@echo off
REM COICOP Dashboard Launcher

cd /d "%~dp0"

echo ======================================
echo   COICOP Dashboard
echo ======================================
echo.
echo Starting dashboard server on port 7896...
echo.

python server.py

pause
