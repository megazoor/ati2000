# CI/CD Pipeline Setup Guide

This document explains how to set up continuous deployment for AdvancedTraderAI on a Linode server.

## Overview

The CI/CD pipeline consists of:

1. **GitHub Actions Workflow**: Automatically builds and deploys your code when pushed to the main branch
2. **Linode Server**: Hosts your application
3. **Environment Variables**: Securely stored as GitHub Secrets
4. **Deployment Scripts**: Automate server setup and application deployment

## Step 1: Set Up the Linode Server

### 1.1. Create a Linode Instance

1. Log in to your Linode account
2. Create a new Linode with Ubuntu 22.04 LTS (4GB RAM recommended)
3. Set a secure root password
4. Deploy the server

### 1.2. Add Your SSH Key to the Server

First, make sure you have an SSH key on your local machine:

```bash
# Check for existing SSH key
ls -la ~/.ssh

# If no key exists, create one
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Connect to your server as root and set up the server using our setup script:

```bash
# Copy server-setup.sh to the server
scp scripts/server-setup.sh root@your_server_ip:/root/

# Connect to the server
ssh root@your_server_ip

# Run the setup script (replace with your desired username and domain)
bash server-setup.sh tradingbot yourdomain.com
```

### 1.3. Configure Environment Variables

After the server is set up, edit the environment file:

```bash
# On the server
nano ~/.env_advancedtraderai
```

Update with your actual API keys and secrets:

```
COINBASE_API_KEY=your_actual_api_key
COINBASE_API_SECRET=your_actual_api_secret
DASHBOARD_PASSWORD=your_secure_dashboard_password
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=your_secure_random_string
ALLOWED_IPS=your_tradingview_ip
```

## Step 2: Set Up GitHub Repository

### 2.1. Create a GitHub Repository

1. Create a new repository on GitHub
2. Push your local code to the repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Add remote and push
git remote add origin https://github.com/yourusername/advancedtraderai.git
git branch -M main
git push -u origin main
```

### 2.2. Set Up GitHub Secrets

In your GitHub repository:

1. Go to Settings > Secrets and variables > Actions
2. Add the following secrets:

- `LINODE_HOST`: Your server's domain or IP address
- `LINODE_USER`: The username you created (e.g., tradingbot)
- `LINODE_SSH_KEY`: Your private SSH key content (the content of your ~/.ssh/id_rsa or ~/.ssh/id_ed25519 file)

To copy your private key:

```bash
# For RSA key
cat ~/.ssh/id_rsa

# For Ed25519 key
cat ~/.ssh/id_ed25519
```

## Step 3: Configure DNS (Optional, but Recommended)

If you have a domain name, set up DNS records to point to your Linode server:

1. In your domain registrar's DNS settings, create an A record:
   - Host: @ (or subdomain)
   - Value: Your Linode server's IP address
   - TTL: 3600 (or as desired)

2. Add a www record if needed:
   - Host: www
   - Value: Your Linode server's IP address
   - TTL: 3600 (or as desired)

## Step 4: Verify the CI/CD Pipeline

### 4.1. Make a Test Commit

Make a small change to your repository and push it to the main branch:

```bash
# Make a change
echo "# Updated on $(date)" >> README.md

# Commit and push
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main
```

### 4.2. Monitor the Deployment

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. Watch the workflow execute

### 4.3. Verify Application Deployment

Once the workflow completes successfully:

1. Visit your domain or Linode IP in a browser
2. Log in to the dashboard using your DASHBOARD_PASSWORD
3. Check that everything is working correctly

## Step 5: Additional Security Measures

### 5.1. Secure SSH Access

Consider disabling password authentication for SSH:

```bash
# On the server
sudo nano /etc/ssh/sshd_config
```

Change/add these lines:
```
PasswordAuthentication no
ChallengeResponseAuthentication no
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### 5.2. Implement Fail2Ban (Optional)

Install Fail2Ban to protect against brute force attacks:

```bash
sudo apt install -y fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

## Troubleshooting

### Deployment Fails

If the GitHub Actions workflow fails:

1. Check the workflow logs for specific errors
2. Verify that all secrets are set correctly
3. Ensure the server is reachable and the user has appropriate permissions

### Application Does Not Start

If the application fails to start after deployment:

1. SSH into your server
2. Check the logs:
   ```bash
   pm2 logs advancedtraderai
   ```
3. Verify environment variables:
   ```bash
   cat ~/advancedtraderai/.env
   ```

### Cannot Access Website

If you cannot access the website:

1. Check Nginx status:
   ```bash
   sudo systemctl status nginx
   ```
2. Check Nginx configuration:
   ```bash
   sudo nginx -t
   ```
3. Check firewall status:
   ```bash
   sudo ufw status
   ```
4. Verify SSL certificate:
   ```bash
   sudo certbot certificates
   ```

## Manual Deployment

If you need to manually deploy the application:

```bash
# SSH into the server
ssh tradingbot@your_server_ip

# Navigate to the application directory
cd ~/advancedtraderai

# Pull the latest changes
git pull origin main

# Install dependencies and restart
npm ci
cd dashboard && npm ci && npm run build && cd ..
pm2 restart advancedtraderai
```

## Monitoring

You can monitor your application's status using PM2:

```bash
# View process status
pm2 status

# Monitor in real-time
pm2 monit

# View logs
pm2 logs advancedtraderai
```