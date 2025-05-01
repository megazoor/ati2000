#!/bin/bash
set -e

# This script should be run as root on a fresh Linode server
# Usage: bash server-setup.sh username domain

# Check if username and domain are provided
if [ "$#" -lt 2 ]; then
  echo "Usage: bash server-setup.sh username domain"
  echo "Example: bash server-setup.sh tradingbot example.com"
  exit 1
fi

USERNAME=$1
DOMAIN=$2
HOME_DIR="/home/$USERNAME"

echo "Setting up server with user $USERNAME and domain $DOMAIN"

# Update system packages
echo "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "Installing required packages..."
apt install -y git curl wget build-essential ufw nginx certbot python3-certbot-nginx

# Set up firewall
echo "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

# Create user if not exists
if ! id "$USERNAME" &>/dev/null; then
  echo "Creating user $USERNAME..."
  adduser --disabled-password --gecos "" $USERNAME
  usermod -aG sudo $USERNAME
  
  # Set up SSH directory for the new user
  mkdir -p $HOME_DIR/.ssh
  touch $HOME_DIR/.ssh/authorized_keys
  chmod 700 $HOME_DIR/.ssh
  chmod 600 $HOME_DIR/.ssh/authorized_keys
  chown -R $USERNAME:$USERNAME $HOME_DIR/.ssh
  
  # Allow password-less sudo for the user (optional, uncomment if needed)
  # echo "$USERNAME ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$USERNAME
fi

# Set up Node.js for the user
echo "Setting up Node.js..."
su - $USERNAME -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash'
su - $USERNAME -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm install 18 && nvm use 18 && nvm alias default 18'

# Install PM2 
echo "Installing PM2..."
su - $USERNAME -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && npm install -g pm2'

# Set up PM2 to start on boot
su - $USERNAME -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && pm2 startup'
# Get the output command from pm2 startup and execute it
PM2_STARTUP_CMD=$(su - $USERNAME -c 'export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && pm2 startup' | grep -o "sudo env.*")
if [ -n "$PM2_STARTUP_CMD" ]; then
  eval $PM2_STARTUP_CMD
fi

# Create application directory
echo "Creating application directory..."
mkdir -p $HOME_DIR/advancedtraderai
chown -R $USERNAME:$USERNAME $HOME_DIR/advancedtraderai

# Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/advancedtraderai << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# Enable the Nginx site
ln -sf /etc/nginx/sites-available/advancedtraderai /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Set up SSL with Certbot
echo "Setting up SSL with Certbot..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Set up log rotation for PM2
echo "Setting up log rotation..."
cat > /etc/logrotate.d/pm2-$USERNAME << EOF
$HOME_DIR/.pm2/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $USERNAME $USERNAME
}
EOF

# Set up automatic updates
echo "Setting up automatic updates..."
apt install -y unattended-upgrades apt-listchanges
dpkg-reconfigure -plow unattended-upgrades

# Create template .env file
echo "Creating template .env file..."
cat > $HOME_DIR/.env_advancedtraderai << EOF
COINBASE_API_KEY=your_api_key_here
COINBASE_API_SECRET=your_api_secret_here
DASHBOARD_PASSWORD=your_secure_password_here
PORT=3000
NODE_ENV=production
WEBHOOK_SECRET=your_webhook_secret_here
ALLOWED_IPS=your_tradingview_ip_here
MONGODB_URI=mongodb+srv://aisupertraderadmin:231fvYzRQ8kl26zh@cluster0.mpq0dqh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
EOF
chown $USERNAME:$USERNAME $HOME_DIR/.env_advancedtraderai
chmod 600 $HOME_DIR/.env_advancedtraderai

echo "==============================================="
echo "Server setup completed!"
echo "==============================================="
echo "Next steps:"
echo "1. Update the environment variables in $HOME_DIR/.env_advancedtraderai"
echo "2. Set up GitHub repository with secrets:"
echo "   - LINODE_HOST: $DOMAIN or server IP"
echo "   - LINODE_USER: $USERNAME"
echo "   - LINODE_SSH_KEY: your private SSH key"
echo "3. Push your code to the main branch to trigger deployment"
echo "==============================================="