@echo off
echo ========================================
echo ChatApp - Setup Script
echo ========================================
echo.

echo Installing root dependencies...
call npm install
echo.

echo Installing server dependencies...
cd server
call npm install
cd ..
echo.

echo Installing client dependencies...
cd client
call npm install
cd ..
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB Atlas is accessible
echo 2. Run: start-dev.bat (or npm run dev)
echo 3. Open http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
