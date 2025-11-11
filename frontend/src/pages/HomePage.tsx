// frontend/src/pages/HomePage.tsx

import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
//import VerificationForm from '../components/certificate/CertificateVerificationForm';
import CertificateVerification from '../components/certificate/CertificateVerification';
import SystemStatus from '../components/common/SystemStatus';
import FeaturesSection from '../components/layout/FeaturesSection';
import HeroSection from '../components/layout/HeroSection';

/**
 * Home Page Component
 * Fixed navbar overlap issue
 */
const HomePage: React.FC = () => {
  return (
    <>
      {/* Hero section handles its own spacing */}
      <HeroSection />
      <FeaturesSection />

      {/* Verification section with proper spacing */}
      <section id="verification-section" className="py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} xl={6}>
              <div className="text-center mb-5">
                <h2 className="display-6 fw-bold mb-3">Verify Certificate</h2>
                <p className="text-muted">
                  Enter the certificate ID and document hash to verify
                  authenticity on the blockchain
                </p>
              </div>

              <CertificateVerification />
            </Col>

            <Col lg={4} xl={3} className="mt-5 mt-lg-0">
              <div className="d-lg-none mb-4">
                <SystemStatus />
              </div>

              <div className="certichain-card p-4 text-center">
                <div
                  className="feature-icon mb-3"
                  style={{ width: '60px', height: '60px' }}
                >
                  <i className="bi bi-question-circle"></i>
                </div>
                <h6 className="fw-bold">How to Verify</h6>
                <p className="small text-muted mb-0">
                  1. Get certificate ID and PDF (from recipient or issuer)
                  <br />
                  2. Upload informations to Verify Certificate form
                  <br />
                  3. System calculate PDF SHA-256 hash & compares it to the
                  blockchain hash
                  <br />
                  4. Certificate verified ✅
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default HomePage;
