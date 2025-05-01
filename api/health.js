const express = require('express');
const router = express.Router();
const os = require('os');
const { createLogger } = require('../config/logger');
const fs = require('fs');
const path = require('path');
const { version } = require('../package.json');

const logger = createLogger('health-api');

// GET /api/health - Basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// GET /api/health/details - Detailed health check with system information
router.get('/details', (req, res) => {
  try {
    const uptime = process.uptime();
    const days = Math.floor(uptime / (60 * 60 * 24));
    const hours = Math.floor((uptime % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const formattedUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    
    const freeMem = Math.round(os.freemem() / (1024 * 1024));
    const totalMem = Math.round(os.totalmem() / (1024 * 1024));
    const usedMem = totalMem - freeMem;
    const memoryUsage = Math.round((usedMem / totalMem) * 100);
    
    const healthData = {
      status: 'ok',
      version,
      uptime: formattedUptime,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        memory: {
          total: `${totalMem} MB`,
          free: `${freeMem} MB`,
          used: `${usedMem} MB`,
          percent: `${memoryUsage}%`
        },
        load: os.loadavg()
      },
      timestamp: new Date().toISOString()
    };
    
    res.status(200).json(healthData);
  } catch (error) {
    logger.error(`Error in health check: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to retrieve health data' });
  }
});

module.exports = router;