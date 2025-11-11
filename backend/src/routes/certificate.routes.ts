// backend/src/routes/certificate.routes.ts

/**
 * Certificate Routes for ScholaChain Backend API
 * Complete implementation with all certificate-related endpoints
 * Fixed method references to match CertificateController implementation
 */

import { Router } from 'express';
import { certificateController } from '../controllers/certificateController.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validationMiddleware.js';
import {
  certificateIdSchema,
  issueCertificateSchema,
} from '../schemas/certificateSchemas.js';

const router = Router();

// ==================== CERTIFICATE ROUTES ====================

/**
 * @route   GET /api/certificates/:id
 * @desc    Get certificate details by ID from blockchain
 * @access  Public
 * @param   {string} id - Certificate ID (numeric string)
 * @returns {Object} Certificate details or error
 */
router.get(
  '/certificates/:id',
  validateParams(certificateIdSchema),
  certificateController.getCertificate,
);

/**
 * @route   POST /api/certificates/verify
 * @desc    Verify certificate authenticity using dual verification (ID + PDF file)
 * @access  Public
 * @body    {number} certificateId - Certificate ID to verify
 * @body    {File} file - PDF certificate file for hash comparison
 * @returns {Object} Verification result with transaction hash if available
 */
router.post(
  '/certificates/verify',
  certificateController.verifyCertificateWithFile, // CORRECTED: Use the actual method name
);

/**
 * @route   POST /api/certificates/prepare-issuance
 * @desc    Prepare certificate issuance data for frontend transaction
 * @access  Public
 * @body    {Object} issuanceData - Certificate issuance preparation data
 * @body    {string} issuanceData.documentHash - SHA-256 hash of certificate document
 * @body    {string} issuanceData.ipfsCID - IPFS Content Identifier
 * @body    {string} issuanceData.holderAddress - Recipient's Ethereum address
 * @body    {string} issuanceData.issuerAddress - Issuer's Ethereum address
 * @body    {string} [issuanceData.certificateType] - Type of certificate (optional)
 * @returns {Object} Prepared issuance data for frontend transaction
 */
router.post(
  '/certificates/prepare-issuance',
  validateBody(issueCertificateSchema),
  certificateController.prepareCertificateIssuance,
);

/**
 * @route   POST /api/certificates/prepare-complete
 * @desc    Complete certificate preparation with file upload (without immediate IPFS upload)
 * @access  Public
 * @body    {File} file - PDF certificate file
 * @body    {string} holderAddress - Recipient's Ethereum address
 * @body    {string} issuerAddress - Issuer's Ethereum address
 * @body    {string} [certificateType] - Type of certificate (optional)
 * @returns {Object} Complete preparation data including file buffer and hashes
 */
router.post(
  '/certificates/prepare-complete',
  certificateController.prepareCompleteCertificate,
);

/**
 * @route   GET /api/certificates/total
 * @desc    Get total number of certificates issued on blockchain
 * @access  Public
 * @returns {Object} Total certificates count
 */
router.get('/certificates/total', certificateController.getTotalCertificates);

/**
 * @route   GET /api/issuers/:address/authorized
 * @desc    Check if an issuer address is authorized to issue certificates
 * @access  Public
 * @param   {string} address - Ethereum address to check
 * @returns {Object} Authorization status
 */
router.get(
  '/issuers/:address/authorized',
  certificateController.checkIssuerAuthorization,
);

/**
 * @route   GET /api/contract-info
 * @desc    Get contract information for frontend usage
 * @access  Public
 * @returns {Object} Contract addresses, ABIs, and network information
 */
router.get('/contract-info', certificateController.getContractInfo);

export default router;
