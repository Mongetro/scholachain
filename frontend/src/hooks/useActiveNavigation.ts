// frontend/src/hooks/useActiveNavigation.ts
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useActiveNavigation = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    // Réinitialiser quand on change de page
    if (location.pathname !== '/') {
      setActiveSection(location.pathname);
      return;
    }

    // Observer pour détecter les sections visibles
    const observers: IntersectionObserver[] = [];

    // Configuration de l'observateur
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Détection quand la section est au centre
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observer les sections de la page d'accueil
    const sections = ['features', 'verification-section'];
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
        observers.push(observer);
      }
    });

    // Nettoyer les observers
    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [location.pathname]);

  const isActive = (path: string, sectionId?: string): boolean => {
    // Pour les pages autres que l'accueil
    if (location.pathname !== '/') {
      return location.pathname === path;
    }

    // Pour la page d'accueil
    if (sectionId) {
      return activeSection === sectionId;
    }

    // Page d'accueil sans section spécifique (haut de page)
    return path === '/' && !activeSection;
  };

  return { isActive, activeSection };
};
