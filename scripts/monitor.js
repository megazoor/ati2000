#!/usr/bin/env node

/**
 * Simple monitoring script that can be run as a cron job to check system health
 * and send notifications if anything is wrong.
 * 
 * Usage: 
 * 1. Add execution permission: chmod +x scripts/monitor.js
 * 2. Run: ./scripts/monitor.js https://yourdomain.com optional_webhook_url
 */

const https = require('https');
const http = require('http');

// Get URL from command line argument
const url = process.argv[2];
const webhookUrl = process.argv[3]; // Optional webhook URL for notifications

if (!url) {
  console.error('Error: URL parameter required');
  console.error('Usage: ./monitor.js https://yourdomain.com optional_webhook_url');
  process.exit(1);
}

// Function to send webhook notification
const sendNotification = (message) => {
  if (!webhookUrl) return;
  
  try {
    const parsedUrl = new URL(webhookUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = protocol.request(options);
    
    req.on('error', (error) => {
      console.error('Error sending notification:', error.message);
    });
    
    req.write(JSON.stringify({ message }));
    req.end();
  } catch (error) {
    console.error('Invalid webhook URL:', error.message);
  }
};

// Function to check system health
const checkHealth = () => {
  try {
    const parsedUrl = new URL(`${url}/api/health`);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = protocol.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'GET'
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            const errorMsg = `Health check failed with status code ${res.statusCode}`;
            console.error(errorMsg);
            sendNotification(errorMsg);
            process.exit(1);
          }
          
          const response = JSON.parse(data);
          
          if (response.status !== 'ok') {
            const errorMsg = `System health check returned status: ${response.status}`;
            console.error(errorMsg);
            sendNotification(errorMsg);
            process.exit(1);
          }
          
          console.log('Health check passed');
          process.exit(0);
        } catch (error) {
          const errorMsg = `Error parsing health check response: ${error.message}`;
          console.error(errorMsg);
          sendNotification(errorMsg);
          process.exit(1);
        }
      });
    });
    
    req.on('error', (error) => {
      const errorMsg = `Health check request failed: ${error.message}`;
      console.error(errorMsg);
      sendNotification(errorMsg);
      process.exit(1);
    });
    
    req.end();
  } catch (error) {
    const errorMsg = `Error in health check: ${error.message}`;
    console.error(errorMsg);
    sendNotification(errorMsg);
    process.exit(1);
  }
};

// Run the health check
checkHealth();