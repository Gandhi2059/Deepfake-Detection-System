#!/bin/bash
source venv/bin/activate
uvicorn main:app --port 8000 > server_integration.log 2>&1 &
SERVER_PID=$!
echo "Waiting for server to start..."
sleep 5
echo "Testing prediction endpoint with real_dummy.jpg (NO FACE)..."
curl -s -X POST -F "file=@real_dummy.jpg" -F "user_id=1" http://localhost:8000/api/predict > integration_out2.json 2>&1
kill $SERVER_PID
echo "Done."
