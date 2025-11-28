# 🛡️ Fraud Detection System - Forte Hackathon

Система анализа мошеннических транзакций с использованием Machine Learning.

## 📊 Project Status

✅ **Backend:** Полностью готов и протестирован  
🚧 **Frontend:** В разработке  
🧪 **ML Service:** Mock готов, интеграция с реальным ML pending

## Структура проекта

```
forte hackathon/
├── backend/              # Express.js API ✅
│   ├── routes/          # API эндпоинты
│   ├── services/        # Бизнес-логика
│   ├── storage/         # Хранилище данных
│   └── mock-ml-service.py  # Mock ML-сервис
│
└── frontend/            # Next.js приложение 🚧
    └── forte-hackathon/
```

## 🚀 Quick Start

### Backend (Express.js)

**Автоматический запуск (рекомендуется):**
```bash
cd backend

# Windows:
start-dev.bat

# Linux/Mac:
./start-dev.sh
```

Это запустит:
- Backend API на `http://localhost:3001`
- Mock ML Service на `http://localhost:5000`

**Ручной запуск:**
```bash
cd backend
npm install
pip install -r requirements.txt

# Терминал 1 - ML Service
python mock-ml-service.py

# Терминал 2 - Backend
npm start

# Терминал 3 - Тесты (опционально)
node test-api.js
```

### Frontend (Next.js)

```bash
cd frontend/forte-hackathon
npm install
npm run dev
```

Frontend откроется на `http://localhost:3000`

## 📖 Документация

### Backend Documentation

📖 **[backend/README.md](backend/README.md)** - Полная документация API с примерами  
🚀 **[backend/QUICKSTART.md](backend/QUICKSTART.md)** - Быстрый старт за 5 минут  
🏗️ **[backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)** - Детальная архитектура системы  
🤝 **[backend/ML_SERVICE_CONTRACT.md](backend/ML_SERVICE_CONTRACT.md)** - Спецификация ML интеграции  
📋 **[backend/INSTRUCTIONS_FOR_MADI.md](backend/INSTRUCTIONS_FOR_MADI.md)** - Инструкции для интеграции  
✅ **[backend/IMPLEMENTATION_SUMMARY.md](backend/IMPLEMENTATION_SUMMARY.md)** - Итоговый отчет  

## ⚡ Backend Features

### Реализованные API Endpoints:

✅ **POST /api/upload** - Загрузка и анализ CSV файлов
- Парсинг CSV с автоматической нормализацией
- Интеграция с ML-сервисом для получения fraud_score
- Автоматический расчет аналитики

✅ **POST /api/apply-threshold** - Динамическое изменение порога
- Пересчет метрик без повторной отправки в ML
- Фильтрация подозрительных транзакций

✅ **POST /api/feedback** - Сохранение фидбека аналитика
- Сохранение отзывов по транзакциям
- Поддержка различных типов фидбека
- Возможность использовать для retrain

✅ **GET /api/feedback** - Получение всех фидбеков

✅ **GET /api/feedback/statistics** - Статистика по фидбекам

✅ **GET /api/feature-importance** - Важность признаков ML-модели

✅ **GET /api/health** - Health check endpoint

### Интеллектуальный CSV Parser:

- Автоматическое распознавание различных названий колонок
- Приведение типов данных (числа, даты)
- Форматирование дат в ISO формат
- Валидация обязательных полей
- Детальные отчеты об ошибках

### Автоматическая аналитика:

✅ **Summary** - общие метрики (total, flagged, percentage)  
✅ **By Hour** - распределение транзакций по часам суток  
✅ **By Weekday** - распределение по дням недели  
✅ **By Amount Range** - группировка по диапазонам сумм  
✅ **Score Distribution** - гистограмма fraud_score  

## 🔌 API Examples

### Upload CSV
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@transactions.csv" \
  -F "threshold=0.8"
```

### Apply Threshold
```bash
curl -X POST http://localhost:3001/api/apply-threshold \
  -H "Content-Type: application/json" \
  -d '{"transactions": [...], "threshold": 0.75}'
```

### Submit Feedback
```bash
curl -X POST http://localhost:3001/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"docno": "TX_001", "label": "false_positive", "comment": "Verified"}'
```

## 📊 Response Format

```json
{
  "success": true,
  "summary": {
    "total": 10,
    "flagged_by_threshold": 3,
    "threshold": 0.8,
    "flagged_percentage": "30.00"
  },
  "transactions": [
    {
      "docno": "TX_001",
      "client_id": 12345,
      "amount": 10000.5,
      "transdatetime": "2024-01-15T14:30:00.000Z",
      "fraud_score": 0.87
    }
  ],
  "analytics": {
    "by_hour": [...],
    "by_weekday": [...],
    "by_amount_range": [...],
    "score_distribution": {...}
  }
}
```

## 🛠️ Technologies

### Backend:
- Node.js + Express.js
- Multer (file upload)
- Axios (HTTP client)
- csv-parser (CSV parsing)
- cors (CORS handling)
- Python + Flask (Mock ML)

### Frontend:
- Next.js
- TypeScript
- TailwindCSS

## 🏗️ Architecture

```
Frontend (Next.js)
        ↓
    Backend API (Express.js)
        ↓
    ML Service (Flask/FastAPI)
```

### Data Flow:

1. 📤 Пользователь загружает CSV через frontend
2. 🔄 Frontend отправляет файл на backend
3. 📋 Backend парсит и нормализует данные
4. 🤖 Backend отправляет транзакции в ML-сервис
5. 🎯 ML-сервис возвращает fraud_score
6. 📊 Backend рассчитывает аналитику
7. 📦 Backend возвращает полный результат
8. 📈 Frontend отображает dashboard

## 🧪 Testing

```bash
cd backend
node test-api.js
```

Автоматические тесты проверяют:
- ✅ Health check
- ✅ File upload and processing
- ✅ Threshold application
- ✅ Feedback system
- ✅ Feature importance

## 🔐 Security Features

- ✅ File type validation (CSV only)
- ✅ File size limit (50MB)
- ✅ CORS configuration
- ✅ Input validation
- ✅ Automatic file cleanup
- ✅ Error handling

## 📝 Environment Configuration

Create `.env` file in backend:

```env
ML_SERVICE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development
```

## 🎯 Next Steps

1. ✅ **Backend готов** - можно интегрировать с frontend
2. ⏭️ **Frontend integration** - подключить API endpoints
3. ⏭️ **Real ML service** - заменить mock на реальную модель
4. ⏭️ **Testing** - тестирование с реальными данными

## 🐛 Troubleshooting

### Backend не запускается?
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### ML Service недоступен?
```bash
curl http://localhost:5000/health
```

### Порт занят?
Измените PORT в `.env` файле

## 👥 Team

Разработано для Forte Hackathon 2024

## 📄 License

MIT

---

**Status:** Backend ✅ Ready | Frontend 🚧 In Progress  
**Last Updated:** November 2024  
**All systems operational! 🚀**