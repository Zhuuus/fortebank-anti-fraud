const fs = require('fs-extra');
const path = require('path');

// Путь к файлу с фидбеком
const FEEDBACK_FILE = path.join(__dirname, '../storage/feedback.json');

/**
 * Инициализирует файл feedback, если он не существует
 */
async function initializeFeedbackFile() {
  try {
    await fs.ensureFile(FEEDBACK_FILE);
    
    const fileContent = await fs.readFile(FEEDBACK_FILE, 'utf-8');
    if (!fileContent.trim()) {
      await fs.writeJson(FEEDBACK_FILE, [], { spaces: 2 });
    }
  } catch (error) {
    console.error('Error initializing feedback file:', error);
    throw error;
  }
}

/**
 * Сохраняет фидбек от аналитика
 * @param {Object} feedback - объект с фидбеком
 * @returns {Promise<Object>} сохраненный фидбек
 */
async function saveFeedback(feedback) {
  try {
    await initializeFeedbackFile();

    const feedbacks = await fs.readJson(FEEDBACK_FILE);
    
    const newFeedback = {
      id: Date.now().toString(),
      ...feedback,
      timestamp: new Date().toISOString(),
    };

    feedbacks.push(newFeedback);
    
    await fs.writeJson(FEEDBACK_FILE, feedbacks, { spaces: 2 });
    
    return newFeedback;
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw new Error(`Failed to save feedback: ${error.message}`);
  }
}

/**
 * Получает все сохраненные фидбеки
 * @returns {Promise<Array>} массив фидбеков
 */
async function getAllFeedbacks() {
  try {
    await initializeFeedbackFile();
    
    const feedbacks = await fs.readJson(FEEDBACK_FILE);
    return feedbacks;
  } catch (error) {
    console.error('Error reading feedbacks:', error);
    return [];
  }
}

/**
 * Получает фидбеки по конкретной транзакции
 * @param {string} docno - номер документа транзакции
 * @returns {Promise<Array>} массив фидбеков для транзакции
 */
async function getFeedbacksByDocno(docno) {
  try {
    const feedbacks = await getAllFeedbacks();
    return feedbacks.filter(f => f.docno === docno);
  } catch (error) {
    console.error('Error getting feedbacks by docno:', error);
    return [];
  }
}

/**
 * Получает статистику по фидбекам
 * @returns {Promise<Object>} статистика фидбеков
 */
async function getFeedbackStatistics() {
  try {
    const feedbacks = await getAllFeedbacks();
    
    const stats = {
      total: feedbacks.length,
      by_label: {},
      recent: feedbacks.slice(-10).reverse(),
    };

    feedbacks.forEach(feedback => {
      const label = feedback.label || 'unknown';
      stats.by_label[label] = (stats.by_label[label] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error calculating feedback statistics:', error);
    return { total: 0, by_label: {}, recent: [] };
  }
}

module.exports = {
  saveFeedback,
  getAllFeedbacks,
  getFeedbacksByDocno,
  getFeedbackStatistics,
};
