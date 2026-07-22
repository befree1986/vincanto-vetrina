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
import { useTranslation } from 'react-i18next';
import { detectLangFromPath, SUPPORTED_LANGS } from './i18n';

// Lazy loading per componenti pesanti
const AdminPanelPro = lazy(() => import('./pages/AdminPanelPro'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const TwoFactorLogin = lazy(() => import('./components/TwoFactorLogin'));
const TwoFactorSetup = lazy(() => import('./components/TwoFactorSetup'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

const LazyLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    <div className="ml-4 text-xl">Caricamento...</div>
  </div>
);

import './App.css';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import GoogleAnalytics from "./utils/GoogleAnalytics";
import SafeSeo from './components/SafeSeo';
import { suppressPerformanceWarnings } from './utils/eventListenerOptimizer';

suppressPerformanceWarnings();

// Inserisce i tag hreflang nel <head> per la SEO multilingua
// vincantomaiori.it/          → IT (canonical)
// vincantomaiori.it/en/...    → EN
// vincantomaiori.it/de/...    → DE
// vincantomaiori.it/fr/...    → FR
function HreflangTags({ pagePath }: { pagePath: string }) {
  useEffect(() => {
    // Rimuovi eventuali hreflang precedenti
    document.querySelectorAll('link[hreflang]').forEach(el => el.remove());

    const base = 'https://www.vincantomaiori.it';
    const tags: { hreflang: string; href: string }[] = [
      { hreflang: 'it', href: `${base}${pagePath}` },
      { hreflang: 'en', href: `${base}/en${pagePath === '/' ? '' : pagePath}` },
      { hreflang: 'de', href: `${base}/de${pagePath === '/' ? '' : pagePath}` },
      { hreflang: 'fr', href: `${base}/fr${pagePath === '/' ? '' : pagePath}` },
      { hreflang: 'x-default', href: `${base}${pagePath}` },
    ];

    tags.forEach(({ hreflang, href }) => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      link.setAttribute('href', href);
      document.head.appendChild(link);
    });

    return () => {
      document.querySelectorAll('link[hreflang]').forEach(el => el.remove());
    };
  }, [pagePath]);

  return null;
}

// Sincronizza i18n con la lingua nell'URL e aggiorna <html lang="">
function LangSync() {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = detectLangFromPath(location.pathname);
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    document.documentElement.lang = lang;
  }, [location.pathname, i18n]);

  return null;
}

// Carica impostazioni dinamiche dal backend e inietta in i18n
function DynamicSettingsLoader() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const loadDynamicSettings = async () => {
      try {
        const baseUrl = import.meta.env.DEV && import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL : '/api';
        const response = await fetch(`${baseUrl}/unified?action=settings`);
        if (response.ok) {
          const data = await response.json();
          const settings = data.settings || data;
          if (Array.isArray(settings)) {
            settings.forEach((setting) => {
              // Assumiamo che se il valore è un JSON, contiene le traduzioni per lingua
              // altrimenti è una stringa semplice per la lingua di default (it)
              try {
                const parsedValue = JSON.parse(setting.value);
                if (typeof parsedValue === 'object') {
                  Object.keys(parsedValue).forEach((lang) => {
                    i18n.addResource(lang, 'translation', setting.key, parsedValue[lang]);
                  });
                } else {
                  i18n.addResource('it', 'translation', setting.key, parsedValue);
                }
              } catch (e) {
                // Non è JSON, quindi è solo testo per la lingua di default
                i18n.addResource('it', 'translation', setting.key, setting.value);
              }
            });
          }
        }
      } catch (error) {
        console.error('Errore caricamento impostazioni dinamiche:', error);
      }
    };
    loadDynamicSettings();
  }, [i18n]);

  return null;
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/oauth');

  const {
    showBanner,
    setShowBanner,
    showPreferences,
    setShowPreferences,
    userPreferences,
    setConsent,
    savePreferences
  } = useCookieContext() || {};

  useEffect(() => {
    if (!isAdminRoute) {
      const cleanup = setupIntelligentPreload();
      setTimeout(preloadOnIdle, 1000);
      return cleanup;
    }
  }, [isAdminRoute]);

  // Layout standalone per admin
  if (isAdminRoute) {
    return (
      <>
        {userPreferences?.analytics && <GoogleAnalytics />}
        <Suspense fallback={<LazyLoadingSpinner />}>
          <Routes>
            <Route path="/admin/login" element={
              <TwoFactorLogin
                onLoginSuccess={(_token, role) => {
                  // 🚀 Reindirizzamento corretto basato sul ruolo
                  const targetPath = role === 'superadmin' ? '/admin/pro' : '/admin';
                  navigate(targetPath);
                }}
              />
            } />
            <Route path="/admin/pro" element={
              <ProtectedRoute requiredRole="superadmin">
                <AdminPanelPro />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
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
      </>
    );
  }

  // Rimuovi il prefisso lingua per ottenere il path canonico (es. /en/about -> /about)
  const canonicalPath = location.pathname.replace(/^\/(en|de|fr)/, '') || '/';

  return (
    <>
      <HreflangTags pagePath={canonicalPath} />
      <LangSync />
      <DynamicSettingsLoader />
      {userPreferences?.analytics && <GoogleAnalytics />}
      <Navbar />

      <Routes>
        {/* ── Pagine con prefisso lingua (/en/, /de/, /fr/) ── */}
        {SUPPORTED_LANGS.filter(l => l !== 'it').map(lang => (
          <React.Fragment key={lang}>
            <Route path={`/${lang}`} element={
              <>
                <SafeSeo page="home" ogImage="/logo.svg" canonical={`https://www.vincantomaiori.it/${lang}`} />
                <Home /><About /><Booking /><Contact />
              </>
            } />
            <Route path={`/${lang}/property`} element={
              <>
                <SafeSeo page="property" ogImage="/logo.svg" canonical={`https://www.vincantomaiori.it/${lang}/property`} />
                <Propriety />
              </>
            } />
            <Route path={`/${lang}/cookie-policy`} element={<CookiePolicy />} />
            <Route path={`/${lang}/privacy-policy`} element={<PrivacyPolicy />} />
            <Route path={`/${lang}/terms-conditions`} element={<TermsConditions />} />
            <Route path={`/${lang}/accessibility`} element={<Accessibility />} />
          </React.Fragment>
        ))}

        {/* ── Pagine italiane (default, senza prefisso) ── */}
        <Route path="/" element={
          <>
            <SafeSeo page="home" ogImage="/logo.svg" canonical="https://www.vincantomaiori.it" />
            <Home /><About /><Booking /><Contact />
          </>
        } />
        <Route path="/property" element={
          <>
            <SafeSeo page="property" ogImage="/logo.svg" canonical="https://www.vincantomaiori.it/property" />
            <Propriety />
          </>
        } />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
        <Route path="/accessibility" element={<Accessibility />} />
      </Routes>

      {showBanner && (
        <CookieBanner
          onClose={() => setConsent && setConsent(false)}
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
                essential: prefs.essential !== undefined ? prefs.essential : true
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
    const handleScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`back-to-top-btn ${visible ? 'visible' : ''}`}
      aria-label="Torna su"
    >
      <ArrowUp size={28} />
    </button>
  );
};

export default App;