@echo off
REM Open a new terminal and run uvicorn for ml-service
start cmd /k "cd /d %~dp0ml-service && uvicorn server:app --host 127.0.0.1 --port 8000 --reload"

REM Open a new terminal and run npm start in server directory
start cmd /k "cd /d %~dp0server && npm start"

REM Open a new terminal and run npm start in client directory
start cmd /k "cd /d %~dp0client && npm start"
