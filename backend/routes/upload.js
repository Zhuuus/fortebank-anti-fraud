const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { parseCSV, filterValidTransactions } = require('../services/csvParser');
const { predictFraud } = require('../services/mlClient');
const { calculateSummary, generateAnalytics } = require('../services/analytics');

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

/**
 * POST /api/upload
 * Загрузка CSV файла, парсинг и получение fraud_score от ML-сервиса
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    console.log('Processing file:', req.file.originalname);

    // Читаем файл
    const fileBuffer = await fs.readFile(req.file.path);

    // Парсим CSV
    const parsedTransactions = await parseCSV(fileBuffer);
    console.log('Parsed transactions:', parsedTransactions.length);

    // Фильтруем валидные транзакции
    const { valid, invalid } = filterValidTransactions(parsedTransactions);
    
    if (valid.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid transactions found in the CSV file',
        invalid_count: invalid.length,
      });
    }

    console.log('Valid transactions:', valid.length);
    console.log('Invalid transactions:', invalid.length);

    // Отправляем в ML-сервис
    // Составляем payload, совместимый с FastAPI Schema (docno, cst_dim_id, transdate, transdatetime, amount, direction)
    const mlRows = valid.map((t, idx) => {
      // Приоритет: если есть cst_dim_id — используем, иначе client_id
      const cst_dim_id = t.cst_dim_id || (t.client_id !== undefined ? String(t.client_id) : (t['client_id'] || null));
      const docno = t.docno || t['docno'] || t['transaction_id'] || t['id'] || `doc-${idx}`;
      const transdatetime = t.transdatetime || t.transdate || null;
      const transdate = transdatetime ? String(transdatetime).split('T')[0] : (t.transdate || null);
      const amount = t.amount !== undefined ? parseFloat(t.amount) : null;
      const direction = t.direction || t.trans_type || 'unknown';

      return {
        docno,
        cst_dim_id,
        transdate,
        transdatetime,
        amount,
        direction,
        // Пробрасываем все поле чтобы модель при необходимости могла использовать дополнительные признаки
        ...t,
      };
    });

    // Log sample of payload for debugging
    console.log('Sending to ML-service rows count:', mlRows.length);
    console.log('ML-service sample rows:', JSON.stringify(mlRows.slice(0, 3), null, 2));

    let predictions;
    try {
      predictions = await predictFraud(mlRows);
    } catch (mlError) {
      console.error('ML Service error:', mlError.message);
      return res.status(503).json({
        success: false,
        error: 'ML Service unavailable',
        message: mlError.message,
      });
    }

    // Объединяем транзакции с fraud_score
    const transactionsWithScore = valid.map((transaction, index) => ({
      ...transaction,
      fraud_score: predictions[index]?.fraud_score || 0,
    }));

    // Получаем порог из запроса или используем дефолтный
    const threshold = parseFloat(req.body.threshold) || 0.8;

    // Рассчитываем аналитику
    const summary = calculateSummary(transactionsWithScore, threshold);
    const analytics = generateAnalytics(transactionsWithScore, threshold);

    // Удаляем загруженный файл
    await fs.remove(req.file.path);

    // Формируем ответ
    const response = {
      success: true,
      summary,
      transactions: transactionsWithScore,
      analytics,
      invalid_transactions: invalid.length > 0 ? {
        count: invalid.length,
        examples: invalid.slice(0, 5), // Первые 5 примеров
      } : null,
    };

    res.json(response);

  } catch (error) {
    console.error('Error processing upload:', error);
    
    // Удаляем файл в случае ошибки
    if (req.file) {
      await fs.remove(req.file.path).catch(err => console.error('Error removing file:', err));
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

module.exports = router;
