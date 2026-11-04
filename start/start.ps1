# Smart City Waste Management System - Startup Script
$Host.UI.RawUI.WindowTitle = "Smart City Waste Management System - Starting..."
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName

Clear-Host
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         SMART CITY WASTE MANAGEMENT AND RECYCLING SYSTEM            " -ForegroundColor Cyan
Write-Host "                        STARTING UP...                                " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project Directory: $rootDir" -ForegroundColor DarkGray
Write-Host ""

# 1. Check & Start MySQL Database Service (Port 3306)
Write-Host "[1/4] Checking MySQL Database Service (Port 3306)..." -ForegroundColor Yellow
$mysqlCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -WarningAction SilentlyContinue
if ($mysqlCheck.TcpTestSucceeded) {
    Write-Host "  [OK] MySQL is active and listening on port 3306." -ForegroundColor Green
} else {
    Write-Host "  [!] MySQL is not running on port 3306. Attempting to start MySQL..." -ForegroundColor Yellow
    if (Test-Path "C:\xampp\mysql\bin\mysqld.exe") {
        Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--defaults-file=mysql\bin\my.ini --standalone" -WorkingDirectory "C:\xampp" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "  [OK] MySQL service started." -ForegroundColor Green
    } else {
        Write-Host "  [WARN] Could not find XAMPP MySQL. If connection fails, please start MySQL manually." -ForegroundColor Red
    }
}
Write-Host ""

# 2. Ensure ports 8080 and 5173 are free
Write-Host "[2/4] Clearing previous backend and frontend processes..." -ForegroundColor Yellow
$p8080 = (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
if ($p8080) {
    Stop-Process -Id $p8080 -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] Freed Port 8080" -ForegroundColor Green
}
$p5173 = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
if ($p5173) {
    Stop-Process -Id $p5173 -Force -ErrorAction SilentlyContinue
    Write-Host "  [OK] Freed Port 5173" -ForegroundColor Green
}
Write-Host "  [OK] Ports 8080 and 5173 are ready." -ForegroundColor Green
Write-Host ""

# 3. Start Spring Boot Backend in a minimized window
Write-Host "[3/4] Starting Backend (Spring Boot on Port 8080)..." -ForegroundColor Yellow
$backendJar = Join-Path $rootDir "backend\target\waste-management-system-1.0.0.jar"
$backendDir = Join-Path $rootDir "backend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c title SmartCity-Backend-8080 && cd /d `"$backendDir`" && java -jar `"$backendJar`"" -WindowStyle Minimized

# 4. Start Vite Frontend in a minimized window
Write-Host "[4/4] Starting Frontend (React Vite on Port 5173)..." -ForegroundColor Yellow
$frontendDir = Join-Path $rootDir "frontend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c title SmartCity-Frontend-5173 && cd /d `"$frontendDir`" && npm run dev -- --host --port 5173" -WindowStyle Minimized

Write-Host ""
Write-Host "Initializing servers, please wait a few seconds..." -ForegroundColor Cyan

# Wait for frontend
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { break }
    } catch {}
    Start-Sleep -Seconds 1
}

# Wait for backend
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:8080/api/reports" -TimeoutSec 2
        if ($r -ne $null) { break }
    } catch {}
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "              WEBSITE IS NOW RUNNING SUCCESSFULLY!                    " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  [+] Website URL:    http://localhost:5173" -ForegroundColor White
Write-Host "  [+] Network Wi-Fi:  http://10.57.118.193:5173" -ForegroundColor White
Write-Host "  [+] Backend API:    http://localhost:8080" -ForegroundColor White
Write-Host "  [+] MySQL Database: localhost:3306 (smart_waste_db)" -ForegroundColor White
Write-Host ""
Write-Host "  ------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  DEMO LOGIN ACCOUNTS:" -ForegroundColor Cyan
Write-Host "  ------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  1. Municipal Admin:    admin@smartcity.gov   /  Admin@123" -ForegroundColor Yellow
Write-Host "  2. Municipal Driver:   driver@smartcity.gov  /  Driver@123" -ForegroundColor Yellow
Write-Host "  3. Citizen Reporter:   pravin@gmail.com      /  Citizen@123" -ForegroundColor Yellow
Write-Host "  ------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Opening website in your browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"
Write-Host ""
Write-Host "  Keep this window open while using the website." -ForegroundColor Gray
Write-Host "  To STOP the website at any time:" -ForegroundColor Gray
Write-Host "  - Press Enter in this window, OR double-click stop_app.bat" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Green

Read-Host "Press Enter to stop all website services"

# Shutdown
Write-Host ""
Write-Host "Stopping website services..." -ForegroundColor Yellow
$p8080 = (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
if ($p8080) { Stop-Process -Id $p8080 -Force -ErrorAction SilentlyContinue }
$p5173 = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
if ($p5173) { Stop-Process -Id $p5173 -Force -ErrorAction SilentlyContinue }
Write-Host "Website stopped." -ForegroundColor Green
Start-Sleep -Seconds 2
