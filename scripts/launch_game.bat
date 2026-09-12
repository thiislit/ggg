@echo off
title RPS Retro - Servidor de Juego
color 0A

echo ===================================================
echo               INICIANDO RPS RETRO
echo ===================================================
echo.
echo Iniciando el servidor local del juego...
echo Abriendo el juego en tu navegador predeterminado...
echo.

cd /d "%~dp0.."

start http://localhost:8080

npx http-server www -p 8080 -c-1
