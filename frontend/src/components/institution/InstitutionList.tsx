// frontend/src/components/institution/InstitutionList.tsx

/**
 * Institution List Component
 * Displays all registered institutions with management actions
 * Supports revocation and reactivation of institutions
 */

import React, { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';

// Props interface for the component
interface InstitutionListProps {
  institutions: any[];
  onRevoke: (address: string, reason: string) => Promise<any>;
  onReactivate: (address: string) => Promise<any>;
}

/**
 * InstitutionList Component
 * Displays a table of registered institutions with management actions
 * Provides revocation and reactivation functionality
 */
const InstitutionList: React.FC<InstitutionListProps> = ({
  institutions,
  onRevoke,
  onReactivate,
}) => {
  // State management for modals and actions
  const [showRevocationModal, setShowRevocationModal] = useState(false);
  const [showReactivationModal, setShowReactivationModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /**
   * Handle institution revocation
   * Calls parent handler and manages loading state
   */
  const handleRevoke = async () => {
    if (!selectedInstitution) return;

    setIsProcessing(true);
    setActionError(null);

    try {
      const result = await onRevoke(
        selectedInstitution.address,
        revocationReason,
      );

      if (result.success) {
        setShowRevocationModal(false);
        setSelectedInstitution(null);
        setRevocationReason('');
      } else {
        setActionError(result.error || 'Revocation failed');
      }
    } catch (error: any) {
      console.error('Revocation failed:', error);
      setActionError(error.message || 'Revocation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle institution reactivation
   * Calls parent handler and manages loading state
   */
  const handleReactivate = async () => {
    if (!selectedInstitution) return;

    setIsProcessing(true);
    setActionError(null);

    try {
      const result = await onReactivate(selectedInstitution.address);

      if (result.success) {
        setShowReactivationModal(false);
        setSelectedInstitution(null);
      } else {
        setActionError(result.error || 'Reactivation failed');
      }
    } catch (error: any) {
      console.error('Reactivation failed:', error);
      setActionError(error.message || 'Reactivation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Open revocation confirmation modal
   */
  const openRevokeModal = (institution: any) => {
    setSelectedInstitution(institution);
    setRevocationReason('');
    setActionError(null);
    setShowRevocationModal(true);
  };

  /**
   * Open reactivation confirmation modal
   */
  const openReactivationModal = (institution: any) => {
    setSelectedInstitution(institution);
    setActionError(null);
    setShowReactivationModal(true);
  };

  /**
   * Close all modals and reset state
   */
  const closeModals = () => {
    setShowRevocationModal(false);
    setShowReactivationModal(false);
    setSelectedInstitution(null);
    setRevocationReason('');
    setActionError(null);
    setIsProcessing(false);
  };

  /**
   * Format Ethereum address for display
   */
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  return (
    <>
      {/* Institutions Table Card */}
      <Card className="certichain-card">
        <Card.Header>
          <h5 className="mb-0">Registered Institutions</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {institutions.length === 0 ? (
            // Empty state
            <div className="text-center p-5">
              <h5>No Institutions Registered</h5>
              <p className="text-muted">
                Start by registering your first educational institution.
              </p>
            </div>
          ) : (
            // Institutions Table
            <div className="table-responsive">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Address</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Website</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((inst, index) => (
                    <tr key={index}>
                      {/* Institution Address */}
                      <td>
                        <code className="small" title={inst.address}>
                          {formatAddress(inst.address)}
                        </code>
                      </td>

                      {/* Institution Name and Description */}
                      <td>
                        <strong>{inst.name}</strong>
                        {inst.description && (
                          <>
                            <br />
                            <small className="text-muted">
                              {inst.description}
                            </small>
                          </>
                        )}
                      </td>

                      {/* Role Badge */}
                      <td>
                        <Badge
                          bg={
                            inst.role === 'SUPER_ADMIN' ? 'danger' : 'primary'
                          }
                        >
                          {inst.role}
                        </Badge>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <Badge bg={inst.isActive ? 'success' : 'warning'}>
                          {inst.isActive ? 'Active' : 'Revoked'}
                        </Badge>
                      </td>

                      {/* Website Link */}
                      <td>
                        {inst.website ? (
                          <a
                            href={inst.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none"
                          >
                            {inst.website}
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td>
                        {/* Revoke button for active ISSUER institutions */}
                        {inst.role === 'ISSUER' && inst.isActive && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => openRevokeModal(inst)}
                            title="Revoke institution privileges"
                          >
                            Revoke
                          </Button>
                        )}

                        {/* Reactivate button for revoked ISSUER institutions */}
                        {inst.role === 'ISSUER' && !inst.isActive && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => openReactivationModal(inst)}
                            title="Reactivate institution privileges"
                          >
                            Reactivate
                          </Button>
                        )}

                        {/* No actions for SUPER_ADMIN or already processed institutions */}
                        {inst.role === 'SUPER_ADMIN' && (
                          <span className="text-muted small">System Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Revocation Confirmation Modal */}
      <Modal show={showRevocationModal} onHide={closeModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle text-warning me-2"></i>
            Revoke Institution
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Warning Alert */}
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>Important: This action is permanent!</Alert.Heading>
            <p className="mb-0">
              Revoking an institution will prevent it from issuing new
              certificates. This action requires a blockchain transaction.
            </p>
          </Alert>

          {/* Error Display */}
          {actionError && (
            <Alert variant="danger" className="mb-3">
              {actionError}
            </Alert>
          )}

          {/* Institution Details */}
          {selectedInstitution && (
            <div className="mb-3 p-3 bg-light rounded">
              <h6 className="fw-bold mb-3">Institution Details</h6>
              <Row>
                <Col sm={6}>
                  <strong>Name:</strong>
                  <br />
                  {selectedInstitution.name}
                </Col>
                <Col sm={6}>
                  <strong>Address:</strong>
                  <br />
                  <code className="small">{selectedInstitution.address}</code>
                </Col>
              </Row>
              {selectedInstitution.description && (
                <Row className="mt-2">
                  <Col>
                    <strong>Description:</strong>
                    <br />
                    {selectedInstitution.description}
                  </Col>
                </Row>
              )}
            </div>
          )}

          {/* Revocation Reason Input */}
          <Form.Group>
            <Form.Label>
              <strong>Reason for Revocation *</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter reason for revocation..."
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              disabled={isProcessing}
            />
            <Form.Text className="text-muted">
              This reason will be recorded on the blockchain for transparency.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeModals}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRevoke}
            disabled={!revocationReason.trim() || isProcessing}
          >
            {isProcessing ? (
              <>
                <Spinner
                  animation="border"
                  size="sm"
                  className="me-2"
                  role="status"
                  aria-hidden="true"
                />
                Revoking...
              </>
            ) : (
              <>
                <i className="bi bi-slash-circle me-2"></i>
                Revoke Institution
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reactivation Confirmation Modal */}
      <Modal show={showReactivationModal} onHide={closeModals} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-check-circle text-success me-2"></i>
            Reactivate Institution
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Info Alert */}
          <Alert variant="info" className="mb-4">
            <Alert.Heading>Reactivate Institution</Alert.Heading>
            <p className="mb-0">
              This will restore the institution's ability to issue certificates.
              This action requires a blockchain transaction.
            </p>
          </Alert>

          {/* Error Display */}
          {actionError && (
            <Alert variant="danger" className="mb-3">
              {actionError}
            </Alert>
          )}

          {/* Institution Details */}
          {selectedInstitution && (
            <div className="mb-3">
              <h6 className="fw-bold mb-3">Institution Details</h6>
              <Row>
                <Col sm={6}>
                  <strong>Name:</strong>
                  <br />
                  {selectedInstitution.name}
                </Col>
                <Col sm={6}>
                  <strong>Address:</strong>
                  <br />
                  <code className="small">{selectedInstitution.address}</code>
                </Col>
              </Row>
              {selectedInstitution.description && (
                <Row className="mt-2">
                  <Col>
                    <strong>Description:</strong>
                    <br />
                    {selectedInstitution.description}
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeModals}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleReactivate}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Spinner
                  animation="border"
                  size="sm"
                  className="me-2"
                  role="status"
                  aria-hidden="true"
                />
                Reactivating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Reactivate Institution
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default InstitutionList;
