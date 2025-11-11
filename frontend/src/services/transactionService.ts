// frontend/src/services/transactionService.ts

/**
 * Transaction Service for ScholaChain Frontend
 * Specialized service for retrieving and managing blockchain transaction data
 * Enables direct Etherscan linking for certificate verification
 */

// ==================== TYPE DEFINITIONS ====================

export interface TransactionServiceDependencies {
  account: string | null;
  signer: any;
  contractConfigs: any;
}

export interface CertificateTransaction {
  certificateId: number;
  transactionHash: string;
  blockNumber: number;
  issuer: string;
  holder: string;
  timestamp: Date;
}

// Import ethers types for proper type safety
import type { EventLog, Log } from 'ethers';

// Type guard to check if a log is an EventLog (has args)
function isEventLog(log: EventLog | Log): log is EventLog {
  return 'args' in log;
}

// ==================== TRANSACTION SERVICE CLASS ====================

/**
 * Transaction Service - Specialized in blockchain transaction retrieval
 * Provides methods to find certificate issuance transactions for direct Etherscan linking
 */
export class TransactionService {
  private dependencies: TransactionServiceDependencies;

  constructor(dependencies: TransactionServiceDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Retrieve the transaction hash for a specific certificate
   * Queries blockchain events to find the exact issuance transaction
   */
  async getCertificateTransactionHash(
    certificateId: number,
  ): Promise<string | null> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      // Validate service dependencies
      if (!signer || !contractConfigs.scholachain) {
        console.error('❌ TransactionService: Missing blockchain dependencies');
        return null;
      }

      console.log(
        `🔍 Searching for transaction of certificate #${certificateId}`,
      );

      const { Contract } = await import('ethers');
      const scholachainContract = new Contract(
        contractConfigs.scholachain.address,
        contractConfigs.scholachain.abi,
        signer,
      );

      // Query CertificateIssued events filtered by certificate ID
      const filter =
        scholachainContract.filters.CertificateIssued(certificateId);
      const events = await scholachainContract.queryFilter(filter, 0, 'latest');

      if (events.length > 0) {
        // Use type-safe event processing
        const event = events[0];
        const transactionHash = event.transactionHash;

        console.log(
          `✅ Found transaction for certificate #${certificateId}: ${transactionHash}`,
        );

        // Log complete event details for verification (with type safety)
        if (isEventLog(event) && event.args) {
          console.log('📋 Transaction event details:', {
            certificateId: Number(event.args.certificateId),
            issuer: event.args.issuer,
            holder: event.args.holder,
            documentHash: event.args.documentHash,
            transactionHash: transactionHash,
            blockNumber: event.blockNumber,
          });
        } else {
          console.log('📋 Transaction log details (no args):', {
            transactionHash: transactionHash,
            blockNumber: event.blockNumber,
            address: event.address,
          });
        }

        return transactionHash;
      }

      console.log(`❌ No transaction found for certificate #${certificateId}`);
      return null;
    } catch (error) {
      console.error(
        `❌ Error fetching transaction for certificate #${certificateId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Retrieve all certificate transactions for a specific issuer
   * Builds a complete map of certificate IDs to their transaction hashes
   */
  async getIssuerCertificatesTransactions(
    issuerAddress: string,
  ): Promise<Map<number, string>> {
    const transactions = new Map<number, string>();

    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.scholachain) {
        return transactions;
      }

      console.log(
        `🔍 Retrieving all transactions for issuer: ${issuerAddress}`,
      );

      const { Contract } = await import('ethers');
      const scholachainContract = new Contract(
        contractConfigs.scholachain.address,
        contractConfigs.scholachain.abi,
        signer,
      );

      // Query all CertificateIssued events for this issuer
      const filter = scholachainContract.filters.CertificateIssued(
        null,
        issuerAddress,
      );
      const events = await scholachainContract.queryFilter(filter, 0, 'latest');

      // Map certificate IDs to their transaction hashes with type safety
      events.forEach((event) => {
        // Use type guard to safely access args
        if (
          isEventLog(event) &&
          event.args &&
          event.args.certificateId !== undefined
        ) {
          const certificateId = Number(event.args.certificateId);
          const transactionHash = event.transactionHash;
          transactions.set(certificateId, transactionHash);

          console.log(
            `📝 Mapped certificate #${certificateId} to transaction: ${transactionHash}`,
          );
        } else {
          console.log(
            '⚠️ Event without certificateId args:',
            event.transactionHash,
          );
        }
      });

      console.log(
        `✅ Found ${transactions.size} certificate transactions for issuer ${issuerAddress}`,
      );
    } catch (error) {
      console.error('❌ Error fetching issuer transactions:', error);
    }

    return transactions;
  }

  /**
   * Get complete transaction details for a certificate
   * Includes block number, timestamp, and full event data
   */
  async getCertificateTransactionDetails(
    certificateId: number,
  ): Promise<CertificateTransaction | null> {
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

      // Query events for this specific certificate
      const filter =
        scholachainContract.filters.CertificateIssued(certificateId);
      const events = await scholachainContract.queryFilter(filter, 0, 'latest');

      if (events.length === 0) {
        return null;
      }

      const event = events[0];

      // Get block details for timestamp
      const block = await signer.provider.getBlock(event.blockNumber);
      const timestamp = new Date(block.timestamp * 1000);

      // Extract event data with type safety
      let issuer = '';
      let holder = '';

      if (isEventLog(event) && event.args) {
        issuer = event.args.issuer || '';
        holder = event.args.holder || '';
      }

      const transactionDetails: CertificateTransaction = {
        certificateId: certificateId,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        issuer: issuer,
        holder: holder,
        timestamp: timestamp,
      };

      console.log(
        `✅ Retrieved complete transaction details for certificate #${certificateId}:`,
        transactionDetails,
      );
      return transactionDetails;
    } catch (error) {
      console.error(
        `❌ Error fetching transaction details for certificate #${certificateId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Batch retrieve transaction hashes for multiple certificates
   * Optimized for loading multiple certificates at once
   */
  async getBatchCertificateTransactions(
    certificateIds: number[],
  ): Promise<Map<number, string>> {
    const transactions = new Map<number, string>();

    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.scholachain) {
        return transactions;
      }

      console.log(
        `🔍 Batch retrieving transactions for ${certificateIds.length} certificates`,
      );

      const { Contract } = await import('ethers');
      const scholachainContract = new Contract(
        contractConfigs.scholachain.address,
        contractConfigs.scholachain.abi,
        signer,
      );

      // Query all CertificateIssued events
      const filter = scholachainContract.filters.CertificateIssued();
      const events = await scholachainContract.queryFilter(filter, 0, 'latest');

      // Filter events for the requested certificate IDs with type safety
      events.forEach((event) => {
        // Use type guard to safely access args
        if (
          isEventLog(event) &&
          event.args &&
          event.args.certificateId !== undefined
        ) {
          const certificateId = Number(event.args.certificateId);
          if (certificateIds.includes(certificateId)) {
            transactions.set(certificateId, event.transactionHash);
          }
        }
      });

      console.log(
        `✅ Batch retrieval complete: found ${transactions.size} transactions`,
      );
    } catch (error) {
      console.error('❌ Error in batch transaction retrieval:', error);
    }

    return transactions;
  }

  /**
   * Alternative method to find transactions by scanning all events
   * More comprehensive but potentially slower
   */
  async findCertificateTransactionByScan(
    certificateId: number,
  ): Promise<string | null> {
    try {
      const { contractConfigs, signer } = this.dependencies;

      if (!signer || !contractConfigs.scholachain) {
        return null;
      }

      console.log(`🔍 Scanning all events for certificate #${certificateId}`);

      const { Contract } = await import('ethers');
      const scholachainContract = new Contract(
        contractConfigs.scholachain.address,
        contractConfigs.scholachain.abi,
        signer,
      );

      // Get all CertificateIssued events without filter
      const allEvents = await scholachainContract.queryFilter(
        'CertificateIssued',
        0,
        'latest',
      );

      // Manually filter events for our certificate ID
      for (const event of allEvents) {
        if (isEventLog(event) && event.args) {
          const eventCertificateId = Number(event.args.certificateId);
          if (eventCertificateId === certificateId) {
            console.log(
              `✅ Found transaction via scan: ${event.transactionHash}`,
            );
            return event.transactionHash;
          }
        }
      }

      console.log(`❌ Certificate #${certificateId} not found in event scan`);
      return null;
    } catch (error) {
      console.error(
        `❌ Error scanning events for certificate #${certificateId}:`,
        error,
      );
      return null;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Generate Etherscan URL for a transaction hash
   * Supports multiple networks based on configuration
   */
  getEtherscanTransactionURL(transactionHash: string): string {
    const network =
      this.dependencies.contractConfigs.network?.network || 'sepolia';

    const baseURLs: { [key: string]: string } = {
      sepolia: 'https://sepolia.etherscan.io',
      mainnet: 'https://etherscan.io',
      localhost: 'https://sepolia.etherscan.io', // Default to Sepolia for local development
    };

    const baseURL = baseURLs[network] || baseURLs.sepolia;
    return `${baseURL}/tx/${transactionHash}`;
  }

  /**
   * Generate Etherscan URL for contract address
   */
  getEtherscanContractURL(): string {
    const network =
      this.dependencies.contractConfigs.network?.network || 'sepolia';
    const contractAddress =
      this.dependencies.contractConfigs.scholachain?.address;

    if (!contractAddress) {
      return this.getEtherscanTransactionURL('');
    }

    const baseURLs: { [key: string]: string } = {
      sepolia: 'https://sepolia.etherscan.io',
      mainnet: 'https://etherscan.io',
      localhost: 'https://sepolia.etherscan.io',
    };

    const baseURL = baseURLs[network] || baseURLs.sepolia;
    return `${baseURL}/address/${contractAddress}`;
  }

  /**
   * Generate Etherscan URL for certificate events filtering
   */
  getEtherscanEventsURL(): string {
    const contractURL = this.getEtherscanContractURL();
    return `${contractURL}?tab=events#address-tabs`;
  }

  /**
   * Check if service is ready for blockchain operations
   */
  isServiceReady(): boolean {
    const { signer, contractConfigs } = this.dependencies;
    return !!(signer && contractConfigs.scholachain);
  }

  /**
   * Validate transaction hash format
   */
  isValidTransactionHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Extract certificate ID from event log with type safety
   */
  extractCertificateIdFromEvent(event: EventLog | Log): number | null {
    if (
      isEventLog(event) &&
      event.args &&
      event.args.certificateId !== undefined
    ) {
      return Number(event.args.certificateId);
    }
    return null;
  }

  /**
   * Extract issuer address from event log with type safety
   */
  extractIssuerFromEvent(event: EventLog | Log): string | null {
    if (isEventLog(event) && event.args && event.args.issuer) {
      return event.args.issuer;
    }
    return null;
  }

  /**
   * Extract holder address from event log with type safety
   */
  extractHolderFromEvent(event: EventLog | Log): string | null {
    if (isEventLog(event) && event.args && event.args.holder) {
      return event.args.holder;
    }
    return null;
  }
}
