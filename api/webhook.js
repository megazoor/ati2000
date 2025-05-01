const express = require('express');
const router = express.Router();
const strategyService = require('../services/strategy');
const { createLogger } = require('../config/logger');
const rateLimit = require('express-rate-limit');

const logger = createLogger('webhook-api');

// IP whitelist middleware
const ipWhitelist = (req, res, next) => {
  const allowedIPs = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];
  
  // Skip IP check in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (allowedIPs.length > 0 && !allowedIPs.includes(req.ip)) {
    logger.warn(`Blocked request from unauthorized IP: ${req.ip}`);
    return res.status(403).json({ error: 'Unauthorized IP address' });
  }
  
  next();
};

// Webhook secret validation middleware
const validateWebhookSecret = (req, res, next) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const providedSecret = req.headers['x-webhook-secret'];
  
  // Skip secret check in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (webhookSecret && (!providedSecret || providedSecret !== webhookSecret)) {
    logger.warn('Invalid webhook secret provided');
    return res.status(403).json({ error: 'Invalid webhook secret' });
  }
  
  next();
};

// Rate limit specifically for webhook endpoint
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

// POST /api/webhook/tradingview - Receive signals from TradingView
router.post('/tradingview',
  webhookLimiter,
  ipWhitelist,
  validateWebhookSecret,
  async (req, res) => {
    try {
      const signal = req.body;
      
      logger.info(`Received TradingView signal: ${JSON.stringify(signal)}`);
      
      if (!signal || !signal.ticker || !signal.action) {
        logger.error('Invalid signal format');
        return res.status(400).json({ error: 'Invalid signal format' });
      }
      
      // Process the signal
      const result = await strategyService.processSignal(signal);
      
      if (result.success) {
        logger.info(`Signal processed successfully: ${result.message}`);
        return res.status(200).json(result);
      } else {
        logger.warn(`Signal processing failed: ${result.message}`);
        return res.status(400).json(result);
      }
    } catch (error) {
      logger.error(`Error processing webhook: ${error.message}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/webhook/test - Test endpoint for signal validation
router.post('/test', async (req, res) => {
  try {
    const signal = req.body;
    logger.info(`Received test signal: ${JSON.stringify(signal)}`);
    
    // Only validate the signal format but don't execute real trades
    const isValid = strategyService.validateSignal(signal);
    
    if (isValid) {
      return res.status(200).json({ 
        success: true, 
        message: 'Signal format is valid',
        signal,
        wouldExecute: strategyService.isTradingAllowed()
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid signal format',
        signal 
      });
    }
  } catch (error) {
    logger.error(`Error in test endpoint: ${error.message}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;