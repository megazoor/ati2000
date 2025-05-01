const express = require('express');
const router = express.Router();
const dbService = require('../services/database');
const { createLogger } = require('../config/logger');

const logger = createLogger('analytics-api');

// Same authentication middleware as in trade.js
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

// GET /api/analytics/performance - Get performance metrics over time
router.get('/performance', authenticateDashboard, async (req, res) => {
  try {
    const { startDate, endDate, interval = 'daily' } = req.query;
    
    if (!startDate) {
      return res.status(400).json({ error: 'Start date is required' });
    }
    
    // Get all trades within the date range
    const trades = await dbService.getTradesByDateRange(
      startDate,
      endDate || new Date().toISOString()
    );
    
    // Group trades by interval (daily, weekly, monthly)
    const performanceData = groupTradesByInterval(trades, interval);
    
    res.status(200).json({ performanceData });
  } catch (error) {
    logger.error(`Error retrieving performance analytics: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve performance analytics' });
  }
});

// GET /api/analytics/symbols - Get performance metrics by symbols
router.get('/symbols', authenticateDashboard, async (req, res) => {
  try {
    // Get all trades
    const trades = await dbService.getTradeHistory(1000);
    
    // Group trades by symbol
    const symbolPerformance = {};
    
    trades.forEach(trade => {
      if (!symbolPerformance[trade.ticker]) {
        symbolPerformance[trade.ticker] = {
          ticker: trade.ticker,
          totalTrades: 0,
          buyTrades: 0,
          sellTrades: 0,
          profit: 0,
          profitPercentage: 0,
          winCount: 0,
          lossCount: 0,
          lastTradeDate: null,
          averageEntryPrice: 0,
          totalBuyAmount: 0
        };
      }
      
      const symbol = symbolPerformance[trade.ticker];
      symbol.totalTrades++;
      
      if (trade.action === 'BUY') {
        symbol.buyTrades++;
        symbol.totalBuyAmount += trade.price;
        symbol.averageEntryPrice = symbol.totalBuyAmount / symbol.buyTrades;
      } else if (trade.action === 'SELL') {
        symbol.sellTrades++;
        
        if (trade.entryPrice) {
          const tradeProfit = (trade.price - trade.entryPrice) * trade.size;
          const tradeProfitPercentage = ((trade.price - trade.entryPrice) / trade.entryPrice) * 100;
          
          symbol.profit += tradeProfit;
          symbol.profitPercentage += tradeProfitPercentage;
          
          if (trade.price > trade.entryPrice) {
            symbol.winCount++;
          } else {
            symbol.lossCount++;
          }
        }
      }
      
      // Update last trade date
      const tradeDate = new Date(trade.timestamp);
      if (!symbol.lastTradeDate || tradeDate > new Date(symbol.lastTradeDate)) {
        symbol.lastTradeDate = trade.timestamp;
      }
    });
    
    // Calculate win rate and format numbers
    Object.values(symbolPerformance).forEach(symbol => {
      const totalCompletedTrades = symbol.winCount + symbol.lossCount;
      symbol.winRate = totalCompletedTrades > 0 ? (symbol.winCount / totalCompletedTrades) : 0;
      symbol.profit = parseFloat(symbol.profit.toFixed(2));
      symbol.profitPercentage = parseFloat(symbol.profitPercentage.toFixed(2));
      symbol.averageEntryPrice = parseFloat(symbol.averageEntryPrice.toFixed(2));
    });
    
    res.status(200).json({ symbols: Object.values(symbolPerformance) });
  } catch (error) {
    logger.error(`Error retrieving symbol analytics: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve symbol analytics' });
  }
});

// GET /api/analytics/historical-metrics - Get saved metrics over time
router.get('/historical-metrics', authenticateDashboard, async (req, res) => {
  try {
    const { limit = 90 } = req.query;
    
    // Get metrics from database
    const metricsCollection = await dbService.getCollection('tradeMetrics');
    const metrics = await metricsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.status(200).json({ metrics });
  } catch (error) {
    logger.error(`Error retrieving historical metrics: ${error.message}`);
    res.status(500).json({ error: 'Failed to retrieve historical metrics' });
  }
});

// Helper function to group trades by interval
function groupTradesByInterval(trades, interval) {
  const result = {};
  
  trades.forEach(trade => {
    const date = new Date(trade.timestamp);
    let intervalKey;
    
    if (interval === 'daily') {
      intervalKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (interval === 'weekly') {
      // Get the Monday of the current week
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      const monday = new Date(date.setDate(diff));
      intervalKey = monday.toISOString().split('T')[0];
    } else if (interval === 'monthly') {
      intervalKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    } else {
      intervalKey = date.toISOString().split('T')[0]; // Default to daily
    }
    
    if (!result[intervalKey]) {
      result[intervalKey] = {
        interval: intervalKey,
        trades: 0,
        buyTrades: 0,
        sellTrades: 0,
        profit: 0,
        profitPercentage: 0,
        winTrades: 0,
        lossTrades: 0
      };
    }
    
    result[intervalKey].trades++;
    
    if (trade.action === 'BUY') {
      result[intervalKey].buyTrades++;
    } else if (trade.action === 'SELL') {
      result[intervalKey].sellTrades++;
      
      if (trade.entryPrice) {
        const tradeProfit = (trade.price - trade.entryPrice) * trade.size;
        const tradeProfitPercentage = ((trade.price - trade.entryPrice) / trade.entryPrice) * 100;
        
        result[intervalKey].profit += tradeProfit;
        result[intervalKey].profitPercentage += tradeProfitPercentage;
        
        if (trade.price > trade.entryPrice) {
          result[intervalKey].winTrades++;
        } else {
          result[intervalKey].lossTrades++;
        }
      }
    }
  });
  
  // Format numbers and sort by interval
  return Object.values(result)
    .map(data => ({
      ...data,
      profit: parseFloat(data.profit.toFixed(2)),
      profitPercentage: parseFloat(data.profitPercentage.toFixed(2)),
      winRate: (data.winTrades + data.lossTrades) > 0 
        ? parseFloat((data.winTrades / (data.winTrades + data.lossTrades)).toFixed(2)) 
        : 0
    }))
    .sort((a, b) => a.interval.localeCompare(b.interval));
}

module.exports = router;