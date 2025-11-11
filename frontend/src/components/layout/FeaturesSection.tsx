// frontend/src/components/layout/FeaturesSection.tsx

import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';

/**
 * Features Section Component - Full width with proper navigation
 */
const FeaturesSection: React.FC = () => {
  const scrollToSection = useSmoothScroll();

  const features = [
    {
      icon: 'bi-shield-lock',
      title: 'Tamper-Proof Storage',
      description:
        'Certificates are permanently recorded on Ethereum blockchain, making them immutable and secure against alteration.',
    },
    {
      icon: 'bi-lightning',
      title: 'Instant Verification',
      description:
        'Verify any certificate in seconds using cryptographic hash comparison on the blockchain.',
    },
    {
      icon: 'bi-globe',
      title: 'Fully Decentralized',
      description:
        'Built on Ethereum with no central authority. Trust is distributed across the network.',
    },
    {
      icon: 'bi-eye',
      title: 'Transparent & Private',
      description:
        'Public verification while maintaining data privacy through cryptographic hashing.',
    },
    {
      icon: 'bi-cloud-check',
      title: 'IPFS Integration',
      description:
        'Certificate documents are stored in a decentralized way on the decentralized IPFS network for permanent availability.',
    },
    {
      icon: 'bi-graph-up',
      title: 'Cost Efficient',
      description:
        'Blockchain technology makes the process of verifying certificates and diplomas more affordable for educational institutions.',
    },
  ];

  return (
    <section id="features" className="features-section py-5">
      <div className="features-content">
        {/* Section Header */}
        <Row className="text-center mb-5">
          <Col lg={8} className="mx-auto">
            <h2 className="display-5 fw-bold mb-4 text-dark">
              Why Choose ScholaChain?
            </h2>
            <p className="lead text-muted mb-0">
              Revolutionizing certificate verification with blockchain
              technology. Secure, transparent, and tamper-proof.
            </p>
          </Col>
        </Row>

        {/* Features Grid */}
        <Row className="g-4">
          {features.map((feature, index) => (
            <Col lg={4} md={6} key={index}>
              <div className="feature-item feature-stagger">
                <div className="feature-icon">
                  <i className={`bi ${feature.icon}`}></i>
                </div>
                <h5 className="fw-bold mb-3 text-dark">{feature.title}</h5>
                <p className="text-muted mb-0 lh-base">{feature.description}</p>
              </div>
            </Col>
          ))}
        </Row>

        {/* Call to Action */}
        <Row className="mt-5 pt-4">
          <Col lg={8} className="mx-auto text-center">
            <div className="certichain-card p-4 p-md-5">
              <h4 className="fw-bold mb-3 text-dark">Ready to Get Started?</h4>
              <p className="text-muted mb-4">
                Join institutions worldwide that trust ScholaChain for secure
                certificate verification.
              </p>
              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <Button
                  className="btn-primary px-4 py-2 fw-semibold"
                  onClick={() => scrollToSection('verification-section')}
                >
                  <i className="bi bi-search me-2"></i>
                  Verify a Certificate
                </Button>
                <Button
                  href="/about"
                  variant="outline-primary"
                  className="px-4 py-2 fw-semibold"
                >
                  <i className="bi bi-info-circle me-2"></i>
                  Learn More
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default FeaturesSection;
