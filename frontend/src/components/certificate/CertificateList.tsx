// frontend/src/components/certificate/CertificateList.tsx

/**
 * Enhanced Certificate List Component
 * Displays certificates issued by the current user with advanced features:
 * - Clickable IPFS CID links to view documents
 * - Search and filter functionality
 * - Certificate revocation capability
 */

import { useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useWeb3 } from '../../contexts/Web3Context';
import useCertificates from '../../hooks/useCertificates';

const CertificateList: React.FC = () => {
  // === STATE MANAGEMENT ===
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showRevokeModal, setShowRevokeModal] = useState<boolean>(false);
  const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
  const [revocationReason, setRevocationReason] = useState<string>('');
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  // === HOOKS AND SERVICES ===
  const {
    certificates,
    isLoadingCertificates,
    certificatesError,
    refetchCertificates,
  } = useCertificates();

  const { account, signer, contractConfigs } = useWeb3();
  const queryClient = useQueryClient();

  /**
   * Filter certificates based on search criteria
   * Searches in certificate ID, holder address, certificate type, and IPFS CID
   * FIXED: Now properly searches certificate ID as string
   */
  const filteredCertificates = useMemo(() => {
    if (!searchTerm.trim()) return certificates;

    const searchLower = searchTerm.toLowerCase();
    return certificates.filter((cert) => {
      // Search in certificate ID (convert to string for proper matching)
      if (cert.id.toString().toLowerCase().includes(searchLower)) {
        return true;
      }
      // Search in holder address
      if (cert.holder.toLowerCase().includes(searchLower)) {
        return true;
      }
      // Search in certificate type
      if (
        cert.certificateType &&
        cert.certificateType.toLowerCase().includes(searchLower)
      ) {
        return true;
      }
      // Search in IPFS CID
      if (cert.ipfsCID.toLowerCase().includes(searchLower)) {
        return true;
      }
      return false;
    });
  }, [certificates, searchTerm]);

  /**
   * Format Ethereum address for display
   * Shows first 8 and last 6 characters for readability
   */
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  /**
   * Format date to readable string
   */
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Generate IPFS gateway URL for certificate document
   * Uses Pinata gateway for reliable access
   */
  const getIPFSGatewayURL = (ipfsCID: string): string => {
    return `https://gateway.pinata.cloud/ipfs/${ipfsCID}`;
  };

  /**
   * Check if contract configuration is available for blockchain operations
   */
  const isContractAvailable = (): boolean => {
    return !!(
      contractConfigs.scholachain &&
      contractConfigs.scholachain.address &&
      contractConfigs.scholachain.abi
    );
  };

  /**
   * Handle certificate revocation process
   * Sends blockchain transaction to revoke the selected certificate
   */
  const handleRevokeCertificate = async (): Promise<void> => {
    if (!selectedCertificate || !account || !signer) {
      toast.error('Cannot revoke certificate: Missing required information');
      return;
    }

    // Validate contract configuration
    if (!isContractAvailable()) {
      toast.error(
        'Cannot revoke certificate: Contract configuration not available',
      );
      return;
    }

    setIsRevoking(true);

    try {
      console.log(
        `🔄 Starting revocation for certificate #${selectedCertificate.id}`,
      );

      const { Contract } = await import('ethers');

      // Use non-null assertion since we validated contract configuration
      const scholachainContract = new Contract(
        contractConfigs.scholachain!.address,
        contractConfigs.scholachain!.abi,
        signer,
      );

      // Execute revocation transaction
      const transaction = await scholachainContract.revokeCertificate(
        BigInt(selectedCertificate.id),
      );

      console.log('⏳ Revocation transaction sent:', transaction.hash);
      toast.success('Revocation transaction submitted...');

      // Wait for transaction confirmation
      const receipt = await transaction.wait();

      if (receipt.status === 1) {
        console.log('✅ Certificate revoked successfully!');
        toast.success(
          `Certificate #${selectedCertificate.id} revoked successfully`,
        );

        // Close modal and reset states
        setShowRevokeModal(false);
        setSelectedCertificate(null);
        setRevocationReason('');

        // Refresh certificate list
        queryClient.invalidateQueries({ queryKey: ['certificates'] });
        refetchCertificates();
      } else {
        throw new Error('Transaction failed on blockchain');
      }
    } catch (error: any) {
      console.error('❌ Certificate revocation failed:', error);

      let errorMessage = 'Revocation failed';
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Revocation cancelled by user in MetaMask';
      } else if (error.reason) {
        errorMessage = `Contract error: ${error.reason}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsRevoking(false);
    }
  };

  /**
   * Open revocation confirmation modal
   */
  const openRevokeModal = (certificate: any): void => {
    // Check if contract is available before allowing revocation
    if (!isContractAvailable()) {
      toast.error('Cannot revoke certificate: Contract not configured');
      return;
    }

    setSelectedCertificate(certificate);
    setRevocationReason('');
    setShowRevokeModal(true);
  };

  /**
   * Close revocation modal and reset states
   */
  const closeRevokeModal = (): void => {
    setShowRevokeModal(false);
    setSelectedCertificate(null);
    setRevocationReason('');
    setIsRevoking(false);
  };

  /**
   * Refresh certificate list
   */
  const handleRefresh = (): void => {
    queryClient.invalidateQueries({ queryKey: ['certificates'] });
    refetchCertificates();
    toast.success('Refreshing certificates...');
  };

  // === RENDER COMPONENT ===

  // Loading state
  if (isLoadingCertificates) {
    return (
      <Card className="certichain-card">
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p>Loading your certificates...</p>
        </Card.Body>
      </Card>
    );
  }

  // Error state
  if (certificatesError) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Certificates</Alert.Heading>
        <p>Failed to load your certificates. Please try again.</p>
        <Button variant="outline-danger" size="sm" onClick={handleRefresh}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <>
      <Card className="certichain-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-files me-2"></i>
            Certificates I Issued
          </h5>
          <Button variant="outline-primary" size="sm" onClick={handleRefresh}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </Button>
        </Card.Header>

        <Card.Body>
          {/* Search and Filter Section */}
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by ID, holder address, type, or IPFS CID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="bi bi-x"></i>
                    </Button>
                  )}
                </InputGroup>
                <Form.Text className="text-muted">
                  Search through your issued certificates (e.g., "1", "0x742d",
                  "Bachelor", "Qm...")
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex align-items-end">
              <div className="text-muted small">
                Showing {filteredCertificates.length} of {certificates.length}{' '}
                certificate
                {certificates.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            </Col>
          </Row>

          {/* Certificates Table */}
          {filteredCertificates.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-4 text-muted mb-3"></i>
              <h5>
                {searchTerm
                  ? 'No Matching Certificates'
                  : 'No Certificates Issued Yet'}
              </h5>
              <p className="text-muted">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Certificates you issue will appear here.'}
              </p>
              {searchTerm && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>ID</th>
                    <th>Holder</th>
                    <th>Type</th>
                    <th>Issued Date</th>
                    <th>Status</th>
                    <th>IPFS CID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate.id}>
                      <td>
                        <strong>#{certificate.id}</strong>
                      </td>
                      <td>
                        <code className="small" title={certificate.holder}>
                          {formatAddress(certificate.holder)}
                        </code>
                      </td>
                      <td>{certificate.certificateType || 'General'}</td>
                      <td>
                        <small title={certificate.issuedAt.toISOString()}>
                          {formatDate(certificate.issuedAt)}
                        </small>
                      </td>
                      <td>
                        <Badge
                          bg={certificate.revoked ? 'warning' : 'success'}
                          className={certificate.revoked ? 'text-dark' : ''}
                        >
                          {certificate.revoked ? (
                            <>
                              <i className="bi bi-slash-circle me-1"></i>
                              Revoked
                            </>
                          ) : (
                            <>
                              <i className="bi bi-check-circle me-1"></i>
                              Active
                            </>
                          )}
                        </Badge>
                      </td>
                      <td>
                        <a
                          href={getIPFSGatewayURL(certificate.ipfsCID)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                          title="View document on IPFS"
                          onClick={(e) => {
                            // Check if it's a temporary CID (not yet uploaded to IPFS)
                            if (certificate.ipfsCID.startsWith('pending_')) {
                              e.preventDefault();
                              toast.error('Document not yet uploaded to IPFS');
                            }
                          }}
                        >
                          <code className="small text-primary">
                            <i className="bi bi-box-arrow-up-right me-1"></i>
                            {certificate.ipfsCID.slice(0, 10)}...
                          </code>
                        </a>
                      </td>
                      <td>
                        {!certificate.revoked && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => openRevokeModal(certificate)}
                            title="Revoke this certificate"
                            disabled={!isContractAvailable()}
                          >
                            Revoke
                          </Button>
                        )}
                        {certificate.revoked && (
                          <span className="text-muted small">Revoked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>

        {filteredCertificates.length > 0 && (
          <Card.Footer className="bg-transparent border-0">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Showing {filteredCertificates.length} certificate
                {filteredCertificates.length !== 1 ? 's' : ''}
              </small>
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Click IPFS CID to view document
              </small>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Revocation Confirmation Modal */}
      <Modal show={showRevokeModal} onHide={closeRevokeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
            Revoke Certificate
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>Important: This action is permanent!</Alert.Heading>
            <p className="mb-0">
              Revoking a certificate is irreversible and will permanently mark
              it as invalid on the blockchain.
            </p>
          </Alert>

          {selectedCertificate && (
            <div className="mb-4 p-3 bg-light rounded">
              <h6 className="fw-bold mb-3">Certificate Details</h6>
              <Row>
                <Col sm={6}>
                  <strong>Certificate ID:</strong>
                  <br />
                  <code>#{selectedCertificate.id}</code>
                </Col>
                <Col sm={6}>
                  <strong>Holder:</strong>
                  <br />
                  <code className="small">
                    {formatAddress(selectedCertificate.holder)}
                  </code>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col sm={6}>
                  <strong>Type:</strong>
                  <br />
                  {selectedCertificate.certificateType || 'General'}
                </Col>
                <Col sm={6}>
                  <strong>Issued:</strong>
                  <br />
                  <small>{formatDate(selectedCertificate.issuedAt)}</small>
                </Col>
              </Row>
            </div>
          )}

          <Form.Group>
            <Form.Label>
              <strong>Reason for Revocation (Optional)</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter reason for revocation..."
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              disabled={isRevoking}
            />
            <Form.Text className="text-muted">
              This information is for your records and will not be stored on the
              blockchain.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeRevokeModal}
            disabled={isRevoking}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRevokeCertificate}
            disabled={isRevoking || !isContractAvailable()}
          >
            {isRevoking ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Revoking...
              </>
            ) : (
              <>
                <i className="bi bi-slash-circle me-2"></i>
                Revoke Certificate
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CertificateList;
