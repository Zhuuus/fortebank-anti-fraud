@echo off
REM Batch file to run the AI service on Windows
cd /d "%~dp0"
IF NOT EXIST .venv (py -3 -m venv .venv)
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn API:app --host 0.0.0.0 --port 8000 --reload
