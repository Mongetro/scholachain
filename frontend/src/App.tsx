// frontend/src/App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from 'react-router-dom';
import BackToTop from './components/common/BackToTop';
import Footer from './components/layout/Footer';
import Header from './components/layout/Header';
import { Web3Provider } from './contexts/Web3Context';
import AboutPage from './pages/AboutPage';
import AdminPage from './pages/AdminPage';
import HomePage from './pages/HomePage';
import IssueCertificatePage from './pages/IssueCertificatePage';
import { queryClient } from './services/queryClient';
import './styles/globals.css';

/**
 * Component to handle scroll behavior and hash-based navigation
 * Automatically scrolls to sections when URL hash changes
 */
const ScrollHandler: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle hash-based section navigation
    if (location.hash) {
      const sectionId = location.hash.replace('#', '');

      // Delay to ensure page is fully rendered
      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const navbarHeight = 80;
          const elementTop =
            element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementTop - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });

          console.log(`📍 Auto-scrolled to: ${sectionId}`);
        }
      }, 800); // Longer delay for initial page loads

      return () => clearTimeout(scrollTimer);
    } else {
      // Scroll to top when no hash is present
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return null;
};

/**
 * Main App Component
 * Sets up routing, providers, and global layout
 */
function App() {
  return (
    <Web3Provider>
      <QueryClientProvider client={queryClient}>
        <Router>
          {/* Global toast notifications */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />

          <div className="app-container">
            {/* Handles automatic scrolling to sections */}
            <ScrollHandler />

            {/* Fixed navigation header */}
            <Header />

            {/* Main content area */}
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route
                  path="/issue-certificate"
                  element={<IssueCertificatePage />}
                />
                <Route path="/about" element={<AboutPage />} />
                {/* Fallback to homepage for unknown routes */}
                <Route path="*" element={<HomePage />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* Back to Top Button - Fixed position */}
            <BackToTop />
          </div>
        </Router>
      </QueryClientProvider>
    </Web3Provider>
  );
}

export default App;
