@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0backend"
echo Installing backend dependencies...
call npm install
if errorlevel 1 (
  echo.
  echo ERROR: npm install failed.
  pause
  exit /b 1
)
echo.
echo OK! Run start-backend.bat to start the server.
pause
