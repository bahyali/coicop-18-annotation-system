@echo off
REM COICOP Classification System - Windows Deployment (Docker Hub)

echo ===============================================
echo   COICOP Classification System - Setup
echo ===============================================
echo.

REM 1. Login to Docker Hub
echo Step 1: Logging in to Docker Hub...
echo YOUR_DOCKER_TOKEN_HERE | docker login -u radhyah --password-stdin

if %errorlevel% neq 0 (
    echo [ERROR] Failed to login to Docker Hub
    pause
    exit /b 1
)

echo [OK] Login successful
echo.

REM 2. Pull images
echo Step 2: Pulling Docker images from Docker Hub...
docker pull radhyah/coicop-backend:latest
docker pull radhyah/coicop-frontend:latest

echo.

REM 3. Start services
echo Step 3: Starting the application...
docker-compose -f docker-compose.hub.yml up -d

echo.
echo ===============================================
echo [SUCCESS] Application is now running!
echo.
echo Access URLs:
echo   Frontend: http://localhost:8080
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ===============================================
echo.
echo To stop the application, run:
echo   docker-compose -f docker-compose.hub.yml down
echo.
pause
