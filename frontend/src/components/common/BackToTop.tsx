// frontend/src/components/common/BackToTop.tsx

/**
 * BackToTop Component
 * Provides a smooth scroll-to-top functionality with fade-in/fade-out animation
 * Appears when user scrolls down and allows quick return to top of page
 */

import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';

/**
 * BackToTop Component
 * Displays a floating button that appears when user scrolls down
 * Clicking the button smoothly scrolls the page to the top
 */
const BackToTop: React.FC = () => {
  // State to control button visibility
  const [isVisible, setIsVisible] = useState<boolean>(false);

  /**
   * Toggle button visibility based on scroll position
   * Shows button when user scrolls more than 300px down
   */
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  /**
   * Smooth scroll to top of page
   * Uses behavior: 'smooth' for smooth scrolling animation
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Add scroll event listener when component mounts
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);

    // Cleanup: remove event listener when component unmounts
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <>
      {isVisible && (
        <Button
          variant="primary"
          onClick={scrollToTop}
          className="back-to-top-btn"
          aria-label="Back to top"
          title="Back to top"
        >
          <i className="bi bi-chevron-up"></i>
        </Button>
      )}
    </>
  );
};

export default BackToTop;
