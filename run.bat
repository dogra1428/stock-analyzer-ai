@echo off
title ApexTrade AI Launcher
setlocal enabledelayedexpansion

:: Set UTF-8 Console Output
chcp 65001 >nul
set PYTHONIOENCODING=utf-8

cls
echo =====================================================================
echo    📈  APEXTRADE AI — STOCK ANALYZER LAUNCHER  📈
echo =====================================================================
echo.

:: Step 1: Check Python Installation
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python was not found on your system PATH.
    echo Please download and install Python 3.10+ from: https://www.python.org/downloads/
    echo Make sure to check the box "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

:: Step 2: Set Virtual Environment Path
set VENV_DIR=.venv
set VENV_PYTHON=%VENV_DIR%\Scripts\python.exe
set VENV_PIP=%VENV_DIR%\Scripts\pip.exe

:: Step 3: Setup Virtual Environment if missing
if not exist %VENV_DIR% (
    echo [INFO] Virtual environment (.venv) not found. Setting it up now...
    python -m venv %VENV_DIR%
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    
    echo [INFO] Installing required dependencies (this may take a few minutes)...
    %VENV_PYTHON% -m pip install --upgrade pip >nul
    %VENV_PIP% install -r requirements.txt
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
    echo [SUCCESS] Setup complete!
    echo.
)

:MENU
cls
echo =====================================================================
echo    📈  APEXTRADE AI — STOCK ANALYZER LAUNCHER  📈
echo =====================================================================
echo  Select which interface you would like to run:
echo.
echo  [1] Streamlit Dashboard (Port 8501)
echo      - Default analytics interface with Plotly charts and ML forecasts.
echo.
echo  [2] Custom Web Dashboard (Port 8000)
echo      - High-fidelity custom HTML/JS interface connected to FastAPI backend.
echo.
echo  [3] Run BOTH (Recommended)
echo      - Launches both portals in separate windows (Streamlit + FastAPI).
echo.
echo  [4] Run System Diagnostics
echo      - Runs API & ML validation tests to check codebase integrity.
echo.
echo  [5] Exit
echo =====================================================================
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto RUN_STREAMLIT
if "%choice%"=="2" goto RUN_FASTAPI
if "%choice%"=="3" goto RUN_BOTH
if "%choice%"=="4" goto RUN_TESTS
if "%choice%"=="5" goto EXIT
echo Invalid choice. Please select a number from 1 to 5.
timeout /t 2 >nul
goto MENU

:RUN_STREAMLIT
echo [LAUNCH] Starting Streamlit dashboard on http://localhost:8501...
%VENV_PYTHON% -m streamlit run app.py
goto EXIT

:RUN_FASTAPI
echo [LAUNCH] Starting FastAPI server on http://localhost:8000...
%VENV_PYTHON% -m uvicorn server:app --host 0.0.0.0 --port 8000
goto EXIT

:RUN_BOTH
echo [LAUNCH] Starting FastAPI server in a new window...
start "ApexTrade FastAPI Server (Port 8000)" cmd /k "title FastAPI Backend && chcp 65001 >nul && set PYTHONIOENCODING=utf-8 && .venv\Scripts\python.exe -m uvicorn server:app --host 0.0.0.0 --port 8000"

echo [LAUNCH] Starting Streamlit server in a new window...
start "ApexTrade Streamlit Server (Port 8501)" cmd /k "title Streamlit Frontend && chcp 65001 >nul && set PYTHONIOENCODING=utf-8 && .venv\Scripts\python.exe -m streamlit run app.py"

echo.
echo [SUCCESS] Both servers are starting up!
echo - Custom Web App: http://localhost:8000
echo - Streamlit Dashboard: http://localhost:8501
echo.
echo Press any key to return to menu or close this window to exit.
pause >nul
goto MENU

:RUN_TESTS
cls
echo Running diagnostics...
%VENV_PYTHON% utils.py --test-ml
echo.
%VENV_PYTHON% utils.py --test-apis
echo.
echo Diagnostics complete. Press any key to return to menu...
pause >nul
goto MENU

:EXIT
echo.
echo Thank you for using ApexTrade AI!
echo.
timeout /t 2 >nul
exit /b 0
