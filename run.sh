#!/bin/bash

# ApexTrade AI Launcher for macOS / Linux
export PYTHONIOENCODING=utf-8

clear
echo "====================================================================="
echo "   📈  APEXTRADE AI — STOCK ANALYZER LAUNCHER  📈"
echo "====================================================================="
echo ""

# Step 1: Check Python Installation
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 was not found on your system."
    echo "Please install Python 3.10+ using your package manager (brew, apt, etc.)."
    echo ""
    exit 1
fi

VENV_DIR=".venv"
VENV_PYTHON="$VENV_DIR/bin/python"
VENV_PIP="$VENV_DIR/bin/pip"

# Step 2: Setup Virtual Environment if missing
if [ ! -d "$VENV_DIR" ]; then
    echo "[INFO] Virtual environment (.venv) not found. Setting it up now..."
    python3 -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to create virtual environment."
        exit 1
    fi
    
    echo "[INFO] Installing required dependencies (this may take a few minutes)..."
    "$VENV_PYTHON" -m pip install --upgrade pip > /dev/null
    "$VENV_PIP" install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "[ERROR] Dependency installation failed."
        exit 1
    fi
    echo "[SUCCESS] Setup complete!"
    echo ""
fi

show_menu() {
    clear
    echo "====================================================================="
    echo "   📈  APEXTRADE AI — STOCK ANALYZER LAUNCHER  📈"
    echo "====================================================================="
    echo " Select which interface you would like to run:"
    echo ""
    echo " [1] Streamlit Dashboard (Port 8501)"
    echo "     - Default analytics interface with Plotly charts and ML forecasts."
    echo ""
    echo " [2] Custom Web Dashboard (Port 8000)"
    echo "     - High-fidelity custom HTML/JS interface connected to FastAPI backend."
    echo ""
    echo " [3] Run BOTH (Recommended)"
    echo "     - Launches both portals concurrently (Streamlit + FastAPI)."
    echo ""
    echo " [4] Run System Diagnostics"
    echo "     - Runs API & ML validation tests to check codebase integrity."
    echo ""
    echo " [5] Exit"
    echo "====================================================================="
    echo -n "Enter your choice (1-5): "
}

while true; do
    show_menu
    read choice
    case $choice in
        1)
            echo "[LAUNCH] Starting Streamlit dashboard on http://localhost:8501..."
            "$VENV_PYTHON" -m streamlit run app.py
            break
            ;;
        2)
            echo "[LAUNCH] Starting FastAPI server on http://localhost:8000..."
            "$VENV_PYTHON" -m uvicorn server:app --host 0.0.0.0 --port 8000
            break
            ;;
        3)
            echo "[LAUNCH] Starting FastAPI server on http://localhost:8000 in background..."
            # Start FastAPI backend in background
            "$VENV_PYTHON" -m uvicorn server:app --host 0.0.0.0 --port 8000 &
            FASTAPI_PID=$!
            
            # Setup trap to terminate FastAPI backend when this script is closed
            trap "kill $FASTAPI_PID 2>/dev/null" EXIT
            
            echo "[LAUNCH] Starting Streamlit dashboard on http://localhost:8501..."
            "$VENV_PYTHON" -m streamlit run app.py
            
            # Wait for Streamlit to exit
            wait
            break
            ;;
        4)
            clear
            echo "Running diagnostics..."
            "$VENV_PYTHON" utils.py --test-ml
            echo ""
            "$VENV_PYTHON" utils.py --test-apis
            echo ""
            echo "Diagnostics complete. Press Enter to return to menu..."
            read
            ;;
        5)
            echo ""
            echo "Thank you for using ApexTrade AI!"
            echo ""
            exit 0
            ;;
        *)
            echo "Invalid choice. Please select a number from 1 to 5."
            sleep 2
            ;;
    esac
done
