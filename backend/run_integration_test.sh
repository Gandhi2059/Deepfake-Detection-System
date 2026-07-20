#!/bin/bash
source venv/bin/activate
uvicorn main:app --port 8000 > server_integration.log 2>&1 &
SERVER_PID=$!
echo "Waiting for server to start..."
sleep 5
echo "Testing prediction endpoint with lena.jpg..."
curl -s -X POST -F "file=@lena.jpg" -F "user_id=1" http://localhost:8000/api/predict > integration_out.json 2>&1
kill $SERVER_PID
echo "Done."
