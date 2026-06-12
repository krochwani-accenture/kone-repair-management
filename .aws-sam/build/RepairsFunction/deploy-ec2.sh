#!/bin/bash

# EC2 Deployment Script for Kone Repairs Frontend
# This script sets up the frontend on EC2 to use the SAM API

set -e

echo "================================================"
echo "Kone Repairs - EC2 Frontend Deployment"
echo "================================================"

# Get SAM API URL from user
read -p "Enter your SAM API URL (e.g., https://abc123.execute-api.ap-south-2.amazonaws.com/Prod): " SAM_API_URL

if [ -z "$SAM_API_URL" ]; then
  echo "Error: SAM API URL is required"
  exit 1
fi

echo ""
echo "Installing system dependencies..."
sudo apt update
sudo apt install -y nodejs npm git

echo ""
echo "Installing global tools..."
sudo npm install -g pnpm pm2

echo ""
echo "Cloning repository..."
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/kone-repair-management.git
cd kone-repair-management

echo ""
echo "Creating .env.local with SAM API URL..."
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=${SAM_API_URL}
NEXT_PUBLIC_REPAIRS_API_URL=${SAM_API_URL}
EOF

echo ""
echo "Installing dependencies..."
pnpm install

echo ""
echo "Building frontend..."
pnpm build

echo ""
echo "Starting frontend with PM2..."
pm2 start "pnpm start" --name "kone-repairs-frontend"
pm2 startup
pm2 save

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "Your app is running at:"
echo "  http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Next steps:"
echo "1. Update your EC2 Security Group to allow port 3000"
echo "2. Share the IP address with others"
echo "3. To view logs: pm2 logs"
echo "4. To stop: pm2 stop kone-repairs-frontend"
echo "5. To restart: pm2 restart kone-repairs-frontend"
echo ""
