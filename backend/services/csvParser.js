const fs = require('fs');
const csv = require('csv-parser');
const { Readable } = require('stream');
const iconv = require('iconv-lite');

/**
 * Парсит CSV файл и нормализует данные для ML-сервиса
 * @param {Buffer} fileBuffer - буфер с содержимым CSV файла
 * @returns {Promise<Array>} массив транзакций
 */
async function parseCSV(fileBuffer) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    // Пробуем декодировать из windows-1251 в utf-8
    let decodedBuffer;
    try {
      decodedBuffer = iconv.decode(fileBuffer, 'win1251');
    } catch (e) {
      // Если не получилось, используем как есть
      decodedBuffer = fileBuffer.toString();
    }
    
    const stream = Readable.from(decodedBuffer);

    stream
      .pipe(csv({
        separator: ';',  // Используем точку с запятой как разделитель
        skipEmptyLines: true,
        trim: true,
      }))
      .on('data', (row) => {
        // Log первую строку для отладки
        if (results.length === 0) {
          console.log('CSV columns detected:', Object.keys(row));
        }
        // Нормализация полей транзакции
        const transaction = normalizeTransaction(row);
        results.push(transaction);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      });
  });
}

/**
 * Нормализует поля транзакции
 * @param {Object} row - сырая строка из CSV
 * @returns {Object} нормализованная транзакция
 */
function normalizeTransaction(row) {
  // Маппинг возможных названий колонок к стандартному формату
  const fieldMappings = {
    docno: [
      'docno', 'doc_no', 'document_number', 'transaction_id', 'id',
      'уникальный идентификатор платежа', 'идентификатор'
    ],
    client_id: [
      'client_id', 'clientid', 'customer_id', 'customerid',
      'уникальный идентификатор клиента', 'клиент'
    ],
    amount: [
      'amount', 'sum', 'transaction_amount', 'value',
      'сумма транзакции', 'сумма'
    ],
    transdatetime: [
      'transdatetime', 'trans_datetime', 'transaction_date', 'date', 'timestamp',
      'дата и время завершения транзакции', 'дата завершения транзакции', 'дата'
    ],
    direction: [
      'direction', 'type', 'transaction_type', 'trans_type',
      'направление транзакции(входящая)', 'направление'
    ],
  };

  const normalized = {};

  // Поиск значений по различным вариантам названий колонок
  for (const [standardField, possibleNames] of Object.entries(fieldMappings)) {
    for (const name of possibleNames) {
      const lowerName = name.toLowerCase();
      const matchedKey = Object.keys(row).find(
        (key) => key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())
      );

      if (matchedKey && row[matchedKey]) {
        normalized[standardField] = row[matchedKey];
        break;
      }
    }
  }

  // Приведение типов
  if (normalized.client_id) {
    normalized.client_id = parseInt(normalized.client_id, 10);
  }

  // Ensure cst_dim_id field is available for ML service (string)
  if (!normalized.cst_dim_id && normalized.client_id !== undefined) {
    normalized.cst_dim_id = String(normalized.client_id);
  }

  if (normalized.amount) {
    normalized.amount = parseFloat(normalized.amount);
  }

  // Форматирование даты
  if (normalized.transdatetime) {
    normalized.transdatetime = formatDateTime(normalized.transdatetime);
  }

  // Добавляем все остальные поля, которые могут быть использованы ML-моделью
  const additionalFields = [
    'merchant_id',
    'card_number',
    'card_type',
    'merchant_category',
    'country',
    'city',
    'ip_address',
    'device_id',
    'is_recurring',
    'currency',
  ];

  for (const field of additionalFields) {
    const matchedKey = Object.keys(row).find(
      (key) => key.toLowerCase() === field.toLowerCase()
    );
    if (matchedKey && row[matchedKey]) {
      normalized[field] = row[matchedKey];
    }
  }

  return normalized;
}

/**
 * Форматирует дату в ISO формат
 * @param {string} dateString - строка с датой
 * @returns {string} отформатированная дата
 */
function formatDateTime(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Возвращаем как есть, если не можем распарсить
    }
    return date.toISOString();
  } catch (error) {
    return dateString;
  }
}

/**
 * Валидирует транзакцию на наличие обязательных полей
 * @param {Object} transaction - транзакция для валидации
 * @returns {boolean}
 */
function validateTransaction(transaction) {
  // Required: docno, amount (numeric), transdatetime (parseable), and at least one of client_id or cst_dim_id
  const docno = transaction.docno;
  const clientId = transaction.client_id || transaction.cst_dim_id || transaction['client_id'];
  const amount = transaction.amount;
  const tdatetime = transaction.transdatetime || transaction.transdate;

  function isHeaderLike(val) {
    if (!val || typeof val !== 'string') return false;
    const s = val.toLowerCase();
    return s.includes('doc') || s.includes('id') || s.includes('client') || s.includes('transaction') || s.includes('amount') || s.includes('сумма');
  }

  if (!docno || isHeaderLike(docno)) return false;
  if (!clientId || isHeaderLike(String(clientId))) return false;
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return false;
  if (!tdatetime || isNaN(new Date(tdatetime).getTime())) return false;

  return true;
}

/**
 * Фильтрует невалидные транзакции
 * @param {Array} transactions - массив транзакций
 * @returns {Object} объект с валидными и невалидными транзакциями
 */
function filterValidTransactions(transactions) {
  const valid = [];
  const invalid = [];

  transactions.forEach((transaction, index) => {
    if (validateTransaction(transaction)) {
      valid.push(transaction);
    } else {
      // Log первые несколько невалидных транзакций для отладки
      if (invalid.length < 3) {
        console.log('Invalid transaction:', JSON.stringify(transaction, null, 2));
      }
      invalid.push({ index, transaction, reason: 'Missing required fields' });
    }
  });

  return { valid, invalid };
}

module.exports = {
  parseCSV,
  normalizeTransaction,
  validateTransaction,
  filterValidTransactions,
};
