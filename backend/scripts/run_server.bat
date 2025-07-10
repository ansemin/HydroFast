@echo off
REM Batch script to run Django development server
REM Activates virtual environment and starts the server with network IP display

echo Starting Django development server...

REM Activate virtual environment (updated path to .venv-win)
call "%~dp0..\.venv-win\Scripts\activate.bat"

REM Navigate to backend directory
cd /d "%~dp0.."

REM Run the Python server script that displays network info
python scripts\run_server.py

pause 