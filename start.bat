@echo off
echo ========================================
echo   Judith Seafoods - Ecommerce Platform
echo ========================================
echo.
echo IMPORTANT: Make sure to update your .env file with your MongoDB password
echo The connection string format: mongodb+srv://raybagsik0825_db_user:YOUR_PASSWORD@cluster0.obfa84e.mongodb.net/?appName=Cluster0
echo.

echo [1/4] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo [2/4] Checking MongoDB connection...
echo Note: Using MongoDB Atlas cloud database

echo.
echo [3/4] Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [4/4] Starting development server...
echo.
echo The app will be available at:
echo   - Main site: http://localhost:3000
echo   - Dashboard: http://localhost:3000/dashboard
echo   - Login: http://localhost:3000/login
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause
