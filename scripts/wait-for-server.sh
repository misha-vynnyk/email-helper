#!/bin/bash

# Wait for server to be ready before starting frontend
# This ensures the frontend doesn't start before the backend is accepting requests

BACKEND_URL="http://localhost:3001/api/health"
MAX_RETRIES=30
CURRENT_RETRY=0

echo "⏳ Waiting for backend server to be ready..."

while [ $CURRENT_RETRY -lt $MAX_RETRIES ]; do
  if curl -s "$BACKEND_URL" > /dev/null 2>&1; then
    echo "✅ Backend server is ready!"
    exit 0
  fi

  CURRENT_RETRY=$((CURRENT_RETRY + 1))
  echo "⏳ Backend not ready yet... ($CURRENT_RETRY/$MAX_RETRIES)"
  sleep 1
done

echo "⚠️  Backend server did not respond after $MAX_RETRIES attempts"
echo "Frontend will still start, but may have connection issues"
exit 0
