// frontend/src/pages/IssueCertificatePage.tsx

/**
 * Issue Certificate Page - WITH ISSUER AUTHORIZATION CHECK
 * Only accessible to authorized issuer addresses
 * Includes certificate list, issuance form, and information sidebar
 */

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Alert, Col, Container, Row, Spinner } from 'react-bootstrap';
import CertificateIssuanceForm from '../components/certificate/CertificateIssuanceForm';
import CertificateList from '../components/certificate/CertificateList';
import { useWeb3 } from '../contexts/Web3Context';
import { useGovernanceService } from '../hooks/useGovernanceService';

/**
 * Issue Certificate Page Component
 * Restricted to authorized issuers only
 */
const IssueCertificatePage: React.FC = () => {
  const { account, loading: web3Loading } = useWeb3();
  const governanceService = useGovernanceService();

  // Query to check if current user is authorized to issue certificates
  const {
    data: isIssuerAuthorized,
    isLoading: checkingAuthorization,
    error: authorizationError,
  } = useQuery({
    queryKey: ['issuer-authorization', account],
    queryFn: async () => {
      if (!account) {
        console.log('❌ No account connected for issuer authorization check');
        return false;
      }

      console.log(`🔍 Checking issuer authorization for: ${account}`);
      const authorized = await governanceService.isIssuerAuthorized(account);
      console.log(`✅ Issuer authorization result: ${authorized}`);
      return authorized;
    },
    enabled: !!account && !web3Loading,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Show loading state while checking authorization
  if (web3Loading || checkingAuthorization) {
    return (
      <Container className="py-5 mt-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h4>
                {web3Loading
                  ? 'Connecting to Blockchain...'
                  : 'Checking Issuer Authorization...'}
              </h4>
              <p className="text-muted">
                Please wait while we verify your issuer permissions...
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  // Show error state if authorization check failed
  if (authorizationError) {
    return (
      <Container className="py-5 mt-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Alert variant="danger" className="text-center">
              <Alert.Heading>Authorization Check Failed</Alert.Heading>
              <p>
                We couldn't verify your issuer authorization status. Please try
                refreshing the page.
              </p>
              <p className="mb-0">
                <small className="text-muted">
                  Error:{' '}
                  {authorizationError instanceof Error
                    ? authorizationError.message
                    : 'Unknown error'}
                </small>
              </p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // Show access denied if user is not authorized
  if (!isIssuerAuthorized) {
    return (
      <Container className="py-5 mt-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Alert variant="warning" className="text-center">
              <Alert.Heading>
                <i className="bi bi-shield-exclamation me-2"></i>
                Access Restricted
              </Alert.Heading>

              {!account ? (
                <>
                  <p className="mb-3">
                    Please connect your MetaMask wallet to access the
                    certificate issuance page.
                  </p>
                  <p className="mb-0">
                    You need an authorized issuer account to issue certificates.
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-3">
                    <strong>
                      {account.slice(0, 10)}...{account.slice(-8)}
                    </strong>{' '}
                    is not authorized to issue certificates.
                  </p>
                  <p className="mb-3">
                    Only registered educational institutions with issuer
                    privileges can create certificates on the blockchain.
                  </p>
                  <div className="mb-3">
                    <p className="mb-2">
                      <strong>To become an authorized issuer:</strong>
                    </p>
                    <ol className="text-start">
                      <li>
                        Contact the Ministry of Education for registration
                      </li>
                      <li>
                        Provide your institution details and Ethereum address
                      </li>
                      <li>Wait for approval from the Ministry administrator</li>
                    </ol>
                  </div>
                  <p className="mb-0">
                    <small className="text-muted">
                      If you believe this is an error, please contact the system
                      administrator.
                    </small>
                  </p>
                </>
              )}
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }

  // Main content for authorized issuers
  return (
    <Container className="py-5 mt-4">
      <Row>
        {/* Main Content Column */}
        <Col lg={8} className="mb-5">
          {/* Page Header with Authorization Badge */}
          <div className="text-center mb-5">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <h1 className="display-5 fw-bold mb-0 me-3">
                Issue Certificate & Diploma
              </h1>
              <span className="badge bg-success px-3 py-2">
                <i className="bi bi-patch-check me-2"></i>
                Authorized Issuer
              </span>
            </div>
            <p className="lead text-muted">
              Create and issue tamper-proof certificates on the blockchain as a
              verified educational institution
            </p>
          </div>

          {/* Issuance Form */}
          <CertificateIssuanceForm />

          {/* Certificate List */}
          <div className="mt-5">
            <CertificateList />
          </div>
        </Col>

        {/* === SIDEBAR PANEL: Additional Information Section for Authorized Issuers + Process Steps === */}
        <Col lg={4}>
          {/* Security Features Card */}
          <div className="certichain-card p-4 mb-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-journal-text me-2"></i>
              Issuer Guidelines & Best Practices
            </h6>
            <h6 className="fw-bold mt-3">Before Issuance</h6>
            <ul className="text-muted">
              <li>Verify the recipient's identity and eligibility</li>
              <li>Ensure certificate content is accurate and complete</li>
              <li>Validate PDF document meets quality standards</li>
              <li>Confirm recipient's Ethereum address is correct</li>
            </ul>

            <h6 className="fw-bold mt-3">After Issuance</h6>
            <ul className="text-muted">
              <li>Provide certificate ID to recipient for verification</li>
              <li>Keep records of issued certificates for auditing</li>
              <li>Monitor certificate status and revoke if necessary</li>
              <li>Educate recipients on verification process</li>
            </ul>

            <div className="mt-3 pt-3 border-top">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                As an authorized issuer, you are responsible for the integrity
                and accuracy of all certificates issued under your institution.
              </small>
            </div>
          </div>

          {/* Issuance Process Card */}
          <div className="certichain-card p-4 mb-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-info-circle me-2"></i>
              Issuance Process
            </h6>
            <div className="d-flex flex-column gap-3 align-items-start">
              <div className="d-flex align-items-start w-100">
                <div
                  className="feature-icon me-3"
                  style={{ width: '20px', height: '20px' }}
                >
                  <i className="bi bi-1-circle"></i>
                </div>
                <div className="flex-grow-1 text-start">
                  <h6 className="fw-bold mb-1">Upload & Prepare</h6>
                  <p className="text-muted small mb-0">
                    The system loads the certificate/diploma information and the
                    PDF. It validates the data and generates the document hash.
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-start">
                <div
                  className="feature-icon me-3"
                  style={{ width: '20px', height: '20px' }}
                >
                  <i className="bi bi-2-circle"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Blockchain Transaction</h6>
                  <p className="text-muted small mb-0">
                    Confirm & sign the transaction in MetaMask to record on
                    Ethereum
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-start">
                <div
                  className="feature-icon me-3"
                  style={{ width: '20px', height: '20px' }}
                >
                  <i className="bi bi-3-circle"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">IPFS Storage</h6>
                  <p className="text-muted small mb-0">
                    Document stored on decentralized IPFS network
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Features Card */}
          <div className="certichain-card p-4 mb-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-shield-check me-2"></i>
              Security Features
            </h6>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle text-success me-2"></i>
                <span className="small">Immutable Blockchain Record</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle text-success me-2"></i>
                <span className="small">SHA-256 Document Hashing</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle text-success me-2"></i>
                <span className="small">Decentralized IPFS Storage</span>
              </div>

              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle text-success me-2"></i>
                <span className="small">Instant Verification</span>
              </div>
            </div>
          </div>

          {/* Requirements Card */}
          <div className="certichain-card p-4">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-list-check me-2"></i>
              Requirements
            </h6>
            <div className="d-flex flex-column gap-2">
              <div className="d-flex align-items-center">
                <i className="bi bi-file-pdf text-primary me-2"></i>
                <span className="small">PDF Document (max 5MB)</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-wallet2 text-primary me-2"></i>
                <span className="small">Connected MetaMask Wallet</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-person-check text-primary me-2"></i>
                <span className="small">Authorized Issuer Account</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-currency-dollar text-primary me-2"></i>
                <span className="small">ETH for Gas Fees</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default IssueCertificatePage;
