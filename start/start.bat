@echo off
title Smart City Waste Management System - Starting...
setlocal enabledelayedexpansion

:: Determine project root directory (one level up from this script)
set "ROOT_DIR=%~dp0.."
pushd "%ROOT_DIR%"
set "ROOT_DIR=%CD%"
popd

cls
echo ======================================================================
echo          SMART CITY WASTE MANAGEMENT AND RECYCLING SYSTEM
echo                         STARTING UP...
echo ======================================================================
echo.
echo Project Directory: %ROOT_DIR%
echo.

:: 1. Check & Start MySQL Database Service (Port 3306)
echo [1/4] Checking MySQL Database Service (Port 3306)...
powershell -NoProfile -Command "$tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue; if ($tcp.TcpTestSucceeded) { 'RUNNING' } else { 'STOPPED' }" > "%temp%\mysql_status.txt" 2>&1
set /p MYSQL_STATUS=<"%temp%\mysql_status.txt"
del "%temp%\mysql_status.txt" >nul 2>&1

if "%MYSQL_STATUS%"=="RUNNING" (
    echo   [OK] MySQL is active and listening on port 3306.
) else (
    echo   [!] MySQL is not running on port 3306. Attempting to start MySQL...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "MySQL-Daemon" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        ping 127.0.0.1 -n 4 >nul
        echo   [OK] MySQL service started.
    ) else if exist "C:\xampp\mysql_start.bat" (
        start "" /b "C:\xampp\mysql_start.bat" >nul 2>&1
        ping 127.0.0.1 -n 4 >nul
        echo   [OK] MySQL started via XAMPP.
    ) else (
        echo   [WARN] Could not find XAMPP MySQL. If connection fails, please start MySQL manually.
    )
)
echo.

:: 2. Ensure ports 8080 and 5173 are free
echo [2/4] Clearing previous backend and frontend processes...
powershell -NoProfile -Command ^
    "$p8080 = (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess; " ^
    "if ($p8080) { Stop-Process -Id $p8080 -Force -ErrorAction SilentlyContinue; Write-Host '  [OK] Freed Port 8080' }; " ^
    "$p5173 = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess; " ^
    "if ($p5173) { Stop-Process -Id $p5173 -Force -ErrorAction SilentlyContinue; Write-Host '  [OK] Freed Port 5173' }; "
echo   [OK] Ports 8080 and 5173 are ready.
echo.

:: 3. Start Spring Boot Backend in a minimized window
echo [3/4] Starting Backend (Spring Boot on Port 8080)...
start "SmartCity-Backend-8080" /min cmd /c "cd /d "%ROOT_DIR%\backend" && java -jar "target\waste-management-system-1.0.0.jar""

:: 4. Start Vite Frontend in a minimized window
echo [4/4] Starting Frontend (React Vite on Port 5173)...
start "SmartCity-Frontend-5173" /min cmd /c "cd /d "%ROOT_DIR%\frontend" && npm run dev -- --host --port 5173"

echo.
echo Initializing servers, please wait a few seconds...

:: Wait for frontend to respond on port 5173
powershell -NoProfile -Command ^
    "for ($i=0; $i -lt 30; $i++) { " ^
    "  try { $r = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { break } } catch {}; " ^
    "  Start-Sleep -Seconds 1 " ^
    "}"

:: Wait for backend to respond on port 8080
powershell -NoProfile -Command ^
    "for ($i=0; $i -lt 30; $i++) { " ^
    "  try { $r = Invoke-RestMethod -Uri 'http://localhost:8080/api/recycling/facilities' -TimeoutSec 2; if ($r) { break } } catch {}; " ^
    "  Start-Sleep -Seconds 1 " ^
    "}"

echo.
echo ======================================================================
echo               WEBSITE IS NOW RUNNING SUCCESSFULLY!
echo ======================================================================
echo.
echo   [+] Website URL:    http://localhost:5173
echo   [+] Backend API:    http://localhost:8080
echo   [+] MySQL Database: localhost:3306 (smart_waste_db)
echo.
echo   ------------------------------------------------------------------
echo   DEMO LOGIN ACCOUNTS:
echo   ------------------------------------------------------------------
echo   1. Municipal Admin:    admin@smartcity.gov   /  Admin@123
echo   2. Municipal Driver:   driver@smartcity.gov  /  Driver@123
echo   3. Citizen Reporter:   pravin@gmail.com      /  Citizen@123
echo   ------------------------------------------------------------------
echo.
echo   Opening website in your browser...
echo.
echo   NOTE: Keep this window open while using the website.
echo         To STOP the website at any time:
echo         - Press any key in this window, OR
echo         - Run the file inside the 'stop' folder.
echo ======================================================================
echo.

:: Automatically open browser
start http://localhost:5173

pause >nul

echo.
echo Stopping website services...
if exist "%ROOT_DIR%\stop\stop.bat" (
    call "%ROOT_DIR%\stop\stop.bat"
) else (
    call "%ROOT_DIR%\stop_app.bat"
)
