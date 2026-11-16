@echo off
title Publicar no GitHub - Transcritor do Will
echo ========================================================
echo   Enviando o Transcritor do Will para o GitHub
echo   Repositorio: https://github.com/chamaowil/TranscritordoWill.git
echo ========================================================
echo.
echo Para o GitHub aceitar o envio, ele precisa do seu Token de Acesso.
echo.
echo Como gerar seu token em 20 segundos:
echo 1. Acesse: https://github.com/settings/tokens/new
echo 2. Em 'Note', digite: Transcritor
echo 3. Marque a caixinha [x] 'repo'
echo 4. Role ate o final e clique no botao verde 'Generate token'
echo 5. Copie o token gerado (comeca com ghp_...)
echo.
set /p GH_TOKEN="Cole seu Token do GitHub aqui (ou pressione Enter se ja autenticou): "

if "%GH_TOKEN%"=="" (
    echo.
    echo Tentando envio direto...
    "C:\Users\Office\.mingit\cmd\git.exe" push -u origin main
) else (
    echo.
    echo Enviando com Token para o GitHub...
    "C:\Users\Office\.mingit\cmd\git.exe" push -u https://%GH_TOKEN%@github.com/chamaowil/TranscritordoWill.git main
)

echo.
echo ========================================================
echo   Processo finalizado! Agora conecte no Render.com.
echo ========================================================
pause
