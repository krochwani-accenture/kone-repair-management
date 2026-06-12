# EC2 Deployment Guide (SAM + Frontend)

This guide deploys your frontend on AWS EC2 while using the SAM backend API.

## Architecture

```
Users access: http://13.233.146.247:3000 (Frontend on EC2)
        ↓
Frontend makes API calls to your SAM API
        ↓
Lambda + DynamoDB (in AWS)
```

## Prerequisites

1. ✅ SAM API already deployed and working
2. ✅ Code pushed to GitHub
3. ✅ AWS account with EC2 access

## Step 1: Get Your SAM API URL

From your SAM deployment output, find the API URL. It looks like:
```
https://abc123xyz.execute-api.ap-south-2.amazonaws.com/Prod
```

Keep this handy—you'll need it in Step 5.

## Step 2: Create EC2 Instance

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2)
2. Click **"Launch Instance"**
3. Select **Ubuntu 22.04 LTS** (free tier eligible)
4. Instance type: **t3.micro** (free tier)
5. Region: **ap-south-2** (Mumbai)
6. Create/download a **key pair** (save it as `kone-key.pem`)
7. Click **"Launch Instance"**

## Step 3: Connect to EC2

Replace `13.233.146.247` with your instance's public IP:

```bash
chmod 400 kone-key.pem
ssh -i kone-key.pem ubuntu@13.233.146.247
```

## Step 4: Update Deploy Script

Before running, update the script with your GitHub username:

```bash
# On your local machine
sed -i 's/YOUR_USERNAME/your-github-username/g' deploy-ec2.sh
```

Or manually edit `deploy-ec2.sh` and replace `YOUR_USERNAME` with your actual GitHub username.

## Step 5: Run Deploy Script

On the EC2 instance:

```bash
# Download the script
curl -o deploy-ec2.sh https://raw.githubusercontent.com/YOUR_USERNAME/kone-repair-management/main/deploy-ec2.sh
chmod +x deploy-ec2.sh

# Run it
./deploy-ec2.sh
```

When prompted, enter your SAM API URL:
```
https://abc123xyz.execute-api.ap-south-2.amazonaws.com/Prod
```

## Step 6: Open Security Group

1. Go to EC2 → Security Groups
2. Find your instance's security group
3. Edit inbound rules
4. **Add rule:**
   - Type: HTTP
   - Port: 3000
   - Source: 0.0.0.0/0 (anywhere)
5. Click **"Save rules"**

## Step 7: Access Your App

Get your EC2 public IP (e.g., `13.233.146.247`) and open:

```
http://13.233.146.247:3000
```

Share this link with others!

## Useful Commands

### View logs
```bash
pm2 logs kone-repairs-frontend
```

### Stop/restart
```bash
pm2 stop kone-repairs-frontend
pm2 restart kone-repairs-frontend
```

### SSH back in
```bash
ssh -i kone-key.pem ubuntu@13.233.146.247
```

### Check if running
```bash
pm2 status
```

## Troubleshooting

### "Connection refused" or "Cannot reach server"
- Check security group allows port 3000
- Check PM2 status: `pm2 status`
- View logs: `pm2 logs`

### "API not found" errors on the app
- Verify SAM API URL in `.env.local`
- Check CORS if API is on different domain
- Test API directly in browser: `https://abc123...execute-api.../Prod/repairs`

### "Module not found" errors
- SSH into EC2 and check logs: `pm2 logs`
- Reinstall dependencies: `pnpm install`

## Stopping the Server

```bash
ssh -i kone-key.pem ubuntu@13.233.146.247
pm2 stop kone-repairs-frontend
```

## Costs

- **EC2 t3.micro**: Free for 12 months (AWS free tier)
- **Data transfer**: ~$0-1/month (minimal)
- **Total**: ~Free for 12 months

## Next Steps

- Add a custom domain instead of IP
- Set up auto-scaling (if traffic increases)
- Add HTTPS certificate

Enjoy! 🚀
