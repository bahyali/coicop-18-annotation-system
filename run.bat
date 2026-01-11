@echo off
setlocal enabledelayedexpansion

:: COICOP Classification Validation System - Run Script (Windows)
:: Usage: run.bat [dev|prod|backend|frontend|build|help]

cd /d "%~dp0"

:: Default ports
if not defined BACKEND_PORT set BACKEND_PORT=8000
if not defined FRONTEND_PORT set FRONTEND_PORT=5173

:: Parse command
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=dev

if "%COMMAND%"=="dev" goto :run_dev
if "%COMMAND%"=="prod" goto :run_prod
if "%COMMAND%"=="backend" goto :run_backend
if "%COMMAND%"=="frontend" goto :run_frontend
if "%COMMAND%"=="build" goto :build_frontend
if "%COMMAND%"=="help" goto :usage
if "%COMMAND%"=="--help" goto :usage
if "%COMMAND%"=="-h" goto :usage

echo [ERROR] Unknown command: %COMMAND%
echo.
goto :usage

:usage
echo Usage: run.bat [command]
echo.
echo Commands:
echo   dev       Run both backend and frontend in development mode (default)
echo   prod      Build frontend and run production server
echo   backend   Run only the backend server
echo   frontend  Run only the frontend dev server
echo   build     Build frontend for production
echo   help      Show this help message
echo.
echo Environment variables:
echo   BACKEND_PORT   Backend server port (default: 8000)
echo   FRONTEND_PORT  Frontend dev server port (default: 5173)
echo.
goto :eof

:check_setup
if not exist "backend\venv" (
    echo [ERROR] Backend virtual environment not found.
    echo Please run setup.bat first.
    exit /b 1
)
if not exist "frontend\node_modules" (
    echo [ERROR] Frontend dependencies not installed.
    echo Please run setup.bat first.
    exit /b 1
)
goto :eof

:run_backend
call :check_setup
if %errorlevel% neq 0 exit /b 1

echo Starting backend server...
cd backend
call venv\Scripts\activate.bat
echo Backend running at http://localhost:%BACKEND_PORT%
if "%2"=="prod" (
    uvicorn main:app --host 0.0.0.0 --port %BACKEND_PORT%
) else (
    uvicorn main:app --reload --host 0.0.0.0 --port %BACKEND_PORT%
)
goto :eof

:run_frontend
call :check_setup
if %errorlevel% neq 0 exit /b 1

echo Starting frontend dev server...
cd frontend
echo Frontend running at http://localhost:%FRONTEND_PORT%
call npm run dev -- --port %FRONTEND_PORT%
goto :eof

:build_frontend
call :check_setup
if %errorlevel% neq 0 exit /b 1

echo Building frontend for production...
cd frontend
call npm run build
echo [OK] Frontend built successfully! Output in frontend\dist\
goto :eof

:run_dev
call :check_setup
if %errorlevel% neq 0 exit /b 1

echo ========================================
echo   Development Mode
echo ========================================
echo.
echo Backend:  http://localhost:%BACKEND_PORT%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.
echo Starting servers in separate windows...
echo Close the windows or press Ctrl+C in each to stop.
echo.

:: Start backend in new window
start "Backend Server" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port %BACKEND_PORT%"

:: Small delay
timeout /t 2 /nobreak >nul

:: Start frontend in new window
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --port %FRONTEND_PORT%"

echo.
echo Servers started in separate windows.
echo.
goto :eof

:run_prod
call :check_setup
if %errorlevel% neq 0 exit /b 1

echo ========================================
echo   Production Mode
echo ========================================
echo.

:: Build frontend first
call :build_frontend
echo.

echo [NOTE] In production, serve frontend\dist\ using a web server (nginx, IIS, etc.)
echo        or use a reverse proxy to serve both frontend and backend.
echo.
echo Starting backend server at http://localhost:%BACKEND_PORT%
echo.

:: Run backend in production mode
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
uvicorn main:app --host 0.0.0.0 --port %BACKEND_PORT%
goto :eof

endlocal
