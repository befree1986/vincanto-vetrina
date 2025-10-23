import { useEffect } from 'react';
import { useCookieContext } from './CookieContext';

const CookieController: React.FC = () => {
  const { setConsent } = useCookieContext();

  useEffect(() => {
    const saved = localStorage.getItem('userPreferences');
    
    // Se non ci sono preferenze salvate, aspetta X secondi e imposta default
    if (!saved) {
      const timer = setTimeout(() => {
        setConsent(false); // consensi minimi
      }, 10000); // 10 secondi di attesa

      return () => clearTimeout(timer); // pulizia se il componente viene smontato
    }
  }, [setConsent]);

  return null;
};

export default CookieController;