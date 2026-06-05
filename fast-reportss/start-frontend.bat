@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0frontend"
echo Frontend: http://localhost:5173
call npm run dev
pause
