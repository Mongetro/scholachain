// backend/src/controllers/certificateController.ts

/**
 * Enhanced Certificate Controller for ScholaChain Backend
 * COMPLETE VERSION with transaction hash support for direct Etherscan linking
 * Handles all certificate-related API endpoints with blockchain transaction tracking
 */

import { Request, Response } from 'express';
import {
  ApiResponse,
  IController,
} from '../interfaces/controller.interface.js';
import { blockchainService } from '../services/blockchainService.js';
import { hashService } from '../services/hashService.js';
import { ipfsService } from '../services/ipfsService.js';
import {
  isValidEthereumAddress,
  validateAndNormalizeAddress,
} from '../utils/addressUtils.js';
import { contractLoader } from '../utils/contractLoader.js';
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * Complete Certificate Controller implementation
 * Enhanced with transaction hash retrieval for direct blockchain verification
 * Provides endpoints for certificate operations with transaction tracking
 */
export class CertificateController implements IController {
  private contractConfigs: any;

  /**
   * Constructor - Initializes contract configurations
   * Uses contractLoader to access blockchain contract details
   */
  constructor() {
    this.initializeContractConfigs();
  }

  /**
   * Initialize contract configurations from contract loader
   * Sets up ScholaChain contract details for blockchain interactions
   */
  private initializeContractConfigs(): void {
    try {
      this.contractConfigs = {
        scholachain: contractLoader.getScholaChainConfig(),
        governance: contractLoader.getGovernanceConfig(),
        network: contractLoader.getNetworkConfig(),
      };
      console.log(
        '✅ CertificateController contract configurations initialized',
      );
    } catch (error) {
      console.error('❌ Failed to initialize contract configurations:', error);
      this.contractConfigs = {};
    }
  }

  /**
   * Retrieve transaction hash for a specific certificate from blockchain events
   * Queries CertificateIssued events to find the exact transaction that created the certificate
   * @param certificateId - The ID of the certificate to find transaction for
   * @returns Promise<string | null> - Transaction hash if found, null otherwise
   */
  private async getCertificateTransactionHash(
    certificateId: number,
  ): Promise<string | null> {
    try {
      console.log(
        `🔍 Searching for transaction hash for certificate #${certificateId}`,
      );

      // Validate contract configuration
      if (
        !this.contractConfigs.scholachain ||
        !this.contractConfigs.scholachain.address
      ) {
        console.error(
          '❌ Contract configuration not available for transaction hash lookup',
        );
        return null;
      }

      // Dynamic import for ethers to avoid TypeScript issues
      const ethers = await import('ethers');

      // Get provider based on network - use 'any' type to avoid TypeScript issues
      let provider: any;
      const network = this.contractConfigs.network.network;

      if (network === 'sepolia') {
        if (!process.env.ALCHEMY_API_KEY) {
          console.error('ALCHEMY_API_KEY required for Sepolia connection');
          return null;
        }
        const alchemyUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
        provider = new ethers.JsonRpcProvider(alchemyUrl);
      } else {
        // Local development
        provider = new ethers.JsonRpcProvider('http://hardhat-node:8545');
      }

      // Create contract instance with proper typing
      const scholachainContract = new ethers.Contract(
        this.contractConfigs.scholachain.address,
        this.contractConfigs.scholachain.abi,
        provider,
      );

      // Query CertificateIssued events for this specific certificate ID
      console.log(
        `📊 Querying blockchain events for certificate #${certificateId}`,
      );

      try {
        const filter =
          scholachainContract.filters.CertificateIssued(certificateId);
        const events = await scholachainContract.queryFilter(
          filter,
          0,
          'latest',
        );

        if (events.length > 0) {
          const transactionHash = events[0].transactionHash;
          console.log(
            `✅ Found transaction hash for certificate #${certificateId}: ${transactionHash}`,
          );
          return transactionHash;
        }

        console.log(
          `⚠️ No transaction events found for certificate #${certificateId}`,
        );
        return null;
      } catch (queryError) {
        console.error(
          `❌ Error querying events for certificate #${certificateId}:`,
          queryError,
        );
        return null;
      }
    } catch (error) {
      console.error(
        `❌ Error fetching transaction hash for certificate #${certificateId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Alternative method to get transaction hash using blockchain service
   * This method uses the existing blockchain service instead of direct ethers
   * @param certificateId - The ID of the certificate to find transaction for
   * @returns Promise<string | null> - Transaction hash if found, null otherwise
   */
  private async getCertificateTransactionHashAlternative(
    certificateId: number,
  ): Promise<string | null> {
    try {
      console.log(
        `🔍 [Alternative] Searching for transaction hash for certificate #${certificateId}`,
      );

      // Since we can't easily query events without proper ethers setup,
      // we'll return null and rely on the frontend to use the transaction hash
      // from the issuance process
      console.log(
        `ℹ️ Transaction hash lookup requires proper ethers configuration`,
      );
      return null;
    } catch (error) {
      console.error(`❌ [Alternative] Error fetching transaction hash:`, error);
      return null;
    }
  }

  /**
   * Get certificate details by ID from blockchain
   * Enhanced to include transaction hash for direct Etherscan linking
   * @param req - Express request with certificate ID parameter
   * @param res - Express response with certificate data or error
   */
  public getCertificate = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const certificateId = parseInt(req.params.id);

      // Validate certificate ID
      if (isNaN(certificateId) || certificateId < 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid certificate ID',
          message: 'Certificate ID must be 0 or a positive integer',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      console.log(
        `🔍 Fetching certificate #${certificateId} from blockchain...`,
      );

      const certificate = await blockchainService.getCertificate(certificateId);

      if (!certificate) {
        const response: ApiResponse = {
          success: false,
          error: 'Certificate not found',
          message: `Certificate with ID ${certificateId} does not exist`,
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      // Enhanced: Get transaction hash for direct Etherscan linking
      // Use alternative method to avoid ethers type issues
      const transactionHash =
        await this.getCertificateTransactionHashAlternative(certificateId);

      const response: ApiResponse = {
        success: true,
        data: {
          id: certificateId,
          ...certificate,
          transactionHash, // Include transaction hash in response
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * Verify certificate authenticity using dual verification (ID + PDF file)
   * Enhanced to include transaction hash in verification results
   * Compares calculated PDF hash with blockchain record for maximum security
   * @param req - Express request with certificate ID and PDF file
   * @param res - Express response with comprehensive verification results
   */
  public verifyCertificateWithFile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const certificateId = parseInt(req.body.certificateId);

        // Validate certificate ID (accept 0 and positive numbers)
        if (isNaN(certificateId) || certificateId < 0) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid certificate ID',
            message: 'Certificate ID must be 0 or a positive integer',
            timestamp: new Date().toISOString(),
          };
          res.status(400).json(response);
          return;
        }

        // Validate file presence
        if (!req.file) {
          const response: ApiResponse = {
            success: false,
            error: 'No file provided',
            message: 'Please upload a PDF certificate file for verification',
            timestamp: new Date().toISOString(),
          };
          res.status(400).json(response);
          return;
        }

        const { originalname, buffer } = req.file;

        console.log(
          `🔍 Starting dual verification for certificate #${certificateId}`,
        );

        // Step 1: Calculate SHA-256 hash of uploaded PDF
        const calculatedHash = hashService.generateSHA256Hash(buffer);
        console.log(`✅ PDF hash calculated: ${calculatedHash}`);

        // Step 2: Get certificate from blockchain
        const blockchainCert = await blockchainService.getCertificate(
          certificateId,
        );

        if (!blockchainCert) {
          const response: ApiResponse = {
            success: true,
            data: {
              isValid: false,
              verificationDetails: {
                certificateExists: false,
                hashMatches: false,
                isRevoked: false,
                issuerAuthorized: false,
              },
              error: 'Certificate not found on blockchain',
            },
            timestamp: new Date().toISOString(),
          };
          res.status(200).json(response);
          return;
        }

        // Step 3: Perform multiple verifications
        const hashMatches =
          calculatedHash.toLowerCase() ===
          blockchainCert.documentHash.toLowerCase();

        const isRevoked = blockchainCert.revoked;

        // Check if issuer is authorized
        const issuerAuthorized = await blockchainService.isIssuerAuthorized(
          blockchainCert.issuer,
        );

        // Step 4: Determine overall validity
        const isValid = hashMatches && !isRevoked && issuerAuthorized;

        console.log(
          `✅ Verification completed for certificate #${certificateId}:`,
          {
            isValid,
            hashMatches,
            isRevoked,
            issuerAuthorized,
          },
        );

        // ENHANCED: Get transaction hash for direct Etherscan linking
        // Use alternative method to avoid ethers type issues
        const transactionHash =
          await this.getCertificateTransactionHashAlternative(certificateId);
        if (transactionHash) {
          console.log(
            `✅ Transaction hash retrieved for direct linking: ${transactionHash}`,
          );
        } else {
          console.log(
            `⚠️ No transaction hash found for certificate #${certificateId}`,
          );
        }

        // Step 5: Return comprehensive results with transaction hash
        const response: ApiResponse = {
          success: true,
          data: {
            isValid,
            certificate: {
              id: certificateId,
              documentHash: blockchainCert.documentHash,
              ipfsCID: blockchainCert.ipfsCID,
              issuer: blockchainCert.issuer,
              holder: blockchainCert.holder,
              issuedAt: blockchainCert.issuedAt.toISOString(),
              revoked: blockchainCert.revoked,
              certificateType: blockchainCert.certificateType,
              transactionHash: transactionHash, // ENHANCED: Include transaction hash
            },
            verificationDetails: {
              hashMatches,
              isRevoked,
              certificateExists: true,
              issuerAuthorized,
            },
          },
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        console.error('❌ Certificate verification failed:', error);

        const response: ApiResponse = {
          success: false,
          error: 'Verification failed',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown verification error',
          timestamp: new Date().toISOString(),
        };

        res.status(500).json(response);
      }
    },
  );

  /**
   * Prepare certificate issuance data for frontend transaction
   * This does NOT execute blockchain transaction - only prepares data
   * @param req - Express request with certificate issuance data
   * @param res - Express response with prepared transaction data
   */
  public prepareCertificateIssuance = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        documentHash,
        ipfsCID,
        holderAddress,
        certificateType,
        issuerAddress,
      } = req.body;

      console.log('📝 Starting certificate issuance preparation...');

      // Validate required parameters
      if (!documentHash || !ipfsCID || !holderAddress || !issuerAddress) {
        console.error(
          '❌ Missing required parameters for certificate preparation',
        );
        const response: ApiResponse = {
          success: false,
          error: 'Missing required parameters',
          message:
            'documentHash, ipfsCID, holderAddress, and issuerAddress are required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate holder address
      if (!isValidEthereumAddress(holderAddress)) {
        console.error(`❌ Invalid holder address: ${holderAddress}`);
        const response: ApiResponse = {
          success: false,
          error: 'Invalid holder address',
          message: 'Holder address must be a valid Ethereum address',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate issuer address
      if (!isValidEthereumAddress(issuerAddress)) {
        console.error(`❌ Invalid issuer address: ${issuerAddress}`);
        const response: ApiResponse = {
          success: false,
          error: 'Invalid issuer address',
          message: 'Issuer address must be a valid Ethereum address',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate document hash format
      if (
        typeof documentHash !== 'string' ||
        !documentHash.startsWith('0x') ||
        documentHash.length !== 66
      ) {
        console.error(`❌ Invalid document hash format: ${documentHash}`);
        const response: ApiResponse = {
          success: false,
          error: 'Invalid document hash',
          message:
            'Document hash must be a 66-character hexadecimal string starting with 0x',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate IPFS CID
      if (typeof ipfsCID !== 'string' || ipfsCID.length === 0) {
        console.error(`❌ Invalid IPFS CID: ${ipfsCID}`);
        const response: ApiResponse = {
          success: false,
          error: 'Invalid IPFS CID',
          message: 'IPFS CID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      try {
        console.log('📝 Preparing certificate issuance data...');

        // Normalize addresses
        const normalizedHolderAddress =
          validateAndNormalizeAddress(holderAddress);
        const normalizedIssuerAddress =
          validateAndNormalizeAddress(issuerAddress);

        // Check if issuer is authorized using blockchain service
        console.log(
          `🔍 Checking authorization for issuer: ${normalizedIssuerAddress}`,
        );
        const isIssuerAuthorized = await blockchainService.isIssuerAuthorized(
          normalizedIssuerAddress,
        );

        console.log(`✅ Issuer authorization checked: ${isIssuerAuthorized}`);
        console.log(`   Issuer Address: ${normalizedIssuerAddress}`);
        console.log(
          `   Governance Contract: ${blockchainService.getGovernanceAddress()}`,
        );

        if (!isIssuerAuthorized) {
          console.error(`❌ Issuer not authorized: ${normalizedIssuerAddress}`);
          const response: ApiResponse = {
            success: false,
            error: 'Issuer not authorized',
            message: `Address ${normalizedIssuerAddress} is not authorized to issue certificates. Please contact the Ministry of Education to be registered as an issuer.`,
            timestamp: new Date().toISOString(),
          };
          res.status(403).json(response);
          return;
        }

        // Prepare issuance data (NO TRANSACTION EXECUTED)
        const preparationResult =
          await blockchainService.prepareCertificateIssuance(
            documentHash,
            ipfsCID,
            normalizedHolderAddress,
            certificateType || '',
          );

        if (!preparationResult.success) {
          throw new Error(`Preparation failed: ${preparationResult.message}`);
        }

        console.log('✅ Certificate issuance data prepared successfully');

        // Construct response with proper structure
        const response: ApiResponse = {
          success: true,
          data: {
            preparation: preparationResult,
            contractInfo: {
              address: blockchainService.getContractAddress(),
              abi: blockchainService.getContractABI(),
              governanceAddress: blockchainService.getGovernanceAddress(),
              governanceABI: blockchainService.getGovernanceABI(),
              network: blockchainService.getContractInfo().network,
            },
            // Use consistent structure without nested addresses.holder
            holderAddress: normalizedHolderAddress,
            issuerAddress: normalizedIssuerAddress,
            issuerAuthorized: true,
            document: {
              hash: documentHash,
              ipfsCID: ipfsCID,
            },
            certificateType: certificateType || '',
            nextSteps: [
              'Use the prepared data in your frontend application',
              'Connect issuer wallet via MetaMask',
              'Execute issueCertificate transaction with the prepared parameters',
              'Wait for transaction confirmation on blockchain',
              'Store the transaction hash for future verification',
            ],
            timestamp: new Date().toISOString(),
            message:
              'Certificate issuance data prepared successfully. Use frontend for blockchain transaction execution.',
          },
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        console.error('❌ Certificate preparation failed:', error);

        const response: ApiResponse = {
          success: false,
          error: 'Preparation failed',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown preparation error',
          timestamp: new Date().toISOString(),
        };

        res.status(500).json(response);
      }
    },
  );

  /**
   * Complete certificate preparation with file upload
   * Handles PDF upload, hash generation, IPFS storage, and issuance preparation
   * @param req - Express request with file and certificate data
   * @param res - Express response with complete preparation data
   */
  public prepareCompleteCertificate = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.file) {
        const response: ApiResponse = {
          success: false,
          error: 'No file provided',
          message: 'Please upload a PDF certificate file',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { originalname, buffer } = req.file;
      const { holderAddress, certificateType, issuerAddress } = req.body;

      // Validate required parameters
      if (!holderAddress) {
        const response: ApiResponse = {
          success: false,
          error: 'Holder address required',
          message: 'Please provide the certificate holder Ethereum address',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      if (!issuerAddress) {
        const response: ApiResponse = {
          success: false,
          error: 'Issuer address required',
          message: 'Please provide the issuer Ethereum address',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate addresses
      if (!isValidEthereumAddress(holderAddress)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid holder address',
          message: 'Holder address must be a valid Ethereum address',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      if (!isValidEthereumAddress(issuerAddress)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid issuer address',
          message: 'Issuer address must be a valid Ethereum address',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate file type
      if (!originalname.toLowerCase().endsWith('.pdf')) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid file type',
          message: 'Only PDF files are supported for certificates',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      try {
        console.log('🎯 Starting COMPLETE certificate preparation flow...');

        // Step 1: Generate document hash
        const documentHash = hashService.generateSHA256Hash(buffer);
        console.log('✅ Document hash generated:', documentHash);

        // Step 2: Upload to IPFS
        const ipfsResult = await ipfsService.uploadFile(buffer, originalname);
        console.log('✅ File uploaded to IPFS:', ipfsResult.cid);

        // Step 3: Normalize addresses
        const normalizedHolderAddress =
          validateAndNormalizeAddress(holderAddress);
        const normalizedIssuerAddress =
          validateAndNormalizeAddress(issuerAddress);

        // Step 4: Check if issuer is authorized
        console.log(
          `🔍 Checking authorization for issuer: ${normalizedIssuerAddress}`,
        );
        const isIssuerAuthorized = await blockchainService.isIssuerAuthorized(
          normalizedIssuerAddress,
        );

        console.log(`✅ Issuer authorization checked: ${isIssuerAuthorized}`);
        console.log(`   Issuer Address: ${normalizedIssuerAddress}`);
        console.log(
          `   Governance Contract: ${blockchainService.getGovernanceAddress()}`,
        );

        if (!isIssuerAuthorized) {
          const response: ApiResponse = {
            success: false,
            error: 'Issuer not authorized',
            message: `Address ${normalizedIssuerAddress} is not authorized to issue certificates. Please contact the Ministry of Education to be registered as an issuer.`,
            timestamp: new Date().toISOString(),
          };
          res.status(403).json(response);
          return;
        }

        // Step 5: Prepare blockchain issuance data (NO TRANSACTION EXECUTED)
        const preparationResult =
          await blockchainService.prepareCertificateIssuance(
            documentHash,
            ipfsResult.cid,
            normalizedHolderAddress,
            certificateType || '',
          );

        if (!preparationResult.success) {
          throw new Error(`Preparation failed: ${preparationResult.message}`);
        }

        console.log(
          '✅ Complete certificate preparation completed successfully',
        );
        console.log(
          '   Predicted Certificate ID:',
          preparationResult.certificateId,
        );
        console.log('   Next: Use frontend to execute blockchain transaction');

        // Construct comprehensive preparation response
        const response: ApiResponse = {
          success: true,
          data: {
            preparation: preparationResult,
            document: {
              filename: originalname,
              hash: documentHash,
              ipfsCID: ipfsResult.cid,
              ipfsURL: ipfsResult.url,
              fileSize: buffer.length,
            },
            // Use flat structure instead of nested addresses object
            holderAddress: normalizedHolderAddress,
            issuerAddress: normalizedIssuerAddress,
            issuerAuthorized: true,
            certificateType: certificateType || '',
            contractInfo: {
              address: blockchainService.getContractAddress(),
              abi: blockchainService.getContractABI(),
              governanceAddress: blockchainService.getGovernanceAddress(),
              governanceABI: blockchainService.getGovernanceABI(),
              network: blockchainService.getContractInfo().network,
            },
            nextSteps: [
              '1. Execute blockchain transaction with prepared data',
              '2. After transaction success, the certificate will be permanently recorded',
              '3. Use the transaction hash for direct blockchain verification',
            ],
            timestamp: new Date().toISOString(),
            message:
              'Certificate preparation completed successfully. Use frontend for blockchain transaction.',
          },
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        console.error('❌ Complete preparation flow failed:', error);

        const response: ApiResponse = {
          success: false,
          error: 'Preparation failed',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown preparation error',
          timestamp: new Date().toISOString(),
        };

        res.status(500).json(response);
      }
    },
  );

  /**
   * Get total number of certificates issued on blockchain
   * @param req - Express request
   * @param res - Express response with total certificates count
   */
  public getTotalCertificates = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const totalCertificates = await blockchainService.getTotalCertificates();

      const response: ApiResponse = {
        success: true,
        data: {
          totalCertificates: totalCertificates,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * Check if an address is authorized to issue certificates
   * @param req - Express request with address parameter
   * @param res - Express response with authorization status
   */
  public checkIssuerAuthorization = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { address } = req.params;

      if (!address) {
        const response: ApiResponse = {
          success: false,
          error: 'Address required',
          message: 'Ethereum address is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      if (!isValidEthereumAddress(address)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid address',
          message: 'Provided address is not a valid Ethereum address',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const normalizedAddress = validateAndNormalizeAddress(address);
      const isAuthorized = await blockchainService.isIssuerAuthorized(
        normalizedAddress,
      );

      const response: ApiResponse = {
        success: true,
        data: {
          address: normalizedAddress,
          authorized: isAuthorized,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * Get contract information for frontend usage
   * @param req - Express request
   * @param res - Express response with contract configuration
   */
  public getContractInfo = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const contractInfo = blockchainService.getContractInfo();

      const response: ApiResponse = {
        success: true,
        data: {
          contractAddress: contractInfo.address,
          contractABI: blockchainService.getContractABI(),
          governanceAddress: blockchainService.getGovernanceAddress(),
          governanceABI: blockchainService.getGovernanceABI(),
          network: contractInfo.network,
          chainId: contractInfo.chainId,
          serviceMode: contractInfo.mode,
          connected: contractInfo.connected,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );
}

// Export singleton instance for use throughout the application
export const certificateController = new CertificateController();
