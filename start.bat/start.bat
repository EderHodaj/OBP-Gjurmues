@echo off
echo Nisja e OBP Savings Tracker...

start "OBP Server" cmd /k "cd /d C:\Users\Eder Hodaj\Downloads\budget-tracker\budget-tracker\server && node server.js"
timeout /t 3 /nobreak
start "OBP App" cmd /k "cd /d C:\Users\Eder Hodaj\Downloads\budget-tracker\budget-tracker && npm run dev"

echo Gati! Hapni: http://localhost:5173