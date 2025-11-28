const express = require('express');
const router = express.Router();
const {
  saveFeedback,
  getAllFeedbacks,
  getFeedbacksByDocno,
  getFeedbackStatistics,
} = require('../storage/feedbackRepository');

/**
 * POST /api/feedback
 * Сохраняет фидбек от аналитика по транзакции
 */
router.post('/feedback', async (req, res) => {
  try {
    const { docno, label, comment } = req.body;

    if (!docno) {
      return res.status(400).json({
        success: false,
        error: 'docno is required',
      });
    }

    if (!label) {
      return res.status(400).json({
        success: false,
        error: 'label is required',
      });
    }

    // Валидация label
    const validLabels = [
      'false_positive',
      'true_positive',
      'confirmed_fraud',
      'needs_review',
    ];

    if (!validLabels.includes(label)) {
      return res.status(400).json({
        success: false,
        error: `label must be one of: ${validLabels.join(', ')}`,
      });
    }

    const feedback = {
      docno,
      label,
      comment: comment || '',
    };

    const savedFeedback = await saveFeedback(feedback);

    res.json({
      success: true,
      feedback: savedFeedback,
      message: 'Feedback saved successfully',
    });

  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/feedback
 * Получает все фидбеки
 */
router.get('/feedback', async (req, res) => {
  try {
    const feedbacks = await getAllFeedbacks();

    res.json({
      success: true,
      feedbacks,
      count: feedbacks.length,
    });

  } catch (error) {
    console.error('Error getting feedbacks:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/feedback/statistics
 * Получает статистику по фидбекам
 */
router.get('/feedback/statistics', async (req, res) => {
  try {
    const statistics = await getFeedbackStatistics();

    res.json({
      success: true,
      statistics,
    });

  } catch (error) {
    console.error('Error getting feedback statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/feedback/:docno
 * Получает фидбеки по конкретной транзакции
 */
router.get('/feedback/:docno', async (req, res) => {
  try {
    const { docno } = req.params;
    const feedbacks = await getFeedbacksByDocno(docno);

    res.json({
      success: true,
      docno,
      feedbacks,
      count: feedbacks.length,
    });

  } catch (error) {
    console.error('Error getting feedbacks by docno:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
