const fs = require('fs');
const path = require('path');
const coinbaseService = require('./coinbase');
const dbService = require('./database');
const { createLogger } = require('../config/logger');

const logger = createLogger('strategy-service');
const configPath = path.join(__dirname, '..', 'config', 'strategy-config.json');

// Default strategy configuration
const defaultConfig = {
  enabled: true,
  stopLossATR: 0.8,
  takeProfitATR: 3.2,
  useVwapFilter: false,
  useMacdFilter: false,
  tradingHoursOnly: false,
  tradingStartHour: 9, // 9 AM
  tradingEndHour: 16, // 4 PM
  maxTradesPerDay: 5,
  minimumConfidence: 0.7,
  whitelistedSymbols: ['BTC-USD', 'ETH-USD']
};

class StrategyService {
  constructor() {
    this.config = this.loadConfig();
    this.trades = this.loadTrades();
    this.currentPosition = null;
    
    // Create initial configuration file if it doesn't exist
    if (!fs.existsSync(configPath)) {
      this.saveConfig(defaultConfig);
    }
  }

  // Load strategy configuration
  loadConfig() {
    try {
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
      }
      return defaultConfig;
    } catch (error) {
      logger.error(`Error loading strategy config: ${error.message}`);
      return defaultConfig;
    }
  }

  // Save strategy configuration
  saveConfig(config) {
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      this.config = config;
      logger.info('Strategy configuration saved');
      return true;
    } catch (error) {
      logger.error(`Error saving strategy config: ${error.message}`);
      return false;
    }
  }

  // Load trade history
  async loadTrades() {
    try {
      const trades = await dbService.getTradeHistory(100);
      return { trades };
    } catch (error) {
      logger.error(`Error loading trades from database: ${error.message}`);
      
      // Fallback to file-based if available
      try {
        const tradesLogPath = path.join(__dirname, '..', 'logs', 'trades.json');
        if (fs.existsSync(tradesLogPath)) {
          const data = fs.readFileSync(tradesLogPath, 'utf8');
          return JSON.parse(data);
        }
      } catch (fileError) {
        logger.error(`Error loading trades from file: ${fileError.message}`);
      }
      
      return { trades: [] };
    }
  }

  // Save trade to database
  async saveTrade(trade) {
    try {
      const tradeData = {
        ...trade,
        timestamp: new Date().toISOString()
      };
      
      // Save to MongoDB
      await dbService.saveTrade(tradeData);
      
      // Also update local cache
      this.trades.trades.push(tradeData);
      
      // Optionally still save to file as backup
      try {
        const tradesLogPath = path.join(__dirname, '..', 'logs', 'trades.json');
        fs.writeFileSync(tradesLogPath, JSON.stringify(this.trades, null, 2), 'utf8');
      } catch (fileError) {
        logger.warn(`Couldn't save trade to file backup: ${fileError.message}`);
      }
      
      logger.info(`Trade saved to database: ${trade.action} ${trade.ticker} at ${trade.price}`);
      return true;
    } catch (error) {
      logger.error(`Error saving trade to database: ${error.message}`);
      return false;
    }
  }

  // Get trade history
  async getTradeHistory(limit = 20) {
    try {
      // Try to get from database
      const trades = await dbService.getTradeHistory(limit);
      return trades;
    } catch (error) {
      logger.error(`Error getting trade history from database: ${error.message}`);
      // Fall back to in-memory cache if database fails
      return this.trades.trades.slice(-limit).reverse();
    }
  }

  // Update strategy configuration
  updateConfig(newConfig) {
    const updatedConfig = { ...this.config, ...newConfig };
    return this.saveConfig(updatedConfig);
  }

  // Check if trading is allowed by time restrictions
  isTradingAllowed() {
    if (!this.config.enabled) {
      logger.info('Trading is disabled in configuration');
      return false;
    }

    if (this.config.tradingHoursOnly) {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour < this.config.tradingStartHour || hour >= this.config.tradingEndHour) {
        logger.info(`Trading not allowed outside hours ${this.config.tradingStartHour}-${this.config.tradingEndHour}`);
        return false;
      }
    }

    // Check max trades per day
    if (this.config.maxTradesPerDay > 0) {
      const today = new Date().toISOString().split('T')[0];
      const tradesForToday = this.trades.trades.filter(trade => 
        trade.timestamp.startsWith(today)
      ).length;
      
      if (tradesForToday >= this.config.maxTradesPerDay) {
        logger.info(`Max trades per day (${this.config.maxTradesPerDay}) reached`);
        return false;
      }
    }

    return true;
  }

  // Validate incoming signal
  validateSignal(signal) {
    // Check required fields
    if (!signal.ticker || !signal.action) {
      logger.error('Invalid signal: missing ticker or action');
      return false;
    }

    // Check if ticker is in whitelist
    if (this.config.whitelistedSymbols.length > 0 && 
        !this.config.whitelistedSymbols.includes(signal.ticker)) {
      logger.error(`Ticker ${signal.ticker} not in whitelist`);
      return false;
    }

    // Check confidence threshold
    if (signal.confidence && signal.confidence < this.config.minimumConfidence) {
      logger.error(`Signal confidence ${signal.confidence} below threshold ${this.config.minimumConfidence}`);
      return false;
    }

    return true;
  }

  // Process an incoming trading signal
  async processSignal(signal) {
    try {
      logger.info(`Processing signal: ${JSON.stringify(signal)}`);

      // Check if trading is allowed
      if (!this.isTradingAllowed()) {
        return {
          success: false,
          message: 'Trading not allowed by current configuration'
        };
      }

      // Validate the signal
      if (!this.validateSignal(signal)) {
        return {
          success: false,
          message: 'Invalid signal'
        };
      }

      // Get current price if not provided
      let entryPrice = signal.entryPrice;
      if (!entryPrice) {
        entryPrice = await coinbaseService.getCurrentPrice(signal.ticker);
      }

      // Get ATR for the product (for stop loss and take profit)
      const atr = await coinbaseService.getATR(signal.ticker);
      
      // Calculate stop loss and take profit levels if not provided
      const stopLossATR = signal.stopLossATR || this.config.stopLossATR;
      const takeProfitATR = signal.takeProfitATR || this.config.takeProfitATR;
      
      let stopLossPrice, takeProfitPrice;
      
      if (signal.action === 'BUY') {
        stopLossPrice = entryPrice - (atr * stopLossATR);
        takeProfitPrice = entryPrice + (atr * takeProfitATR);
      } else {
        stopLossPrice = entryPrice + (atr * stopLossATR);
        takeProfitPrice = entryPrice - (atr * takeProfitATR);
      }

      // Execute the trade
      const tradeSize = 0.01; // Fixed size for now
      let orderResult;
      
      if (signal.action === 'BUY') {
        orderResult = await coinbaseService.placeMarketOrder(
          signal.ticker,
          'BUY',
          tradeSize
        );
        
        // Set stop loss after buy
        await coinbaseService.placeStopLossOrder(
          signal.ticker,
          stopLossPrice,
          tradeSize
        );
      } else if (signal.action === 'SELL') {
        orderResult = await coinbaseService.placeMarketOrder(
          signal.ticker,
          'SELL',
          tradeSize
        );
      }

      // Save the trade to log
      const tradeRecord = {
        ticker: signal.ticker,
        action: signal.action,
        price: entryPrice,
        size: tradeSize,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
        orderId: orderResult.order_id,
        confidence: signal.confidence || null,
        entryPrice: signal.action === 'SELL' ? this.currentPosition?.entryPrice : entryPrice
      };
      
      await this.saveTrade(tradeRecord);
      
      // Update current position
      this.currentPosition = signal.action === 'BUY' ? {
        ticker: signal.ticker,
        entryPrice,
        stopLoss: stopLossPrice,
        takeProfit: takeProfitPrice,
        size: tradeSize,
        entryTime: new Date().toISOString()
      } : null;

      return {
        success: true,
        message: `${signal.action} order executed for ${signal.ticker}`,
        trade: tradeRecord
      };
    } catch (error) {
      logger.error(`Error processing signal: ${error.message}`);
      return {
        success: false,
        message: `Error processing signal: ${error.message}`
      };
    }
  }

  // Get current position
  getCurrentPosition() {
    return this.currentPosition;
  }

  // Get strategy metrics
  async getMetrics() {
    try {
      // Get trades from database
      const trades = await dbService.getTradeHistory(1000);
      
      // Calculate win rate
      const winTrades = trades.filter(trade => 
        trade.action === 'SELL' && trade.price > trade.entryPrice
      ).length;
      
      const lossTrades = trades.filter(trade => 
        trade.action === 'SELL' && trade.price < trade.entryPrice
      ).length;
      
      const totalCompletedTrades = winTrades + lossTrades;
      const winRate = totalCompletedTrades > 0 ? (winTrades / totalCompletedTrades) : 0;

      // Calculate profit metrics
      let totalProfit = 0;
      let profitPercentage = 0;
      
      // Group trades by ticker for proper P&L calculation
      const tradesByTicker = {};
      trades.forEach(trade => {
        if (!tradesByTicker[trade.ticker]) {
          tradesByTicker[trade.ticker] = [];
        }
        tradesByTicker[trade.ticker].push(trade);
      });
      
      // Calculate profit for each ticker
      Object.values(tradesByTicker).forEach(tickerTrades => {
        let position = null;
        tickerTrades.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(trade => {
          if (trade.action === 'BUY') {
            position = {
              price: trade.price,
              size: trade.size
            };
          } else if (trade.action === 'SELL' && position) {
            const tradeProfit = (trade.price - position.price) * position.size;
            const tradeProfitPercentage = ((trade.price - position.price) / position.price) * 100;
            
            totalProfit += tradeProfit;
            profitPercentage += tradeProfitPercentage;
            
            position = null;
          }
        });
      });
      
      const metrics = {
        totalTrades: trades.length,
        completedTrades: totalCompletedTrades,
        winTrades,
        lossTrades,
        winRate,
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        profitPercentage: parseFloat(profitPercentage.toFixed(2)),
        config: this.config,
        lastUpdated: new Date().toISOString()
      };
      
      // Save metrics to database for historical tracking
      await dbService.saveTradeMetrics(metrics);
      
      return metrics;
    } catch (error) {
      logger.error(`Error calculating metrics from database: ${error.message}`);
      
      // Fall back to in-memory data if database fails
      const trades = this.trades.trades;
      
      const winTrades = trades.filter(trade => 
        trade.action === 'SELL' && trade.price > trade.entryPrice
      ).length;
      
      const lossTrades = trades.filter(trade => 
        trade.action === 'SELL' && trade.price < trade.entryPrice
      ).length;
      
      const totalCompletedTrades = winTrades + lossTrades;
      const winRate = totalCompletedTrades > 0 ? (winTrades / totalCompletedTrades) : 0;
      
      return {
        totalTrades: trades.length,
        completedTrades: totalCompletedTrades,
        winTrades,
        lossTrades,
        winRate,
        config: this.config
      };
    }
  }
}

module.exports = new StrategyService();