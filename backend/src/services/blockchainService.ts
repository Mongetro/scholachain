// backend/src/services/blockchainService.ts

import {
  createPublicClient,
  http,
  type Abi,
  type Address,
  type PublicClient,
} from 'viem';
import { sepolia } from 'viem/chains';
import { validateAndNormalizeAddress } from '../utils/addressUtils.js';
import { contractLoader } from '../utils/contractLoader.js';

// ==================== TYPE DEFINITIONS ====================

export interface Certificate {
  documentHash: string;
  ipfsCID: string;
  issuer: Address;
  holder: Address;
  issuedAt: Date;
  revoked: boolean;
  certificateType?: string;
}

export interface BlockchainStatus {
  status: 'connected' | 'disconnected';
  latestBlock?: number;
  error?: string;
}

export interface IssuanceSimulationResult {
  success: boolean;
  certificateId?: number;
  simulated: boolean;
  message: string;
  estimatedGas?: number;
  requiredParameters: {
    documentHash: string;
    ipfsCID: string;
    holderAddress: string;
    certificateType?: string;
  };
}

export interface ServiceMode {
  readOnly: boolean;
  description: string;
}

// ==================== READ-ONLY BLOCKCHAIN SERVICE CLASS - CORRECTED ====================

export class BlockchainService {
  private publicClient: PublicClient | null = null;
  private governanceClient: PublicClient | null = null;
  private contractConfig: any;
  private governanceConfig: any;
  private isConnected: boolean = false;
  private network: string;
  private serviceMode: ServiceMode;

  constructor() {
    // Load BOTH contract configurations
    this.contractConfig = contractLoader.getScholaChainConfig();
    this.governanceConfig = contractLoader.getGovernanceConfig();
    this.network = this.contractConfig.network;
    this.serviceMode = {
      readOnly: true,
      description: 'Backend provides read-only blockchain access.',
    };

    console.log(
      `🔗 Initializing CORRECTED Blockchain Service for network: ${this.network}`,
    );
    console.log(`   ScholaChain Contract: ${this.contractConfig.address}`);
    console.log(`   Governance Contract: ${this.governanceConfig.address}`);

    this.initializeClient();
  }

  // ==================== CLIENT INITIALIZATION ====================

  /**
   * Initialize public clients for read operations
   */
  private async initializeClient(): Promise<void> {
    try {
      console.log(`🔗 Initializing CORRECTED blockchain clients...`);

      if (this.network === 'sepolia') {
        await this.initializeSepoliaClient();
      } else {
        await this.initializeLocalClient();
      }

      await this.testConnection();
      this.isConnected = true;

      console.log('✅ CORRECTED blockchain clients initialized successfully');
      console.log(
        `   Mode: ${this.serviceMode.readOnly ? 'Read-Only' : 'Read/Write'}`,
      );
      console.log(`   Network: ${this.network}`);
    } catch (error) {
      console.error('❌ Failed to initialize blockchain client:', error);
      this.isConnected = false;
    }
  }

  /**
   * Initialize client for Sepolia testnet
   */
  private async initializeSepoliaClient(): Promise<void> {
    if (!process.env.ALCHEMY_API_KEY) {
      throw new Error('ALCHEMY_API_KEY not found for Sepolia deployment');
    }

    const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

    // Initialize public client for ScholaChain contract
    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(alchemyUrl, {
        timeout: 10000,
        retryCount: 3,
      }),
    });

    // Initialize separate client for Governance contract to ensure proper ABI handling
    this.governanceClient = createPublicClient({
      chain: sepolia,
      transport: http(alchemyUrl, {
        timeout: 10000,
        retryCount: 3,
      }),
    });

    console.log('✅ Sepolia public clients initialized (READ-ONLY)');
  }

  /**
   * Initialize client for local development
   */
  private async initializeLocalClient(): Promise<void> {
    const rpcUrl = 'http://hardhat-node:8545';

    const localChain = {
      id: 31337,
      name: 'hardhat',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [rpcUrl],
        },
      },
    };

    // Initialize public client for ScholaChain contract
    this.publicClient = createPublicClient({
      chain: localChain,
      transport: http(rpcUrl, {
        timeout: 5000,
        retryCount: 5,
      }),
    });

    // Initialize separate client for Governance contract
    this.governanceClient = createPublicClient({
      chain: localChain,
      transport: http(rpcUrl, {
        timeout: 5000,
        retryCount: 5,
      }),
    });

    console.log('✅ Local blockchain clients initialized (READ-ONLY)');
  }

  /**
   * Test blockchain connection
   */
  private async testConnection(): Promise<void> {
    if (!this.publicClient) {
      throw new Error('Blockchain client not initialized');
    }

    try {
      const blockNumber = await this.publicClient.getBlockNumber();
      console.log(`✅ Connected to blockchain. Latest block: ${blockNumber}`);
    } catch (error) {
      console.error('❌ Blockchain connection test failed:', error);
      throw error;
    }
  }

  // ==================== ISSUER AUTHORIZATION - CORRECTED ====================

  /**
   * Check if an address is authorized to issue certificates - FIXED VERSION
   * Uses Governance contract directly with proper ABI
   */
  async isIssuerAuthorized(issuerAddress: string): Promise<boolean> {
    if (!this.isConnected || !this.governanceClient) {
      console.warn(
        '⚠️ Blockchain not connected - cannot check issuer authorization',
      );
      return false;
    }

    try {
      const normalizedAddress = validateAndNormalizeAddress(issuerAddress);
      console.log(`🔍 Checking authorization for issuer: ${normalizedAddress}`);
      console.log(
        `   Using Governance contract: ${this.governanceConfig.address}`,
      );

      // Use the CORRECT ABI from governance contract
      const result = await this.governanceClient.readContract({
        address: this.governanceConfig.address as Address,
        abi: this.governanceConfig.abi as Abi,
        functionName: 'canIssueCertificates',
        args: [normalizedAddress],
      });

      console.log(`✅ Issuer ${normalizedAddress} authorized: ${result}`);
      return result as boolean;
    } catch (error: any) {
      console.error(
        `❌ Error checking issuer authorization for ${issuerAddress}:`,
        error,
      );

      // Provide detailed error information
      if (error.message?.includes('cannot estimate gas')) {
        console.error('   Gas estimation error - possible ABI mismatch');
      }
      if (error.message?.includes('reverted')) {
        console.error('   Contract call reverted - check contract state');
      }

      return false;
    }
  }

  // ==================== READ-ONLY CERTIFICATE OPERATIONS ====================

  /**
   * Get certificate details by ID from blockchain
   */
  async getCertificate(certificateId: number): Promise<Certificate | null> {
    if (!this.isConnected || !this.publicClient) {
      console.warn('⚠️ Blockchain not connected - cannot fetch certificate');
      return null;
    }

    try {
      const result = (await this.publicClient.readContract({
        address: this.contractConfig.address as Address,
        abi: this.contractConfig.abi as Abi,
        functionName: 'getCertificate',
        args: [BigInt(certificateId)], // Ici, BigInt(0) est valide
      })) as any;
      // Check if certificate exists (holder address not zero)
      if (
        !result ||
        result.holder === '0x0000000000000000000000000000000000000000'
      ) {
        console.log(`❌ Certificate #${certificateId} not found on blockchain`);
        return null;
      }

      const certificate: Certificate = {
        documentHash: result.documentHash,
        ipfsCID: result.ipfsCID,
        issuer: result.issuer,
        holder: result.holder,
        issuedAt: new Date(Number(result.issuedAt) * 1000),
        revoked: result.revoked,
        certificateType: result.certificateType,
      };

      console.log(`✅ Certificate #${certificateId} loaded successfully`);
      return certificate;
    } catch (error) {
      console.error(`❌ Error fetching certificate #${certificateId}:`, error);
      return null;
    }
  }

  /**
   * Verify certificate authenticity by comparing document hash
   */
  async verifyCertificateHash(
    certificateId: number,
    documentHash: string,
  ): Promise<boolean> {
    if (!this.isConnected || !this.publicClient) {
      console.warn('⚠️ Blockchain not connected - cannot verify certificate');
      return false;
    }

    try {
      console.log(
        `🔍 Verifying certificate #${certificateId} with hash: ${documentHash}`,
      );

      const result = (await this.publicClient.readContract({
        address: this.contractConfig.address as Address,
        abi: this.contractConfig.abi as Abi,
        functionName: 'verifyCertificate',
        args: [BigInt(certificateId), documentHash],
      })) as [boolean, Address, Address, boolean];

      const [isValid, issuer, holder, isRevoked] = result;

      console.log(`✅ Verification result for certificate #${certificateId}:`, {
        isValid,
        issuer,
        holder,
        isRevoked,
      });

      return isValid && !isRevoked;
    } catch (error) {
      console.error(`❌ Error verifying certificate #${certificateId}:`, error);
      return false;
    }
  }

  /**
   * Get total number of certificates issued on blockchain
   */
  async getTotalCertificates(): Promise<number> {
    if (!this.isConnected || !this.publicClient) {
      console.warn(
        '⚠️ Blockchain not connected - cannot fetch total certificates',
      );
      return 0;
    }

    try {
      console.log('🔍 Fetching total certificates count...');

      const result = (await this.publicClient.readContract({
        address: this.contractConfig.address as Address,
        abi: this.contractConfig.abi as Abi,
        functionName: 'totalCertificates',
      })) as bigint;

      const total = Number(result);
      console.log(`✅ Total certificates on blockchain: ${total}`);
      return total;
    } catch (error: any) {
      if (error.message?.includes('returned no data')) {
        console.warn(
          '⚠️ ABI mismatch or contract not initialized. Assuming 0 certificates.',
        );
        return 0;
      }

      console.error('❌ Error fetching total certificates:', error);
      return 0;
    }
  }

  // ==================== CERTIFICATE ISSUANCE PREPARATION ====================

  /**
   * Prepare certificate issuance data for frontend transaction
   * This does NOT execute any transaction - only prepares data
   */
  async prepareCertificateIssuance(
    documentHash: string,
    ipfsCID: string,
    holderAddress: string,
    certificateType: string = '',
  ): Promise<IssuanceSimulationResult> {
    if (!this.isConnected || !this.publicClient) {
      console.warn('⚠️ Blockchain not connected - cannot prepare issuance');
      return {
        success: false,
        simulated: true,
        message: 'Blockchain not connected',
        requiredParameters: {
          documentHash,
          ipfsCID,
          holderAddress,
          certificateType,
        },
      };
    }

    try {
      console.log('📝 Preparing certificate issuance data for frontend...');
      console.log('   Document Hash:', documentHash);
      console.log('   IPFS CID:', ipfsCID);
      console.log('   Holder:', holderAddress);
      console.log('   Certificate Type:', certificateType);

      // Validate inputs
      if (!this.isValidEthereumAddress(holderAddress)) {
        throw new Error('Invalid holder Ethereum address');
      }

      if (!documentHash.startsWith('0x') || documentHash.length !== 66) {
        throw new Error('Invalid document hash format');
      }

      if (!ipfsCID || ipfsCID.length === 0) {
        throw new Error('IPFS CID is required');
      }

      // Get current total certificates to predict next ID
      const currentTotal = await this.getTotalCertificates();
      const predictedCertificateId = currentTotal;

      console.log(
        `✅ Issuance preparation successful. Predicted certificate ID: ${predictedCertificateId}`,
      );

      return {
        success: true,
        certificateId: predictedCertificateId,
        simulated: true,
        message:
          'Issuance data prepared successfully. Use frontend with MetaMask for actual transaction.',
        estimatedGas: 150000, // Estimated gas for typical certificate issuance
        requiredParameters: {
          documentHash,
          ipfsCID,
          holderAddress,
          certificateType,
        },
      };
    } catch (error) {
      console.error('❌ Error preparing certificate issuance:', error);
      return {
        success: false,
        simulated: true,
        message: `Preparation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        requiredParameters: {
          documentHash,
          ipfsCID,
          holderAddress,
          certificateType,
        },
      };
    }
  }

  // ==================== STATUS AND INFORMATION ====================

  /**
   * Get current blockchain connection status
   */
  async getBlockchainStatus(): Promise<BlockchainStatus> {
    if (!this.isConnected || !this.publicClient) {
      return {
        status: 'disconnected',
        error: 'Blockchain client not initialized',
      };
    }

    try {
      const blockNumber = await this.publicClient.getBlockNumber();

      return {
        status: 'connected',
        latestBlock: Number(blockNumber),
      };
    } catch (error: any) {
      console.error('❌ Blockchain connection error:', error.message);
      return {
        status: 'disconnected',
        error: error.message,
      };
    }
  }

  /**
   * Get contract information and service status
   */
  getContractInfo(): {
    address: string;
    network: string;
    chainId: number;
    deployedAt: string;
    connected: boolean;
    mode: ServiceMode;
  } {
    return {
      address: this.contractConfig.address,
      network: this.contractConfig.network,
      chainId: this.contractConfig.chainId,
      deployedAt: this.contractConfig.deployedAt,
      connected: this.isConnected,
      mode: this.serviceMode,
    };
  }

  /**
   * Validate Ethereum address format
   */
  isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Check if service is connected and ready
   */
  isServiceConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Check if service can issue certificates (always false for backend)
   */
  canIssueCertificates(): boolean {
    return false; // Backend is always read-only
  }

  /**
   * Get contract ABI for frontend usage
   */
  getContractABI(): any[] {
    return this.contractConfig.abi;
  }

  /**
   * Get contract address for frontend usage
   */
  getContractAddress(): string {
    return this.contractConfig.address;
  }

  /**
   * Get governance contract ABI for frontend usage
   */
  getGovernanceABI(): any[] {
    return this.governanceConfig.abi;
  }

  /**
   * Get governance contract address for frontend usage
   */
  getGovernanceAddress(): string {
    return this.governanceConfig.address;
  }
}

// ==================== SINGLETON EXPORT ====================

export const blockchainService = new BlockchainService();
