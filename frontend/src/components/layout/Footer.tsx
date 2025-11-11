// frontend/src/components/layout/Footer.tsx

import React from 'react';
import { Col, Row } from 'react-bootstrap';

/**
 * Professional footer component - Full width without Bootstrap containers
 */
const Footer: React.FC = () => {
  return (
    <footer className="certichain-footer">
      <div className="footer-content">
        <Row>
          <Col lg={4} className="mb-4">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-shield-check me-2"></i>
              ScholaChain
            </h5>
            <p className="text-muted">
              Revolutionizing certificate and Diploma verification with
              blockchain technology. Secure, transparent, and tamper-proof.
            </p>
          </Col>

          <Col lg={2} className="mb-4">
            <h6 className="fw-bold mb-3">Product</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a
                  href="#verification-section"
                  className="text-muted text-decoration-none"
                >
                  Verify Certificate
                </a>
              </li>
              <li className="mb-2">
                <a href="#features" className="text-muted text-decoration-none">
                  Features
                </a>
              </li>
              <li className="mb-2">
                <a href="/about" className="text-muted text-decoration-none">
                  About
                </a>
              </li>
            </ul>
          </Col>

          <Col lg={3} className="mb-4">
            <h6 className="fw-bold mb-3">Technology</h6>
            <ul className="list-unstyled">
              <li className="mb-2 text-muted">Ethereum Blockchain</li>
              <li className="mb-2 text-muted">IPFS Storage</li>
              <li className="mb-2 text-muted">Smart Contracts</li>
              <li className="mb-2 text-muted">Node.js & React/TypeScript </li>
            </ul>
          </Col>

          <Col lg={3}>
            <h6 className="fw-bold mb-3">Network</h6>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-shield-check text-success me-2"></i>
              <span className="text-muted">Sepolia Testnet</span>
            </div>
            <div className="text-muted small mb-3">
              Contract: 0x955E...Ea5c0
            </div>
            <div className="d-flex gap-3">
              <a
                href="https://github.com/Mongetro"
                className="text-muted"
                title="GitHub"
              >
                <i className="bi bi-github fs-5"></i>
              </a>
              <a
                href="https://x.com/mongetrogoint"
                className="text-muted"
                title="Twitter"
              >
                <i className="bi bi-twitter fs-5"></i>
              </a>
              <a
                href="https://www.linkedin.com/in/mongetro-goint-ph-d-227b94141/"
                className="text-muted"
                title="LinkedIn"
              >
                <i className="bi bi-linkedin fs-5"></i>
              </a>
              <a
                href="https://github.com/Mongetro/scholachain"
                className="text-muted"
                title="Documentation"
              >
                <i className="bi bi-file-text fs-5"></i>
              </a>

              <a
                href="https://sites.google.com/view/mongetrogoint"
                className="text-muted"
                title="Website"
              >
                <i className="bi bi-globe text-info fs-5"></i>
              </a>
            </div>
          </Col>
        </Row>

        <hr className="my-4 border-secondary" />

        <Row className="align-items-center">
          <Col md={6}>
            <p className="text-muted mb-0">
              &copy; 2025 ScholaChain (by{' '}
              <a
                href="https://www.linkedin.com/in/mongetro-goint-ph-d-227b94141/"
                className="text-muted text-decoration-none"
              >
                Mongetro Goint
              </a>
              ). All rights reserved.
            </p>
          </Col>
          <Col md={5} className="text-md-end">
            <div className="text-muted small">
              Built with ❤️ for transparency and authenticity of diplomas and
              certificates!
            </div>
          </Col>
        </Row>
      </div>
    </footer>
  );
};

export default Footer;
