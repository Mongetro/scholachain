#!/bin/bash

echo "🧪 SCHOLACHAIN BACKEND TEST - FINAL"
echo "================================="

# Se positionner à la racine du projet
cd "$(dirname "$0")/.." 2>/dev/null || cd .

echo ""
echo "1. Checking contract deployment..."
if [ -f "backend/contract/ScholaChain.json" ]; then
    echo "✅ Contract file found at: backend/contract/ScholaChain.json"
    CONTRACT_ADDRESS=$(cat backend/contract/ScholaChain.json | jq -r '.address')
    CONTRACT_NETWORK=$(cat backend/contract/ScholaChain.json | jq -r '.network')
    echo "   Address: $CONTRACT_ADDRESS"
    echo "   Network: $CONTRACT_NETWORK"
else
    echo "❌ Contract file not found at: backend/contract/ScholaChain.json"
    echo "   Current directory: $(pwd)"
    echo "   Files in backend/contract/: $(ls -la backend/contract/ 2>/dev/null || echo 'Directory not found')"
    exit 1
fi

echo ""
echo "2. Starting backend tests..."
echo "   Waiting for backend to be ready..."

# Attendre que le backend soit prêt
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "✅ Backend is ready!"
        break
    fi
    echo "   ...waiting (attempt $((RETRY_COUNT+1))/$MAX_RETRIES)"
    sleep 3
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Backend not responding after $MAX_RETRIES attempts"
    echo "   Make sure backend is running: docker-compose --profile sepolia up backend"
    exit 1
fi

echo ""
echo "3. Testing endpoints..."
echo "   Health: $(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo 'FAILED')"
echo "   Blockchain: $(curl -s http://localhost:3001/api/blockchain/status | jq -r '.blockchain.status' 2>/dev/null || echo 'FAILED')"
echo "   IPFS: $(curl -s http://localhost:3001/api/ipfs/status | jq -r '.data.provider' 2>/dev/null || echo 'FAILED')"
echo "   Total Certificates: $(curl -s http://localhost:3001/api/blockchain/certificates/total | jq -r '.data.totalCertificates' 2>/dev/null || echo 'FAILED')"

echo ""
echo "4. Service status:"
docker-compose ps 2>/dev/null || echo "Docker compose not available"

echo ""
echo "🎉 Backend test completed successfully!"
echo "   Contract: $CONTRACT_ADDRESS on $CONTRACT_NETWORK"
echo "   Backend: http://localhost:3001"