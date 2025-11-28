# Backend README

This backend expects an ML service to run on `http://localhost:8000` (default). It uses the `ai-service` FastAPI service in the repo.

## Running AI service (FastAPI)
1. Open a PowerShell terminal and change directory to `ai-service`:
```powershell
Set-Location "c:\Users\Hiti\Desktop\projects indev and etc\forte hackathon\ai-service"
```
2. Activate venv and install dependencies, or use the provided script:
```powershell
# Create venv, install deps, start server
.\run_ai.ps1
```

If using `start_ai.bat` on Windows:
```cmd
cd ai-service
start_ai.bat
```

## Backend config
Backend reads `ML_SERVICE_URL` from `.env` (defaults to http://localhost:8000). Ensure ML service URL matches.
