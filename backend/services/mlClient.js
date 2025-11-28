const axios = require('axios');

// ML Service URL - можно вынести в переменные окружения
// Default to http://localhost:8000 where the Python FastAPI service runs
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Отправляет транзакции в ML-сервис для получения fraud_score
 * @param {Array} transactions - массив транзакций
 * @returns {Promise<Array>} массив с fraud_score для каждой транзакции
 */
async function predictFraud(transactions) {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      { rows: transactions },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Увеличиваем таймаут до 3 минут, чтобы дать модели
        // время обработать большой батч транзакций
        timeout: 180000,
      }
    );

    return response.data.predictions || [];
  } catch (error) {
    console.error('Error calling ML service:', error?.message || error);
    
    if (error.response) {
      console.error('ML service response data:', JSON.stringify(error.response.data));
      throw new Error(`ML Service error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('ML Service is not responding. Please check if the service is running.');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
}

/**
 * Получает важность признаков из ML-сервиса
 * @returns {Promise<Object>} объект с важностью признаков
 */
async function getFeatureImportance() {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/feature-importance`,
      {
        timeout: 10000, // 10 секунд таймаут
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting feature importance:', error.message);
    
    if (error.response) {
      throw new Error(`ML Service error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('ML Service is not responding');
    } else {
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
}

/**
 * Проверяет доступность ML-сервиса
 * @returns {Promise<boolean>}
 */
async function checkMLServiceHealth() {
  try {
    const response = await axios.get(
      `${ML_SERVICE_URL}/health`,
      { timeout: 5000 }
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

module.exports = {
  predictFraud,
  getFeatureImportance,
  checkMLServiceHealth,
};
