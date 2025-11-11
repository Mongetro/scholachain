// frontend/src/hooks/useSmoothScroll.ts
import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook for smooth scrolling to page sections
 * Handles both navigation and scrolling with proper timing
 */
export const useSmoothScroll = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = useCallback((sectionId: string) => {
    const navbarHeight = 80; // Height of the fixed navbar

    // Small delay to ensure DOM is updated
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        // Calculate position with navbar offset
        const elementTop =
          element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementTop - navbarHeight;

        // Smooth scroll to section
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });

        console.log(`🔍 Scrolled to section: ${sectionId}`);
      } else {
        console.warn(`⚠️ Section not found: ${sectionId}`);
      }
    }, 150); // Increased delay for better reliability
  }, []);

  return scrollToSection;
};
