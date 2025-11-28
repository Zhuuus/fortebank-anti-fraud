/**
 * Сервис для расчета аналитики по транзакциям
 */

/**
 * Рассчитывает основные метрики по транзакциям
 * @param {Array} transactions - массив транзакций с fraud_score
 * @param {number} threshold - порог для определения мошенничества
 * @returns {Object} объект с метриками
 */
function calculateSummary(transactions, threshold = 0.8) {
  const total = transactions.length;
  const flagged = transactions.filter(t => t.fraud_score >= threshold).length;

  return {
    total,
    flagged_by_threshold: flagged,
    threshold,
    flagged_percentage: total > 0 ? ((flagged / total) * 100).toFixed(2) : 0,
  };
}

/**
 * Группирует транзакции по часам
 * @param {Array} transactions - массив транзакций с fraud_score
 * @param {number} threshold - порог для определения мошенничества
 * @returns {Array} массив с группировкой по часам
 */
function analyzeByHour(transactions, threshold = 0.8) {
  const hourlyData = {};

  // Инициализация всех часов
  for (let i = 0; i < 24; i++) {
    hourlyData[i] = { hour: i, count: 0, flagged: 0 };
  }

  transactions.forEach(transaction => {
    try {
      const date = new Date(transaction.transdatetime);
      const hour = date.getHours();

      if (!isNaN(hour) && hour >= 0 && hour < 24) {
        hourlyData[hour].count++;
        if (transaction.fraud_score >= threshold) {
          hourlyData[hour].flagged++;
        }
      }
    } catch (error) {
      console.warn('Invalid date format:', transaction.transdatetime);
    }
  });

  return Object.values(hourlyData);
}

/**
 * Группирует транзакции по дням недели
 * @param {Array} transactions - массив транзакций с fraud_score
 * @param {number} threshold - порог для определения мошенничества
 * @returns {Array} массив с группировкой по дням недели (0 = воскресенье)
 */
function analyzeByWeekday(transactions, threshold = 0.8) {
  const weekdayData = {};

  // Инициализация всех дней недели
  for (let i = 0; i < 7; i++) {
    weekdayData[i] = { weekday: i, count: 0, flagged: 0 };
  }

  transactions.forEach(transaction => {
    try {
      const date = new Date(transaction.transdatetime);
      const weekday = date.getDay();

      if (!isNaN(weekday) && weekday >= 0 && weekday < 7) {
        weekdayData[weekday].count++;
        if (transaction.fraud_score >= threshold) {
          weekdayData[weekday].flagged++;
        }
      }
    } catch (error) {
      console.warn('Invalid date format:', transaction.transdatetime);
    }
  });

  return Object.values(weekdayData);
}

/**
 * Группирует транзакции по суммам (диапазонам)
 * @param {Array} transactions - массив транзакций с fraud_score
 * @param {number} threshold - порог для определения мошенничества
 * @returns {Array} массив с группировкой по диапазонам сумм
 */
function analyzeByAmountRange(transactions, threshold = 0.8) {
  const ranges = [
    { label: '0-100', min: 0, max: 100 },
    { label: '100-500', min: 100, max: 500 },
    { label: '500-1000', min: 500, max: 1000 },
    { label: '1000-5000', min: 1000, max: 5000 },
    { label: '5000-10000', min: 5000, max: 10000 },
    { label: '10000+', min: 10000, max: Infinity },
  ];

  const rangeData = ranges.map(range => ({
    label: range.label,
    count: 0,
    flagged: 0,
  }));

  transactions.forEach(transaction => {
    const amount = transaction.amount;
    
    for (let i = 0; i < ranges.length; i++) {
      if (amount >= ranges[i].min && amount < ranges[i].max) {
        rangeData[i].count++;
        if (transaction.fraud_score >= threshold) {
          rangeData[i].flagged++;
        }
        break;
      }
    }
  });

  return rangeData;
}

/**
 * Получает топ N транзакций с наивысшим fraud_score
 * @param {Array} transactions - массив транзакций с fraud_score
 * @param {number} limit - количество транзакций для возврата
 * @returns {Array} массив топовых транзакций
 */
function getTopFraudTransactions(transactions, limit = 10) {
  return transactions
    .sort((a, b) => b.fraud_score - a.fraud_score)
    .slice(0, limit);
}

/**
 * Рассчитывает распределение fraud_score
 * @param {Array} transactions - массив транзакций с fraud_score
 * @returns {Object} распределение по диапазонам score
 */
function analyzeScoreDistribution(transactions) {
  const distribution = {
    '0.0-0.2': 0,
    '0.2-0.4': 0,
    '0.4-0.6': 0,
    '0.6-0.8': 0,
    '0.8-1.0': 0,
  };

  transactions.forEach(transaction => {
    const score = transaction.fraud_score;
    
    if (score >= 0 && score < 0.2) distribution['0.0-0.2']++;
    else if (score >= 0.2 && score < 0.4) distribution['0.2-0.4']++;
    else if (score >= 0.4 && score < 0.6) distribution['0.4-0.6']++;
    else if (score >= 0.6 && score < 0.8) distribution['0.6-0.8']++;
    else if (score >= 0.8 && score <= 1.0) distribution['0.8-1.0']++;
  });

  return distribution;
}

/**
 * Генерирует полный отчет по аналитике
 * @param {Array} transactions - массив транзакций с fraud_score
 * @param {number} threshold - порог для определения мошенничества
 * @returns {Object} полный отчет с аналитикой
 */
function generateAnalytics(transactions, threshold = 0.8) {
  return {
    by_hour: analyzeByHour(transactions, threshold),
    by_weekday: analyzeByWeekday(transactions, threshold),
    by_amount_range: analyzeByAmountRange(transactions, threshold),
    score_distribution: analyzeScoreDistribution(transactions),
  };
}

module.exports = {
  calculateSummary,
  analyzeByHour,
  analyzeByWeekday,
  analyzeByAmountRange,
  getTopFraudTransactions,
  analyzeScoreDistribution,
  generateAnalytics,
};
