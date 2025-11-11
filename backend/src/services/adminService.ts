// backend/src/services/adminService.ts

/**
 * Admin Service for ScholaChain Backend
 */

import {
  createPublicClient,
  http,
  type Abi,
  type Address,
  type Chain,
  type PublicClient,
} from 'viem';
import { sepolia } from 'viem/chains';
import { validateAndNormalizeAddress } from '../utils/addressUtils.js';
import { contractLoader } from '../utils/contractLoader.js';
import { logger } from '../utils/logger.js';

// ==================== TYPE DEFINITIONS ====================

export interface InstitutionData {
  address: string;
  name: string;
  description: string;
  website: string;
  isActive: boolean;
  registeredAt: number;
  role: string; // 'ISSUER' | 'SUPER_ADMIN'
}

export interface AdminServiceStatus {
  initialized: boolean;
  ready: boolean;
  readOnly: boolean;
  network: string;
  ministryAddress: string;
}

export interface ServiceInfo {
  chain: { id: number; name: string } | null;
  account: { address: string } | null;
  clients: { public: boolean; wallet: boolean };
}

// ==================== ADMIN SERVICE CLASS ====================

/**
 * Read-only admin service for blockchain data queries
 */
export class AdminService {
  private publicClient: PublicClient | null = null;
  private governanceConfig: any;
  private isInitialized: boolean = false;
  private isReady: boolean = false;
  private network: string = 'unknown';
  private chain: Chain | null = null;

  constructor() {
    this.initializeService().catch((error) => {
      logger.error('Admin service initialization failed', error);
    });
  }

  // ==================== SERVICE INITIALIZATION ====================

  /**
   * Initialize the read-only admin service
   */
  private async initializeService(): Promise<void> {
    try {
      logger.info('🔗 Initializing Read-Only Admin Service...');

      // Load governance contract configuration
      this.governanceConfig = contractLoader.getGovernanceConfig();
      this.network = contractLoader.getNetwork();

      // Initialize public client for read operations only
      await this.initializePublicClient();

      this.isInitialized = true;
      this.isReady = true;

      logger.info('✅ Read-only admin service initialized successfully');
      logger.info(`   Network: ${this.network}`);
      logger.info(`   Ministry: ${contractLoader.getMinistryAddress()}`);
      logger.info(`   Mode: Read-Only (Web3 Best Practice)`);
    } catch (error) {
      logger.error('❌ Admin service initialization failed:', error);
      this.isInitialized = false;
      this.isReady = false;
    }
  }

  /**
   * Initialize public client for blockchain read operations
   */
  private async initializePublicClient(): Promise<void> {
    try {
      if (this.network === 'sepolia') {
        if (!process.env.ALCHEMY_API_KEY) {
          throw new Error('ALCHEMY_API_KEY required for Sepolia connection');
        }

        const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

        this.chain = sepolia;
        this.publicClient = createPublicClient({
          chain: this.chain,
          transport: http(alchemyUrl),
        });
      } else {
        // Local development
        const rpcUrl = 'http://hardhat-node:8545';

        this.chain = {
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

        this.publicClient = createPublicClient({
          chain: this.chain,
          transport: http(rpcUrl),
        });
      }

      // Test connection
      const blockNumber = await this.publicClient.getBlockNumber();
      logger.info(`✅ Public client connected. Latest block: ${blockNumber}`);
    } catch (error) {
      logger.error('❌ Failed to initialize public client:', error);
      throw error;
    }
  }

  // ==================== READ-ONLY OPERATIONS ====================

  /**
   * Check if an address is the Ministry of Education (SUPER_ADMIN)
   */
  async isMinistryOfEducation(address: string): Promise<boolean> {
    if (!this.isReady || !this.publicClient) {
      logger.warn('Admin service not ready - using fallback ministry check');
      return this.fallbackMinistryCheck(address);
    }

    try {
      const normalizedAddress = validateAndNormalizeAddress(address);
      const ministryAddress = contractLoader.getMinistryAddress();

      // Quick check against configured ministry address
      if (normalizedAddress.toLowerCase() === ministryAddress.toLowerCase()) {
        return true;
      }

      // Verify on blockchain
      const result = await this.publicClient.readContract({
        address: this.governanceConfig.address as Address,
        abi: this.governanceConfig.abi as Abi,
        functionName: 'isSuperAdmin',
        args: [normalizedAddress],
      });

      return result as boolean;
    } catch (error) {
      logger.error('Error checking ministry status', {
        address,
        error: error instanceof Error ? error.message : error,
      });
      return this.fallbackMinistryCheck(address);
    }
  }

  /**
   * Fallback ministry check using configuration only
   */
  private fallbackMinistryCheck(address: string): boolean {
    const ministryAddress = contractLoader.getMinistryAddress();
    const isMinistry = address.toLowerCase() === ministryAddress.toLowerCase();

    if (isMinistry) {
      logger.warn('⚠️ Using fallback ministry check (blockchain query failed)');
    }

    return isMinistry;
  }

  /**
   * Get institution details by address from blockchain
   */
  async getInstitution(address: string): Promise<InstitutionData | null> {
    if (!this.isReady || !this.publicClient) {
      logger.warn('Admin service not ready - cannot fetch institution');
      return null;
    }

    try {
      const normalizedAddress = validateAndNormalizeAddress(address);

      const institution = await this.publicClient.readContract({
        address: this.governanceConfig.address as Address,
        abi: this.governanceConfig.abi as Abi,
        functionName: 'getInstitution',
        args: [normalizedAddress],
      });

      if (!institution || (institution as any).role === 0) {
        // Role.NONE - institution not found
        return null;
      }

      const inst = institution as any;
      return {
        address: normalizedAddress,
        name: inst.name,
        description: inst.description,
        website: inst.website,
        isActive: inst.isActive,
        registeredAt: Number(inst.registeredAt),
        role: inst.role === 2 ? 'SUPER_ADMIN' : 'ISSUER',
      };
    } catch (error) {
      logger.error('Error fetching institution', { address, error });
      return null;
    }
  }

  /**
   * Get all registered institutions from blockchain
   */
  async getInstitutions(): Promise<InstitutionData[]> {
    if (!this.isReady || !this.publicClient) {
      logger.warn(
        'Admin service not ready - returning empty institutions list',
      );
      return [];
    }

    try {
      // For demo purposes, return the ministry as the only institution
      const ministryAddress = contractLoader.getMinistryAddress();
      const ministryInstitution = await this.getInstitution(ministryAddress);

      if (ministryInstitution) {
        return [ministryInstitution];
      }

      return [];
    } catch (error) {
      logger.error('Error fetching institutions', error);
      return [];
    }
  }

  /**
   * Check if an address is authorized to issue certificates
   */
  async isIssuerAuthorized(address: string): Promise<boolean> {
    if (!this.isReady || !this.publicClient) {
      logger.warn(
        'Admin service not ready - cannot check issuer authorization',
      );
      return false;
    }

    try {
      const normalizedAddress = validateAndNormalizeAddress(address);

      const result = await this.publicClient.readContract({
        address: this.governanceConfig.address as Address,
        abi: this.governanceConfig.abi as Abi,
        functionName: 'canIssueCertificates',
        args: [normalizedAddress],
      });

      return result as boolean;
    } catch (error) {
      logger.error('Error checking issuer authorization', { address, error });
      return false;
    }
  }

  // ==================== STATUS AND INFORMATION ====================

  /**
   * Get admin service status
   */
  getStatus(): AdminServiceStatus {
    return {
      initialized: this.isInitialized,
      ready: this.isReady,
      readOnly: true, // Always true in this architecture
      network: this.network,
      ministryAddress: contractLoader.getMinistryAddress(),
    };
  }

  /**
   * Get ministry address
   */
  getMinistryAddress(): string {
    return contractLoader.getMinistryAddress();
  }

  /**
   * Check if service is ready for read operations
   */
  isServiceReady(): boolean {
    return this.isReady;
  }

  /**
   * Get detailed service information for debugging
   */
  getServiceInfo(): ServiceInfo {
    return {
      chain: this.chain
        ? {
            id: this.chain.id,
            name: this.chain.name,
          }
        : null,
      account: null, // No account in read-only mode
      clients: {
        public: !!this.publicClient,
        wallet: false, // No wallet client in read-only mode
      },
    };
  }
}

// ==================== SINGLETON EXPORT ====================

/**
 * Export singleton instance for use throughout the application
 */
export const adminService = new AdminService();
