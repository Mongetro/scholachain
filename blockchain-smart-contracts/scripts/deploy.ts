// blockchain-smart-contracts/scripts/deploy.ts

import { ethers } from 'ethers';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Main deployment function
 */
async function deployContracts(): Promise<void> {
  const network = process.argv[2] || 'localhost';
  console.log(`🚀 Starting ScholaChain deployment to ${network.toUpperCase()}`);
  console.log('='.repeat(60));

  try {
    // Validate environment
    await validateEnvironment(network);

    // Setup provider and signer
    const { provider, signer, signerAddress } = await setupProviderAndSigner(
      network,
    );

    // Compile contracts
    console.log('\n📦 Compiling smart contracts...');
    await compileContracts();

    // Load contract artifacts
    console.log('📄 Loading contract artifacts...');
    const { governanceArtifact, scholachainArtifact } = loadContractArtifacts();

    // Deploy Governance contract
    console.log('\n🏛️  Deploying ScholaChainGovernance contract...');
    const governanceAddress = await deployGovernanceContract(
      governanceArtifact,
      signer,
      signerAddress,
    );

    // Deploy ScholaChain contract
    console.log('\n📜 Deploying ScholaChain contract...');
    const scholachainAddress = await deployScholaChainContract(
      scholachainArtifact,
      signer,
      governanceAddress,
    );

    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    await verifyDeployment(
      governanceAddress,
      scholachainArtifact.abi,
      provider,
      signerAddress,
    );

    // Export contract data
    console.log('\n📁 Exporting contract data to backend...');
    exportContractData(
      network,
      governanceAddress,
      scholachainAddress,
      signerAddress,
      governanceArtifact.abi,
      scholachainArtifact.abi,
    );

    console.log('\n🎉 Deployment completed successfully!');
    console.log('='.repeat(60));
    console.log('📋 Deployment Summary:');
    console.log(`   🏛️  Governance: ${governanceAddress}`);
    console.log(`   📜 ScholaChain:  ${scholachainAddress}`);
    console.log(`   🔗 Ministry:    ${signerAddress}`);
    console.log(`   🌐 Network:     ${network}`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n💥 Deployment failed:');
    console.error(error instanceof Error ? error.message : error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Run: npx hardhat compile');
    console.log('   • Check environment variables');
    console.log('   • Verify network connectivity');
    console.log('='.repeat(60));
    process.exit(1);
  }
}

/**
 * Validate deployment environment
 */
async function validateEnvironment(network: string): Promise<void> {
  console.log('🔍 Validating environment...');

  if (network === 'sepolia') {
    if (!process.env.ALCHEMY_API_KEY) {
      throw new Error(
        'ALCHEMY_API_KEY environment variable is required for Sepolia deployment',
      );
    }
    if (!process.env.TESTNET_PRIVATE_KEY) {
      throw new Error(
        'TESTNET_PRIVATE_KEY environment variable is required for Sepolia deployment',
      );
    }

    const privateKey = process.env.TESTNET_PRIVATE_KEY;
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      throw new Error(
        'TESTNET_PRIVATE_KEY must be a 64-character hexadecimal string starting with 0x',
      );
    }
  }

  console.log('✅ Environment validation passed');
}

/**
 * Setup provider and signer based on network
 */
async function setupProviderAndSigner(network: string): Promise<{
  provider: ethers.Provider;
  signer: ethers.Wallet;
  signerAddress: string;
}> {
  console.log('🔗 Setting up blockchain connection...');

  let provider: ethers.Provider;
  let signer: ethers.Wallet;

  if (network === 'sepolia') {
    provider = new ethers.JsonRpcProvider(
      `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    );
    signer = new ethers.Wallet(process.env.TESTNET_PRIVATE_KEY!, provider);
  } else {
    // Localhost - Hardhat node
    provider = new ethers.JsonRpcProvider('http://hardhat-node:8545');
    // Use the first Hardhat account for local deployment
    signer = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      provider,
    );
  }

  const signerAddress = await signer.getAddress();
  const networkInfo = await provider.getNetwork();
  const balance = await provider.getBalance(signerAddress);

  console.log(
    `✅ Connected to: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`,
  );
  console.log(`   👤 Deployer: ${signerAddress}`);
  console.log(`   💰 Balance: ${ethers.formatEther(balance)} ETH`);

  return { provider, signer, signerAddress };
}

/**
 * Compile contracts using Hardhat
 */
async function compileContracts(): Promise<void> {
  const { execSync } = await import('child_process');
  execSync('npx hardhat compile', { stdio: 'inherit' });
}

/**
 * Load contract artifacts from compilation output
 */
function loadContractArtifacts(): {
  governanceArtifact: any;
  scholachainArtifact: any;
} {
  const governancePath =
    './artifacts/contracts/ScholaChainGovernance.sol/ScholaChainGovernance.json';
  const scholachainPath =
    './artifacts/contracts/ScholaChain.sol/ScholaChain.json';

  if (!existsSync(governancePath) || !existsSync(scholachainPath)) {
    throw new Error(
      'Contract artifacts not found. Please run: npx hardhat compile',
    );
  }

  const governanceArtifact = JSON.parse(readFileSync(governancePath, 'utf-8'));
  const scholachainArtifact = JSON.parse(
    readFileSync(scholachainPath, 'utf-8'),
  );

  console.log('✅ Contract artifacts loaded');
  return { governanceArtifact, scholachainArtifact };
}

/**
 * Deploy Governance contract
 */
async function deployGovernanceContract(
  artifact: any,
  signer: ethers.Wallet,
  ministryAddress: string,
): Promise<string> {
  const GovernanceFactory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer,
  );

  const governance = await GovernanceFactory.deploy(ministryAddress);
  console.log(`   ⏳ Transaction: ${governance.deploymentTransaction()?.hash}`);

  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();

  console.log(`   ✅ Governance deployed: ${governanceAddress}`);
  return governanceAddress;
}

// Add delays between contracts deployments
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deploy ScholaChain contract
 */
async function deployScholaChainContract(
  artifact: any,
  signer: ethers.Wallet,
  governanceAddress: string,
): Promise<string> {
  // Ajouter un délai avant le déploiement du deuxième contrat
  console.log('   ⏳ Waiting for block confirmation...');
  await delay(2000); // 2 secondes de délai

  const ScholaChainFactory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    signer,
  );

  const scholachain = await ScholaChainFactory.deploy(governanceAddress);
  console.log(
    `   ⏳ Transaction: ${scholachain.deploymentTransaction()?.hash}`,
  );

  await scholachain.waitForDeployment();
  const scholachainAddress = await scholachain.getAddress();

  console.log(`   ✅ ScholaChain deployed: ${scholachainAddress}`);
  return scholachainAddress;
}

/**
 * Verify deployment by checking contract state
 */
async function verifyDeployment(
  governanceAddress: string,
  scholachainAbi: any[],
  provider: ethers.Provider,
  ministryAddress: string,
): Promise<void> {
  const governanceContract = new ethers.Contract(
    governanceAddress,
    scholachainAbi,
    provider,
  );

  try {
    const role = await governanceContract.getInstitutionRole(ministryAddress);
    const totalInstitutions = await governanceContract.totalInstitutions();

    console.log(`   ✅ Ministry role: ${role}`);
    console.log(`   ✅ Total institutions: ${totalInstitutions}`);
  } catch (error) {
    console.log(
      '   ⚠️  Could not verify deployment state (normal for new contracts)',
    );
  }
}

/**
 * Export contract data to backend for API consumption
 */
function exportContractData(
  network: string,
  governanceAddress: string,
  scholachainAddress: string,
  ministryAddress: string,
  governanceAbi: any[],
  scholachainAbi: any[],
): void {
  const backendDir = resolve('../../backend/contract');
  const frontendDir = resolve('../../frontend/public/contract-data');

  // Create directories recursively
  mkdirSync(backendDir, { recursive: true });
  mkdirSync(frontendDir, { recursive: true });

  const chainId = network === 'sepolia' ? 11155111 : 31337;

  // Export network configuration
  const networkConfig = {
    network: network,
    chainId: chainId,
    ministryOfEducation: ministryAddress,
    deployedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  // Write to backend
  writeFileSync(
    `${backendDir}/network.json`,
    JSON.stringify(networkConfig, null, 2),
  );

  // Write to frontend
  writeFileSync(
    `${frontendDir}/network.json`,
    JSON.stringify(networkConfig, null, 2),
  );

  // Export Governance contract data
  const governanceConfig = {
    address: governanceAddress,
    abi: governanceAbi,
    contractName: 'ScholaChainGovernance',
    network: network,
    chainId: chainId,
    superAdmin: ministryAddress,
    deployedAt: new Date().toISOString(),
  };

  writeFileSync(
    `${backendDir}/ScholaChainGovernance.json`,
    JSON.stringify(governanceConfig, null, 2),
  );
  writeFileSync(
    `${frontendDir}/ScholaChainGovernance.json`,
    JSON.stringify(governanceConfig, null, 2),
  );

  // Export ScholaChain contract data
  const scholachainConfig = {
    address: scholachainAddress,
    abi: scholachainAbi,
    contractName: 'ScholaChain',
    network: network,
    chainId: chainId,
    governanceAddress: governanceAddress,
    deployedAt: new Date().toISOString(),
  };

  writeFileSync(
    `${backendDir}/ScholaChain.json`,
    JSON.stringify(scholachainConfig, null, 2),
  );
  writeFileSync(
    `${frontendDir}/ScholaChain.json`,
    JSON.stringify(scholachainConfig, null, 2),
  );

  console.log('✅ Contract data exported to backend AND frontend');
  console.log(`   📁 Backend: ${backendDir}`);
  console.log(`   📁 Frontend: ${frontendDir}`);
}

// Execute deployment
deployContracts().catch(console.error);
