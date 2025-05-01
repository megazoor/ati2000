const axios = require('axios');
const crypto = require('crypto-js');
const { createLogger } = require('../config/logger');

const logger = createLogger('coinbase-service');
const BASE_URL = 'https://api.coinbase.com/api/v3/brokerage';

class CoinbaseService {
  constructor() {
    this.apiKey = process.env.COINBASE_API_KEY;
    this.apiSecret = process.env.COINBASE_API_SECRET;
    
    if (!this.apiKey || !this.apiSecret) {
      logger.error('Coinbase API credentials not found in environment variables');
    }
  }

  // Create signature for API request
  createSignature(requestPath, method, timestamp, body = '') {
    const message = timestamp + method + requestPath + body;
    return crypto.HmacSHA256(message, this.apiSecret).toString();
  }

  // Make authenticated request to Coinbase API
  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const requestPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const fullUrl = `${BASE_URL}${requestPath}`;
      
      const body = data ? JSON.stringify(data) : '';
      const signature = this.createSignature(requestPath, method, timestamp, body);
      
      const headers = {
        'CB-ACCESS-KEY': this.apiKey,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json'
      };

      const response = await axios({
        method,
        url: fullUrl,
        headers,
        data: data || undefined
      });

      return response.data;
    } catch (error) {
      logger.error(`Coinbase API error: ${error.message}`, { 
        stack: error.stack,
        response: error.response?.data
      });
      throw new Error(`Coinbase API error: ${error.message}`);
    }
  }

  // Get account information
  async getAccounts() {
    return this.makeRequest('/accounts');
  }

  // Get product information (ticker)
  async getProduct(productId) {
    return this.makeRequest(`/products/${productId}`);
  }

  // Get current price for a product
  async getCurrentPrice(productId) {
    try {
      const product = await this.getProduct(productId);
      return parseFloat(product.price);
    } catch (error) {
      logger.error(`Failed to get current price for ${productId}: ${error.message}`);
      throw error;
    }
  }

  // Place a market order
  async placeMarketOrder(productId, side, size) {
    const orderData = {
      client_order_id: crypto.lib.WordArray.random(16).toString(),
      product_id: productId,
      side: side.toLowerCase(), // buy or sell
      order_configuration: {
        market_market_ioc: {
          quote_size: size.toString()
        }
      }
    };

    try {
      logger.info(`Placing ${side} market order for ${size} of ${productId}`);
      const result = await this.makeRequest('/orders', 'POST', orderData);
      logger.info(`Order placed successfully: ${result.order_id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to place ${side} market order: ${error.message}`);
      throw error;
    }
  }

  // Place a limit order
  async placeLimitOrder(productId, side, price, size) {
    const orderData = {
      client_order_id: crypto.lib.WordArray.random(16).toString(),
      product_id: productId,
      side: side.toLowerCase(), // buy or sell
      order_configuration: {
        limit_limit_gtc: {
          limit_price: price.toString(),
          base_size: size.toString()
        }
      }
    };

    try {
      logger.info(`Placing ${side} limit order for ${size} of ${productId} at ${price}`);
      const result = await this.makeRequest('/orders', 'POST', orderData);
      logger.info(`Limit order placed successfully: ${result.order_id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to place ${side} limit order: ${error.message}`);
      throw error;
    }
  }

  // Place a stop loss order
  async placeStopLossOrder(productId, stopPrice, size) {
    const orderData = {
      client_order_id: crypto.lib.WordArray.random(16).toString(),
      product_id: productId,
      side: 'sell',
      order_configuration: {
        stop_limit_stop_limit_gtc: {
          stop_price: stopPrice.toString(),
          limit_price: (stopPrice * 0.99).toString(), // Set limit price slightly below stop price
          base_size: size.toString()
        }
      }
    };

    try {
      logger.info(`Placing stop loss order for ${size} of ${productId} at ${stopPrice}`);
      const result = await this.makeRequest('/orders', 'POST', orderData);
      logger.info(`Stop loss order placed successfully: ${result.order_id}`);
      return result;
    } catch (error) {
      logger.error(`Failed to place stop loss order: ${error.message}`);
      throw error;
    }
  }

  // Get open orders
  async getOpenOrders() {
    return this.makeRequest('/orders?status=OPEN');
  }

  // Get order by ID
  async getOrderById(orderId) {
    return this.makeRequest(`/orders/${orderId}`);
  }

  // Cancel order
  async cancelOrder(orderId) {
    try {
      logger.info(`Cancelling order: ${orderId}`);
      const result = await this.makeRequest(`/orders/batch_cancel`, 'POST', {
        order_ids: [orderId]
      });
      logger.info(`Order cancelled successfully: ${orderId}`);
      return result;
    } catch (error) {
      logger.error(`Failed to cancel order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  // Get ATR (Average True Range) - this would typically be calculated from price data
  // Here's a placeholder implementation
  async getATR(productId, period = 14) {
    // In a real implementation, you would fetch historical candle data and calculate ATR
    // This is a placeholder that returns a fixed value
    logger.info(`Getting ATR for ${productId} with period ${period}`);
    return 2000; // Placeholder ATR value for BTC-USD
  }
}

module.exports = new CoinbaseService();