# AdvancedTraderAI Deployment Guide

This document provides step-by-step instructions for deploying the AdvancedTraderAI platform on a Linode server. The guide assumes you have basic Linux administration knowledge.

## Server Requirements

- **Linux Distribution**: Ubuntu 22.04 LTS or higher
- **RAM**: 4GB+ recommended
- **CPU**: 2+ cores recommended
- **Storage**: 25GB+ SSD
- **Network**: Public IP address

## Step 1: Create a Linode Server

1. Log in to your Linode account
2. Click "Create Linode"
3. Select the following options:
   - Ubuntu 22.04 LTS (or newer)
   - Shared CPU with at least 4GB RAM (Linode 4GB)
   - Choose a region close to your location
   - Set a strong root password
   - Add SSH keys if available
4. Click "Create"

## Step 2: Connect to Your Server

Use SSH to connect to your server:

```bash
ssh root@YOUR_SERVER_IP
```

## Step 3: Initial Server Setup

Update the system and install basic dependencies:

```bash
# Update the system
apt update && apt upgrade -y

# Install essential packages
apt install -y git curl wget build-essential ufw

# Set up firewall
ufw allow OpenSSH
ufw allow http
ufw allow https
ufw enable

# Create a non-root user (recommended)
adduser tradingbot
usermod -aG sudo tradingbot

# Switch to the new user
su - tradingbot
```

## Step 4: Install Node.js and npm

Install Node.js using NVM (Node Version Manager) for better version control:

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js v18 LTS
nvm install 18
nvm use 18
nvm alias default 18

# Check installation
node -v
npm -v
```

## Step 5: Install PM2 Process Manager

PM2 will keep the application running and restart it if it crashes:

```bash
# Install PM2 globally
npm install -g pm2
```

## Step 6: Install Nginx and Certbot

Nginx will act as a reverse proxy and Certbot will provide free SSL certificates:

```bash
# Install Nginx and Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 7: Clone the Repository

Clone the AdvancedTraderAI repository:

```bash
# Navigate to home directory
cd ~

# Clone the repository
git clone https://github.com/yourusername/advancedtraderai.git
cd advancedtraderai
```

## Step 8: Install Dependencies

Install both backend and frontend dependencies:

```bash
# Install backend dependencies
npm install

# Build the frontend
cd dashboard
npm install
npm run build
cd ..
```

## Step 9: Configure Environment Variables

Create and configure the `.env` file:

```bash
# Create .env file
cp .env.example .env

# Edit the .env file with your settings
nano .env
```

Add your Coinbase API credentials and other configuration values:

```
COINBASE_API_KEY=your_api_key_here
COINBASE_API_SECRET=your_api_secret_here
DASHBOARD_PASSWORD=your_secure_password_here
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=your_webhook_secret_here
ALLOWED_IPS=your_tradingview_ip_here
```

## Step 10: Configure Nginx as a Reverse Proxy

Create an Nginx server configuration:

```bash
sudo nano /etc/nginx/sites-available/advancedtraderai
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and test Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/advancedtraderai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 11: Set Up SSL with Certbot

Obtain an SSL certificate:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to complete the SSL certificate setup.

## Step 12: Start the Application with PM2

Start the application and configure it to run on system startup:

```bash
# Navigate to project directory
cd ~/advancedtraderai

# Start with PM2
pm2 start ecosystem.config.js

# Make PM2 start on system boot
pm2 startup
sudo env PATH=$PATH:/home/tradingbot/.nvm/versions/node/v18.x.x/bin pm2 startup systemd -u tradingbot --hp /home/tradingbot
pm2 save
```

## Step 13: Set Up Log Rotation

Configure log rotation for PM2 logs:

```bash
sudo nano /etc/logrotate.d/pm2-tradingbot
```

Add the following configuration:

```
/home/tradingbot/.pm2/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 tradingbot tradingbot
}
```

## Step 14: Set Up Automatic Updates

Configure unattended upgrades for security patches:

```bash
sudo apt install -y unattended-upgrades apt-listchanges
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Step 15: Test Everything

1. Check the server status:
   ```bash
   pm2 status
   pm2 logs
   ```

2. Visit your domain in a browser to access the dashboard.

3. Test the webhook using curl:
   ```bash
   curl -X POST -H "Content-Type: application/json" -H "X-Webhook-Secret: your_webhook_secret_here" -d '{"ticker":"BTC-USD","action":"BUY","confidence":0.95}' https://yourdomain.com/api/webhook/test
   ```

## Troubleshooting

1. **Application not starting:**
   - Check the PM2 logs: `pm2 logs`
   - Verify environment variables: `cat .env`
   - Check for file permission issues

2. **Website not accessible:**
   - Check Nginx status: `sudo systemctl status nginx`
   - Verify Nginx configuration: `sudo nginx -t`
   - Check firewall rules: `sudo ufw status`

3. **SSL certification issues:**
   - Check Certbot logs: `sudo certbot certificates`
   - Renew certificates: `sudo certbot renew --dry-run`

## Maintenance

1. **Update the application:**
   ```bash
   cd ~/advancedtraderai
   git pull
   npm install
   cd dashboard
   npm install
   npm run build
   cd ..
   pm2 restart all
   ```

2. **Backup your configuration:**
   ```bash
   cp .env ~/backups/.env
   cp logs/trades.json ~/backups/trades.json
   cp config/strategy-config.json ~/backups/strategy-config.json
   ```

3. **Monitor server resources:**
   ```bash
   htop
   ```

4. **Monitor application logs:**
   ```bash
   pm2 logs
   ```

## Security Best Practices

1. **Regularly update system packages:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Rotate API keys periodically:**
   - Generate new Coinbase API keys
   - Update the `.env` file
   - Restart the application: `pm2 restart all`

3. **Implement IP whitelisting:**
   - Update the `ALLOWED_IPS` variable in the `.env` file
   - Restart the application: `pm2 restart all`

4. **Monitor login attempts:**
   ```bash
   sudo grep "Failed password" /var/log/auth.log
   ```

5. **Set up fail2ban (optional):**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl start fail2ban
   sudo systemctl enable fail2ban
   ```

## Conclusion

Your AdvancedTraderAI platform should now be securely deployed on Linode. The setup includes:

- Secure server with UFW firewall
- PM2 process management for reliability
- Nginx reverse proxy with SSL encryption
- Automated security updates
- Log rotation for maintenance

Remember to regularly check for application updates and security patches to keep your trading platform secure and up-to-date.