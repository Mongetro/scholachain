// frontend/src/components/certificate/CertificateVerification.tsx

/**
 * Enhanced Certificate Verification Component
 * Complete implementation with direct Etherscan transaction linking
 * Provides dual verification (Certificate ID + PDF File) with blockchain proof
 */

import React, { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useTransactionService } from '../../hooks/useTransactionService';

// API base URL from environment variables
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Enhanced verification result interface with transaction hash support
 * Includes complete certificate and verification details
 */
interface VerificationResult {
  isValid: boolean;
  certificate?: {
    id: number;
    documentHash: string;
    ipfsCID: string;
    issuer: string;
    holder: string;
    issuedAt: string;
    revoked: boolean;
    certificateType?: string;
    transactionHash?: string; // Transaction hash for direct Etherscan linking
  };
  verificationDetails?: {
    hashMatches: boolean;
    isRevoked: boolean;
    certificateExists: boolean;
    issuerAuthorized: boolean;
  };
  error?: string;
}

/**
 * Complete Certificate Verification Component
 * Enhanced with transaction hash retrieval for direct Etherscan linking
 */
const CertificateVerification: React.FC = () => {
  // === STATE MANAGEMENT ===
  const [certificateId, setCertificateId] = useState<string>('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Transaction-specific states
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [loadingTransaction, setLoadingTransaction] = useState<boolean>(false);

  // === SERVICES ===
  const transactionService = useTransactionService();

  /**
   * Validate certificate ID format
   * Accepts 0 and positive integers since certificate IDs start from 0 in blockchain
   */
  const isValidCertificateId = (id: string): boolean => {
    const idNum = parseInt(id);
    return !isNaN(idNum) && idNum >= 0;
  };

  /**
   * Handle file input change with comprehensive validation
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) {
      setCertificateFile(null);
      return;
    }

    // Validate file type - only PDF allowed
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed for certificate verification');
      setCertificateFile(null);
      return;
    }

    // Validate file size - 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB');
      setCertificateFile(null);
      return;
    }

    // File passed all validations
    setCertificateFile(file);
    setError(null);
    console.log(`✅ File selected for verification: ${file.name}`);
  };

  /**
   * Reset form and clear all states
   */
  const resetForm = (): void => {
    setCertificateId('');
    setCertificateFile(null);
    setVerificationResult(null);
    setError(null);
    setTransactionHash(null);

    // Clear file input element
    const fileInput = document.getElementById(
      'verification-file',
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  /**
   * Retrieve transaction hash for a verified certificate
   * Called automatically when a certificate is successfully verified
   */
  const fetchTransactionHash = async (certificateId: number): Promise<void> => {
    if (!transactionService.isServiceReady()) {
      console.warn(
        'Transaction service not ready, skipping transaction hash retrieval',
      );
      return;
    }

    setLoadingTransaction(true);
    try {
      console.log(
        `🔍 Retrieving transaction hash for certificate #${certificateId}`,
      );
      const hash = await transactionService.getCertificateTransactionHash(
        certificateId,
      );
      setTransactionHash(hash);

      if (hash) {
        console.log(`✅ Transaction hash retrieved: ${hash}`);
      } else {
        console.log('⚠️ No transaction hash found for this certificate');
      }
    } catch (error) {
      console.error('❌ Failed to fetch transaction hash:', error);
      setTransactionHash(null);
    } finally {
      setLoadingTransaction(false);
    }
  };

  /**
   * Generate Etherscan URL for certificate transaction
   * Prioritizes direct transaction hash, falls back to contract events
   */
  const getCertificateTransactionURL = (): string => {
    // PRIORITY 1: Direct transaction hash from verification result
    if (verificationResult?.certificate?.transactionHash) {
      return transactionService.getEtherscanTransactionURL(
        verificationResult.certificate.transactionHash,
      );
    }

    // PRIORITY 2: Transaction hash retrieved separately
    if (transactionHash) {
      return transactionService.getEtherscanTransactionURL(transactionHash);
    }

    // PRIORITY 3: Contract events page (fallback)
    return `${transactionService.getEtherscanContractURL()}?tab=events#address-tabs`;
  };

  /**
   * Get appropriate button text based on transaction availability
   */
  const getEtherscanButtonText = (): string => {
    if (loadingTransaction) {
      return 'Loading...';
    }

    if (verificationResult?.certificate?.transactionHash || transactionHash) {
      return 'View Transaction';
    }

    return 'View on Etherscan';
  };

  /**
   * Get tooltip text for Etherscan button
   */
  const getEtherscanTooltip = (): string => {
    if (verificationResult?.certificate?.transactionHash || transactionHash) {
      return 'View exact issuance transaction on Etherscan';
    }

    return 'View contract events on Etherscan';
  };

  /**
   * Main verification handler
   */
  const handleVerification = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Clear previous states
    setError(null);
    setVerificationResult(null);
    setTransactionHash(null);
    setIsVerifying(true);

    // Validate inputs before submission
    if (!isValidCertificateId(certificateId)) {
      setError('Please enter a valid certificate ID (0 or positive number)');
      setIsVerifying(false);
      return;
    }

    if (!certificateFile) {
      setError('Please select a PDF certificate file for verification');
      setIsVerifying(false);
      return;
    }

    try {
      console.log(`🔍 Starting verification for certificate #${certificateId}`);

      // Create FormData for file upload with certificate ID
      const formData = new FormData();
      formData.append('certificateId', certificateId);
      formData.append('file', certificateFile);

      // Send verification request to backend API
      const response = await fetch(`${API_BASE_URL}/api/certificates/verify`, {
        method: 'POST',
        body: formData,
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Verification failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      // Handle API-level errors
      if (!result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      // Set successful verification result
      setVerificationResult(result.data);
      console.log('✅ Verification completed:', result.data);

      // If certificate is valid, try to retrieve transaction hash
      if (result.data.isValid && result.data.certificate) {
        console.log('🔍 Certificate valid, retrieving transaction hash...');
        fetchTransactionHash(result.data.certificate.id);
      }
    } catch (err: any) {
      console.error('❌ Verification error:', err);
      setError(
        err.message || 'An unexpected error occurred during verification',
      );
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Format Ethereum address for display
   */
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  /**
   * Format ISO date string to human-readable format
   */
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Check if form can be submitted
   */
  const canSubmit: boolean =
    isValidCertificateId(certificateId) &&
    certificateFile !== null &&
    !isVerifying;

  return (
    <Card className="certichain-card">
      <Card.Header>
        <h4 className="mb-0">
          <i className="bi bi-shield-check me-2"></i>
          Verify Certificate Authenticity
        </h4>
        <small className="text-muted">
          Dual verification using certificate ID and PDF document with direct
          blockchain proof
        </small>
      </Card.Header>

      <Card.Body>
        {/* Verification Input Form */}
        <Form onSubmit={handleVerification}>
          <Row>
            {/* Certificate ID Input */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Certificate ID *</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter certificate ID (e.g., 0, 1, 2...)"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  disabled={isVerifying}
                  min="0"
                  isInvalid={
                    !!certificateId && !isValidCertificateId(certificateId)
                  }
                  isValid={
                    !!certificateId && isValidCertificateId(certificateId)
                  }
                />
                <Form.Control.Feedback type="invalid">
                  Please enter a valid certificate ID (0 or positive number)
                </Form.Control.Feedback>
                <Form.Control.Feedback type="valid">
                  ✓ Valid certificate ID format
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  The unique identifier number of the certificate (starts from
                  0)
                </Form.Text>
              </Form.Group>
            </Col>

            {/* PDF File Input */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>PDF Certificate Document *</Form.Label>
                <Form.Control
                  id="verification-file"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={isVerifying}
                  isInvalid={!!error && error.includes('file')}
                />
                {certificateFile && (
                  <div className="mt-2">
                    <small className="text-success">
                      <i className="bi bi-check-circle me-1"></i>
                      Selected: {certificateFile.name}
                    </small>
                  </div>
                )}
                <Form.Text className="text-muted">
                  Upload the original PDF certificate document (max 5MB)
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Error Display */}
          {error && (
            <Alert variant="danger" className="mb-4">
              <Alert.Heading>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Verification Error
              </Alert.Heading>
              {error}
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              type="submit"
              disabled={!canSubmit}
              size="lg"
              className="py-3 fw-semibold"
            >
              {isVerifying ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Verifying Certificate...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-check me-2"></i>
                  Verify Certificate
                </>
              )}
            </Button>

            {/* Reset button shown when form has content or results */}
            {(certificateId || certificateFile || verificationResult) && (
              <Button
                variant="outline-secondary"
                onClick={resetForm}
                disabled={isVerifying}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset Form
              </Button>
            )}
          </div>
        </Form>

        {/* Verification Results Section */}
        {verificationResult && (
          <div className="mt-5 pt-4 border-top">
            <h5 className="mb-4">
              <i className="bi bi-clipboard-check me-2"></i>
              Verification Results
            </h5>

            {/* Overall Verification Result Alert */}
            <Alert variant={verificationResult.isValid ? 'success' : 'danger'}>
              <Alert.Heading className="d-flex align-items-center">
                {verificationResult.isValid ? (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Certificate Verified Successfully!
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-circle me-2"></i>
                    Certificate Verification Failed
                  </>
                )}
              </Alert.Heading>

              {/* Detailed Verification Breakdown */}
              {verificationResult.verificationDetails && (
                <div className="mt-3">
                  <Row>
                    <Col md={6}>
                      <strong>Hash Match:</strong>{' '}
                      <Badge
                        bg={
                          verificationResult.verificationDetails.hashMatches
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {verificationResult.verificationDetails.hashMatches
                          ? 'Yes'
                          : 'No'}
                      </Badge>
                    </Col>
                    <Col md={6}>
                      <strong>Revocation Status:</strong>{' '}
                      <Badge
                        bg={
                          verificationResult.verificationDetails.isRevoked
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {verificationResult.verificationDetails.isRevoked
                          ? 'Revoked'
                          : 'Active'}
                      </Badge>
                    </Col>
                  </Row>
                  <Row className="mt-2">
                    <Col md={6}>
                      <strong>Certificate Exists:</strong>{' '}
                      <Badge
                        bg={
                          verificationResult.verificationDetails
                            .certificateExists
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {verificationResult.verificationDetails
                          .certificateExists
                          ? 'Yes'
                          : 'No'}
                      </Badge>
                    </Col>
                    <Col md={6}>
                      <strong>Issuer Authorized:</strong>{' '}
                      <Badge
                        bg={
                          verificationResult.verificationDetails
                            .issuerAuthorized
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {verificationResult.verificationDetails.issuerAuthorized
                          ? 'Yes'
                          : 'No'}
                      </Badge>
                    </Col>
                  </Row>
                </div>
              )}
            </Alert>

            {/* Certificate Details Card */}
            {verificationResult.certificate && (
              <Card className="mt-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Certificate Details</h6>
                  {/* Enhanced Etherscan Link Button */}
                  <Button
                    variant="outline-info"
                    size="sm"
                    href={getCertificateTransactionURL()}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={loadingTransaction}
                    title={getEtherscanTooltip()}
                  >
                    {loadingTransaction ? (
                      <Spinner animation="border" size="sm" className="me-1" />
                    ) : (
                      <i className="bi bi-link-45deg me-1"></i>
                    )}
                    {getEtherscanButtonText()}
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p>
                        <strong>Certificate ID:</strong> #
                        {verificationResult.certificate.id}
                      </p>
                      <p>
                        <strong>Type:</strong>{' '}
                        {verificationResult.certificate.certificateType ||
                          'General'}
                      </p>
                      <p>
                        <strong>Issuer:</strong>{' '}
                        <code
                          className="small"
                          title={verificationResult.certificate.issuer}
                        >
                          {formatAddress(verificationResult.certificate.issuer)}
                        </code>
                      </p>
                    </Col>
                    <Col md={6}>
                      <p>
                        <strong>Holder:</strong>{' '}
                        <code
                          className="small"
                          title={verificationResult.certificate.holder}
                        >
                          {formatAddress(verificationResult.certificate.holder)}
                        </code>
                      </p>
                      <p>
                        <strong>Issued:</strong>{' '}
                        {formatDate(verificationResult.certificate.issuedAt)}
                      </p>
                      <p>
                        <strong>IPFS CID:</strong>{' '}
                        <code
                          className="small"
                          title={verificationResult.certificate.ipfsCID}
                        >
                          {verificationResult.certificate.ipfsCID.slice(0, 10)}
                          ...
                        </code>
                      </p>
                    </Col>
                  </Row>

                  {/* Transaction Hash Display Section */}
                  {(verificationResult.certificate.transactionHash ||
                    transactionHash) && (
                    <div className="mt-3 p-3 bg-success bg-opacity-10 rounded border border-success border-opacity-25">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="fw-bold text-success mb-1">
                            <i className="bi bi-check-circle me-2"></i>
                            Direct Blockchain Proof Available
                          </h6>
                          <p className="mb-2 small">
                            <strong>Transaction Hash:</strong>{' '}
                            <code className="small">
                              {(verificationResult.certificate
                                .transactionHash || transactionHash)!.slice(
                                0,
                                20,
                              )}
                              ...
                            </code>
                          </p>
                          <p className="mb-0 small text-muted">
                            This certificate has a direct transaction record on
                            the blockchain. Click "View Transaction" to see the
                            exact issuance transaction.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document Hash Comparison Section */}
                  {verificationResult.verificationDetails && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6 className="fw-bold">Document Integrity Check</h6>
                      <p className="mb-2">
                        <strong>Stored Hash:</strong>{' '}
                        <code className="small">
                          {verificationResult.certificate.documentHash.slice(
                            0,
                            20,
                          )}
                          ...
                        </code>
                      </p>
                      <p className="mb-0">
                        <strong>Status:</strong>{' '}
                        {verificationResult.verificationDetails.hashMatches ? (
                          <span className="text-success">
                            <i className="bi bi-check-circle me-1"></i>
                            Document hash matches blockchain record
                          </span>
                        ) : (
                          <span className="text-danger">
                            <i className="bi bi-x-circle me-1"></i>
                            Document hash does not match - possible tampering
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Blockchain Verification Information */}
                  <div className="mt-3 p-3 bg-info bg-opacity-10 rounded border border-info border-opacity-25">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold text-info mb-1">
                          <i className="bi bi-link-45deg me-2"></i>
                          Blockchain Verification
                        </h6>
                        <p className="mb-0 small text-muted">
                          {verificationResult.certificate.transactionHash ||
                          transactionHash
                            ? 'This certificate is permanently recorded with a direct transaction on the Ethereum blockchain.'
                            : 'This certificate is permanently recorded on the Ethereum blockchain. View the contract events to verify its immutability.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Next Steps Guidance */}
            <Card className="mt-4">
              <Card.Body>
                <h6 className="fw-bold mb-3">Next Steps</h6>
                {verificationResult.isValid ? (
                  <ul className="mb-0">
                    <li>
                      You can trust this certificate and use it for official
                      purposes
                    </li>
                    {(verificationResult.certificate?.transactionHash ||
                      transactionHash) && (
                      <li>
                        Tell someone about <strong>ScholaChain</strong>{' '}
                      </li>
                    )}
                  </ul>
                ) : (
                  <ul className="mb-0">
                    <li>
                      Do not accept this certificate for official purposes
                    </li>
                    <li>Contact the issuing institution for verification</li>
                    <li>
                      Report suspicious certificates to the Ministry of
                      Education
                    </li>
                  </ul>
                )}
              </Card.Body>
            </Card>
          </div>
        )}

        {/* Informational Footer */}
        <div className="mt-4 pt-3 border-top">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            This verification compares the PDF document's cryptographic hash
            with the immutable blockchain record to ensure authenticity and
            detect any tampering. When available, direct transaction links
            provide exact blockchain proof.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CertificateVerification;
