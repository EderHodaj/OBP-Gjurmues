@echo off
set SOURCE=C:\Users\Eder Hodaj\Downloads\budget-tracker\budget-tracker\server\db.sqlite
set BACKUP=C:\Users\Eder Hodaj\Downloads\budget-tracker\budget-tracker\backup

if not exist "%BACKUP%" mkdir "%BACKUP%"

for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
set DATE=%DT:~0,4%-%DT:~4,2%-%DT:~6,2%

copy "%SOURCE%" "%BACKUP%\db_%DATE%.sqlite"
