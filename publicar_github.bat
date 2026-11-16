@echo off
title Enviar Transcritor para o GitHub
echo =======================================================
echo   Publicar Projeto no GitHub
echo =======================================================
echo.
echo 1. Va no GitHub (https://github.com/new) e crie um repositorio.
echo 2. Cole a URL do repositorio abaixo.
echo    (Exemplo: https://github.com/SEU_USUARIO/transcritor-audio.git)
echo.
set /p REPO_URL="Cole a URL do Repositorio aqui: "

if "%REPO_URL%"=="" (
    echo.
    echo Nenhuma URL informada. Cancelado.
    pause
    exit /b
)

echo.
echo Configurando e enviando arquivos para o GitHub...
"C:\Users\Office\.mingit\cmd\git.exe" remote remove origin 2>nul
"C:\Users\Office\.mingit\cmd\git.exe" remote add origin %REPO_URL%
"C:\Users\Office\.mingit\cmd\git.exe" branch -M main
"C:\Users\Office\.mingit\cmd\git.exe" push -u origin main

echo.
echo =======================================================
echo   Envio concluido! Agora va para o Render.com.
echo =======================================================
pause
