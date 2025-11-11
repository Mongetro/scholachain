// frontend/src/pages/AdminPage.tsx

/**
 * Admin Page Component
 * Ministry of Education administration panel for managing institutions
 * Provides institution registration, revocation, and reactivation functionality
 * Access restricted to SUPER_ADMIN role only
 */

import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap';
import InstitutionList from '../components/institution/InstitutionList';
import InstitutionRegistrationForm from '../components/institution/InstitutionRegistrationForm';
import { useWeb3 } from '../contexts/Web3Context';
import { useGovernanceService } from '../hooks/useGovernanceService';

/**
 * AdminPage Component
 * Main administration interface for Ministry of Education
 * Manages institution registration and role management
 */
const AdminPage: React.FC = () => {
  // State for success notifications and transaction tracking
  const [successTxHash, setSuccessTxHash] = useState<string | null>(null);
  const [successAction, setSuccessAction] = useState<
    'register' | 'revoke' | 'reactivate' | null
  >(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Web3 and service hooks
  const { account, loading: web3Loading } = useWeb3();
  const governanceService = useGovernanceService();

  /**
   * Query to check if current user is Ministry of Education (SUPER_ADMIN)
   * Only SUPER_ADMIN can access this administration panel
   */
  const {
    data: isMinistry,
    isLoading: checkingMinistry,
    error: ministryCheckError,
  } = useQuery({
    queryKey: ['check-ministry', account],
    queryFn: () => governanceService.isMinistryOfEducation(),
    enabled: !!account && !web3Loading,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  /**
   * Query to fetch all registered institutions from blockchain
   * Includes both active and revoked institutions
   */
  const { data: institutions = [], isLoading: loadingInstitutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => governanceService.getInstitutions(),
    enabled: !!account && !!isMinistry,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });

  /**
   * Handle successful transactions from child components
   * Shows success notification with transaction details
   */
  const handleSuccess = (
    txHash: string,
    action: 'register' | 'revoke' | 'reactivate',
  ) => {
    setSuccessTxHash(txHash);
    setSuccessAction(action);
    setShowSuccessModal(true);
  };

  /**
   * Handle institution revocation
   * Wrapper function for revocation service call
   */
  const handleRevoke = async (address: string, reason: string) => {
    return await governanceService.revokeInstitution({
      institutionAddress: address,
      reason,
    });
  };

  /**
   * Handle institution reactivation
   * Wrapper function for reactivation service call
   */
  const handleReactivate = async (address: string) => {
    return await governanceService.reactivateInstitution(address);
  };

  /**
   * Close success modal and reset success state
   */
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessTxHash(null);
    setSuccessAction(null);
  };

  /**
   * Calculate statistics for dashboard cards
   */
  const activeInstitutions = institutions.filter((i) => i.isActive);
  const revokedInstitutions = institutions.filter((i) => !i.isActive);
  const superAdmins = institutions.filter((i) => i.role === 'SUPER_ADMIN');

  /**
   * Get success message based on action type
   */
  const getSuccessMessage = () => {
    if (!successAction || !successTxHash) return null;

    const titles = {
      register: 'Institution Registered Successfully!',
      revoke: 'Institution Revoked Successfully!',
      reactivate: 'Institution Reactivated Successfully!',
    };

    return titles[successAction];
  };

  /**
   * Get Etherscan URL for transaction
   */
  const getEtherscanUrl = () => {
    if (!successTxHash) return '#';
    return `https://sepolia.etherscan.io/tx/${successTxHash}`;
  };

  // ==================== RENDER LOGIC ====================

  /**
   * Loading state while checking permissions or loading data
   */
  if (web3Loading || checkingMinistry) {
    return (
      <Container className="py-5 mt-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="certichain-card text-center p-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h4>
                {web3Loading
                  ? 'Initializing Blockchain Connection...'
                  : 'Checking Administrative Permissions...'}
              </h4>
              <p className="text-muted">
                Please wait while we verify your administrative permissions...
              </p>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  /**
   * Access denied state for non-Ministry users
   */
  if (ministryCheckError || !isMinistry) {
    return (
      <Container className="py-5 mt-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Alert variant="warning" className="text-center">
              <Alert.Heading>
                <i className="bi bi-shield-exclamation me-2"></i>
                Access Restricted - Ministry Administration
              </Alert.Heading>

              {!account ? (
                <>
                  <p className="mb-3">
                    Please connect your MetaMask wallet to access the Ministry
                    Administration panel.
                  </p>
                  <p className="mb-0">
                    You need a Ministry of Education (SUPER_ADMIN) account to
                    manage institutions.
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-3">
                    <strong>
                      {account.slice(0, 10)}...{account.slice(-8)}
                    </strong>{' '}
                    is not authorized to access Ministry Administration.
                  </p>
                  <p className="mb-3">
                    Only the <strong>Ministry of Education</strong> account
                    (SUPER_ADMIN) can manage educational institutions and their
                    issuance rights.
                  </p>
                  <div className="mb-3">
                    <p className="mb-2">
                      <strong>Ministry Administration allows you to:</strong>
                    </p>
                    <ul className="text-start">
                      <li>Register new educational institutions</li>
                      <li>Grant ISSUER or SUPER_ADMIN roles</li>
                      <li>Revoke or reactivate institution privileges</li>
                      <li>Monitor all registered institutions</li>
                    </ul>
                  </div>
                  <p className="mb-0">
                    <small className="text-muted">
                      If you believe this is an error, please ensure you are
                      using the correct Ministry of Education wallet account.
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

  /**
   * Main administration interface for authorized SUPER_ADMIN users
   */
  return (
    <Container className="py-5 mt-4">
      <Row className="justify-content-center">
        <Col lg={12}>
          {/* Page Header */}
          <div className="text-center mb-5">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <h1 className="display-5 fw-bold mb-0 me-3">
                Ministry Administration
              </h1>
              <span className="badge bg-success px-3 py-2">
                <i className="bi bi-patch-check me-2"></i>
                SUPER_ADMIN
              </span>
            </div>
            <p className="lead text-muted">
              Manage educational institutions and their certificate issuance
              rights as the Ministry of Education
            </p>
          </div>

          {/* Statistics Dashboard */}
          <Row className="mb-5">
            <Col md={3}>
              <Card className="certichain-card text-center">
                <Card.Body>
                  <h3 className="text-primary fw-bold">
                    {institutions.length}
                  </h3>
                  <p className="text-muted mb-0">Total Institutions</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="certichain-card text-center">
                <Card.Body>
                  <h3 className="text-success fw-bold">
                    {activeInstitutions.length}
                  </h3>
                  <p className="text-muted mb-0">Active</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="certichain-card text-center">
                <Card.Body>
                  <h3 className="text-warning fw-bold">
                    {revokedInstitutions.length}
                  </h3>
                  <p className="text-muted mb-0">Revoked</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="certichain-card text-center">
                <Card.Body>
                  <h3 className="text-info fw-bold">{superAdmins.length}</h3>
                  <p className="text-muted mb-0">Super Admins</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Institution Registration Form */}
          <InstitutionRegistrationForm
            institutions={institutions}
            onSuccess={handleSuccess}
          />

          {/* Institution List */}
          <InstitutionList
            institutions={institutions}
            onRevoke={handleRevoke}
            onReactivate={handleReactivate}
          />
        </Col>
      </Row>

      {/* Success Transaction Modal */}
      <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-check-circle text-success me-2"></i>
            Transaction Successful
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success">
            <Alert.Heading>{getSuccessMessage()}</Alert.Heading>
            <p className="mb-2">
              <strong>Transaction Hash:</strong>
            </p>
            <code className="d-block p-2 bg-light rounded mb-3 small">
              {successTxHash}
            </code>
            <p className="mb-0">
              The transaction has been confirmed on the blockchain. You can view
              the details on Etherscan.
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseSuccessModal}>
            Close
          </Button>
          <Button
            variant="primary"
            href={getEtherscanUrl()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="bi bi-link-45deg me-2"></i>
            View on Etherscan
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminPage;
