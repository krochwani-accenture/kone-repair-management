Signing up for an AWS account.

Setting up secure access to AWS.

Creating an access key ID and secret access key.
ask team members

install SAM
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/prerequisites.html#prerequisites-install-cli

Installing the AWS CLI.
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html?utm_source=chatgpt.com


winget install Amazon.SAM-CLI

Configuring AWS credentials.
ask team members

Add policy to aws IAM user
AdministratorAccess
AdministratorAccess-Amplify
IAMUserChangePassword

//---------------------------------------------------
update backend env file with

PORT=5000
NODE_ENV=development
AWS_REGION=ap-south-2
UPLOAD_BUCKET_NAME=kone-repairs-stack-repair-uploads
JWT_SECRET=your-secret
NEXT_PUBLIC_API_URL=http://localhost:5000/api

//---------------------------------------------------

git clone

npm install
npm run dev

cd backend
npm run dev

//---------------------------------------------------
aws configure

AWS Access Key ID [****************TNX2]:
AWS Secret Access Key [****************5q0r]: 
Default region name [ap-south-2]: ap-south-2
Default output format [None]: json


//---------------------------------------------------

sam deploy --guided

# Configuring SAM deploy

        Stack Name [kone-repairs-stack]: kone-repairs-stack
        AWS Region [ap-south-2]: ap-south-2
        #Shows you resources changes to be deployed and require a 'Y' to initiate deploy
        Confirm changes before deploy [Y/n]: y
        #SAM needs permission to be able to create roles to connect to the resources in your template
        Allow SAM CLI IAM role creation [Y/n]: y
        #Preserves the state of previously provisioned resources when an operation fails
        Disable rollback [Y/n]: n
        RepairsFunction has no authentication. Is this okay? [y/N]: y
        RepairsFunction has no authentication. Is this okay? [y/N]: y
        RepairsFunction has no authentication. Is this okay? [y/N]: y
        RepairsFunction has no authentication. Is this okay? [y/N]: y
        RepairsFunction has no authentication. Is this okay? [y/N]: y
        S3UploadUrlFunction has no authentication. Is this okay? [y/N]: y
        Save arguments to configuration file [Y/n]: y
        SAM configuration file [samconfig.toml]: samconfig.toml
        SAM configuration environment [default]: default
