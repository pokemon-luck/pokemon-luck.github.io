@echo off
chcp 65001 >nul
title Pokemon Luck - apercu local
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo   Node.js est introuvable sur cette machine.
    echo   Installe-le depuis https://nodejs.org puis relance ce fichier.
    echo.
    pause
    exit /b 1
)

node "tools\serve.js"

echo.
echo   Serveur arrete.
pause
