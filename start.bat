@echo off
echo Starting HTH Estate Management System...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Check if database exists, if not run sample data
if not exist "estate_management.db" (
    echo Setting up sample data...
    npm run sample-data
    echo.
)

echo Starting the server...
echo.
echo The application will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

npm start

pause
