import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Preferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

type CookieContextType = {
  showBanner: boolean;
  setShowBanner: (value: boolean) => void;
  showPreferences: boolean;
  setShowPreferences: (value: boolean) => void;
  userPreferences: Preferences;
  setConsent: (accepted: boolean) => void;
  savePreferences: (prefs: Preferences) => void;
};

export const CookieContext = createContext<CookieContextType | undefined>(undefined);

export const CookieProvider = ({ children }: { children: ReactNode }) => {
  const [showBanner, setShowBanner] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState<Preferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      setUserPreferences(JSON.parse(saved));
      setShowBanner(false);
    }
  }, []);

  const setConsent = (accepted: boolean) => {
    const prefs = accepted
      ? { essential: true, analytics: true, marketing: true }
      : { essential: true, analytics: false, marketing: false };
    setUserPreferences(prefs);
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
    setShowBanner(false);
  };

  const savePreferences = (prefs: Preferences) => {
    setUserPreferences(prefs);
    localStorage.setItem('userPreferences', JSON.stringify(prefs));
    setShowPreferences(false);
    setShowBanner(false);
  };

  return (
    <CookieContext.Provider
      value={{
        showBanner,
        setShowBanner,
        showPreferences,
        setShowPreferences,
        userPreferences,
        setConsent,
        savePreferences,
      }}
    >
      {children}
    </CookieContext.Provider>
  );
};

export const useCookieContext = (): CookieContextType => {
  const context = useContext(CookieContext);
  if (!context) throw new Error('useCookieContext must be used within a CookieProvider');
  return context;
};