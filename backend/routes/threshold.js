const express = require('express');
const router = express.Router();
const { calculateSummary } = require('../services/analytics');

/**
 * POST /api/apply-threshold
 * Пересчитывает метрики на основе нового порога
 */
router.post('/apply-threshold', (req, res) => {
  try {
    const { transactions, threshold } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'transactions array is required',
      });
    }

    if (threshold === undefined || threshold === null) {
      return res.status(400).json({
        success: false,
        error: 'threshold is required',
      });
    }

    const thresholdValue = parseFloat(threshold);

    if (isNaN(thresholdValue) || thresholdValue < 0 || thresholdValue > 1) {
      return res.status(400).json({
        success: false,
        error: 'threshold must be a number between 0 and 1',
      });
    }

    // Рассчитываем новый summary
    const summary = calculateSummary(transactions, thresholdValue);

    // Определяем какие транзакции попадают под порог
    const flaggedTransactions = transactions
      .filter(t => t.fraud_score >= thresholdValue)
      .map(t => ({
        docno: t.docno,
        fraud_score: t.fraud_score,
        amount: t.amount,
        client_id: t.client_id,
      }));

    res.json({
      success: true,
      summary,
      flagged_transactions: flaggedTransactions,
      flagged_docnos: flaggedTransactions.map(t => t.docno),
    });

  } catch (error) {
    console.error('Error applying threshold:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
