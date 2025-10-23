import React from 'react';
import './Footer.css';
import { useTranslation } from 'react-i18next';
import { useCookieContext } from './CookieContext';
import { useTranslationDebug } from '../hooks/useTranslationDebug';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const { setShowPreferences } = useCookieContext();

  useTranslationDebug([
  'footer.privacyPolicy',
  'footer.cookiePolicy',
  'footer.termsConditions',
  'footer.accessibility',
  'footer.manageCookies',
  'footer.legalInfo',
  'footer.certified',
  'footer.license',
  'footer.cin',
  'footer.rights',
  'footer.webmaster'
], 'Footer');

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/logo.svg" alt="Vincanto" className="footer-logo-img" />
            <p>{t('Il Tuo angolo di Paradiso nel Limoneto')}</p>
          </div>

          <div className="footer-links">
            <h4>{t('footer.quickLinks')}</h4>
            <ul>
              <li><a href="#home">{t('footer.home')}</a></li>
              <li><a href="#about">{t('footer.about')}</a></li>
              <li><a href="#proprieta">{t('footer.proprieta')}</a></li>
              <li><a href="#contact">{t('footer.contactUs')}</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>{t('footer.contactUs')}</h4>
            <p>Via Torre di Milo, 7</p>
            <p>84010 Maiori (SA)</p>
            <p>
              <a href="mailto:info@vincantomaiori.it" className="footer-link">
                <i className="fas fa-envelope"></i> info@vincantomaiori.it
              </a>
            </p>
            <p>
              <a href="tel:+393331481677" className="footer-link">
                <i className="fas fa-phone"></i> Tel. +39 333 148 1677
              </a>
            </p>
          </div>

          <div className="footer-social">
            <h4>{t('footer.followUs')}</h4>
            <div className="social-icons-list">
              <a href="https://www.facebook.com/people/Vincanto-Maiori-Costiera-Amalfitana/61574880714522/" target="_blank" rel="noopener noreferrer" aria-label={t('Facebook')}>
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="https://www.instagram.com/vincanto_maiori/" target="_blank" rel="noopener noreferrer" aria-label={t('Instagram')}>
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://wa.me/393331481677" target="_blank" rel="noopener noreferrer" aria-label={t('WhatsApp')}>
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-paytourist-logo">
            <img src="/paytourist_logo.webp" alt="Paytourist" className="footer-paytourist-logo-img" />
            <p>{t('footer.certifiedBy')}</p>
            <p>{t('footer.license')}</p>
            <p>{t('footer.regionLicense')}</p>

            <h4>{t('footer.legalInformation')}</h4>
            <p>
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link">
                  {t('footer.privacyPolicy')}
                </a>
            </p>
            <p>
              <a
              href="/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link">
                {t('footer.cookiePolicy')}
                </a>
            </p>
            <p>
              <a href="/terms-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link">
                {t('footer.terms')}
              </a>
            </p>
            <p>
              <a href="/accessibility"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link">
                {t('footer.accessibility')}
              </a>
            </p>
            <p>
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="footer-link"
                >
                {t('footer.cookieSettings')}
              </button>
            </p>
          </div>

          <div className="footer-verfied-logo">
            <img src="verify-logo.webp" alt="Verified" className="footer-verfied-logo-img" />
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; <time dateTime={String(currentYear)}>{currentYear}</time> Vincanto. {t('All Rights Reserved.')}</p>
          <p>{t('Webmaster')} Giuseppe Marino</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;