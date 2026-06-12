param(
    [string]$Region = "ap-south-2",
    [string]$KeyName,
    [string]$InstanceType = "t3.micro",
    [string]$SgName = "kone-poc-sg",
    [string]$RepoUrl = "https://github.com/krochwani-accenture/kone-repair-management.git",
    [string]$Branch = "main",
    [string]$InstanceName = "kone-poc-instance"
)

function Fail($msg) {
    Write-Error $msg
    exit 1
}

Write-Host "Starting EC2 deployment (region=$Region)"

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Fail "AWS CLI not found. Install and run 'aws configure' before running this script."
}

# Verify AWS credentials
try {
    aws sts get-caller-identity --region $Region | Out-Null
} catch {
    Fail "AWS CLI is not configured or credentials are invalid. Run 'aws configure'."
}

if (-not $KeyName) {
    $KeyName = Read-Host "Enter your EC2 Key Pair name (must already exist in AWS)"
}

Write-Host "Validating SSH key pair '$KeyName'..."
$keyCheck = aws ec2 describe-key-pairs --key-names $KeyName --query 'KeyPairs[0].KeyName' --output text --region $Region 2>$null
if (-not $keyCheck) { Fail "Key pair '$KeyName' does not exist in region $Region." }

Write-Host "Resolving default VPC..."
$vpcId = aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text --region $Region
if (-not $vpcId) { Fail "Could not find default VPC in region $Region." }

Write-Host "Resolving default subnet for VPC $vpcId..."
$subnetId = aws ec2 describe-subnets --filters Name=vpc-id,Values=$vpcId Name=default-for-az,Values=true --query 'Subnets[0].SubnetId' --output text --region $Region
if (-not $subnetId) {
    Write-Warning "Could not find default subnet. Falling back to any subnet in VPC."
    $subnetId = aws ec2 describe-subnets --filters Name=vpc-id,Values=$vpcId --query 'Subnets[0].SubnetId' --output text --region $Region
}
if (-not $subnetId) { Fail "Could not resolve a subnet in the default VPC." }

Write-Host "Fetching latest Amazon Linux 2 AMI..."
$ami = aws ssm get-parameter --name "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2" --region $Region --query 'Parameter.Value' --output text
if (-not $ami) { Fail "Could not fetch AMI via SSM." }

Write-Host "Creating security group '$SgName' in VPC $vpcId..."
$sgId = aws ec2 create-security-group --group-name $SgName --description "Security group for Kone POC" --vpc-id $vpcId --region $Region --query 'GroupId' --output text 2>$null
if (-not $sgId) {
    Write-Warning "Security group already exists or could not be created. Looking up existing security group..."
    $sgId = aws ec2 describe-security-groups --filters Name=group-name,Values=$SgName Name=vpc-id,Values=$vpcId --query 'SecurityGroups[0].GroupId' --output text --region $Region
    if (-not $sgId) { Fail "Failed to create or find security group named '$SgName'." }
}

Write-Host "Authorizing ingress: SSH(22), HTTP(80), HTTPS(443), Backend(5000), Frontend(3000)..."
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $Region | Out-Null
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region | Out-Null
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region | Out-Null
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 5000 --cidr 0.0.0.0/0 --region $Region | Out-Null
aws ec2 authorize-security-group-ingress --group-id $sgId --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $Region | Out-Null

Write-Host "Preparing user-data to bootstrap the instance..."
$userData = @"
#!/bin/bash
set -e
yum update -y
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git gcc gcc-c++ make python3 sqlite-devel
npm install -g pm2
cd /home/ec2-user
if [ -d kone-repair-management ]; then rm -rf kone-repair-management; fi
git clone -b $Branch $RepoUrl

# --- Backend setup ---
cd kone-repair-management/backend
npm install --production
pm2 start server.js --name kone-backend || pm2 restart kone-backend
pm2 save
chown -R ec2-user:ec2-user /home/ec2-user/kone-repair-management
#
# --- Frontend setup (Next.js) ---
cd /home/ec2-user/kone-repair-management
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_REPAIRS_API_URL=http://localhost:5000
EOF
npm install
npm run build
# start frontend with PM2 using npm (serves on port 3000)
pm2 start npm --name kone-frontend --prefix /home/ec2-user/kone-repair-management -- start || pm2 restart kone-frontend
pm2 save

"@

$udFile = Join-Path $env:TEMP "kone-userdata.sh"
Set-Content -Path $udFile -Value $userData -Encoding UTF8

Write-Host "Launching EC2 instance ($InstanceType) with AMI $ami..."
$run = aws ec2 run-instances --image-id $ami --count 1 --instance-type $InstanceType --key-name $KeyName --security-group-ids $sgId --subnet-id $subnetId --associate-public-ip-address --user-data file://$udFile --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$InstanceName}]" --region $Region --query 'Instances[0].InstanceId' --output text
if (-not $run) { Fail "Failed to run instance." }
$instanceId = $run
Write-Host "Instance launched: $instanceId. Waiting for instance to enter 'running' state..."
aws ec2 wait instance-running --instance-ids $instanceId --region $Region

Write-Host "Allocating Elastic IP..."
$allocId = aws ec2 allocate-address --domain vpc --region $Region --query 'AllocationId' --output text
if (-not $allocId) { Fail "Failed to allocate Elastic IP." }

Write-Host "Associating Elastic IP with instance..."
$assoc = aws ec2 associate-address --instance-id $instanceId --allocation-id $allocId --region $Region --query 'AssociationId' --output text
if (-not $assoc) { Fail "Failed to associate Elastic IP." }

Write-Host "Fetching public IP..."
$publicIp = aws ec2 describe-addresses --allocation-ids $allocId --region $Region --query 'Addresses[0].PublicIp' --output text

Write-Host "================================================"
Write-Host "✅ Deployment complete"
Write-Host "InstanceId: $instanceId"
Write-Host "Elastic IP: $publicIp"
Write-Host "Backend should be available on http://$publicIp:5000 (give 30-60s for bootstrapping)"
Write-Host "Frontend should be available on http://$publicIp:3000"
Write-Host "To SSH: ssh -i <path-to-your-pem> ec2-user@$publicIp"
Write-Host "Note: Elastic IPs may incur charges if not used."
Write-Host "================================================"
