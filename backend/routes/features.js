const express = require('express');
const router = express.Router();
const { getFeatureImportance } = require('../services/mlClient');

/**
 * GET /api/feature-importance
 * Получает важность признаков из ML-сервиса
 */
router.get('/feature-importance', async (req, res) => {
  try {
    const featureImportance = await getFeatureImportance();

    res.json({
      success: true,
      feature_importance: featureImportance,
    });

  } catch (error) {
    console.error('Error getting feature importance:', error);
    
    if (error.message.includes('not responding')) {
      return res.status(503).json({
        success: false,
        error: 'ML Service unavailable',
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
