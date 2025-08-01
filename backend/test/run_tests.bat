@echo off
REM Test Runner Batch Script
REM Location: /backend/test/run_tests.bat
REM Automatically activates virtual environment and runs all tests

echo Activating virtual environment...
call "%~dp0..\..\\.venv-win\Scripts\activate.bat"

echo.
echo Running HydroFast Test Suite...
python "%~dp0run_all_tests.py"

echo.
echo Press any key to continue...
pause >nul
