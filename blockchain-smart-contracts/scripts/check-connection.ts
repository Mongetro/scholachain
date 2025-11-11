// blockchain-smart-contracts/scripts/check-connection.ts
// TypeScript connection check script for blockchain networks

/**
 * Connection check script to validate RPC connectivity before deployment
 */

import { ethers } from 'ethers';

async function main(): Promise<void> {
  const network = process.argv[2] || 'localhost';

  try {
    // Create provider based on network
    let provider: ethers.Provider;

    if (network === 'sepolia') {
      if (!process.env.ALCHEMY_API_KEY) {
        throw new Error('ALCHEMY_API_KEY is required for Sepolia connection');
      }
      const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
      provider = new ethers.JsonRpcProvider(alchemyUrl);
    } else {
      // Localhost - Hardhat node
      provider = new ethers.JsonRpcProvider('http://localhost:8545');
    }

    // Test connection
    const networkInfo = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    console.log(`✅ Successfully connected to network:`);
    console.log(
      `   Network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`,
    );
    console.log(`   Latest Block: ${blockNumber}`);

    // Test account access if private key is available
    if (process.env.TESTNET_PRIVATE_KEY) {
      const wallet = new ethers.Wallet(
        process.env.TESTNET_PRIVATE_KEY,
        provider,
      );
      const balance = await provider.getBalance(wallet.address);
      console.log(`   Deployer Address: ${wallet.address}`);
      console.log(`   Deployer Balance: ${ethers.formatEther(balance)} ETH`);
    }

    process.exit(0);
  } catch (error) {
    console.error(
      `❌ Connection failed: ${error instanceof Error ? error.message : error}`,
    );
    process.exit(1);
  }
}

// Execute connection test
main().catch((error) => {
  console.error('Fatal error during connection test:', error);
  process.exit(1);
});
