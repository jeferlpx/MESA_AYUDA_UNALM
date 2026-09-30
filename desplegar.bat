@echo off
chcp 65001 > nul
cls
echo =====================================================================
echo    🏛️ DESPLIEGUE AUTOMÁTICO - MESA DE AYUDA OTIC UNALM
echo =====================================================================
echo.

set BASE_DIR=%~dp0
cd /d "%BASE_DIR%"

echo [1/3] 🔨 Compilando Frontend (React + Vite)...
cd client
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Falló la compilación del Frontend.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] 🔨 Verificando / Compilando Backend (Node.js + TypeScript)...
cd "%BASE_DIR%\server"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Falló la compilación del Backend.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] 🔄 Reiniciando servicio de Backend con PM2...
call pm2 restart mesa-ayuda-backend
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️ El proceso no existía en PM2. Iniciando servicio nuevo...
    call pm2 start dist/app.js --name "mesa-ayuda-backend"
)

echo.
echo =====================================================================
echo    ✅ ¡DESPLIEGUE COMPLETADO CON ÉXITO!
echo    Frontend actualizado en IIS y Backend en línea con PM2.
echo =====================================================================
echo.
call pm2 status
echo.
pause
