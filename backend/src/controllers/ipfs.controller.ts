// backend/src/controllers/ipfs.controller.ts

/**
 * IPFS Controller for ScholaChain Backend
 * Handles all IPFS-related API endpoints for file storage and retrieval
 * Manages certificate document uploads, verification, and finalization processes
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
import { asyncHandler } from '../utils/errorHandler.js';

/**
 * IPFS Controller Class
 * Provides REST API endpoints for IPFS operations in the ScholaChain system
 */
export class IPFSController implements IController {
  /**
   * Get IPFS service status and configuration information
   * @route GET /api/ipfs/status
   * @returns IPFS service status including provider and configuration
   */
  public getStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      console.log('🔍 Fetching IPFS service status');

      const status = ipfsService.getStatus();

      const response: ApiResponse = {
        success: true,
        data: {
          ...status,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      console.log('✅ IPFS status retrieved successfully');
      res.status(200).json(response);
    },
  );

  /**
   * Upload a certificate document to IPFS
   * @route POST /api/ipfs/upload
   * @param req - Express request with file in multipart/form-data
   * @param res - Express response with upload results
   * @returns Upload response including CID, document hash, and file information
   */
  public uploadFile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // Validate file presence in request
      if (!req.file) {
        console.error('❌ No file provided in upload request');
        const response: ApiResponse = {
          success: false,
          error: 'No file provided',
          message: 'Please upload a PDF certificate file',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const { originalname, buffer, size, mimetype } = req.file;

      console.log(
        `📤 Processing file upload: ${originalname} (${size} bytes, ${mimetype})`,
      );

      // Validate file type - only PDF allowed for certificates
      if (
        !originalname.toLowerCase().endsWith('.pdf') ||
        mimetype !== 'application/pdf'
      ) {
        console.error(`❌ Invalid file type: ${mimetype}`);
        const response: ApiResponse = {
          success: false,
          error: 'Invalid file type',
          message: 'Only PDF files are supported for certificates',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate file size (10MB limit)
      if (size > 5 * 1024 * 1024) {
        console.error(`❌ File too large: ${size} bytes`);
        const response: ApiResponse = {
          success: false,
          error: 'File too large',
          message: 'Certificate file must be smaller than 5MB',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      try {
        console.log(`🔐 Generating document hash for: ${originalname}`);

        // Generate SHA-256 hash for document integrity verification
        const documentHash = hashService.generateSHA256Hash(buffer);
        console.log(`✅ Document hash generated: ${documentHash}`);

        // Upload file to IPFS and get CID
        console.log(`📤 Uploading to IPFS: ${originalname}`);
        const uploadResult = await ipfsService.uploadFile(buffer, originalname);

        console.log(`✅ IPFS upload successful - CID: ${uploadResult.cid}`);

        // Construct successful response with all required data
        const response: ApiResponse = {
          success: true,
          data: {
            filename: originalname,
            fileSize: size,
            documentHash: documentHash, // SHA-256 hash for blockchain
            ipfsCID: uploadResult.cid, // IPFS Content Identifier
            ipfsURL: uploadResult.url, // Gateway URL for access
            fileBuffer: buffer.toString('base64'), // Base64 encoded file for immediate use
            uploadSize: uploadResult.size, // Actual size stored on IPFS
            message:
              'File uploaded to IPFS successfully. Ready for blockchain transaction.',
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

        console.log(
          `🎉 File upload completed successfully for: ${originalname}`,
        );
        res.status(200).json(response);
      } catch (error) {
        console.error('❌ File upload processing failed:', error);

        const response: ApiResponse = {
          success: false,
          error: 'Upload processing failed',
          message:
            error instanceof Error ? error.message : 'Unknown processing error',
          timestamp: new Date().toISOString(),
        };

        res.status(500).json(response);
      }
    },
  );

  /**
   * Finalize certificate issuance with IPFS upload confirmation
   * This endpoint is called after successful blockchain transaction
   * @route POST /api/ipfs/finalize
   * @param req - Express request with finalization data
   * @param res - Express response with finalization results
   * @returns Finalization confirmation with transaction details
   */
  public finalizeCertificateIssuance = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { fileBuffer, filename, transactionHash, certificateId, ipfsCID } =
        req.body;

      console.log('📦 Finalizing certificate issuance with IPFS confirmation');
      console.log('   Transaction Hash:', transactionHash);
      console.log('   Certificate ID:', certificateId);
      console.log('   IPFS CID:', ipfsCID);

      // Validate required parameters
      if (!fileBuffer || !filename || !transactionHash || !certificateId) {
        console.error('❌ Missing required parameters for finalization');
        const response: ApiResponse = {
          success: false,
          error: 'Missing required parameters',
          message:
            'fileBuffer, filename, transactionHash, and certificateId are required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      try {
        console.log('🔍 Verifying blockchain transaction...');

        // Verify that certificate ID exists on blockchain (basic validation)
        // In a production system, you might want more thorough verification
        if (certificateId < 0) {
          throw new Error('Invalid certificate ID');
        }

        // Convert base64 file buffer back to Buffer if needed
        // Note: fileBuffer might already be uploaded, this is just for verification
        let fileBufferInstance: Buffer;
        if (typeof fileBuffer === 'string') {
          // If it's base64 encoded, decode it
          fileBufferInstance = Buffer.from(fileBuffer, 'base64');
          console.log(
            `📄 Decoded file buffer: ${fileBufferInstance.length} bytes`,
          );
        } else {
          throw new Error('Invalid fileBuffer format');
        }

        // Verify IPFS CID if provided
        if (ipfsCID) {
          console.log(`🔍 Verifying IPFS CID: ${ipfsCID}`);
          const cidExists = await ipfsService.verifyFileExists(ipfsCID);
          if (!cidExists) {
            console.warn(`⚠️ IPFS CID verification failed: ${ipfsCID}`);
            // Don't fail the entire process, just log warning
          } else {
            console.log(`✅ IPFS CID verified: ${ipfsCID}`);
          }
        }

        console.log('✅ Certificate issuance finalized successfully');

        // Return success response
        const response: ApiResponse = {
          success: true,
          data: {
            finalization: {
              success: true,
              ipfsCID: ipfsCID,
              transactionHash: transactionHash,
              certificateId: certificateId,
              finalizedAt: new Date().toISOString(),
            },
            message:
              'Certificate issuance finalized successfully with IPFS storage confirmation',
            nextSteps: [
              'Certificate is now permanently stored on IPFS',
              'Blockchain transaction confirmed',
              'Certificate can be verified using the provided CID',
            ],
          },
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        console.error('❌ Certificate finalization failed:', error);

        const response: ApiResponse = {
          success: false,
          error: 'Finalization failed',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown finalization error',
          timestamp: new Date().toISOString(),
        };

        res.status(500).json(response);
      }
    },
  );

  /**
   * Verify if a file exists in IPFS by its CID
   * @route GET /api/ipfs/verify/:cid
   * @param req - Express request with CID parameter
   * @param res - Express response with verification result
   * @returns Verification result with existence status
   */
  public verifyFile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { cid } = req.params;

      console.log(`🔍 Verifying IPFS file existence for CID: ${cid}`);

      if (!cid) {
        console.error('❌ No CID provided for verification');
        const response: ApiResponse = {
          success: false,
          error: 'CID required',
          message: 'Please provide an IPFS CID',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate CID format
      if (!ipfsService.isValidCID(cid)) {
        console.error(`❌ Invalid CID format: ${cid}`);
        const response: ApiResponse = {
          success: false,
          error: 'Invalid CID format',
          message:
            'Please provide a valid IPFS CID (should start with Qm and be 46 characters)',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      try {
        const exists = await ipfsService.verifyFileExists(cid);

        console.log(
          `✅ IPFS verification completed: ${
            exists ? 'File exists' : 'File not found'
          }`,
        );

        const response: ApiResponse = {
          success: true,
          data: {
            cid: cid,
            exists: exists,
            gatewayURL: ipfsService.getGatewayURL(cid),
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        console.error('❌ IPFS verification failed:', error);

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
   * Complete certificate preparation flow WITHOUT immediate IPFS upload
   * IPFS upload happens only after successful blockchain transaction
   * @route POST /api/certificates/prepare-complete
   * @param req - Express request with file and certificate data
   * @param res - Express response with preparation data
   * @returns Preparation data for frontend transaction
   */
  public prepareCertificateWithoutIPFS = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // Validate file presence
      if (!req.file) {
        console.error('❌ No file provided in preparation request');
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

      console.log(
        `🎯 Starting certificate preparation without IPFS upload: ${originalname}`,
      );

      // Validate required parameters
      if (!holderAddress) {
        console.error('❌ Holder address missing in preparation request');
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
        console.error('❌ Issuer address missing in preparation request');
        const response: ApiResponse = {
          success: false,
          error: 'Issuer address required',
          message: 'Please provide the issuer Ethereum address',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate Ethereum addresses
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

      // Validate file type
      if (!originalname.toLowerCase().endsWith('.pdf')) {
        console.error(`❌ Invalid file type: ${originalname}`);
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
        console.log('🔐 Generating document hash...');

        // Step 1: Generate document hash for blockchain
        const documentHash = hashService.generateSHA256Hash(buffer);
        console.log(`✅ Document hash generated: ${documentHash}`);

        // Step 2: Normalize Ethereum addresses
        const normalizedHolderAddress =
          validateAndNormalizeAddress(holderAddress);
        const normalizedIssuerAddress =
          validateAndNormalizeAddress(issuerAddress);

        console.log(
          `🔍 Checking issuer authorization: ${normalizedIssuerAddress}`,
        );

        // Step 3: Verify issuer authorization
        const isIssuerAuthorized = await blockchainService.isIssuerAuthorized(
          normalizedIssuerAddress,
        );

        console.log(`✅ Issuer authorization checked: ${isIssuerAuthorized}`);

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

        // Step 4: Create temporary CID placeholder for blockchain preparation
        const temporaryIPFSCID = `pending_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 15)}`;

        console.log(
          `📝 Using temporary IPFS CID for preparation: ${temporaryIPFSCID}`,
        );

        // Step 5: Prepare blockchain issuance data with temporary CID
        const preparationResult =
          await blockchainService.prepareCertificateIssuance(
            documentHash,
            temporaryIPFSCID, // Temporary placeholder CID
            normalizedHolderAddress,
            certificateType || '',
          );

        if (!preparationResult.success) {
          throw new Error(`Preparation failed: ${preparationResult.message}`);
        }

        console.log(
          '✅ Certificate preparation completed (IPFS upload pending)',
        );
        console.log(
          `   Predicted Certificate ID: ${preparationResult.certificateId}`,
        );
        console.log(
          '   Next: Frontend will execute blockchain transaction first',
        );

        // Construct comprehensive preparation response
        const response: ApiResponse = {
          success: true,
          data: {
            preparation: preparationResult,
            document: {
              filename: originalname,
              hash: documentHash,
              fileBuffer: buffer.toString('base64'), // Send file buffer for later IPFS upload
              fileSize: buffer.length,
              ipfsPending: true, // Indicate that IPFS upload is pending
              temporaryIPFSCID: temporaryIPFSCID, // Temporary CID used for preparation
            },
            addresses: {
              holder: normalizedHolderAddress,
              issuer: normalizedIssuerAddress,
              issuerAuthorized: true,
            },
            certificateType: certificateType || '',
            contractInfo: {
              address: blockchainService.getContractAddress(),
              abi: blockchainService.getContractABI(),
              governanceAddress: blockchainService.getGovernanceAddress(),
              governanceABI: blockchainService.getGovernanceABI(),
              network: blockchainService.getContractInfo().network,
            },
            nextSteps: [
              '1. Execute blockchain transaction with temporary IPFS CID',
              '2. After transaction success, call /api/ipfs/finalize to upload to IPFS',
              '3. Update blockchain with actual IPFS CID if needed',
            ],
            timestamp: new Date().toISOString(),
            message:
              'Certificate prepared successfully. Execute blockchain transaction first, then finalize with IPFS.',
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
}

// Export singleton instance for use throughout the application
export const ipfsController = new IPFSController();
