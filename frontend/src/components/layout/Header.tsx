// frontend/src/components/layout/Header.tsx
import React, { useEffect, useState } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import MetaMaskAccount from '../common/WalletAccount';

/**
 * Header Component with Fixed Active State Management
 * Handles active navigation states for both pages and homepage sections
 */
const Header: React.FC = () => {
  const location = useLocation();
  const scrollToSection = useSmoothScroll();

  // State to force re-renders when hash changes
  const [currentHash, setCurrentHash] = useState(location.hash);

  // Update hash state when location changes
  useEffect(() => {
    setCurrentHash(location.hash);
  }, [location]);

  /**
   * Determines if a navigation item is currently active
   * @param path - The route path
   * @param sectionId - The section ID for homepage sections
   * @returns boolean indicating if the item is active
   */
  const isActive = (path: string, sectionId?: string): boolean => {
    // For separate pages (Admin, Issue Certificate, About)
    if (path !== '/') {
      return location.pathname === path;
    }

    // For homepage sections (Features, Verify Certificate)
    if (sectionId && location.pathname === '/') {
      return currentHash === `#${sectionId}`;
    }

    // Homepage without specific section (top of page)
    return location.pathname === '/' && !currentHash;
  };

  /**
   * Returns the CSS class for active navigation items
   */
  const getActiveClass = (path: string, sectionId?: string): string => {
    return isActive(path, sectionId) ? 'active-nav-link' : '';
  };

  /**
   * Handles section navigation clicks with proper state management
   */
  const handleSectionClick = (sectionId: string) => {
    if (location.pathname === '/') {
      // We're already on homepage - update hash and scroll
      const newHash = `#${sectionId}`;
      window.history.pushState(null, '', newHash);
      setCurrentHash(newHash); // Force re-render
      scrollToSection(sectionId);
    } else {
      // Navigate to homepage with section hash
      window.location.href = `/#${sectionId}`;
    }
  };

  /**
   * Handles regular page navigation
   */
  const handlePageClick = (path: string) => {
    // Reset hash state when navigating to a different page
    setCurrentHash('');
  };

  return (
    <>
      <Navbar expand="lg" fixed="top" className="certichain-navbar">
        <Container fluid className="navbar-content">
          {/* Brand Logo */}
          <Navbar.Brand
            href="/"
            className={`fw-bold me-4 ${getActiveClass('/')}`}
            onClick={() => handlePageClick('/')}
          >
            <i className="bi bi-shield-check me-2"></i>
            <strong>ScholaChain</strong>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">
            {/* Main Navigation */}
            <Nav className="me-auto">
              {/* Admin Page Link */}
              <Nav.Link
                href="/admin"
                className={`fw-semibold ${getActiveClass('/admin')}`}
                onClick={() => handlePageClick('/admin')}
              >
                <i className="bi bi-shield-lock me-1"></i>
                Admin
              </Nav.Link>

              {/* Issue Certificate Page Link */}
              <Nav.Link
                href="/issue-certificate"
                className={`fw-semibold ${getActiveClass(
                  '/issue-certificate',
                )}`}
                onClick={() => handlePageClick('/issue-certificate')}
              >
                <i className="bi bi-file-earmark-plus me-1"></i>
                Issue Certificate
              </Nav.Link>

              {/* Verify Certificate Section (Homepage) */}
              <Nav.Link
                href="#verification-section"
                className={`fw-semibold ${getActiveClass(
                  '/',
                  'verification-section',
                )}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionClick('verification-section');
                }}
              >
                <i className="bi bi-search me-1"></i>
                Verify Certificate
              </Nav.Link>

              {/* Features Section (Homepage) */}
              <Nav.Link
                href="#features"
                className={`fw-semibold ${getActiveClass('/', 'features')}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleSectionClick('features');
                }}
              >
                <i className="bi bi-stars me-1"></i>
                Features
              </Nav.Link>

              {/* About Page Link */}
              <Nav.Link
                href="/about"
                className={`fw-semibold ${getActiveClass('/about')}`}
                onClick={() => handlePageClick('/about')}
              >
                <i className="bi bi-info-circle me-1"></i>
                About
              </Nav.Link>
            </Nav>

            {/* MetaMask Wallet Integration */}
            <div className="ms-3">
              <MetaMaskAccount />
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Spacer to prevent content from being hidden behind fixed navbar */}
      <div className="navbar-spacer"></div>
    </>
  );
};

export default Header;
