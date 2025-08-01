@echo off
REM Database Verification Script Runner
REM Location: /backend/scripts/verify_db.bat
REM Automatically activates virtual environment and runs verification

echo Activating virtual environment...
call "%~dp0..\..\\.venv-win\Scripts\activate.bat"

echo Running database verification...
python "%~dp0verify_db.py"

echo.
echo Press any key to continue...
pause >nul
