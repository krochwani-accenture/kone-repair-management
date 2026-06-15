# AWS Amplify Migration Guide

This guide walks you through migrating your Next.js frontend from EC2 to AWS Amplify.

## Overview

```
Before (EC2 + Lambda):
EC2 Instance → Lambda → DynamoDB

After (Amplify + Lambda):
Amplify Hosting → Lambda → DynamoDB
(Auto-deploys on git push)
```

## Prerequisites

- ✅ AWS Free Trial account (already have)
- ✅ GitHub account (need if you don't have)
- ✅ Your code pushed to GitHub
- ✅ Lambda backend already deployed (you have this)

---

## Step 1: Prepare Your Project for Amplify

### 1.1 Create `.amplifyignore` file

This file tells Amplify what NOT to include in builds.

```
node_modules
.git
.env.local
.env.*.local
backend/
deploy-ec2.sh
deploy-ec2.ps1
```

### 1.2 Update `.env.local` configuration

Create a file that Amplify can use for environment variables.

**File: `.env.local`**
```
NEXT_PUBLIC_API_URL=https://YOUR_LAMBDA_API_URL/Prod
```

Replace `YOUR_LAMBDA_API_URL` with your actual Lambda API Gateway URL (from SAM deployment output).

Example:
```
NEXT_PUBLIC_API_URL=https://abc123xyz.execute-api.ap-south-2.amazonaws.com/Prod
```

### 1.3 Verify Next.js configuration

Your `next.config.mjs` should look like:
```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,  // Required for Amplify static export
  },
}
export default nextConfig
```

---

## Step 2: Push Code to GitHub

### 2.1 Initialize Git repo (if not already done)
```bash
cd c:\Users\kratika.rochwani\kone-repair-management
git init
git add .
git commit -m "Initial commit: Ready for Amplify"
```

### 2.2 Create GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `kone-repair-management`
3. Click "Create repository"
4. Follow the instructions to push your local code

Commands will look like:
```bash
git remote add origin https://github.com/YOUR_USERNAME/kone-repair-management.git
git branch -M main
git push -u origin main
```

---

## Step 3: Get Your Lambda API URL

From your SAM deployment, find your API endpoint URL.

If you don't remember it, run:
```bash
cd backend
sam list stack-outputs
```

You need something like:
```
https://abc123xyz.execute-api.ap-south-2.amazonaws.com/Prod
```

Save this—you'll need it in Step 5.

---

## Step 4: Create Amplify App in AWS Console

### 4.1 Open AWS Amplify

1. Go to [AWS Console](https://console.aws.amazon.com)
2. Search for **"Amplify"** in the search bar
3. Click **"AWS Amplify"**

### 4.2 Create App

1. Click **"Create app"** or **"New app"**
2. Choose **"Host web app"**
3. Under **Source code**, select **"GitHub"**
4. Click **"Continue"**

### 4.3 Authorize GitHub

1. Click **"Authorize AWS Amplify"** (GitHub popup)
2. Sign in to GitHub if prompted
3. Select your repository: `kone-repair-management`
4. Click **"Connect"**

### 4.4 Configure Build Settings

1. **App name:** Keep default or customize
2. **Branch:** `main` (or your default branch)
3. Click **"Next"**

On the build settings page:
- Framework: **Next.js (SSR)**
- Build command: `npm run build`
- Start command: `npm start`

Click **"Next"**

### 4.5 Review & Create

- Verify all settings look correct
- Click **"Save and deploy"**

Amplify will now:
1. ✅ Clone your GitHub repo
2. ✅ Install dependencies
3. ✅ Build your Next.js app
4. ✅ Deploy to CloudFront
5. ✅ Give you a live URL

---

## Step 5: Configure Environment Variables

### 5.1 Add API Endpoint to Amplify

1. Go to **Amplify Console** → Your app
2. Click **"Environment variables"** (left sidebar)
3. Click **"Add environment variable"**
4. **Variable name:** `NEXT_PUBLIC_API_URL`
5. **Value:** `https://YOUR_LAMBDA_API_URL/Prod`
6. Click **"Save"**

### 5.2 Trigger New Deployment

1. Go back to **Deployments** tab
2. Click the latest deployment
3. Click **"Redeploy this version"**

Wait for deployment to complete (2-5 minutes).

---

## Step 6: Update Your Frontend Code

Your frontend needs to use the environment variable.

### 6.1 Update API calls

Search for all hardcoded `localhost:5000` or old API URLs and replace with:

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Example usage:
fetch(`${API_URL}/repairs/list`)
fetch(`${API_URL}/auth/login`, { method: 'POST', body: ... })
```

---

## Step 7: Test Your Deployment

1. Get your Amplify app URL from the dashboard
2. Open it in browser
3. Test login functionality
4. Test uploading Excel files
5. Verify repairs are stored in DynamoDB

---

## Step 8: Update Frontend to Use Amplify API

Your frontend code likely has hardcoded `localhost:5000`. Update it to use the Lambda API.

### Example Changes

**Before:**
```javascript
const API_URL = 'http://localhost:5000';
fetch(`${API_URL}/auth/login`, { ... })
```

**After:**
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
fetch(`${API_URL}/auth/login`, { ... })
```

---

## Step 9: Verify Everything Works

### Testing Checklist:

- [ ] Amplify app deploys successfully
- [ ] Frontend loads from Amplify URL
- [ ] Login works
- [ ] Can upload Excel files
- [ ] Data appears in DynamoDB
- [ ] Can fetch repairs list
- [ ] No CORS errors in browser console

---

## Step 10: Decommission EC2 (Optional)

Once everything works on Amplify:

1. Stop EC2 instance in AWS Console
2. Delete EC2 security group
3. Release Elastic IP (if assigned)

This saves you ~$7/month! 💰

---

## Troubleshooting

### Build fails

Check build logs in Amplify console:
1. Go to app → Deployments
2. Click failed deployment
3. Scroll to see error messages
4. Fix and push to GitHub (auto-triggers rebuild)

### API calls fail (CORS error)

Make sure your Lambda has CORS enabled in the SAM template:
```yaml
Cors: "'*'"
```

### Environment variables not working

1. Verify variable name starts with `NEXT_PUBLIC_`
2. Redeploy after adding variables
3. Check browser DevTools → Application → Environment variables

### Frontend can't reach Lambda API

1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check Lambda API Gateway is still deployed
3. Test API directly in Postman

---

## Costs After Amplify

During free trial (12 months):
- Amplify: $0 (within free tier)
- Lambda: $0 (within free tier)
- DynamoDB: $0 (within free tier)
- **Total: $0**

After free trial:
- Amplify: $2-5/month
- Lambda: $1-3/month  
- DynamoDB: $1-2/month
- **Total: ~$4-10/month** (vs $10-15 with EC2)

---

## Next Steps

1. Follow Steps 1-5 above
2. Test your deployed app
3. Update frontend code if needed
4. Run full end-to-end test
5. Decommission EC2 when confident

---

## Need Help?

Check the AWS Amplify documentation:
- [Amplify Next.js Docs](https://docs.amplify.aws/nextjs/)
- [Environment Variables](https://docs.amplify.aws/nextjs/build-a-backend/environment-variables/)
- [Troubleshooting](https://docs.amplify.aws/nextjs/troubleshooting/)
