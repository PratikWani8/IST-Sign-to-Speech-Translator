const express = require('express');
const router = express.Router();
const { isDbConnected } = require('../config/db');
const aiService = require('../services/aiService');

router.get('/', async (req, res) => {
  const aiHealth = await aiService.getHealth();
  const dbConnected = isDbConnected();

  const isHealthy = aiHealth.status === 'healthy';

  return res.status(isHealthy ? 200 : 207).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'ISL Express Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    components: {
      database: {
        connected: dbConnected,
        type: dbConnected ? 'mongodb' : 'in-memory-fallback',
      },
      aiMicroservice: aiHealth,
    },
  });
});

module.exports = router;
