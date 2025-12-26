import React, { useEffect, useState, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Home from './sections/Home';
import About from './sections/About';
import Propriety from './sections/Propriety';
import Booking from './sections/Booking';
import Contact from './sections/Contact';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import PreferencesModal from './components/PreferencesModal';
import { useCookieContext } from './components/CookieContext';
import { ArrowUp } from 'lucide-react';
import CookiePolicy from './pages/CookiePolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import Accessibility from './pages/Accessibility';
import AdminSetup from './components/AdminSetup';
import ProtectedRoute from './components/ProtectedRoute';
import { setupIntelligentPreload, preloadOnIdle } from './utils/preloadComponents';

// Lazy loading per componenti pesanti
const AdminPanelPro = lazy(() => import('./pages/AdminPanelPro'));
const AdminPanelBasic = lazy(() => import('./components/AdminPanelBasic'));
const TwoFactorLogin = lazy(() => import('./components/TwoFactorLogin'));
const TwoFactorSetup = lazy(() => import('./components/TwoFactorSetup'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

// Componente di loading per lazy imports
const LazyLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    <div className="ml-4 text-xl">Caricamento...</div>
  </div>
);

import './App.css';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
// Rimosso Analytics per alleggerire bundle e perché chunk dedicato eliminato
// import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "./utils/GoogleAnalytics";
import SafeSeo from './components/SafeSeo';
import { suppressPerformanceWarnings } from './utils/eventListenerOptimizer';

// Sopprimi warning di performance non critici in sviluppo
suppressPerformanceWarnings();

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  const {
    showBanner,
    setShowBanner,
    showPreferences,
    setShowPreferences,
    userPreferences,
    setConsent,
    savePreferences
  } = useCookieContext() || {};

  // Setup preload intelligente per componenti lazy
  useEffect(() => {
    if (!isAdminRoute) {
      // Avvia preload intelligente solo per le pagine normali
      const cleanup = setupIntelligentPreload();
      // Avvia preload su idle dopo 1 secondo
      setTimeout(preloadOnIdle, 1000);
      
      return cleanup;
    }
  }, [isAdminRoute]);

  // Layout standalone per admin
  if (isAdminRoute) {
    return (
      <>
        {/* Google Analytics solo se accettato */}
        {userPreferences?.analytics && <GoogleAnalytics />}
        <Suspense fallback={<LazyLoadingSpinner />}>
          <Routes>
            <Route path="/admin/login" element={
              <TwoFactorLogin
                onLoginSuccess={(token, role) => {
                  // Salva già nel componente; qui gestiamo solo redirect
                  if (role === 'superadmin') {
                    navigate('/admin');
                  } else {
                    navigate('/admin/basic');
                  }
                }}
              />
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="superadmin">
                <AdminPanelPro />
              </ProtectedRoute>
            } />
            <Route path="/admin/basic" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanelBasic />
              </ProtectedRoute>
            } />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/admin/security" element={
              <ProtectedRoute requiredRole="superadmin">
                <TwoFactorSetup />
              </ProtectedRoute>
            } />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
          </Routes>
        </Suspense>
        {/* Analytics rimosso */}
      </>
    );
  }

  // Layout normale per il sito
  return (
    <>
      {/* Google Analytics pageview tracking, solo se accettato */}
      {userPreferences?.analytics && <GoogleAnalytics />}
      <Navbar />

      <Routes>
        <Route
          path="/" element={ <>
          <SafeSeo
            page="home"
            ogImage="/logo.svg"
            canonical="https://www.vincantomaori.it"
          />
          <Home />
          <About />
          <Booking />
          <Contact />
          </>
          }
          />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/property" element={
          <>
            <SafeSeo
              page="property"
              ogImage="/logo.svg"
              canonical="https://www.vincantomaori.it/property"
            />
            <Propriety />
          </>
        } />
      </Routes>

      {showBanner && (
        <CookieBanner
          onClose={() => setShowBanner(false)}
          onAccept={() => setConsent && setConsent(true)}
          onCustomize={() => {
            setShowPreferences && setShowPreferences(true);
            setShowBanner && setShowBanner(false);
          }}
        />
      )}

      {showPreferences && (
        <PreferencesModal
          isOpen={showPreferences}
          onClose={() => setShowPreferences && setShowPreferences(false)}
          onSave={(prefs) => {
            if (savePreferences) {
              savePreferences({
                analytics: prefs.analytics,
                marketing: prefs.marketing,
                essential: prefs.essential !== undefined ? prefs.essential : true // ensure boolean
              });
            }
          }}
          initialPreferences={{
            analytics: userPreferences?.analytics ?? false,
            marketing: userPreferences?.marketing ?? false,
            essential: userPreferences?.essential ?? true
          }}
        />
      )}

      <Footer />
      <BackToTopButton />
    </>
  );
}

const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`back-to-top-btn ${visible ? 'visible' : ''}`}
      aria-label="Torna su"
    >
      <ArrowUp size={28} />
    </button>
  );
};

export default App;