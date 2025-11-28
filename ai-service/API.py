import os
os.environ['LIGHTGBM_LOG_LEVEL'] = '0'

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import joblib
import json
from datetime import datetime
import logging
import warnings
from contextlib import redirect_stderr, redirect_stdout
import io

warnings.filterwarnings("ignore")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fraud Detection ML Service", version="1.0.0")

try:
    with redirect_stdout(open('nul', 'w')), redirect_stderr(open('nul', 'w')):
        model = joblib.load('lgbm_fraud_model.pkl')
    with open('ml_artifacts.json', 'r') as f:
        artifacts = json.load(f)
    
    feature_cols = artifacts['feature_cols']
    cat_cols = artifacts['cat_cols']
    num_cols = artifacts['num_cols']
    
    logger.info("Модель и артефакты успешно загружены")
except Exception as e:
    logger.error(f"Ошибка загрузки модели: {e}")
    raise e

class Transaction(BaseModel):
    docno: str
    cst_dim_id: str
    transdate: str
    transdatetime: str
    amount: float
    direction: str
    monthly_os_changes: Optional[float] = None
    monthly_phone_model_changes: Optional[float] = None
    last_phone_model_categorical: Optional[str] = None
    last_os_categorical: Optional[str] = None
    logins_last_7_days: Optional[float] = None
    logins_last_30_days: Optional[float] = None
    login_frequency_7d: Optional[float] = None
    login_frequency_30d: Optional[float] = None
    freq_change_7d_vs_mean: Optional[float] = None
    logins_7d_over_30d_ratio: Optional[float] = None
    avg_login_interval_30d: Optional[float] = None
    std_login_interval_30d: Optional[float] = None
    var_login_interval_30d: Optional[float] = None
    ewm_login_interval_7d: Optional[float] = None
    burstiness_login_interval: Optional[float] = None
    fano_factor_login_interval: Optional[float] = None
    zscore_avg_login_interval_7d: Optional[float] = None

class PredictionRequest(BaseModel):
    rows: List[Transaction]

class PredictionResult(BaseModel):
    docno: str
    fraud_score: float
    anomaly: float
    trust_factor: float
    risk: float
    action: str
    features_used: List[str]

class PredictionResponse(BaseModel):
    predictions: List[PredictionResult]
    model_version: str = "1.0.0"

def preprocess_transaction(transaction: Transaction) -> pd.DataFrame:
    df = pd.DataFrame([transaction.model_dump()])
    
    df['transdatetime'] = pd.to_datetime(df['transdatetime'])
    df['dayofweek'] = df['transdatetime'].dt.dayofweek
    df['is_weekend'] = df['dayofweek'].isin([5, 6]).astype(int)
    df['hour_3h_bin'] = (df['transdatetime'].dt.hour // 3).astype(int)
    df['amount_log'] = np.log1p(df['amount'])
    
    # Add missing features with default values
    missing_features = {
        'tx_count_30d': 0,
        'tx_amount_sum_30d': 0.0,
        'tx_amount_mean_30d': 0.0,
        'monthly_os_changes': 0.0,
        'monthly_phone_model_changes': 0.0,
        'logins_last_7_days': 0.0,
        'logins_last_30_days': 0.0,
        'login_frequency_7d': 0.0,
        'login_frequency_30d': 0.0,
        'freq_change_7d_vs_mean': 0.0,
        'logins_7d_over_30d_ratio': 0.0,
        'avg_login_interval_30d': 0.0,
        'std_login_interval_30d': 0.0,
        'var_login_interval_30d': 0.0,
        'ewm_login_interval_7d': 0.0,
        'burstiness_login_interval': 0.0,
        'fano_factor_login_interval': 0.0,
        'zscore_avg_login_interval_7d': 0.0,
        'last_phone_model_categorical': 'rare',
        'last_os_categorical': 'rare'
    }
    for feat, default in missing_features.items():
        if feat not in df.columns:
            df[feat] = default
    
    for col in num_cols:
        if col in df.columns:
            if df[col].notna().any():
                median_val = df[col].median()
            else:
                median_val = 0  # Default for empty columns
            df[col] = df[col].fillna(median_val).infer_objects(copy=False)
    
    for col in cat_cols:
        if col in df.columns:
            df[col] = df[col].fillna('rare')
            df[col] = df[col].astype('category')
    
    return df

def calculate_anomaly(row: dict) -> float:
    amount = row['amount']
    amount_log = np.log1p(amount)
    
    if amount > 100000:
        return 0.8
    elif amount > 50000:
        return 0.5
    else:
        return 0.1

def decide_action(fraud_score: float, anomaly: float, trust_factor: float) -> str:
    risk = fraud_score + 0.3 * anomaly
    
    if trust_factor < 0.2 and risk >= 0.4:
        return "block"
    if risk >= 0.85:
        return "block"
    if risk >= 0.6 or (risk >= 0.5 and anomaly >= 0.7) or (fraud_score >= 0.6 and trust_factor < 0.4):
        return "manual_review"
    if risk >= 0.4 or (fraud_score >= 0.4 and anomaly >= 0.4):
        return "step_up"
    return "approve"

@app.get("/")
async def root():
    return {"message": "Fraud Detection ML Service", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": True}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        total_rows = len(request.rows)
        logger.info(f"/predict called, rows={total_rows}")

        if total_rows == 0:
            return PredictionResponse(predictions=[])

        MAX_ROWS = 5000  # safety cap to avoid freezing on huge CSV
        if total_rows > MAX_ROWS:
            logger.warning(f"Clipping rows from {total_rows} to {MAX_ROWS}")
        rows = request.rows[:MAX_ROWS]

        BATCH_SIZE = 1000
        predictions: List[PredictionResult] = []

        for batch_start in range(0, len(rows), BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, len(rows))
            batch = rows[batch_start:batch_end]
            logger.info(f"Processing batch {batch_start}-{batch_end} (size={len(batch)})")

            processed_dfs = []
            for idx, transaction in enumerate(batch):
                if idx % 200 == 0:
                    logger.info(f"  Preprocess row {batch_start + idx}")
                df_processed = preprocess_transaction(transaction)
                processed_dfs.append(df_processed)

            X_batch = pd.concat(processed_dfs, ignore_index=True)[feature_cols]
            logger.info(f"  Running predict_proba on batch shape={X_batch.shape}")

            # LightGBM warnings already suppressed by env + warnings.filterwarnings
            fraud_scores = model.predict_proba(X_batch)[:, 1]
            logger.info("  predict_proba finished for batch")

            for i, transaction in enumerate(batch):
                fraud_score = float(fraud_scores[i])
                anomaly = calculate_anomaly(transaction.model_dump())
                trust_factor = 0.9
                risk = fraud_score + 0.3 * anomaly
                action = decide_action(fraud_score, anomaly, trust_factor)

                predictions.append(PredictionResult(
                    docno=transaction.docno,
                    fraud_score=round(fraud_score, 4),
                    anomaly=round(anomaly, 4),
                    trust_factor=round(trust_factor, 4),
                    risk=round(risk, 4),
                    action=action,
                    features_used=feature_cols
                ))

        logger.info(f"/predict finished, predictions={len(predictions)}")
        return PredictionResponse(predictions=predictions)

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/feature-importance")
async def feature_importance():
    try:
        importance = model.feature_importances_
        features = feature_cols
        
        feature_importance_list = []
        for feat, imp in zip(features, importance):
            feature_importance_list.append({
                "name": feat,
                "importance": float(imp)
            })
        
        feature_importance_list.sort(key=lambda x: x["importance"], reverse=True)
        
        return {"features": feature_importance_list}
    except Exception as e:
        logger.error(f"Feature importance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)