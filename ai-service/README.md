# AI Service (FastAPI) — Run instructions

This directory contains the Python ML service for fraud detection.

## Prerequisites
- Python 3.8+ installed (Use `py -3` on Windows)
- (Optional) `git` if you want to fetch additional artifacts

## 1) Create & activate venv (PowerShell):
```powershell
Set-Location "C:\Users\Hiti\Desktop\projects indev and etc\forte hackathon\ai-service"
py -3 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned -Force
.\.venv\Scripts\Activate.ps1
```

## 2) Install dependencies
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

> Note: Installing `lightgbm` on Windows may require build tools. If `pip install lightgbm` fails, either use Anaconda / conda, or install a prebuilt wheel:
> - Using conda: `conda create -n ai-env python=3.10` and `conda install -c conda-forge lightgbm`

## 3) Run the service (port 8000)
```powershell
# If venv active
python -m uvicorn API:app --host 0.0.0.0 --port 8000 --reload
# Or run the helper script
.\run_ai.ps1
```

## 4) Health check
Open in browser or use curl:
```
http://localhost:8000/health
```

## 5) API docs
Open Swagger UI:
```
http://localhost:8000/docs
```

## Troubleshooting
- ModuleNotFoundError: No module named 'lightgbm'
  - Ensure `pip` installed LightGBM; try `pip install lightgbm` or use conda.
- Joblib load fails due to incompatible scikit-learn version:
  - Ensure `scikit-learn` version is compatible with the model artifact. Check `ml_artifacts.json`.

If you want, you can also run the service under Docker — ask and I will provide a sample Dockerfile and docker-compose manifest.
