// frontend/src/pages/AboutPage.tsx

import React from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';

/**
 * About Page Component
 * Fixed navbar overlap issue with proper spacing
 */
const AboutPage: React.FC = () => {
  return (
    // Added mt-4 for proper spacing below navbar
    <Container className="py-5 mt-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-4">About ScholaChain</h1>
            <p className="lead text-muted">
              Transforming certificate verification with blockchain technology
            </p>
          </div>

          <Card className="certichain-card p-4 mb-5">
            <h3 className="fw-bold mb-4">Our Mission</h3>
            <p className="mb-4">
              ScholaChain addresses the growing problem of certificate fraud and
              verification inefficiencies in academic and professional settings.
              Using Ethereum blockchain technology, we offer a decentralized,
              transparent, and tamper-proof solution for issuing and verifying
              certificates and diplomas.
            </p>

            <Row>
              <Col md={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <div
                    className="feature-icon me-3"
                    style={{ width: '50px', height: '50px' }}
                  >
                    <i className="bi bi-shield-lock"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Immutable Records</h6>
                    <p className="text-muted small mb-0">
                      Once stored, certificates cannot be altered
                    </p>
                  </div>
                </div>
              </Col>

              <Col md={6} className="mb-3">
                <div className="d-flex align-items-center">
                  <div
                    className="feature-icon me-3"
                    style={{ width: '50px', height: '50px' }}
                  >
                    <i className="bi bi-lightning"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Instant Verification</h6>
                    <p className="text-muted small mb-0">
                      Verify any certificate in seconds
                    </p>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AboutPage;
