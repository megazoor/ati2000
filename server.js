require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('./config/logger');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;
const logger = createLogger('server');

// Create logs directory if it doesn't exist
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// Create logs/trades.json if it doesn't exist
const tradesLogPath = path.join(__dirname, 'logs', 'trades.json');
if (!fs.existsSync(tradesLogPath)) {
  fs.writeFileSync(tradesLogPath, JSON.stringify({ trades: [] }), 'utf8');
  logger.info('Created trades log file');
}

// Middleware
app.use(express.json());
app.use(cors());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Import routes
const webhookRoutes = require('./api/webhook');
const tradeRoutes = require('./api/trade');
const statusRoutes = require('./api/status');
const healthRoutes = require('./api/health');
const analyticsRoutes = require('./api/analytics');

// Use routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dashboard', 'out')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'out', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Import database service
const dbService = require('./services/database');

// Start the server
const server = app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Initialize database connection
  try {
    await dbService.connect();
    logger.info('MongoDB connection established');
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    logger.warn('Server running with limited functionality - using file-based storage');
  }
});

// Clean up on server close
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await dbService.close();
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await dbService.close();
  server.close(() => {
    logger.info('HTTP server closed');
  });
});