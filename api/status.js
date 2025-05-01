const express = require('express');
const router = express.Router();
const strategyService = require('../services/strategy');
const { createLogger } = require('../config/logger');
const fs = require('fs');
const path = require('path');
const os = require('os');

const logger = createLogger('status-api');
const tradesLogPath = path.join(__dirname, '..', 'logs', 'trades.json');

// GET /api/status - Get bot status
router.get('/', (req, res) => {
  try {
    const config = strategyService.loadConfig();
    const position = strategyService.getCurrentPosition();
    
    // Get uptime
    const uptime = process.uptime();
    const formattedUptime = formatUptime(uptime);
    
    // Get system info
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: {
        total: Math.round(os.totalmem() / (1024 * 1024)) + ' MB',
        free: Math.round(os.freemem() / (1024 * 1024)) + ' MB',
      },
      hostname: os.hostname()
    };
    
    // Get last trade time
    let lastTradeTime = null;
    if (fs.existsSync(tradesLogPath)) {
      const tradesData = JSON.parse(fs.readFileSync(tradesLogPath, 'utf8'));
      if (tradesData.trades && tradesData.trades.length > 0) {
        lastTradeTime = tradesData.trades[tradesData.trades.length - 1].timestamp;
      }
    }
    
    // Get last 3 trades
    const recentTrades = strategyService.getTradeHistory(3);
    
    const status = {
      enabled: config.enabled,
      tradingAllowed: strategyService.isTradingAllowed(),
      uptime: formattedUptime,
      systemInfo,
      lastTradeTime,
      recentTrades,
      currentPosition: position,
      version: '1.0.0',
      serverTime: new Date().toISOString()
    };
    
    res.status(200).json(status);
  } catch (error) {
    logger.error(`Error getting status: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve status' });
  }
});

// GET /api/status/logs - Get recent logs
router.get('/logs', (req, res) => {
  try {
    // For security, only allow viewing trade logs
    if (fs.existsSync(tradesLogPath)) {
      const tradesData = JSON.parse(fs.readFileSync(tradesLogPath, 'utf8'));
      res.status(200).json(tradesData);
    } else {
      res.status(200).json({ trades: [] });
    }
  } catch (error) {
    logger.error(`Error getting logs: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// Helper function to format uptime
function formatUptime(uptime) {
  const days = Math.floor(uptime / (60 * 60 * 24));
  const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((uptime % (60 * 60)) / 60);
  const seconds = Math.floor(uptime % 60);
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = router;