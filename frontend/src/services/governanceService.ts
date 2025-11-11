// frontend/src/services/governanceService.ts

/**
 * Governance Service for ScholaChain Frontend
 * Handles institution registration and role management on blockchain
 * Uses dependency injection for React compatibility and testability
 */

// ==================== TYPE DEFINITIONS ====================

/**
 * Data required for registering a new institution
 */
export interface InstitutionRegistrationData {
  address: string;
  name: string;
  description: string;
  website: string;
  role: 'ISSUER' | 'SUPER_ADMIN';
}

/**
 * Institution data structure from blockchain
 */
export interface InstitutionData {
  address: string;
  name: string;
  description: string;
  website: string;
  isActive: boolean;
  registeredAt: number;
  role: string;
}

/**
 * Transaction result from blockchain operations
 */
export interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Dependencies required by GovernanceService
 * Injected via constructor for better testability and React compatibility
 */
export interface GovernanceServiceDependencies {
  account: string | null;
  signer: any;
  contractConfigs: any;
}

/**
 * Revocation capabilities
 */

export interface RevocationData {
  institutionAddress: string;
  reason: string;
}

// ==================== GOVERNANCE SERVICE CLASS ====================

/**
 * GovernanceService - Handles ALL governance-related blockchain operations
 * Single Responsibility: Manage institution registration and governance functions
 * Refactored to accept dependencies via constructor for proper React integration
 */
export class GovernanceService {
  private dependencies: GovernanceServiceDependencies;

  /**
   * Constructor - Accepts dependencies as parameters
   * @param dependencies - Web3 dependencies required for blockchain operations
   */
  constructor(dependencies: GovernanceServiceDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Check if current user is Ministry of Education (SUPER_ADMIN)
   * Uses case-insensitive address comparison and blockchain verification
   * @returns boolean indicating if user is Ministry of Education
   */
  async isMinistryOfEducation(): Promise<boolean> {
    try {
      const { account, contractConfigs, signer } = this.dependencies;

      // Check if we have required dependencies
      if (!account || !contractConfigs.governance || !signer) {
        console.error(
          '❌ GovernanceService: Missing required dependencies for ministry check:',
          {
            hasAccount: !!account,
            hasGovernanceConfig: !!contractConfigs.governance,
            hasSigner: !!signer,
          },
        );
        return false;
      }

      console.log('🔍 Checking Ministry of Education status...');
      console.log('   Current account:', account);
      console.log(
        '   Governance contract:',
        contractConfigs.governance.address,
      );

      const { Contract } = await import('ethers');
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer,
      );

      // METHOD 1: Quick check against configured ministry address (case-insensitive)
      const ministryAddress = contractConfigs.network?.ministryOfEducation;
      if (ministryAddress) {
        const isConfiguredMinistry =
          account.toLowerCase() === ministryAddress.toLowerCase();
        console.log('   Configured ministry check:', {
          configuredMinistry: ministryAddress,
          isConfiguredMinistry,
          accountMatches: isConfiguredMinistry,
        });

        if (isConfiguredMinistry) {
          console.log(
            '✅ User is Ministry of Education (configured address match)',
          );
          return true;
        }
      }

      // METHOD 2: Verify on blockchain using contract methods
      console.log('   Performing blockchain verification...');

      try {
        // Check superAdmin address from contract - this is the most reliable method
        console.log('   Calling superAdmin() on contract...');
        const superAdminAddress = await governanceContract.superAdmin();
        console.log('   Contract superAdmin:', superAdminAddress);

        const isContractSuperAdmin =
          account.toLowerCase() === superAdminAddress.toLowerCase();
        console.log('   Contract superAdmin check:', isContractSuperAdmin);

        if (isContractSuperAdmin) {
          console.log(
            '✅ User is Ministry of Education (contract superAdmin match)',
          );
          return true;
        } else {
          console.log('❌ Contract superAdmin does not match user account');
          console.log('   Expected:', superAdminAddress);
          console.log('   Actual:', account);
        }
      } catch (superAdminError: any) {
        console.warn(
          '⚠️ Could not fetch superAdmin from contract:',
          superAdminError.message,
        );
      }

      // METHOD 3: Use isSuperAdmin view function
      try {
        console.log('   Calling isSuperAdmin() on contract...');
        const isSuperAdmin = await governanceContract.isSuperAdmin(account);
        console.log('   isSuperAdmin contract call result:', isSuperAdmin);

        if (isSuperAdmin) {
          console.log('✅ User is Ministry of Education (isSuperAdmin check)');
          return true;
        } else {
          console.log('❌ isSuperAdmin returned false for user account');
        }
      } catch (isSuperAdminError: any) {
        console.warn(
          '⚠️ Could not call isSuperAdmin:',
          isSuperAdminError.message,
        );
      }

      console.log(
        '❌ User is NOT Ministry of Education - all verification methods failed',
      );
      return false;
    } catch (error: any) {
      console.error('❌ Error checking ministry status:', error);
      return false;
    }
  }

  /**
   * Register a new institution on blockchain via MetaMask transaction
   * Sends actual transaction that requires user confirmation in MetaMask
   * @param institutionData - Institution registration data
   * @returns TransactionResult with success status and transaction hash
   */
  async registerInstitution(
    institutionData: InstitutionRegistrationData,
  ): Promise<TransactionResult> {
    try {
      const { contractConfigs, signer, account } = this.dependencies;

      // Validate dependencies
      if (!signer || !contractConfigs.governance) {
        throw new Error('Wallet not connected. Please connect MetaMask first.');
      }

      if (!account) {
        throw new Error('No account connected. Please connect your wallet.');
      }

      console.log(
        '📝 Preparing to register institution on blockchain:',
        institutionData,
      );
      console.log('   Using account:', account);
      console.log(
        '   Governance contract:',
        contractConfigs.governance.address,
      );

      const { Contract } = await import('ethers');

      // Create contract instance with signer (this enables transactions)
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer, // Using signer instead of provider for write operations
      );

      // Convert role to number (1 for ISSUER, 2 for SUPER_ADMIN)
      const roleValue: number = institutionData.role === 'SUPER_ADMIN' ? 2 : 1;

      console.log('🔄 Sending transaction to register institution...');
      console.log('   Institution address:', institutionData.address);
      console.log('   Name:', institutionData.name);
      console.log('   Role:', institutionData.role, `(value: ${roleValue})`);

      // Send transaction via MetaMask - this will trigger MetaMask popup
      const transaction = await governanceContract.registerInstitution(
        institutionData.address,
        institutionData.name,
        institutionData.description,
        institutionData.website,
        roleValue,
      );

      console.log('⏳ Transaction sent, waiting for confirmation...');
      console.log('   Transaction hash:', transaction.hash);

      // Wait for transaction confirmation (this can take some time)
      const receipt = await transaction.wait();

      // Check if transaction was successful
      if (receipt.status === 1) {
        console.log('✅ Transaction confirmed successfully!');
        console.log('   Block number:', receipt.blockNumber);
        console.log('   Gas used:', receipt.gasUsed.toString());

        return {
          success: true,
          transactionHash: receipt.hash,
        };
      } else {
        throw new Error('Transaction failed on blockchain');
      }
    } catch (error: any) {
      console.error('❌ Institution registration failed:', error);

      // Handle specific error cases
      let errorMessage = 'Transaction failed';

      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user in MetaMask';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for transaction';
      } else if (error.info?.error?.message) {
        errorMessage = error.info.error.message;
      } else if (error.reason) {
        errorMessage = `Contract error: ${error.reason}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('   Error details:', errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get institution details from blockchain
   * @param address - Ethereum address of the institution
   * @returns InstitutionData or null if not found
   */
  async getInstitution(address: string): Promise<InstitutionData | null> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      // Validate dependencies
      if (!signer || !contractConfigs.governance) {
        console.warn(
          '❌ GovernanceService: Missing dependencies for getInstitution',
        );
        return null;
      }

      console.log(`🔍 Fetching institution details for: ${address}`);

      const { Contract } = await import('ethers');
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer,
      );

      const institution = await governanceContract.getInstitution(address);

      // Check if institution exists (role is not NONE = 0)
      if (!institution || institution.role === 0) {
        console.log(`❌ Institution not found for address: ${address}`);
        return null;
      }

      // DEBUG: Log the raw role value from blockchain
      console.log(
        `🔍 Raw role value from blockchain: ${
          institution.role
        } (type: ${typeof institution.role})`,
      );

      // Transform blockchain result to InstitutionData interface
      // CORRECTION: Convert BigInt to number properly and handle role conversion
      const roleValue = Number(institution.role);
      const institutionData: InstitutionData = {
        address: address,
        name: institution.name,
        description: institution.description,
        website: institution.website,
        isActive: institution.isActive,
        registeredAt: Number(institution.registeredAt),
        role: roleValue === 2 ? 'SUPER_ADMIN' : 'ISSUER', // 2 = SUPER_ADMIN, 1 = ISSUER
      };

      console.log(
        `✅ Institution loaded: ${institutionData.name}, Role: ${institutionData.role} (raw: ${roleValue})`,
      );
      return institutionData;
    } catch (error) {
      console.error(
        `❌ Error fetching institution for address ${address}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Get all registered institutions from blockchain by querying events
   * This is the REAL implementation that reads from blockchain events
   * @returns Array of InstitutionData
   */
  async getInstitutions(): Promise<InstitutionData[]> {
    try {
      const { contractConfigs, signer } = this.dependencies;
      const institutionsList: InstitutionData[] = [];

      // Validate dependencies
      if (!signer || !contractConfigs.governance) {
        console.warn(
          '❌ GovernanceService: Missing dependencies for getInstitutions',
        );
        return [];
      }

      console.log('🔍 Fetching ALL institutions from blockchain events...');

      const { Contract } = await import('ethers');
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer,
      );

      // METHOD 1: Get InstitutionRegistered events to find all registered institutions
      try {
        console.log('📊 Querying InstitutionRegistered events...');

        // Get events from the beginning of the blockchain
        const events = await governanceContract.queryFilter(
          governanceContract.filters.InstitutionRegistered(),
          0, // fromBlock - start from block 0
          'latest', // toBlock - up to latest block
        );

        console.log(`📋 Found ${events.length} InstitutionRegistered events`);

        // Extract institution addresses from events with proper type checking
        const institutionAddresses: string[] = [];

        for (const event of events) {
          // Type guard for EventLog (which has args)
          if ('args' in event && event.args) {
            // The event args structure: InstitutionRegistered(address indexed institutionAddress, string name, Role role)
            const institutionAddress = event.args[0]; // First argument is institutionAddress
            if (institutionAddress && typeof institutionAddress === 'string') {
              // Avoid duplicates
              if (!institutionAddresses.includes(institutionAddress)) {
                institutionAddresses.push(institutionAddress);
              }
            }
          }
        }

        console.log(
          `📍 Unique institution addresses from events:`,
          institutionAddresses,
        );

        // Fetch details for each institution
        for (const address of institutionAddresses) {
          try {
            const institution = await this.getInstitution(address);
            if (institution) {
              institutionsList.push(institution);
              console.log(
                `✅ Added institution from events: ${institution.name}`,
              );
            }
          } catch (error) {
            console.error(
              `❌ Error fetching institution ${address} from events:`,
              error,
            );
          }
        }
      } catch (eventsError) {
        console.error(
          '❌ Error querying InstitutionRegistered events:',
          eventsError,
        );

        // FALLBACK METHOD: Try to get total institutions and fetch individually
        try {
          console.log('🔄 Falling back to totalInstitutions method...');
          const totalInstitutions =
            await governanceContract.totalInstitutions();
          const totalCount = Number(totalInstitutions);

          console.log(`📊 Total institutions from contract: ${totalCount}`);

          // Try to fetch institutions by known addresses
          // This is a simplified approach - in production you'd need a mapping
          if (totalCount > institutionsList.length) {
            console.warn(
              `⚠️ Contract reports ${totalCount} institutions but we only found ${institutionsList.length}`,
            );
          }
        } catch (countError) {
          console.warn(
            '⚠️ Could not fetch total institutions count:',
            countError,
          );
        }
      }

      // METHOD 2: Always ensure Ministry is included
      if (contractConfigs.network?.ministryOfEducation) {
        const ministryAddress = contractConfigs.network.ministryOfEducation;
        const ministryExists = institutionsList.some(
          (inst) =>
            inst.address.toLowerCase() === ministryAddress.toLowerCase(),
        );

        if (!ministryExists) {
          console.log('👑 Adding Ministry institution...');
          const ministryInstitution = await this.getInstitution(
            ministryAddress,
          );
          if (ministryInstitution) {
            institutionsList.push(ministryInstitution);
          } else {
            // Fallback Ministry data
            const fallbackMinistry: InstitutionData = {
              address: ministryAddress,
              name: 'Ministry of Education',
              description: 'Governing body for educational certification',
              website: 'https://education.gov',
              isActive: true,
              registeredAt: Date.now(),
              role: 'SUPER_ADMIN',
            };
            institutionsList.push(fallbackMinistry);
          }
        }
      }

      console.log(
        `🎯 Final institutions list: ${institutionsList.length} institutions`,
      );

      // Log each institution for debugging
      institutionsList.forEach((inst, index) => {
        console.log(
          `   ${index + 1}. ${inst.name} - ${inst.role} - ${inst.address.slice(
            0,
            10,
          )}...`,
        );
      });

      return institutionsList;
    } catch (error) {
      console.error('❌ Error fetching institutions from blockchain:', error);
      return [];
    }
  }

  /**
   * Check if an address is authorized to issue certificates
   * @param address - Ethereum address to check
   * @returns boolean indicating if address can issue certificates
   */
  async isIssuerAuthorized(address: string): Promise<boolean> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      // Validate dependencies
      if (!signer || !contractConfigs.governance) {
        console.warn(
          '❌ GovernanceService: Missing dependencies for isIssuerAuthorized',
        );
        return false;
      }

      console.log(`🔍 Checking issuer authorization for: ${address}`);

      const { Contract } = await import('ethers');
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer,
      );

      const result = await governanceContract.canIssueCertificates(address);

      console.log(`✅ Issuer ${address} authorized: ${result}`);
      return result;
    } catch (error) {
      console.error(
        `❌ Error checking issuer authorization for ${address}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Validate Ethereum address format
   * @param address - Ethereum address to validate
   * @returns boolean indicating if address is valid
   */
  isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  async revokeInstitution(
    revocationData: RevocationData,
  ): Promise<TransactionResult> {
    try {
      const { contractConfigs, signer, account } = this.dependencies;

      // Validate dependencies
      if (!signer || !contractConfigs.governance) {
        throw new Error('Wallet not connected. Please connect MetaMask first.');
      }

      if (!account) {
        throw new Error('No account connected. Please connect your wallet.');
      }

      console.log('📝 Preparing to revoke institution:', revocationData);

      const { Contract } = await import('ethers');
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer,
      );

      console.log('🔄 Sending revocation transaction...');

      // CORRECTION : Utiliser setInstitutionStatus au lieu de revokeInstitution
      // car nous n'avons pas encore implémenté revokeInstitution dans le smart contract
      const transaction = await governanceContract.setInstitutionStatus(
        revocationData.institutionAddress,
        false, // Set to inactive
      );

      console.log('⏳ Transaction sent, waiting for confirmation...');
      const receipt = await transaction.wait();

      if (receipt.status === 1) {
        console.log('✅ Institution revoked successfully!');
        return {
          success: true,
          transactionHash: receipt.hash,
        };
      } else {
        throw new Error('Revocation transaction failed on blockchain');
      }
    } catch (error: any) {
      console.error('❌ Institution revocation failed:', error);

      let errorMessage = 'Revocation failed';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user in MetaMask';
      } else if (error.reason) {
        errorMessage = `Contract error: ${error.reason}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Reactivate a previously revoked institution
   * @param institutionAddress - Address of the institution to reactivate
   * @returns TransactionResult indicating success/failure
   */
  async reactivateInstitution(
    institutionAddress: string,
  ): Promise<TransactionResult> {
    try {
      const { contractConfigs, signer, account } = this.dependencies;

      // Validate dependencies
      if (!signer || !contractConfigs.governance) {
        throw new Error('Wallet not connected. Please connect MetaMask first.');
      }

      if (!account) {
        throw new Error('No account connected. Please connect your wallet.');
      }

      console.log(
        '📝 Preparing to reactivate institution:',
        institutionAddress,
      );

      const { Contract } = await import('ethers');
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer,
      );

      console.log('🔄 Sending reactivation transaction...');
      const transaction = await governanceContract.reactivateInstitution(
        institutionAddress,
      );

      console.log('⏳ Transaction sent, waiting for confirmation...');
      const receipt = await transaction.wait();

      if (receipt.status === 1) {
        console.log('✅ Institution reactivated successfully!');
        return {
          success: true,
          transactionHash: receipt.hash,
        };
      } else {
        throw new Error('Reactivation transaction failed on blockchain');
      }
    } catch (error: any) {
      console.error('❌ Institution reactivation failed:', error);

      let errorMessage = 'Reactivation failed';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user in MetaMask';
      } else if (error.reason) {
        errorMessage = `Contract error: ${error.reason}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if an institution is revoked
   * @param institutionAddress - Address of the institution to check
   * @returns boolean indicating if institution is revoked
   */
  async isInstitutionRevoked(institutionAddress: string): Promise<boolean> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.governance) {
        console.warn('❌ Missing dependencies for isInstitutionRevoked');
        return false;
      }

      const { Contract } = await import('ethers');
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer,
      );

      const isRevoked = await governanceContract.isInstitutionRevoked(
        institutionAddress,
      );
      return isRevoked;
    } catch (error) {
      console.error('❌ Error checking institution revocation status:', error);
      return false;
    }
  }
}
