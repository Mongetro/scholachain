// frontend/src/components/layout/HeroSection.tsx

import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';

/**
 * Hero Section Component - Full width with proper navigation
 */
const HeroSection: React.FC = () => {
  const scrollToSection = useSmoothScroll();

  return (
    <section className="hero-section">
      {/* Custom container for centered content */}
      <div className="hero-content">
        <Row className="align-items-center text-center text-lg-start hero-min-height">
          {/* Main Content Column */}
          <Col lg={7} className="mb-5 mb-lg-0">
            <div className="pe-lg-5">
              <h1 className="display-4 fw-bold mb-4">
                Verify Certificates & Diplomas on the{' '}
                <span className="d-block text-warning mt-2">Blockchain</span>
              </h1>

              <p className="lead mb-4 opacity-90 fs-5">
                ScholaChain ensures the issuance and tamper-proof verification
                of academic and professional certificates using Ethereum
                blockchain technology. Ensure authenticity with decentralized,
                immutable trust.
              </p>

              <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-lg-start mb-4">
                <Button
                  size="lg"
                  className="btn-primary px-4 py-3 fw-semibold"
                  onClick={() => scrollToSection('verification-section')}
                >
                  <i className="bi bi-search me-2"></i>
                  Verify Certificate
                </Button>

                <Button
                  variant="outline-light"
                  size="lg"
                  className="px-4 py-3 fw-semibold"
                  onClick={() => scrollToSection('features')}
                >
                  <i className="bi bi-info-circle me-2"></i>
                  Learn More
                </Button>
              </div>

              <div className="trust-indicator mt-4 pt-3">
                <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-4 text-white-50 small">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-shield-check text-info me-2"></i>
                    <span>Blockchain Secured</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-lightning text-warning me-2"></i>
                    <span>Instant Verification</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-globe text-info me-2"></i>
                    <span>Decentralized</span>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          {/* Visual Element Column */}
          <Col lg={5}>
            <div className="hero-visual-container">
              <div className="certichain-card p-4 p-lg-5 hero-visual-element">
                <div className="feature-icon mx-auto mb-4">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h4 className="fw-bold mb-3 text-dark text-center">
                  Immutable Verification
                </h4>
                <p className="text-muted mb-0 text-center">
                  Every certificate is permanently stored on the Ethereum
                  blockchain, ensuring it can never be altered or forged.
                </p>
              </div>

              <div className="hero-background-element">
                <i className="bi bi-link-45deg display-1 text-white"></i>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default HeroSection;
