@echo off
setlocal enabledelayedexpansion

:: COICOP Classification Validation System - Docker Hub Runner
:: Usage: run-docker.bat [up|down|pull|logs|help]

:: Default ports
if not defined BACKEND_PORT set BACKEND_PORT=8000
if not defined FRONTEND_PORT set FRONTEND_PORT=80

:: Compose file
set COMPOSE_FILE=docker-compose.hub.yml

:: Check if compose file exists, if not create it
if not exist "%~dp0%COMPOSE_FILE%" (
    if not exist "%COMPOSE_FILE%" (
        echo Creating docker-compose.hub.yml...
        (
            echo services:
            echo   backend:
            echo     image: bahyali/coicop-validation-backend:latest
            echo     ports:
            echo       - "${BACKEND_PORT:-8000}:8000"
            echo     environment:
            echo       - PYTHONUNBUFFERED=1
            echo     restart: unless-stopped
            echo.
            echo   frontend:
            echo     image: bahyali/coicop-validation-frontend:latest
            echo     ports:
            echo       - "${FRONTEND_PORT:-80}:80"
            echo     depends_on:
            echo       - backend
            echo     restart: unless-stopped
        ) > "%COMPOSE_FILE%"
    )
    set COMPOSE_PATH=%COMPOSE_FILE%
) else (
    set COMPOSE_PATH=%~dp0%COMPOSE_FILE%
)

:: Parse command
set COMMAND=%1
if "%COMMAND%"=="" set COMMAND=up

if "%COMMAND%"=="up" goto :start_app
if "%COMMAND%"=="start" goto :start_app
if "%COMMAND%"=="down" goto :stop_app
if "%COMMAND%"=="stop" goto :stop_app
if "%COMMAND%"=="pull" goto :pull_images
if "%COMMAND%"=="update" goto :pull_images
if "%COMMAND%"=="logs" goto :show_logs
if "%COMMAND%"=="restart" goto :restart_app
if "%COMMAND%"=="status" goto :show_status
if "%COMMAND%"=="ps" goto :show_status
if "%COMMAND%"=="help" goto :usage
if "%COMMAND%"=="--help" goto :usage
if "%COMMAND%"=="-h" goto :usage

echo [ERROR] Unknown command: %COMMAND%
echo.
goto :usage

:usage
echo COICOP Classification Validation System - Docker Runner
echo.
echo Usage: run-docker.bat [command]
echo.
echo Commands:
echo   up        Start the application (default)
echo   down      Stop the application
echo   pull      Pull latest images from Docker Hub
echo   logs      View application logs
echo   restart   Restart the application
echo   status    Show container status
echo   help      Show this help message
echo.
echo Environment variables:
echo   BACKEND_PORT   Backend server port (default: 8000)
echo   FRONTEND_PORT  Frontend server port (default: 80)
echo.
echo Examples:
echo   run-docker.bat up
echo   set FRONTEND_PORT=8080 ^&^& run-docker.bat up
echo.
goto :eof

:check_docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    echo Visit: https://docs.docker.com/get-docker/
    exit /b 1
)

docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker daemon is not running. Please start Docker Desktop.
    exit /b 1
)
goto :eof

:start_app
call :check_docker
if %errorlevel% neq 0 exit /b 1

echo Starting COICOP Validation System...
echo.
docker compose -f "%COMPOSE_PATH%" up -d
echo.
echo ========================================
echo   Application started!
echo ========================================
echo.
echo Access the application at:
echo   Frontend: http://localhost:%FRONTEND_PORT%
echo   Backend:  http://localhost:%BACKEND_PORT%
echo.
echo Run 'run-docker.bat logs' to view logs
echo Run 'run-docker.bat down' to stop
goto :eof

:stop_app
call :check_docker
if %errorlevel% neq 0 exit /b 1

echo Stopping COICOP Validation System...
docker compose -f "%COMPOSE_PATH%" down
echo Application stopped.
goto :eof

:pull_images
call :check_docker
if %errorlevel% neq 0 exit /b 1

echo Pulling latest images from Docker Hub...
docker compose -f "%COMPOSE_PATH%" pull
echo Images updated.
goto :eof

:show_logs
call :check_docker
if %errorlevel% neq 0 exit /b 1

docker compose -f "%COMPOSE_PATH%" logs -f
goto :eof

:restart_app
call :check_docker
if %errorlevel% neq 0 exit /b 1

echo Restarting COICOP Validation System...
docker compose -f "%COMPOSE_PATH%" restart
echo Application restarted.
goto :eof

:show_status
call :check_docker
if %errorlevel% neq 0 exit /b 1

docker compose -f "%COMPOSE_PATH%" ps
goto :eof

endlocal
