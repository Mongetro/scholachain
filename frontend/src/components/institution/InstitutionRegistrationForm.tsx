// frontend/src/components/institution/InstitutionRegistrationForm.tsx

/**
 * Institution Registration Form Component
 * Handles the registration of new educational institutions on the blockchain
 * Provides form validation and transaction status tracking
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useGovernanceService } from '../../hooks/useGovernanceService';
import { InstitutionRegistrationData } from '../../services/governanceService';

// Props interface for the component
interface InstitutionRegistrationFormProps {
  institutions: any[];
  onSuccess: (txHash: string, action: 'register') => void;
}

/**
 * InstitutionRegistrationForm Component
 * Provides a form for Ministry of Education to register new institutions
 * Includes validation and blockchain transaction handling
 */
const InstitutionRegistrationForm: React.FC<
  InstitutionRegistrationFormProps
> = ({ institutions, onSuccess }) => {
  // Form state management
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [institutionDescription, setInstitutionDescription] = useState('');
  const [institutionWebsite, setInstitutionWebsite] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ISSUER' | 'SUPER_ADMIN'>(
    'ISSUER',
  );
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<
    'idle' | 'waiting-wallet' | 'pending'
  >('idle');

  // Services and hooks
  const governanceService = useGovernanceService();
  const queryClient = useQueryClient();

  /**
   * Mutation for registering a new institution on blockchain
   * Handles the entire registration process including validation and transaction
   */
  const registerMutation = useMutation({
    mutationFn: async (data: InstitutionRegistrationData) => {
      setFormError(null);
      setTxStatus('waiting-wallet');

      // Validate Ethereum address format
      if (!governanceService.isValidEthereumAddress(data.address)) {
        setTxStatus('idle');
        throw new Error('Invalid Ethereum address');
      }

      // Validate institution name
      if (!data.name.trim()) {
        setTxStatus('idle');
        throw new Error('Institution name is required');
      }

      // Check for duplicate institution address
      const exists = institutions.some(
        (inst) => inst.address.toLowerCase() === data.address.toLowerCase(),
      );
      if (exists) {
        setTxStatus('idle');
        throw new Error('This institution address is already registered.');
      }

      // Execute blockchain transaction
      return await governanceService.registerInstitution(data);
    },
    onSuccess: (result) => {
      if (result.success && result.transactionHash) {
        // Notify parent component of success
        onSuccess(result.transactionHash, 'register');
        setTxStatus('idle');
        resetForm();
        setShowForm(false);
        // Refresh institutions list
        queryClient.invalidateQueries({ queryKey: ['institutions'] });
      }
    },
    onError: (error: any) => {
      setTxStatus('idle');
      if (error.message === 'USER_REJECTED') {
        setFormError('Transaction cancelled by user.');
      } else {
        setFormError(error.message || 'Registration failed.');
      }
      // Auto-clear error after 5 seconds
      setTimeout(() => setFormError(null), 5000);
    },
    onSettled: () => {
      setTxStatus('idle');
    },
  });

  /**
   * Reset form fields to initial state
   */
  const resetForm = () => {
    setInstitutionAddress('');
    setInstitutionName('');
    setInstitutionDescription('');
    setInstitutionWebsite('');
    setSelectedRole('ISSUER');
    setTxStatus('idle');
    setFormError(null);
  };

  /**
   * Handle form submission
   * Validates inputs and triggers registration mutation
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      address: institutionAddress,
      name: institutionName,
      description: institutionDescription,
      website: institutionWebsite,
      role: selectedRole,
    });
  };

  return (
    <>
      {/* Form Toggle Button and Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Institution Management</h4>
        <Button
          variant="primary"
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              resetForm();
            }
          }}
        >
          {showForm ? 'Cancel' : 'Add Institution'}
        </Button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <Card className="certichain-card mb-4">
          <Card.Header>
            <h5 className="mb-0">Register New Institution</h5>
          </Card.Header>
          <Card.Body>
            {/* Transaction Status Indicators */}
            {txStatus === 'waiting-wallet' && (
              <Alert variant="info" className="mb-3">
                <Spinner animation="border" size="sm" className="me-2" />
                <strong>Waiting for MetaMask confirmation...</strong>
                <br />
                <small>Please confirm the transaction in your wallet.</small>
              </Alert>
            )}

            {txStatus === 'pending' && (
              <Alert variant="warning" className="mb-3">
                <Spinner animation="border" size="sm" className="me-2" />
                <strong>Transaction in progress...</strong>
                <br />
                <small>Waiting for blockchain confirmation.</small>
              </Alert>
            )}

            {/* Error Display */}
            {formError && (
              <Alert variant="danger" className="mb-3">
                <strong>Error:</strong> {formError}
              </Alert>
            )}

            {/* Registration Form */}
            <Form onSubmit={handleSubmit}>
              <Row>
                {/* Institution Address Field */}
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Address *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="0x..."
                      value={institutionAddress}
                      onChange={(e) => setInstitutionAddress(e.target.value)}
                      disabled={txStatus !== 'idle'}
                      isInvalid={
                        !!institutionAddress &&
                        !governanceService.isValidEthereumAddress(
                          institutionAddress,
                        )
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      Invalid Ethereum address
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      The Ethereum address of the institution
                    </Form.Text>
                  </Form.Group>
                </Col>

                {/* Institution Name Field */}
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="University"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      disabled={txStatus !== 'idle'}
                    />
                    <Form.Text className="text-muted">
                      Official name of the institution
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {/* Institution Description Field */}
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={institutionDescription}
                  onChange={(e) => setInstitutionDescription(e.target.value)}
                  disabled={txStatus !== 'idle'}
                  placeholder="Brief description of the institution..."
                />
                <Form.Text className="text-muted">
                  Optional description of the institution
                </Form.Text>
              </Form.Group>

              <Row>
                {/* Website Field */}
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Website</Form.Label>
                    <Form.Control
                      type="url"
                      value={institutionWebsite}
                      onChange={(e) => setInstitutionWebsite(e.target.value)}
                      disabled={txStatus !== 'idle'}
                      placeholder="https://example.com"
                    />
                    <Form.Text className="text-muted">
                      Official website URL (optional)
                    </Form.Text>
                  </Form.Group>
                </Col>

                {/* Role Selection Field */}
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role *</Form.Label>
                    <Form.Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as any)}
                      disabled={txStatus !== 'idle'}
                    >
                      <option value="ISSUER">Issuer</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Issuer: Can issue certificates | Super Admin: Full system
                      access
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              {/* Action Buttons */}
              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={
                    txStatus !== 'idle' ||
                    !institutionAddress ||
                    !institutionName
                  }
                >
                  {txStatus !== 'idle' ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    'Register Institution'
                  )}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  disabled={txStatus !== 'idle'}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default InstitutionRegistrationForm;
