// backend/src/utils/contractLoader.ts

/**
 * Contract Configuration Loader
 * Loads and manages contract configurations from multiple JSON files
 * Supports elegant multi-file structure with proper TypeScript interfaces
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ==================== TYPE DEFINITIONS ====================

/**
 * Network configuration interface
 * Contains blockchain network information
 */
export interface NetworkConfig {
  network: string;
  chainId: number;
  deployedAt: string;
  version: string;
  description?: string;
  ministryOfEducation?: string; // Ministry of Education address (SUPER_ADMIN)
}

/**
 * Base contract configuration interface
 * Common properties for all contracts
 */
export interface ContractConfig {
  address: string;
  abi: any[];
  contractName: string;
  network: string;
  chainId: number;
  deployedAt: string;
  description?: string;
}

/**
 * Governance contract specific configuration
 * Role-based access control system
 */
export interface GovernanceConfig extends ContractConfig {
  superAdmin?: string; // Ministry of Education address as SUPER_ADMIN
}

/**
 * ScholaChain main contract configuration
 * Certificate issuance and verification system
 */
export interface ScholaChainConfig extends ContractConfig {
  governanceAddress: string; // Reference to the governance contract
}

// ==================== CONTRACT LOADER CLASS ====================

/**
 * Main contract loader class
 * Handles loading and accessing all contract configurations
 */
export class ContractLoader {
  private networkConfig: NetworkConfig;
  private governanceConfig: GovernanceConfig;
  private scholachainConfig: ScholaChainConfig;

  /**
   * Constructor - Loads all contract configurations on initialization
   * @throws Error if contract configurations are not found
   */
  constructor() {
    try {
      const backendDir = resolve(process.cwd(), 'contract');
      console.log('📁 Loading contract configurations from:', backendDir);

      // Load network configuration
      const networkData = readFileSync(
        resolve(backendDir, 'network.json'),
        'utf-8',
      );
      this.networkConfig = JSON.parse(networkData);
      console.log('✅ Network configuration loaded');

      // Load Governance contract configuration
      const governanceData = readFileSync(
        resolve(backendDir, 'ScholaChainGovernance.json'),
        'utf-8',
      );
      this.governanceConfig = JSON.parse(governanceData);
      console.log('✅ Governance contract configuration loaded');

      // Load ScholaChain contract configuration
      const scholachainData = readFileSync(
        resolve(backendDir, 'ScholaChain.json'),
        'utf-8',
      );
      this.scholachainConfig = JSON.parse(scholachainData);
      console.log('✅ ScholaChain contract configuration loaded');

      console.log('🎉 All contract configurations loaded successfully');
      console.log(
        `   🌐 Network: ${this.networkConfig.network} (Chain ID: ${this.networkConfig.chainId})`,
      );
      console.log(
        `   🏛️  Ministry: ${this.getMinistryAddress()} (SUPER_ADMIN)`,
      );
      console.log(`   🏛️  Governance: ${this.governanceConfig.address}`);
      console.log(`   📜 ScholaChain:  ${this.scholachainConfig.address}`);

      // Validate configuration consistency
      this.validateConfigurations();
    } catch (error) {
      console.error('❌ Failed to load contract configuration:', error);
      throw new Error(
        'Contract configuration not found. Please deploy contracts first with: npm run deploy:local',
      );
    }
  }

  // ==================== NETWORK CONFIGURATION GETTERS ====================

  /**
   * Get complete network configuration
   * @returns Complete network configuration object
   */
  getNetworkConfig(): NetworkConfig {
    return this.networkConfig;
  }

  /**
   * Get basic network information
   * @returns Object containing network name and chain ID
   */
  getNetworkInfo(): { network: string; chainId: number } {
    return {
      network: this.networkConfig.network,
      chainId: this.networkConfig.chainId,
    };
  }

  /**
   * Get network name
   * @returns Network name (localhost, sepolia, etc.)
   */
  getNetwork(): string {
    return this.networkConfig.network;
  }

  /**
   * Get chain ID
   * @returns Blockchain chain ID
   */
  getChainId(): number {
    return this.networkConfig.chainId;
  }

  /**
   * Get deployment timestamp
   * @returns ISO string of when contracts were deployed
   */
  getDeployedAt(): string {
    return this.networkConfig.deployedAt;
  }

  // ==================== MINISTRY OF EDUCATION GETTERS ====================

  /**
   * Get Ministry of Education address (SUPER_ADMIN)
   * @returns Ethereum address of the Ministry of Education
   */
  getMinistryAddress(): string {
    // Priority: governance superAdmin -> network ministryOfEducation -> fallback
    return (
      this.governanceConfig.superAdmin ||
      this.networkConfig.ministryOfEducation ||
      '0x0000000000000000000000000000000000000000'
    );
  }

  /**
   * Check if an address is the Ministry of Education (SUPER_ADMIN)
   * @param address Ethereum address to check
   * @returns True if address is the Ministry
   */
  isMinistryAddress(address: string): boolean {
    const ministryAddress = this.getMinistryAddress();
    if (ministryAddress === '0x0000000000000000000000000000000000000000') {
      console.warn('⚠️ Ministry address not configured');
      return false;
    }
    return address.toLowerCase() === ministryAddress.toLowerCase();
  }

  // ==================== GOVERNANCE CONTRACT GETTERS ====================

  /**
   * Get complete governance contract configuration
   * @returns Complete governance configuration object
   */
  getGovernanceConfig(): GovernanceConfig {
    return this.governanceConfig;
  }

  /**
   * Get governance contract address
   * @returns Governance contract Ethereum address
   */
  getGovernanceAddress(): string {
    return this.governanceConfig.address;
  }

  /**
   * Get governance contract ABI
   * @returns Governance contract ABI array
   */
  getGovernanceABI(): any[] {
    return this.governanceConfig.abi;
  }

  /**
   * Get governance contract name
   * @returns Governance contract name
   */
  getGovernanceContractName(): string {
    return this.governanceConfig.contractName;
  }

  // ==================== SCHOLACHAIN CONTRACT GETTERS ====================

  /**
   * Get complete ScholaChain contract configuration
   * @returns Complete ScholaChain configuration object
   */
  getScholaChainConfig(): ScholaChainConfig {
    return this.scholachainConfig;
  }

  /**
   * Get ScholaChain contract address
   * @returns ScholaChain contract Ethereum address
   */
  getScholaChainAddress(): string {
    return this.scholachainConfig.address;
  }

  /**
   * Get ScholaChain contract ABI
   * @returns ScholaChain contract ABI array
   */
  getScholaChainABI(): any[] {
    return this.scholachainConfig.abi;
  }

  /**
   * Get ScholaChain contract name
   * @returns ScholaChain contract name
   */
  getScholaChainContractName(): string {
    return this.scholachainConfig.contractName;
  }

  /**
   * Get governance address from ScholaChain config
   * @returns Governance contract address referenced by ScholaChain
   */
  getGovernanceAddressFromScholaChain(): string {
    return this.scholachainConfig.governanceAddress;
  }

  // ==================== VALIDATION METHODS ====================

  /**
   * Validate that all configurations are consistent
   * @returns True if all configurations are consistent
   */
  validateConfigurations(): boolean {
    console.log('🔍 Validating contract configurations...');

    // Check governance address consistency
    const governanceFromScholaChain = this.scholachainConfig.governanceAddress;
    const governanceDirect = this.governanceConfig.address;

    if (governanceFromScholaChain !== governanceDirect) {
      console.error(
        '❌ Configuration inconsistency: Governance address mismatch',
      );
      console.error(`   From ScholaChain: ${governanceFromScholaChain}`);
      console.error(`   Direct: ${governanceDirect}`);
      return false;
    }

    // Check chain ID consistency
    if (
      this.networkConfig.chainId !== this.governanceConfig.chainId ||
      this.networkConfig.chainId !== this.scholachainConfig.chainId
    ) {
      console.error('❌ Configuration inconsistency: Chain ID mismatch');
      console.error(`   Network: ${this.networkConfig.chainId}`);
      console.error(`   Governance: ${this.governanceConfig.chainId}`);
      console.error(`   ScholaChain: ${this.scholachainConfig.chainId}`);
      return false;
    }

    // Check network consistency
    if (
      this.networkConfig.network !== this.governanceConfig.network ||
      this.networkConfig.network !== this.scholachainConfig.network
    ) {
      console.error('❌ Configuration inconsistency: Network mismatch');
      console.error(`   Network: ${this.networkConfig.network}`);
      console.error(`   Governance: ${this.governanceConfig.network}`);
      console.error(`   ScholaChain: ${this.scholachainConfig.network}`);
      return false;
    }

    // Validate Ministry address format if present
    const ministryAddress = this.getMinistryAddress();
    if (ministryAddress !== '0x0000000000000000000000000000000000000000') {
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!ethAddressRegex.test(ministryAddress)) {
        console.error(
          '❌ Configuration error: Invalid Ministry address format',
        );
        return false;
      }
    }

    console.log('✅ All contract configurations are consistent and valid');
    return true;
  }

  /**
   * Check if all required configurations are loaded
   * @returns True if all configurations are present
   */
  isFullyLoaded(): boolean {
    return (
      !!this.networkConfig &&
      !!this.governanceConfig &&
      !!this.scholachainConfig &&
      !!this.governanceConfig.address &&
      !!this.scholachainConfig.address
    );
  }

  // ==================== LEGACY COMPATIBILITY ====================

  /**
   * Get legacy single-file configuration for backward compatibility
   * @deprecated Use individual getters instead for better maintainability
   * @returns Legacy single-file configuration object
   */
  getLegacyContractConfig(): any {
    console.warn(
      '⚠️ Using legacy contract configuration format. Migrate to individual getters.',
    );

    return {
      network: this.networkConfig.network,
      chainId: this.networkConfig.chainId,
      deployedAt: this.networkConfig.deployedAt,
      contracts: {
        governance: {
          address: this.governanceConfig.address,
          abi: this.governanceConfig.abi,
          contractName: this.governanceConfig.contractName,
        },
        scholachain: {
          address: this.scholachainConfig.address,
          abi: this.scholachainConfig.abi,
          contractName: this.scholachainConfig.contractName,
        },
      },
      version: this.networkConfig.version,
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get summary of all loaded configurations
   * @returns Object containing summary information
   */
  getSummary(): {
    network: string;
    chainId: number;
    ministryAddress: string;
    governanceAddress: string;
    scholachainAddress: string;
    fullyLoaded: boolean;
    valid: boolean;
  } {
    return {
      network: this.getNetwork(),
      chainId: this.getChainId(),
      ministryAddress: this.getMinistryAddress(),
      governanceAddress: this.getGovernanceAddress(),
      scholachainAddress: this.getScholaChainAddress(),
      fullyLoaded: this.isFullyLoaded(),
      valid: this.validateConfigurations(),
    };
  }

  /**
   * Print configuration summary to console
   */
  printSummary(): void {
    const summary = this.getSummary();

    console.log('\n📋 Contract Configuration Summary');
    console.log('='.repeat(40));
    console.log(
      `🌐 Network: ${summary.network} (Chain ID: ${summary.chainId})`,
    );
    console.log(`🏛️  Ministry: ${summary.ministryAddress}`);
    console.log(`🛡️  Governance: ${summary.governanceAddress}`);
    console.log(`📜 ScholaChain: ${summary.scholachainAddress}`);
    console.log(`✅ Fully Loaded: ${summary.fullyLoaded ? 'Yes' : 'No'}`);
    console.log(`🔍 Valid: ${summary.valid ? 'Yes' : 'No'}`);
    console.log('='.repeat(40));
  }
}

// Export singleton instance for use throughout the application
export const contractLoader = new ContractLoader();
