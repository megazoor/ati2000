#!/bin/bash
set -e

# Load environment variables
if [ -f ~/.env_advancedtraderai ]; then
  source ~/.env_advancedtraderai
fi

# Navigate to project directory
cd ~/advancedtraderai

# Install dependencies
echo "Installing dependencies..."
npm ci
cd dashboard && npm ci && cd ..

# Make sure logs directory exists
mkdir -p logs

# Copy the environment file if it doesn't exist in the project
if [ ! -f .env ] && [ -f ~/.env_advancedtraderai ]; then
  echo "Copying environment file..."
  cp ~/.env_advancedtraderai .env
fi

# Create or update the PM2 process
if pm2 list | grep -q "advancedtraderai"; then
  echo "Restarting application..."
  pm2 restart advancedtraderai
else
  echo "Setting up application with PM2..."
  pm2 start ecosystem.config.js
  pm2 save
fi

# Check application status
echo "Application status:"
pm2 status advancedtraderai

echo "Deployment completed successfully!"