# ATI2000 - Advanced Trader AI

A self-hosted crypto trading automation platform powered by TradingView signals and Coinbase Advanced, featuring a secure Next.js dashboard.

## 🚀 Overview

ATI2000 automates cryptocurrency trading strategies by:

1. Receiving signals from TradingView alerts via webhooks
2. Validating and processing signals against configurable criteria
3. Executing trades on Coinbase Advanced Exchange with risk management
4. Providing a secure dashboard for monitoring performance and configuration

The platform is designed to be self-hosted on your own server (such as Linode) and can be customized to fit your specific trading strategies.

## ✨ Features

- **Webhook API**: Receive trade signals from TradingView or other sources
- **Risk Management**: Configurable stop-loss and take-profit levels using ATR multipliers
- **Trading Filters**: Optional VWAP and MACD filters for additional trade confirmation
- **Secure Dashboard**: Password-protected Next.js frontend with real-time trading data
- **Trade History**: Complete logs of all executed trades with performance metrics
- **MongoDB Integration**: Store all trading data in MongoDB Atlas for advanced analytics
- **Advanced Analytics**: Historical performance metrics, symbol-based analysis, and time-series data
- **IP Whitelisting**: Restrict webhook access to trusted sources (optional)
- **Configuration UI**: Intuitive interface for adjusting trading parameters
- **CI/CD Pipeline**: Automated deployment to Linode using GitHub Actions

## 📋 Requirements

### Backend
- Node.js 16+ with npm
- Linux-based OS (recommended for production)
- Coinbase Advanced account with API keys
- TradingView account (for sending alerts)

### Frontend
- Modern web browser

## 🛠️ Installation

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/megazoor/ati2000.git
   cd ati2000
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install dashboard dependencies:
   ```bash
   cd dashboard
   npm install
   ```

4. Create a `.env` file in the root directory:
   ```
   COINBASE_API_KEY=your_api_key_here
   COINBASE_API_SECRET=your_api_secret_here
   DASHBOARD_PASSWORD=your_secure_password_here
   PORT=3000
   NODE_ENV=development
   WEBHOOK_SECRET=your_webhook_secret_here
   ALLOWED_IPS=your_ip_here
   MONGODB_URI=mongodb+srv://aisupertraderadmin:231fvYzRQ8kl26zh@cluster0.mpq0dqh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

5. Start the development server:
   ```bash
   # Start backend in root directory
   npm run dev
   
   # Start frontend in another terminal
   cd dashboard
   npm run dev
   ```

6. Access the dashboard at `http://localhost:3000`

### Production Deployment

For detailed production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

For CI/CD pipeline setup instructions, see [CICD.md](CICD.md).

## Deployment Steps

### 1. Set Up a Linode Server

1. Create a Linode instance (4GB RAM recommended)
2. Connect to your server via SSH as root
3. Run the server setup script:
   ```bash
   # Upload the script to your server
   scp scripts/server-setup.sh root@your_server_ip:/root/
   
   # Execute the script providing a username and domain
   ssh root@your_server_ip 'bash /root/server-setup.sh tradingbot yourdomain.com'
   ```

### 2. Configure GitHub Actions

1. In your GitHub repository, go to Settings > Secrets and variables > Actions
2. Add the following repository secrets:
   - `LINODE_HOST`: Your server's IP or domain name
   - `LINODE_USER`: Username you created on the server (e.g., tradingbot)
   - `LINODE_SSH_KEY`: Your private SSH key content

### 3. Configure Environment Variables on Server

1. SSH into your server as the deployment user
2. Edit the environment file:
   ```bash
   nano ~/.env_advancedtraderai
   ```
3. Update with your actual Coinbase API credentials and other settings

### 4. Push Changes to GitHub

The GitHub Actions workflow will automatically deploy your application when you push to the main branch:

```bash
git push origin main
```

For more detailed information, check [CICD.md](CICD.md).

## 📱 Usage

### Setting Up TradingView Alerts

1. Create a new alert in TradingView
2. Set the "Alert message" to a JSON format like:
   ```json
   {
     "ticker": "BTC-USD",
     "action": "BUY",
     "confidence": 0.92,
     "entryPrice": {{close}},
     "stopLossATR": 0.8,
     "takeProfitATR": 3.2
   }
   ```
3. Set the webhook URL to: `https://your-server.com/api/webhook/tradingview`
4. Add the header: `X-Webhook-Secret: your_webhook_secret_here`

## 📊 Monitoring

Monitor your application's health using the built-in health endpoint:

```bash
curl https://yourdomain.com/api/health
```

You can also set up automated monitoring using the provided script:

```bash
# On your server or monitoring system
./scripts/monitor.js https://yourdomain.com https://webhook-url-for-notifications
```

## ⚠️ Disclaimer

This software is provided for educational and informational purposes only. Trading cryptocurrencies involves substantial risk of loss and is not suitable for everyone. The developers of this platform are not responsible for any financial losses incurred through its use. Always conduct your own research before trading.