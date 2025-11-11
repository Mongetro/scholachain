// backend/src/controllers/blockchain.controller.ts

/**
 * Blockchain Controller
 * Handles READ-ONLY blockchain-related API endpoints
 * Certificate issuance is prepared here but executed by frontend via MetaMask
 */

import { Request, Response } from 'express';
import {
  ApiResponse,
  IController,
} from '../interfaces/controller.interface.js';
import { blockchainService } from '../services/blockchainService.js';
import {
  isValidEthereumAddress,
  validateAndNormalizeAddress,
} from '../utils/addressUtils.js';
import { asyncHandler } from '../utils/errorHandler.js';

export class BlockchainController implements IController {
  /**
   * Get current blockchain connection status and contract information
   */
  public getBlockchainStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const status = await blockchainService.getBlockchainStatus();
      const contractInfo = blockchainService.getContractInfo();

      const response: ApiResponse = {
        success: true,
        data: {
          blockchain: status,
          contract: {
            address: contractInfo.address,
            network: contractInfo.network,
            chainId: contractInfo.chainId,
            deployedAt: contractInfo.deployedAt,
          },
          serviceMode: contractInfo.mode,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * Get certificate details by ID from blockchain
   */
  public getCertificate = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const certificateId = parseInt(req.params.id);

      if (isNaN(certificateId) || certificateId <= 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid certificate ID',
          message: 'Certificate ID must be a positive integer',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

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

      const response: ApiResponse = {
        success: true,
        data: {
          id: certificateId,
          ...certificate,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * Verify a certificate by comparing its document hash with blockchain record
   */
  public verifyCertificate = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { certificateId, documentHash } = req.body;

      // Validate certificate ID
      if (typeof certificateId !== 'number' || certificateId <= 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid certificate ID',
          message: 'Certificate ID must be a positive integer',
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

      const isValid = await blockchainService.verifyCertificateHash(
        certificateId,
        documentHash,
      );

      const response: ApiResponse = {
        success: true,
        data: {
          certificateId,
          documentHash,
          valid: isValid,
          timestamp: new Date().toISOString(),
          verifiedOn: blockchainService.getContractInfo().network,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * Prepare certificate issuance data for frontend transaction
   * This does NOT execute any transaction - only prepares data
   */
  public prepareCertificateIssuance = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { documentHash, ipfsCID, holderAddress, certificateType } =
        req.body;

      // Validate holder address
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

      // Validate document hash
      if (
        typeof documentHash !== 'string' ||
        !documentHash.startsWith('0x') ||
        documentHash.length !== 66
      ) {
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
        const response: ApiResponse = {
          success: false,
          error: 'Invalid IPFS CID',
          message: 'IPFS CID is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const normalizedAddress = validateAndNormalizeAddress(holderAddress);

      // Prepare issuance data (NO TRANSACTION EXECUTED)
      const preparationResult =
        await blockchainService.prepareCertificateIssuance(
          documentHash,
          ipfsCID,
          normalizedAddress,
          certificateType || '',
        );

      const response: ApiResponse = {
        success: preparationResult.success,
        data: {
          ...preparationResult,
          contractAddress: blockchainService.getContractAddress(),
          contractABI: blockchainService.getContractABI(),
          nextSteps: [
            'Use the prepared data in your frontend application',
            'Connect user wallet via MetaMask',
            'Execute transaction using contract ABI and address',
            'Wait for transaction confirmation',
          ],
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * Check if an issuer address is authorized to issue certificates
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
   * Get total number of certificates issued on blockchain
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
   * Get contract information for frontend usage
   */
  public getContractInfo = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const contractInfo = blockchainService.getContractInfo();

      const response: ApiResponse = {
        success: true,
        data: {
          contractAddress: contractInfo.address,
          contractABI: blockchainService.getContractABI(),
          network: contractInfo.network,
          chainId: contractInfo.chainId,
          serviceMode: contractInfo.mode,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );
}

// Export singleton instance
export const blockchainController = new BlockchainController();
