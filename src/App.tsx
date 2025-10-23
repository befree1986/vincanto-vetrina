import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Home from './sections/Home';
import About from './sections/About';
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
import AdminPageSimple from './pages/AdminPageSimple';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "./utils/GoogleAnalytics";
import SafeSeo from './components/SafeSeo';




function App() {
  const {
    showBanner,
    setShowBanner,
    showPreferences,
    setShowPreferences,
    userPreferences,
    setConsent,
    savePreferences
  } = useCookieContext() || {};

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
        <Route path="/admin" element={<AdminPageSimple />} />
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
      <Analytics />
    </>
  );
}

const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
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