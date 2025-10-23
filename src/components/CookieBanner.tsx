import React, { useEffect, useRef } from 'react';
import './CookieBanner.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface CookieBannerProps {
  onClose: () => void;
  onAccept: () => void;
  onCustomize: () => void;
}

const CookieBanner: React.FC<CookieBannerProps> = ({ onClose, onAccept, onCustomize }) => {
  const { t } = useTranslation();
  const bannerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement;
    bannerRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        previousFocus.current?.focus();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      className="cookie-banner"
      ref={bannerRef}
      tabIndex={-1}
    >
      <h2 id="cookie-banner-title">{t('cookie.title')}</h2>
      <p>
        {t('cookie.text')} <Link to="/cookie-policy" target="_blank">Cookie Policy</Link>.
      </p>
      <div className="cookie-actions">
        <button onClick={onAccept} aria-label={t('cookie.acceptAll')}>{t('cookie.acceptAll')}</button>
        <button onClick={onClose} aria-label={t('cookie.acceptEssential')}>{t('cookie.acceptEssential')}</button>
        <button onClick={onCustomize} aria-label={t('cookie.customize')}>{t('cookie.customize')}</button>
      </div>
    </div>
  );
};

export default CookieBanner;