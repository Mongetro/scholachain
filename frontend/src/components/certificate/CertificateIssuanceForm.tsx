// frontend/src/components/certificate/CertificateIssuanceForm.tsx

/**
 * Certificate Issuance Form Component - ENHANCED VERSION
 * Now properly stores transaction hash for direct Etherscan linking
 * Complete certificate issuance workflow with transaction tracking
 */

import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  ProgressBar,
  Row,
  Spinner,
} from 'react-bootstrap';
import { useWeb3 } from '../../contexts/Web3Context';
import { useCertificateService } from '../../hooks/useCertificateService';

// === PREDEFINED CERTIFICATE TYPES ===
const certificateTypes = [
  'Bachelor Degree',
  'Master Degree',
  'Ph.D. Degree',
  'Professional Diploma',
  'Course Completion Certificate',
  'Training Certificate',
  'Workshop Certificate',
  'Professional Certification',
  'Academic Transcript',
  'Other',
];

// API base URL from environment variables
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Enhanced interface for success data with transaction details
interface SuccessData {
  certificateId: number;
  finalCID: string;
  txHash: string; // Blockchain transaction hash for direct Etherscan linking
  holderAddress: string;
  certificateType: string;
  timestamp: string;
  documentHash?: string;
}

/**
 * Certificate Issuance Form Component
 * Enhanced to store transaction hash for direct blockchain verification linking
 */
const CertificateIssuanceForm: React.FC = () => {
  // === FORM INPUT STATES ===
  const [holderAddress, setHolderAddress] = useState<string>('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateType, setCertificateType] = useState<string>('');

  // === PROCESSING STATES ===
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('');

  // === SUCCESS AND ERROR STATES ===
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // === CONTEXT AND SERVICE HOOKS ===
  const { account } = useWeb3();
  const certificateService = useCertificateService();
  const queryClient = useQueryClient();

  /**
   * Validate Ethereum address format using regex pattern
   * @param addr - Ethereum address to validate
   * @returns boolean indicating if address is valid
   */
  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/i.test(addr);
  };

  /**
   * Check if form can be submitted
   * Validates all required fields and connection state
   */
  const canSubmit: boolean =
    isValidAddress(holderAddress) &&
    certificateFile !== null &&
    account !== null &&
    !isSubmitting;

  /**
   * Handle file input change with comprehensive validation
   * @param e - React change event from file input
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) {
      setCertificateFile(null);
      return;
    }

    // Validate file type - only PDF allowed for certificates
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed for certificates');
      setCertificateFile(null);
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB');
      setCertificateFile(null);
      return;
    }

    // File passed all validations
    setCertificateFile(file);
    setError(null);
    console.log(
      `✅ File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(
        2,
      )} MB)`,
    );
  };

  /**
   * Reset form inputs to initial state
   * Preserves success state for user feedback
   */
  const resetFormInputs = (): void => {
    setHolderAddress('');
    setCertificateFile(null);
    setCertificateType('');
    setProgress(0);
    setIsSubmitting(false);
    setCurrentStep('');
    setError(null);

    // Clear file input element
    const fileInput = document.getElementById(
      'certificate-file',
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    console.log('🔄 Form inputs reset');
  };

  /**
   * Handle successful certificate issuance with transaction details
   * Enhanced to store transaction hash for direct Etherscan linking
   * @param certificateId - ID of the issued certificate
   * @param finalCID - IPFS Content Identifier
   * @param txHash - Blockchain transaction hash (CRITICAL for Etherscan linking)
   * @param documentHash - SHA-256 document hash (optional)
   */
  const handleSuccess = (
    certificateId: number,
    finalCID: string,
    txHash: string,
    documentHash?: string,
  ): void => {
    const successData: SuccessData = {
      certificateId,
      finalCID,
      txHash, // Store transaction hash for direct blockchain verification
      holderAddress,
      certificateType: certificateType || 'General Certificate',
      timestamp: new Date().toISOString(),
      documentHash,
    };

    // Update success state
    setSuccessData(successData);
    setShowSuccess(true);

    // Reset form inputs but keep success alert
    resetFormInputs();

    // Invalidate and refetch certificate queries
    queryClient.invalidateQueries({ queryKey: ['certificates'] });
    queryClient.invalidateQueries({ queryKey: ['certificates-all'] });

    // Dispatch global event for other components
    window.dispatchEvent(
      new CustomEvent('certificate-issued', {
        detail: successData,
      }),
    );

    console.log('✅ Certificate issuance completed successfully:', {
      certificateId,
      txHash,
      finalCID,
      holderAddress,
    });
  };

  /**
   * Handle issuance errors with proper user feedback
   * @param errorMessage - Error message to display
   */
  const handleError = (errorMessage: string): void => {
    console.error('❌ Certificate issuance error:', errorMessage);
    setError(errorMessage);
    setIsSubmitting(false);
    setProgress(0);
    setCurrentStep('');

    // Auto-hide error after 10 seconds
    setTimeout(() => setError(null), 10000);
  };

  /**
   * Extract holder address from preparation response with fallback
   * Handles both old nested structure and new flat structure
   * @param prepData - Preparation response data
   * @returns Holder address string
   */
  const extractHolderAddress = (prepData: any): string => {
    console.log(
      '🔍 Extracting holder address from preparation response:',
      prepData,
    );

    // Try new flat structure first
    if (prepData.data?.holderAddress) {
      console.log(
        '✅ Using flat structure holderAddress:',
        prepData.data.holderAddress,
      );
      return prepData.data.holderAddress;
    }

    // Try old nested structure as fallback
    if (prepData.data?.addresses?.holder?.address) {
      console.log(
        '✅ Using nested structure addresses.holder.address:',
        prepData.data.addresses.holder.address,
      );
      return prepData.data.addresses.holder.address;
    }

    // Try alternative nested structure
    if (prepData.data?.addresses?.holder) {
      console.log(
        '✅ Using nested structure addresses.holder:',
        prepData.data.addresses.holder,
      );
      return prepData.data.addresses.holder;
    }

    // Last resort: use the original holder address from form
    console.log(
      '⚠️ Using original form holder address as fallback:',
      holderAddress,
    );
    return holderAddress;
  };

  /**
   * Main form submission handler
   * Executes the complete certificate issuance workflow with transaction tracking
   * @param e - React form submission event
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Clear previous states
    setError(null);
    setShowSuccess(false);
    setSuccessData(null);
    setIsSubmitting(true);
    setProgress(10);

    console.log('🚀 Starting certificate issuance workflow...');

    // === VALIDATION PHASE ===
    if (!isValidAddress(holderAddress)) {
      handleError(
        'Please enter a valid Ethereum address for the certificate holder',
      );
      return;
    }

    if (!certificateFile) {
      handleError('Please select a PDF certificate document');
      return;
    }

    if (!account) {
      handleError('Please connect your wallet to issue certificates');
      return;
    }

    try {
      // === STEP 1: UPLOAD TO IPFS FIRST (Get real CID) ===
      setCurrentStep('Uploading document to IPFS...');
      setProgress(20);

      const formData = new FormData();
      formData.append('file', certificateFile);

      console.log('📤 Uploading file to IPFS to get real CID...');

      // Upload to IPFS FIRST to get the real CID
      const ipfsUploadRes = await fetch(`${API_BASE_URL}/api/ipfs/upload`, {
        method: 'POST',
        body: formData,
      });

      // Handle IPFS upload response
      if (!ipfsUploadRes.ok) {
        const errorText = await ipfsUploadRes.text();
        throw new Error(
          `IPFS upload failed: ${ipfsUploadRes.status} ${errorText}`,
        );
      }

      const ipfsUploadData = await ipfsUploadRes.json();

      // Debug log for response structure
      console.log('📄 IPFS Upload response structure:', ipfsUploadData);

      if (!ipfsUploadData.success || !ipfsUploadData.data) {
        throw new Error(
          ipfsUploadData.error || 'Invalid IPFS upload response from server',
        );
      }

      // Extract data from IPFS upload response
      const realIPFSCID = ipfsUploadData.data.ipfsCID; // Real CID from IPFS upload
      const documentHash = ipfsUploadData.data.documentHash; // SHA-256 hash
      const fileBuffer = ipfsUploadData.data.fileBuffer; // Base64 encoded file

      // Validate that we have a real CID
      if (!realIPFSCID) {
        console.error('❌ IPFS response structure:', ipfsUploadData);
        throw new Error(
          'IPFS upload did not return a valid CID. Response: ' +
            JSON.stringify(ipfsUploadData.data),
        );
      }

      console.log(`✅ IPFS upload successful - Real CID: ${realIPFSCID}`);
      console.log(`✅ Document hash: ${documentHash}`);

      setProgress(40);
      setCurrentStep('IPFS upload complete, preparing certificate data...');

      // === STEP 2: PREPARE CERTIFICATE WITH REAL IPFS CID ===
      const preparationData = {
        documentHash: documentHash,
        ipfsCID: realIPFSCID, // Use REAL CID from IPFS upload
        holderAddress: holderAddress,
        issuerAddress: account, // Current connected wallet address
        certificateType: certificateType || '',
      };

      console.log('📝 Preparation data:', preparationData);

      const prepareRes = await fetch(
        `${API_BASE_URL}/api/certificates/prepare-issuance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preparationData),
        },
      );

      if (!prepareRes.ok) {
        const errorText = await prepareRes.text();
        console.error('❌ Preparation failed with response:', errorText);
        throw new Error(
          `Preparation failed: ${prepareRes.status} ${errorText}`,
        );
      }

      const prepData = await prepareRes.json();
      console.log('📄 Preparation response structure:', prepData);

      if (!prepData.success || !prepData.data) {
        throw new Error(
          prepData.error || 'Invalid preparation response from server',
        );
      }

      // Extract holder address safely
      const finalHolderAddress = extractHolderAddress(prepData);
      console.log(`✅ Final holder address determined: ${finalHolderAddress}`);

      const { preparation } = prepData.data;

      // Validate preparation data
      if (
        !preparation.requiredParameters?.documentHash ||
        !preparation.requiredParameters?.ipfsCID
      ) {
        throw new Error('Incomplete preparation data received from server');
      }

      console.log(
        `✅ Preparation successful with IPFS CID: ${preparation.requiredParameters.ipfsCID}`,
      );

      setProgress(60);
      setCurrentStep(
        'Certificate data prepared, sending blockchain transaction...',
      );

      // === STEP 3: BLOCKCHAIN TRANSACTION WITH REAL IPFS CID ===
      // This is where we get the transaction hash for Etherscan linking
      const txResult = await certificateService.issueCertificateReal({
        documentHash: preparation.requiredParameters.documentHash,
        ipfsCID: preparation.requiredParameters.ipfsCID, // REAL CID, not temporary
        holderAddress: finalHolderAddress,
        certificateType: certificateType || '',
      });

      if (
        !txResult.success ||
        !txResult.transactionHash ||
        txResult.certificateId === undefined
      ) {
        throw new Error(txResult.error || 'Blockchain transaction failed');
      }

      console.log(
        `✅ Blockchain transaction successful: ${txResult.transactionHash}`,
      );
      console.log(`✅ Certificate ID: ${txResult.certificateId}`);

      setProgress(80);
      setCurrentStep('Transaction confirmed, finalizing certificate...');

      // === STEP 4: FINALIZE CERTIFICATE (IPFS already done - just confirmation) ===
      const finalizeRes = await fetch(`${API_BASE_URL}/api/ipfs/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBuffer: fileBuffer,
          filename: certificateFile.name,
          transactionHash: txResult.transactionHash, // Pass transaction hash for record
          certificateId: txResult.certificateId,
          ipfsCID: realIPFSCID, // Include the real CID for verification
        }),
      });

      // Finalization is optional - don't fail if it has issues
      if (!finalizeRes.ok) {
        const errorText = await finalizeRes.text();
        console.warn(`⚠️ Finalization warning: ${errorText}`);
        // Continue with success - certificate is already on blockchain
      } else {
        const finalizeData = await finalizeRes.json();
        if (!finalizeData.success) {
          console.warn('⚠️ Finalization completed with warnings');
        } else {
          console.log('✅ Finalization completed successfully');
        }
      }

      // Use the REAL IPFS CID that was already uploaded
      const finalCID = preparation.requiredParameters.ipfsCID;

      setProgress(100);
      setCurrentStep('Certificate issued successfully!');

      // === SUCCESS COMPLETION ===
      // Pass transaction hash to handleSuccess for Etherscan linking
      handleSuccess(
        txResult.certificateId,
        finalCID, // REAL CID
        txResult.transactionHash, // TRANSACTION HASH for direct Etherscan linking
        preparation.requiredParameters.documentHash,
      );

      // Reset progress after delay
      setTimeout(() => {
        setProgress(0);
        setCurrentStep('');
      }, 2000);
    } catch (err: any) {
      console.error('❌ Certificate issuance workflow failed:', err);

      // Provide user-friendly error messages
      let userErrorMessage =
        err.message ||
        'An unexpected error occurred during certificate issuance';

      // Handle specific error cases
      if (err.message.includes('user rejected transaction')) {
        userErrorMessage =
          'Transaction was rejected in MetaMask. Please approve the transaction to issue the certificate.';
      } else if (err.message.includes('insufficient funds')) {
        userErrorMessage =
          'Insufficient funds for transaction. Please ensure you have enough ETH for gas fees.';
      } else if (err.message.includes('IPFS upload')) {
        userErrorMessage =
          'Failed to upload document to storage. Please try again or check your connection.';
      }

      handleError(userErrorMessage);
    }
  };

  // === RENDER COMPONENT ===
  return (
    <Card className="certichain-card">
      <Card.Header>
        <h4 className="mb-0">
          <i className="bi bi-file-earmark-plus me-2"></i>
          Issue New Certificate/Diploma
        </h4>
      </Card.Header>

      <Card.Body>
        {/* Progress Bar */}
        {progress > 0 && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted">{currentStep}</small>
              <small className="text-muted">{progress}%</small>
            </div>
            <ProgressBar
              now={progress}
              animated={progress < 100}
              striped={progress < 100}
              variant={progress === 100 ? 'success' : 'primary'}
              className="mb-0"
            />
          </div>
        )}

        {/* Success Alert (persists after form reset) */}
        {showSuccess && successData && (
          <Alert
            variant="success"
            className="mb-4"
            dismissible
            onClose={() => setShowSuccess(false)}
          >
            <Alert.Heading>
              <i className="bi bi-check-circle me-2"></i>
              Certificate Issued Successfully!
            </Alert.Heading>
            <div className="mt-3">
              <p className="mb-2">
                <strong>Certificate ID:</strong>{' '}
                <code className="bg-light px-2 py-1 rounded">
                  #{successData.certificateId}
                </code>
              </p>

              <p className="mb-2">
                <strong>Holder Address:</strong>{' '}
                <code className="bg-light px-2 py-1 rounded">
                  {successData.holderAddress}
                </code>
              </p>

              <p className="mb-2">
                <strong>Certificate/Diploma Type:</strong>{' '}
                {successData.certificateType}
              </p>

              <p className="mb-2">
                <strong>IPFS CID:</strong>{' '}
                <code className="bg-light px-2 py-1 rounded">
                  {successData.finalCID}
                </code>
              </p>

              {/* Transaction Hash - CRITICAL for Etherscan linking */}
              <p className="mb-2">
                <strong>Transaction Hash:</strong>{' '}
                <code className="bg-light px-2 py-1 rounded small">
                  {successData.txHash.slice(0, 20)}...
                </code>
              </p>

              {successData.documentHash && (
                <p className="mb-2">
                  <strong>Document Hash:</strong>{' '}
                  <code className="bg-light px-2 py-1 rounded small">
                    {successData.documentHash.slice(0, 20)}...
                  </code>
                </p>
              )}

              <p className="mb-3">
                <strong>Issued At:</strong>{' '}
                {new Date(successData.timestamp).toLocaleString()}
              </p>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-3">
              {/* Direct link to transaction on Etherscan */}
              <a
                href={`https://sepolia.etherscan.io/tx/${successData.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-info"
              >
                <i className="bi bi-link-45deg me-1"></i>
                View Transaction on Etherscan
              </a>

              <a
                href={`https://gateway.pinata.cloud/ipfs/${successData.finalCID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-success"
              >
                <i className="bi bi-eye me-1"></i>
                View Document on IPFS
              </a>

              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    successData.certificateId.toString(),
                  );
                }}
              >
                <i className="bi bi-clipboard me-1"></i>
                Copy ID
              </Button>
            </div>
            <hr />
            <i className="bi bi-info-circle me-1"></i>
            Option to send information by email to the recipient after the
            certificate is issued - coming soon ...
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            variant="danger"
            className="mb-4"
            dismissible
            onClose={() => setError(null)}
          >
            <Alert.Heading>
              <i className="bi bi-exclamation-triangle me-2"></i>
              Issuance Failed
            </Alert.Heading>
            {error}
          </Alert>
        )}

        {/* Main Form */}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Holder Ethereum Address *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="0x742d35Cc6634C0532925a3b8D..."
                  value={holderAddress}
                  onChange={(e) => setHolderAddress(e.target.value)}
                  disabled={isSubmitting}
                  isInvalid={!!holderAddress && !isValidAddress(holderAddress)}
                  isValid={!!holderAddress && isValidAddress(holderAddress)}
                  className="font-monospace"
                />
                <Form.Control.Feedback type="invalid">
                  Please enter a valid Ethereum address (0x followed by 40 hex
                  characters)
                </Form.Control.Feedback>
                <Form.Control.Feedback type="valid">
                  ✓ Valid Ethereum address format
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  The recipient's Ethereum wallet address. This cannot be
                  changed after issuance.
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Certificate/Diploma Type</Form.Label>
                <Form.Select
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Select a certificate type...</option>
                  {certificateTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Choose the type of certificate from the list
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-4">
            <Form.Label>PDF Certificate/Diploma Document *</Form.Label>
            <Form.Control
              id="certificate-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
              isInvalid={!!error && error.includes('file')}
            />
            {certificateFile && (
              <div className="mt-2">
                <small className="text-success">
                  <i className="bi bi-check-circle me-1"></i>
                  Selected: {certificateFile.name} (
                  {(certificateFile.size / 1024 / 1024).toFixed(2)} MB)
                </small>
              </div>
            )}
            <Form.Text className="text-muted">
              Upload the PDF certificate document. Maximum file size: 5MB. The
              document will be stored on IPFS for permanent access.
            </Form.Text>
          </Form.Group>

          {/* Action Buttons */}
          <div className="d-grid gap-2">
            <Button
              variant="primary"
              type="submit"
              disabled={!canSubmit}
              size="lg"
              className="py-3 fw-semibold"
            >
              {isSubmitting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Issuing Certificate...
                </>
              ) : (
                <>
                  <i className="bi bi-file-earmark-check me-2"></i>
                  Issue Certificate
                </>
              )}
            </Button>

            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={resetFormInputs}
                disabled={isSubmitting}
                className="flex-fill"
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset Form
              </Button>

              {showSuccess && (
                <Button
                  variant="outline-success"
                  onClick={() => setShowSuccess(false)}
                  className="flex-fill"
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Hide Success
                </Button>
              )}
            </div>
          </div>
        </Form>

        {/* Connection Status */}
        {!account && (
          <Alert variant="warning" className="mt-3">
            <i className="bi bi-wallet2 me-2"></i>
            Please connect your wallet to issue certificates. You need an
            authorized issuer account.
          </Alert>
        )}

        {/* Information Footer */}
        <div className="mt-4 pt-3 border-top">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            The certificate metadata and hash will be permanently stored on the
            Ethereum blockchain and IPFS. This action requires a blockchain
            transaction and will incur gas fees. The transaction hash will be
            stored for direct blockchain verification.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CertificateIssuanceForm;
