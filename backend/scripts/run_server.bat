@echo off
REM Batch script to run Django development server
REM Activates virtual environment and starts the server

echo Starting Django development server...

REM Activate virtual environment
call "%~dp0..\.venv\Scripts\activate.bat"

REM Navigate to backend directory
cd /d "%~dp0.."

REM Run Django server
python manage.py runserver

pause 