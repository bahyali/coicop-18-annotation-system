@echo off
setlocal enabledelayedexpansion

:: COICOP Classification Validation System - Setup Script (Windows)
:: This script installs all dependencies for both backend and frontend

cd /d "%~dp0"

echo ========================================
echo   Annotation System - Setup
echo ========================================
echo.

:: Check for required tools
echo Checking requirements...

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] %PYTHON_VERSION%

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18 or higher.
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%

:: Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm.
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION%

echo.

:: Setup backend
echo ========================================
echo   Setting up Backend
echo ========================================

cd backend

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    echo [OK] Virtual environment created
) else (
    echo [SKIP] Virtual environment already exists
)

:: Activate virtual environment and install dependencies
echo Installing Python dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q
call venv\Scripts\deactivate.bat
echo [OK] Python dependencies installed

cd ..
echo.

:: Setup frontend
echo ========================================
echo   Setting up Frontend
echo ========================================

cd frontend

:: Install npm dependencies
echo Installing npm dependencies...
call npm install
echo [OK] npm dependencies installed

cd ..
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To run the application:
echo   Development mode:  run.bat dev
echo   Production mode:   run.bat prod
echo.

endlocal
