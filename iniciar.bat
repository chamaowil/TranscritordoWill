@echo off
title Transcritor de Audio AI - Google Gemini
echo =======================================================
echo   Iniciando o Transcritor de Audio AI...
echo =======================================================
echo.

:: Abre o navegador automaticamente apos 2 segundos
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Inicia o servidor Node.js
node server.js
pause
