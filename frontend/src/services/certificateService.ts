// frontend/src/services/certificateService.ts

/**
 * Enhanced Certificate Service for ScholaChain Frontend
 * Complete implementation with transaction hash tracking for direct Etherscan linking
 * Fixed TypeScript issues with proper event log type handling
 */

// ==================== TYPE DEFINITIONS ====================

export interface Certificate {
  id: number;
  documentHash: string;
  ipfsCID: string;
  issuer: string;
  holder: string;
  issuedAt: Date;
  revoked: boolean;
  certificateType?: string;
}

export interface IssueCertificateData {
  documentHash: string;
  ipfsCID: string;
  holderAddress: string;
  certificateType?: string;
}

export interface CertificateIssuanceResult {
  success: boolean;
  certificateId?: number;
  transactionHash?: string;
  error?: string;
  documentHash?: string;
  ipfsCID?: string;
  gasUsed?: string;
  blockNumber?: number;
}

export interface CertificateServiceDependencies {
  account: string | null;
  signer: any;
  contractConfigs: any;
}

// Type guard for parsed event logs
interface ParsedEventLog {
  name: string;
  args: any;
}

function isParsedEventLog(log: any): log is ParsedEventLog {
  return log && typeof log === 'object' && 'name' in log && 'args' in log;
}

// ==================== CERTIFICATE SERVICE CLASS ====================

/**
 * Complete Certificate Service with enhanced transaction tracking
 * Provides comprehensive certificate management with blockchain transaction support
 * Fixed TypeScript event parsing with proper type guards
 */
export class CertificateService {
  private dependencies: CertificateServiceDependencies;

  constructor(dependencies: CertificateServiceDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Issue a new certificate on blockchain with complete transaction tracking
   * Enhanced to properly capture transaction hash for direct Etherscan linking
   * Fixed event parsing with TypeScript type guards
   */
  async issueCertificateReal(
    certificateData: IssueCertificateData,
  ): Promise<CertificateIssuanceResult> {
    try {
      const { contractConfigs, signer, account } = this.dependencies;

      // Validate all required dependencies are available
      if (
        !signer ||
        !contractConfigs.scholachain ||
        !contractConfigs.governance
      ) {
        throw new Error(
          'Wallet not connected or contract configurations missing.',
        );
      }

      if (!account) {
        throw new Error('No account connected. Please connect your wallet.');
      }

      console.log('🎯 Executing certificate issuance transaction:', {
        ...certificateData,
        ipfsCID: certificateData.ipfsCID.startsWith('pending_')
          ? 'Temporary CID'
          : 'Real CID',
      });

      const { Contract } = await import('ethers');

      // Step 1: Verify issuer authorization through governance contract
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer,
      );

      const isAuthorized = await governanceContract.canIssueCertificates(
        account,
      );
      console.log(`✅ Issuer authorization checked: ${isAuthorized}`);

      if (!isAuthorized) {
        throw new Error(
          `Your account is not authorized to issue certificates.`,
        );
      }

      // Step 2: Execute certificate issuance on main contract
      const scholachainContract = new Contract(
        contractConfigs.scholachain.address,
        contractConfigs.scholachain.abi,
        signer,
      );

      // Get current certificate count for ID prediction
      const currentCount = await this.getCertificateCount();
      const predictedCertificateId = currentCount;

      console.log('🔄 Sending blockchain transaction...');
      const transaction = await scholachainContract.issueCertificate(
        certificateData.documentHash,
        certificateData.ipfsCID,
        certificateData.holderAddress,
        certificateData.certificateType || '',
      );

      console.log('⏳ Transaction sent, waiting for confirmation...');
      console.log('📋 Transaction hash:', transaction.hash);

      // Wait for transaction confirmation
      const receipt = await transaction.wait();

      if (receipt.status === 1) {
        console.log('✅ Certificate issued successfully on blockchain!');

        // CRITICAL: Extract certificate ID from emitted events with proper TypeScript handling
        let actualCertificateId = predictedCertificateId;

        try {
          const eventInterface = scholachainContract.interface;

          // Parse transaction logs to find CertificateIssued event
          for (const log of receipt.logs) {
            try {
              const parsedLog = eventInterface.parseLog(log);

              // Use type guard to safely check the parsed log
              if (
                isParsedEventLog(parsedLog) &&
                parsedLog.name === 'CertificateIssued'
              ) {
                actualCertificateId = Number(parsedLog.args.certificateId);
                console.log(
                  `🎯 Certificate ID from blockchain event: ${actualCertificateId}`,
                );

                // Log complete event details for verification
                console.log('📋 Complete event details:', {
                  certificateId: actualCertificateId,
                  issuer: parsedLog.args.issuer,
                  holder: parsedLog.args.holder,
                  documentHash: parsedLog.args.documentHash,
                  transactionHash: receipt.hash,
                });
                break;
              }
            } catch (e) {
              // This log doesn't belong to our contract, continue searching
              continue;
            }
          }
        } catch (eventError) {
          console.warn(
            '⚠️ Could not parse blockchain events, using predicted ID',
          );
          console.warn('Event parsing error:', eventError);
        }

        // Return complete success result with transaction hash
        return {
          success: true,
          certificateId: actualCertificateId,
          transactionHash: receipt.hash, // CRITICAL: Include transaction hash for Etherscan
          documentHash: certificateData.documentHash,
          ipfsCID: certificateData.ipfsCID,
          gasUsed: receipt.gasUsed.toString(),
          blockNumber: receipt.blockNumber,
        };
      } else {
        throw new Error('Transaction failed on blockchain');
      }
    } catch (error: any) {
      console.error('❌ Certificate issuance failed:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Certificate issuance failed';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user in MetaMask';
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds for gas fees';
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
   * Check if an issuer address is authorized to issue certificates
   */
  async isIssuerAuthorized(issuerAddress: string): Promise<boolean> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.governance) {
        return false;
      }

      const { Contract } = await import('ethers');
      const governanceContract = new Contract(
        contractConfigs.governance.address,
        contractConfigs.governance.abi,
        signer,
      );

      const result = await governanceContract.canIssueCertificates(
        issuerAddress,
      );
      return result;
    } catch (error) {
      console.error(`Error checking issuer authorization:`, error);
      return false;
    }
  }

  /**
   * Get certificate details by ID from blockchain
   */
  async getCertificate(certificateId: number): Promise<Certificate | null> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.scholachain) {
        return null;
      }

      const { Contract } = await import('ethers');
      const scholachainContract = new Contract(
        contractConfigs.scholachain.address,
        contractConfigs.scholachain.abi,
        signer,
      );

      const result = await scholachainContract.getCertificate(
        BigInt(certificateId),
      );

      // Check if certificate exists (holder address not zero)
      if (
        !result ||
        result.holder === '0x0000000000000000000000000000000000000000'
      ) {
        return null;
      }

      const certificate: Certificate = {
        id: certificateId,
        documentHash: result.documentHash,
        ipfsCID: result.ipfsCID,
        issuer: result.issuer,
        holder: result.holder,
        issuedAt: new Date(Number(result.issuedAt) * 1000),
        revoked: result.revoked,
        certificateType: result.certificateType,
      };

      return certificate;
    } catch (error) {
      console.error(`Error fetching certificate #${certificateId}:`, error);
      return null;
    }
  }

  /**
   * Verify certificate authenticity by comparing document hash
   */
  async verifyCertificate(
    certificateId: number,
    documentHash: string,
  ): Promise<boolean> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.scholachain) {
        return false;
      }

      const { Contract } = await import('ethers');
      const scholachainContract = new Contract(
        contractConfigs.scholachain.address,
        contractConfigs.scholachain.abi,
        signer,
      );

      const result = (await scholachainContract.verifyCertificate(
        BigInt(certificateId),
        documentHash,
      )) as [boolean, string, string, boolean];

      const [isValid, issuer, holder, isRevoked] = result;

      console.log(`✅ Verification result for certificate #${certificateId}:`, {
        isValid,
        issuer,
        holder,
        isRevoked,
      });

      return isValid && !isRevoked;
    } catch (error) {
      console.error(`Error verifying certificate:`, error);
      return false;
    }
  }

  /**
   * Get total number of certificates issued on blockchain
   */
  async getCertificateCount(): Promise<number> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.scholachain) {
        return 0;
      }

      const { Contract } = await import('ethers');
      const scholachainContract = new Contract(
        contractConfigs.scholachain.address,
        contractConfigs.scholachain.abi,
        signer,
      );

      // Try getTotalCertificates first (most reliable)
      try {
        const result = await scholachainContract.getTotalCertificates();
        return Number(result);
      } catch (error) {
        // Fallback to totalCertificates
        try {
          const result = await scholachainContract.totalCertificates();
          return Number(result);
        } catch (error2) {
          console.warn('Both certificate count methods failed');
          return 0;
        }
      }
    } catch (error) {
      console.error('Error fetching certificate count:', error);
      return 0;
    }
  }

  /**
   * Get certificates by issuer address from blockchain
   */
  async getCertificatesByIssuer(issuerAddress: string): Promise<Certificate[]> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.scholachain) {
        return [];
      }

      const certificates: Certificate[] = [];
      const totalCertificates = await this.getCertificateCount();

      console.log(
        `🔍 Fetching ${totalCertificates} certificates for issuer: ${issuerAddress}`,
      );

      // Check each certificate
      for (let i = 0; i < totalCertificates; i++) {
        try {
          const certificate = await this.getCertificate(i);
          if (
            certificate &&
            certificate.issuer.toLowerCase() === issuerAddress.toLowerCase()
          ) {
            certificates.push(certificate);
          }
        } catch (error) {
          console.warn(`⚠️ Could not fetch certificate #${i}`);
        }
      }

      console.log(
        `🎯 Found ${certificates.length} certificates for issuer ${issuerAddress}`,
      );

      // Sort by issuance date (newest first)
      return certificates.sort(
        (a, b) =>
          new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      );
    } catch (error) {
      console.error(`Error fetching certificates for issuer:`, error);
      return [];
    }
  }

  /**
   * Get all certificates from blockchain
   */
  async getAllCertificates(): Promise<Certificate[]> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.scholachain) {
        return [];
      }

      const certificates: Certificate[] = [];
      const totalCertificates = await this.getCertificateCount();

      for (let i = 0; i < totalCertificates; i++) {
        try {
          const certificate = await this.getCertificate(i);
          if (certificate) {
            certificates.push(certificate);
          }
        } catch (error) {
          // Continue with next certificate
        }
      }

      return certificates.sort(
        (a, b) =>
          new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      );
    } catch (error) {
      console.error('Error fetching all certificates:', error);
      return [];
    }
  }

  /**
   * Revoke a certificate by ID
   * Only the original issuer or super admin can revoke certificates
   */
  async revokeCertificate(
    certificateId: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { contractConfigs, signer, account } = this.dependencies;

      if (!signer || !contractConfigs.scholachain || !account) {
        return { success: false, error: 'Wallet not connected' };
      }

      const { Contract } = await import('ethers');
      const scholachainContract = new Contract(
        contractConfigs.scholachain.address,
        contractConfigs.scholachain.abi,
        signer,
      );

      console.log(`🔄 Revoking certificate #${certificateId}...`);
      const transaction = await scholachainContract.revokeCertificate(
        BigInt(certificateId),
      );

      console.log('⏳ Revocation transaction sent:', transaction.hash);
      const receipt = await transaction.wait();

      if (receipt.status === 1) {
        console.log(`✅ Certificate #${certificateId} revoked successfully`);
        return { success: true };
      } else {
        return { success: false, error: 'Transaction failed on blockchain' };
      }
    } catch (error: any) {
      console.error(`❌ Certificate revocation failed:`, error);

      let errorMessage = 'Revocation failed';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction rejected by user in MetaMask';
      } else if (error.reason) {
        errorMessage = `Contract error: ${error.reason}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Validate Ethereum address format
   */
  isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Check if service is ready for blockchain operations
   */
  isServiceReady(): boolean {
    const { signer, contractConfigs, account } = this.dependencies;
    return !!(
      signer &&
      contractConfigs.scholachain &&
      contractConfigs.governance &&
      account
    );
  }

  /**
   * Get contract address for frontend usage
   */
  getContractAddress(): string {
    return this.dependencies.contractConfigs.scholachain?.address || '';
  }

  /**
   * Get contract ABI for frontend usage
   */
  getContractABI(): any[] {
    return this.dependencies.contractConfigs.scholachain?.abi || [];
  }

  /**
   * Get governance contract address for frontend usage
   */
  getGovernanceAddress(): string {
    return this.dependencies.contractConfigs.governance?.address || '';
  }

  /**
   * Get governance contract ABI for frontend usage
   */
  getGovernanceABI(): any[] {
    return this.dependencies.contractConfigs.governance?.abi || [];
  }

  /**
   * Get network information
   */
  getNetworkInfo(): { network: string; chainId: number } {
    return {
      network: this.dependencies.contractConfigs.network?.network || 'unknown',
      chainId: this.dependencies.contractConfigs.network?.chainId || 0,
    };
  }
}
