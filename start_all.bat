@echo off
title AI Student Growth Engine - Launcher
echo ===================================================
echo   Starting AI Student Growth Engine (NxtWave)
echo   Location: C:\Nxt Wave
echo ===================================================
echo.

cd /d "C:\Nxt Wave"

echo [1/2] Starting Backend FastAPI Server on http://localhost:8000...
start "AI Growth Engine - Backend (FastAPI)" cmd /k "cd /d C:\Nxt Wave && .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Vite Server on http://localhost:5173...
start "AI Growth Engine - Frontend (React)" cmd /k "cd /d C:\Nxt Wave\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ===================================================
echo   Both services are starting!
echo   Frontend UI : http://localhost:5173
echo   API Docs    : http://localhost:8000/api/v1/docs
echo ===================================================
start http://localhost:5173
exit
