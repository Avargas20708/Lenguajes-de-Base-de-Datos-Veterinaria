@echo off
TITLE Happy Pet - Sistema Veterinaria
cd /d "%~dp0"
echo ============================================
echo  HAPPY PET - SISTEMA VETERINARIA
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta instalado.
  echo Instale Node.js LTS desde https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias necesarias...
  npm install
  if errorlevel 1 (
    echo ERROR: No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)

echo Iniciando servidor Node.js...
echo Si el navegador no abre automaticamente, ingrese a http://localhost:3001
npm start
pause
