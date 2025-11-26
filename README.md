# Forte Fraud MVP

MVP-система для детекции мошеннических переводов в мобильном банкинге:
- ML-модель (CatBoost)
- Backend (Express)
- Frontend (React)

## Структура

- `ml/` — обучение модели, скрипт/сервис для предикта
- `backend/` — Node.js + Express API (загрузка CSV, вызов ML, агрегации)
- `frontend/` — React-приложение (UI, дашборды)
- `docs/` — архитектура, заметки, сценарии демо
