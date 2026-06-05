@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0backend"
echo Backend: http://localhost:3001
node src/server.js
pause
