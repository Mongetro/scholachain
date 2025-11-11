#!/bin/sh
set -e

# ====================
# NETWORK DETECTION
# ====================

if [ -z "$DEPLOY_NETWORK" ]; then
    echo "❌ DEPLOY_NETWORK must be set"
    exit 1
fi

NETWORK="$DEPLOY_NETWORK"
echo "🎯 Deploying to: $NETWORK"

# ====================
# NETWORK SETUP
# ====================

if [ "$NETWORK" = "localhost" ]; then
    echo "⏳ Waiting for Hardhat node to be ready..."
    
    max_attempts=30
    attempt=1
    
    until curl -f http://hardhat-node:8545 >/dev/null 2>&1; do
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ Hardhat node not ready after $max_attempts attempts"
            exit 1
        fi
        echo "⏳ Waiting for Hardhat node... (attempt $attempt/$max_attempts)"
        sleep 3
        attempt=$((attempt + 1))
    done
    echo "✅ Hardhat node is ready!"
else
    echo "🌐 Using external network: $NETWORK"
    
    if [ -z "$ALCHEMY_API_KEY" ]; then
        echo "❌ ALCHEMY_API_KEY required for $NETWORK"
        exit 1
    fi
    if [ -z "$TESTNET_PRIVATE_KEY" ]; then
        echo "❌ TESTNET_PRIVATE_KEY required for $NETWORK"
        exit 1
    fi
    echo "✅ $NETWORK configuration validated"
fi

# ====================
# DEPLOYMENT
# ====================

echo "🧹 Cleaning previous deployment data..."
rm -rf ./ignition/deployments/chain-* 2>/dev/null || true
rm -rf ../../backend/contract/* 2>/dev/null || true

echo "🚀 Starting deployment to $NETWORK..."

# Use the unified TypeScript deployment script
npx ts-node scripts/deploy.ts "$NETWORK"

echo "✅ Deployment completed successfully!"