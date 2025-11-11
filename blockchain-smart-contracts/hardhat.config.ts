// hardhat.config.ts
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    // Hardhat built-in EDR network
    hardhat: {
      type: 'edr-simulated',
      chainType: 'l1',
      chainId: 31337,
      allowBlocksWithSameTimestamp: true,
    },

    // Localhost network for Docker
    localhost: {
      type: 'http',
      url: 'http://hardhat-node:8545',
      chainId: 31337,
    },

    // Sepolia testnet
    sepolia: {
      type: 'http',
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.TESTNET_PRIVATE_KEY
        ? [process.env.TESTNET_PRIVATE_KEY]
        : [],
      chainId: 11155111,
    },
  },

  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
};

export default config;
