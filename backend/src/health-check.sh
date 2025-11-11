#!/bin/sh
set -e

echo "🔍 Checking backend health..."

# Wait until the backend is ready
max_attempts=30
attempt=1

until curl -f http://localhost:3001/health >/dev/null 2>&1; do
    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Backend not ready after $max_attempts attempts"
        exit 1
    fi
    echo "⏳ Waiting for backend... (attempt $attempt/$max_attempts)"
    sleep 5
    attempt=$((attempt + 1))
done

echo "✅ Backend is healthy!"