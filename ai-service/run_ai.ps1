# PowerShell script to create a venv, install dependencies, and run the FastAPI service on port 8000
param(
  [switch]$InstallOnly
)

Set-Location -Path $PSScriptRoot

# Create venv if it does not exist
if (-not (Test-Path -Path '.venv')) {
  Write-Host "Creating virtual environment..."
  py -3 -m venv .venv
}

# Activate venv
$activate = "${PSScriptRoot}\.venv\Scripts\Activate.ps1"
if (Test-Path $activate) {
  Write-Host "Activating virtual environment..."
  & $activate
} else {
  Write-Warning "Activation script was not found. You may need to run: .\.venv\Scripts\Activate.ps1"
}

# Upgrade pip
Write-Host "Upgrading pip..."
python -m pip install --upgrade pip

# Install requirements
if (Test-Path -Path 'requirements.txt') {
  Write-Host "Installing Python dependencies from requirements.txt..."
  pip install -r requirements.txt
} else {
  Write-Host "requirements.txt not found; installing default packages..."
  pip install fastapi uvicorn[standard] pandas numpy joblib lightgbm scikit-learn
}

# Optionally stop here if InstallOnly
if ($InstallOnly) {
  Write-Host "Dependencies installed. Exiting (InstallOnly)."
  exit 0
}

# Run uvicorn on port 8000
Write-Host "Starting AI service on http://localhost:8000..."
python -m uvicorn API:app --host 0.0.0.0 --port 8000 --reload
