@echo off
cd /d "%~dp0"
netstat -ano | findstr /r ":3000 .*LISTENING" >nul
if %errorlevel%==0 (
  echo Servidor ja rodando em http://localhost:3000
  start http://localhost:3000
) else (
  npm run dev
)
