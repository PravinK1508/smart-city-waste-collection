@echo off
title Stop Smart City Waste Management System
setlocal enabledelayedexpansion

cls
echo ======================================================================
echo          STOPPING SMART CITY WASTE MANAGEMENT SYSTEM
echo ======================================================================
echo.

powershell -NoProfile -Command ^
    "$p8080 = (Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue).OwningProcess; " ^
    "if ($p8080) { " ^
    "    Stop-Process -Id $p8080 -Force -ErrorAction SilentlyContinue; " ^
    "    Write-Host '  [OK] Backend stopped (Port 8080, PID: ' $p8080 ')' -ForegroundColor Green " ^
    "} else { " ^
    "    Write-Host '  [i] Backend was not running on port 8080.' -ForegroundColor Yellow " ^
    "}; " ^
    "$p5173 = (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess; " ^
    "if ($p5173) { " ^
    "    Stop-Process -Id $p5173 -Force -ErrorAction SilentlyContinue; " ^
    "    Write-Host '  [OK] Frontend stopped (Port 5173, PID: ' $p5173 ')' -ForegroundColor Green " ^
    "} else { " ^
    "    Write-Host '  [i] Frontend was not running on port 5173.' -ForegroundColor Yellow " ^
    "}; "

echo.
echo ======================================================================
echo          WEBSITE SERVICES HAVE BEEN STOPPED SUCCESSFULLY!
echo ======================================================================
echo.
ping 127.0.0.1 -n 3 >nul
