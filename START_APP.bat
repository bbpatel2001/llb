@echo off
REM Start LLB Platform - Questions Detail Page Fix

echo.
echo ============================================================
echo  LLB Platform - Starting Application
echo ============================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if backend folder exists
if not exist "backend" (
    echo ERROR: backend folder not found
    echo Please run this from the root LLB directory
    pause
    exit /b 1
)

REM Check if frontend folder exists
if not exist "react-frontend" (
    echo ERROR: react-frontend folder not found
    echo Please run this from the root LLB directory
    pause
    exit /b 1
)

echo [1/4] Checking environment configuration...
if not exist "react-frontend\.env.local" (
    echo Creating .env.local...
    (
        echo VITE_API_URL=http://localhost:6000
        echo VITE_APP_NAME=LLB Knowledge Platform
        echo VITE_APP_ENV=development
    ) > "react-frontend\.env.local"
    echo ✅ Created .env.local
) else (
    echo ✅ .env.local exists
)

echo.
echo [2/4] Starting Backend...
echo Starting on port 6000...
start "LLB Backend" cmd /k "cd backend && npm run start"
timeout /t 3

echo.
echo [3/4] Starting Frontend Dev Server...
echo Starting on port 6001...
start "LLB Frontend" cmd /k "cd react-frontend && npm run dev"
timeout /t 3

echo.
echo ============================================================
echo  Application Started!
echo ============================================================
echo.
echo Backend:  http://localhost:6000
echo Frontend: http://localhost:6001
echo.
echo The frontend browser window should open automatically.
echo If not, open http://localhost:6001 in your browser.
echo.
echo To use the app:
echo 1. Navigate to "Papers" tab
echo 2. Click on any paper
echo 3. Click on any question
echo 4. Question detail page should load with answer buttons
echo.
echo Press any key to close this window...
pause >nul
