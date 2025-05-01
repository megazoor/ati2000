# AdvancedTraderAI

A self-hosted crypto trading automation platform powered by TradingView signals and Coinbase Advanced, featuring a secure Next.js dashboard.

![Dashboard Preview](https://placeholder-image.com/800x450)

## 🚀 Overview

AdvancedTraderAI automates cryptocurrency trading strategies by:

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
- **IP Whitelisting**: Restrict webhook access to trusted sources (optional)
- **Configuration UI**: Intuitive interface for adjusting trading parameters

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
   git clone https://github.com/yourusername/advancedtraderai.git
   cd advancedtraderai
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

### Dashboard Navigation

- **Dashboard**: View current position, performance metrics, and recent trades
- **Trades**: Detailed trade history with filtering and sorting options
- **Settings**: Configure trading parameters, risk management, and symbol whitelist

## ⚙️ Configuration

### Strategy Configuration

The platform features a web-based configuration interface to adjust:

- Trading status (enabled/disabled)
- Trading hours restrictions
- Maximum trades per day
- Stop loss and take profit levels (ATR multipliers)
- Minimum trade confidence threshold
- Trading filters (VWAP, MACD)
- Symbol whitelist

### Advanced Configuration

For advanced settings that aren't exposed in the UI, you can modify:

- `config/strategy-config.json`: Core trading parameters
- `.env`: Environment variables and API credentials

## 🔐 Security

AdvancedTraderAI implements several security features:

- **Password Protection**: Dashboard access requires a password
- **Webhook Validation**: Webhook endpoints verify a shared secret
- **IP Whitelisting**: Only allow requests from trusted IPs
- **Rate Limiting**: Prevent brute force attempts on the API
- **HTTPS**: Production deployment uses SSL/TLS encryption

## 📊 Logging and Monitoring

The platform provides comprehensive logging:

- **Trade Logs**: All trades are logged with full details
- **Server Logs**: Application events and errors are tracked
- **Performance Metrics**: Track win rate, total trades, and more
- **Status Monitoring**: Check bot status and current positions

## 🧩 Project Structure

```
/advancedtraderai
├── api/                 # API route handlers
│   ├── webhook.js       # Webhook endpoints
│   ├── trade.js         # Trade management endpoints
│   └── status.js        # Status information endpoints
├── services/            # Core business logic
│   ├── coinbase.js      # Coinbase API integration
│   └── strategy.js      # Trading strategy implementation
├── logs/                # Log storage
│   └── trades.json      # Trade history log
├── config/              # Configuration files
│   └── logger.js        # Logging configuration
├── dashboard/           # Next.js frontend
│   └── app/             # App Router structure
│       ├── components/  # Reusable UI components
│       ├── dashboard/   # Dashboard page
│       ├── trades/      # Trade history page
│       └── settings/    # Configuration page
├── .env                 # Environment variables
├── server.js            # Main application entry point
└── ecosystem.config.js  # PM2 process manager config
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This software is provided for educational and informational purposes only. Trading cryptocurrencies involves substantial risk of loss and is not suitable for everyone. The developers of this platform are not responsible for any financial losses incurred through its use. Always conduct your own research before trading.