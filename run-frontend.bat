@echo off
setlocal

rem Starts the React/Vite frontend in this repo.
rem - Dev server: http://localhost:5173/

set "ROOT=%~dp0"
cd /d "%ROOT%frontend" || exit /b 1

if not exist "node_modules" (
  echo Installing npm dependencies...
  npm install
  if errorlevel 1 exit /b 1
)

echo Starting Vite dev server...
echo This should be reachable at http://localhost:5173/
echo Press Ctrl+C in this window to stop.

npm run dev

