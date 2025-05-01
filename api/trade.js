const express = require('express');
const router = express.Router();
const strategyService = require('../services/strategy');
const coinbaseService = require('../services/coinbase');
const { createLogger } = require('../config/logger');

const logger = createLogger('trade-api');

// Authentication middleware for dashboard API
const authenticateDashboard = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const dashboardPassword = process.env.DASHBOARD_PASSWORD;
  
  if (!dashboardPassword) {
    logger.warn('Dashboard password not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token !== dashboardPassword) {
    logger.warn('Invalid dashboard authentication attempt');
    return res.status(401).json({ error: 'Invalid authentication' });
  }
  
  next();
};

// GET /api/trade/history - Get trade history
router.get('/history', authenticateDashboard, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const trades = await strategyService.getTradeHistory(limit);
    
    res.status(200).json({ trades });
  } catch (error) {
    logger.error(`Error getting trade history: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve trade history' });
  }
});

// GET /api/trade/position - Get current position
router.get('/position', authenticateDashboard, (req, res) => {
  try {
    const position = strategyService.getCurrentPosition();
    res.status(200).json({ position });
  } catch (error) {
    logger.error(`Error getting current position: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve current position' });
  }
});

// POST /api/trade/manual - Manually create a trade
router.post('/manual', authenticateDashboard, async (req, res) => {
  try {
    const signal = req.body;
    
    logger.info(`Received manual trade signal: ${JSON.stringify(signal)}`);
    
    if (!signal || !signal.ticker || !signal.action) {
      return res.status(400).json({ error: 'Invalid signal format' });
    }
    
    // Add a flag to indicate this is a manual trade
    signal.isManual = true;
    
    // Process the signal
    const result = await strategyService.processSignal(signal);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    logger.error(`Error processing manual trade: ${error.message}`);
    return res.status(500).json({ error: 'Failed to process manual trade' });
  }
});

// GET /api/trade/metrics - Get trading metrics
router.get('/metrics', authenticateDashboard, async (req, res) => {
  try {
    const metrics = await strategyService.getMetrics();
    res.status(200).json(metrics);
  } catch (error) {
    logger.error(`Error getting trading metrics: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve trading metrics' });
  }
});

// GET /api/trade/config - Get strategy configuration
router.get('/config', authenticateDashboard, (req, res) => {
  try {
    const config = strategyService.loadConfig();
    res.status(200).json({ config });
  } catch (error) {
    logger.error(`Error getting strategy config: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve strategy configuration' });
  }
});

// PUT /api/trade/config - Update strategy configuration
router.put('/config', authenticateDashboard, (req, res) => {
  try {
    const newConfig = req.body;
    
    if (!newConfig) {
      return res.status(400).json({ error: 'Invalid configuration data' });
    }
    
    const updated = strategyService.updateConfig(newConfig);
    
    if (updated) {
      return res.status(200).json({ 
        success: true, 
        message: 'Configuration updated successfully',
        config: strategyService.loadConfig()
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to update configuration'
      });
    }
  } catch (error) {
    logger.error(`Error updating strategy config: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trade/accounts - Get Coinbase accounts
router.get('/accounts', authenticateDashboard, async (req, res) => {
  try {
    const accounts = await coinbaseService.getAccounts();
    res.status(200).json(accounts);
  } catch (error) {
    logger.error(`Error getting Coinbase accounts: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve Coinbase accounts' });
  }
});

// GET /api/trade/orders - Get open orders
router.get('/orders', authenticateDashboard, async (req, res) => {
  try {
    const orders = await coinbaseService.getOpenOrders();
    res.status(200).json(orders);
  } catch (error) {
    logger.error(`Error getting open orders: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve open orders' });
  }
});

module.exports = router;