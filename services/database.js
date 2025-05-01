const { MongoClient, ServerApiVersion } = require('mongodb');
const { createLogger } = require('../config/logger');

const logger = createLogger('database-service');

class DatabaseService {
  constructor() {
    this.uri = process.env.MONGODB_URI || 'mongodb+srv://aisupertraderadmin:231fvYzRQ8kl26zh@cluster0.mpq0dqh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    this.client = new MongoClient(this.uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    this.dbName = 'ati2000';
    this.connected = false;
    this.connection = null;
  }

  async connect() {
    if (this.connected) return this.connection;

    try {
      logger.info('Connecting to MongoDB Atlas...');
      await this.client.connect();
      
      // Test connection with a ping
      await this.client.db('admin').command({ ping: 1 });
      logger.info('Successfully connected to MongoDB Atlas');
      
      this.connection = this.client.db(this.dbName);
      this.connected = true;
      return this.connection;
    } catch (error) {
      logger.error(`MongoDB connection error: ${error.message}`);
      throw error;
    }
  }

  async getCollection(collectionName) {
    const db = await this.connect();
    return db.collection(collectionName);
  }

  async saveTrade(trade) {
    try {
      const trades = await this.getCollection('trades');
      
      const result = await trades.insertOne({
        ...trade,
        createdAt: new Date(),
      });
      
      logger.info(`Trade saved to MongoDB with ID: ${result.insertedId}`);
      return result.insertedId;
    } catch (error) {
      logger.error(`Error saving trade to MongoDB: ${error.message}`);
      throw error;
    }
  }

  async getTradeHistory(limit = 100, filter = {}) {
    try {
      const trades = await this.getCollection('trades');
      
      return await trades
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      logger.error(`Error retrieving trade history from MongoDB: ${error.message}`);
      throw error;
    }
  }

  async saveTradeMetrics(metrics) {
    try {
      const tradesMetrics = await this.getCollection('tradeMetrics');
      
      const result = await tradesMetrics.insertOne({
        ...metrics,
        timestamp: new Date()
      });
      
      logger.info(`Trade metrics saved to MongoDB with ID: ${result.insertedId}`);
      return result.insertedId;
    } catch (error) {
      logger.error(`Error saving trade metrics to MongoDB: ${error.message}`);
      throw error;
    }
  }

  async saveMarketData(ticker, timeframe, data) {
    try {
      const marketData = await this.getCollection('marketData');
      
      const result = await marketData.insertOne({
        ticker,
        timeframe,
        data,
        timestamp: new Date()
      });
      
      logger.info(`Market data saved to MongoDB with ID: ${result.insertedId}`);
      return result.insertedId;
    } catch (error) {
      logger.error(`Error saving market data to MongoDB: ${error.message}`);
      throw error;
    }
  }

  async getMarketData(ticker, timeframe, startDate, endDate) {
    try {
      const marketData = await this.getCollection('marketData');
      
      const query = { ticker };
      if (timeframe) query.timeframe = timeframe;
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }
      
      return await marketData
        .find(query)
        .sort({ timestamp: 1 })
        .toArray();
    } catch (error) {
      logger.error(`Error retrieving market data from MongoDB: ${error.message}`);
      throw error;
    }
  }

  async saveStrategy(strategyConfig) {
    try {
      const strategies = await this.getCollection('strategies');
      
      const result = await strategies.insertOne({
        ...strategyConfig,
        updatedAt: new Date()
      });
      
      logger.info(`Strategy saved to MongoDB with ID: ${result.insertedId}`);
      return result.insertedId;
    } catch (error) {
      logger.error(`Error saving strategy to MongoDB: ${error.message}`);
      throw error;
    }
  }

  async updateStrategy(strategyId, strategyConfig) {
    try {
      const strategies = await this.getCollection('strategies');
      
      const result = await strategies.updateOne(
        { _id: strategyId },
        { 
          $set: {
            ...strategyConfig,
            updatedAt: new Date()
          } 
        }
      );
      
      logger.info(`Strategy updated in MongoDB: ${result.modifiedCount} document(s) modified`);
      return result.modifiedCount > 0;
    } catch (error) {
      logger.error(`Error updating strategy in MongoDB: ${error.message}`);
      throw error;
    }
  }

  async getTradesByDateRange(startDate, endDate) {
    try {
      const trades = await this.getCollection('trades');
      
      return await trades
        .find({
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        })
        .sort({ createdAt: 1 })
        .toArray();
    } catch (error) {
      logger.error(`Error retrieving trades by date range from MongoDB: ${error.message}`);
      throw error;
    }
  }

  async close() {
    if (this.client) {
      try {
        await this.client.close();
        this.connected = false;
        logger.info('MongoDB connection closed');
      } catch (error) {
        logger.error(`Error closing MongoDB connection: ${error.message}`);
      }
    }
  }
}

module.exports = new DatabaseService();