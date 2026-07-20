#!/bin/bash
source venv/bin/activate
uvicorn main:app --port 8000 > server.log 2>&1 &
SERVER_PID=$!
sleep 5
curl -X POST -F "file=@dummy.jpg" -F "user_id=1" http://localhost:8000/api/predict > out.log 2>&1
kill $SERVER_PID
