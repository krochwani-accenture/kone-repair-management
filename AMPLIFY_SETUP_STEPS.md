# AWS Amplify Setup Instructions

## Step-by-Step Guide to Create Amplify App

### Step 1: Open AWS Console
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Make sure you're in region **ap-south-2** (Mumbai) - same as your Lambda

### Step 2: Navigate to Amplify
1. In the search bar at top, type **"Amplify"**
2. Click on **"AWS Amplify"** from results
3. You should see Amplify home page

### Step 3: Create New App
1. Click **"Create app"** button (or **"Host web app"** if you see that)
2. Select **Source code provider: "GitHub"**
3. Click **"Continue"**

### Step 4: Connect GitHub
1. You'll see **"Authorize AWS Amplify"** button
2. Click it - GitHub will ask for permissions
3. Sign in to GitHub if needed
4. Approve "AWS Amplify" permissions
5. You'll be redirected back to AWS

### Step 5: Select Repository
1. **Recent repositories:** Look for `kone-repair-management`
2. Click to select it
3. For Branch, select: **main**
4. Click **"Next"**

### Step 6: Configure Build Settings
On the "Authorize repository access" page:

1. **App name:** Keep default or name it "kone-repairs"
2. **Environment:** Leave as default
3. Click **"Next"**

### Step 7: Review Settings
You should see:
```
Repository: krochwani-accenture/kone-repair-management
Branch: main
Framework: Detected as Next.js
Build command: npm run build
Start command: npm start
```

If framework isn't detected, select **"Next.js"** manually.

Click **"Save and deploy"**

### Step 8: Wait for Build & Deployment
Amplify will now:
1. Clone your GitHub repo ✓
2. Install dependencies ✓
3. Build your Next.js app ✓
4. Deploy to CloudFront ✓

This takes **2-5 minutes**. Watch the deployment logs in the Amplify console.

### Step 9: Get Your Amplify URL
Once deployment is complete:
1. You'll see a live URL like: `https://main.d2abc123.amplifyapp.com`
2. **Copy this URL** - you'll need it soon
3. Test clicking the URL - your frontend should load!

---

## What's Next?

Once your Amplify app is deployed:
1. Note your Amplify app URL
2. You'll need your Lambda API URL (from SAM deployment)
3. Come back here for Step 5: Configure environment variables

---

## Troubleshooting

### Build Failed?
- Check build logs in Amplify console
- Most common: Missing environment variables or build errors
- Fix in GitHub and push - Amplify auto-redeploys

### Can't find Amplify in AWS console?
- Make sure you're logged in to AWS
- Search again or go directly: https://console.aws.amazon.com/amplify/

### GitHub authorization error?
- Check you're not in "Incognito" mode
- Clear browser cache
- Try in different browser if needed

---

**When deployment is complete with a live URL, let me know!**
