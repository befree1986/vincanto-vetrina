import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ThemeSwitcher from './ThemeSwitcher';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const renderFlagSVG = (lang: string) => {
    switch (lang) {
      case 'it': return <svg width="20" height="20" viewBox="0 0 3 2"><rect width="1" height="2" fill="#008d46"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#d2232c"/></svg>;
      case 'en': return <svg width="20" height="20" viewBox="0 0 60 30"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><g clipPath="url(#s)"><path fill="#012169" d="M0,0 v30 h60 v-30 z"/><path stroke="#fff" strokeWidth="6" d="M0,0 l60,30 M60,0 l-60,30"/><path stroke="#c8102e" strokeWidth="4" d="M0,0 l60,30 M60,0 l-60,30"/><path stroke="#fff" strokeWidth="10" d="M30,0 v30 M0,15 h60"/><path stroke="#c8102e" strokeWidth="6" d="M30,0 v30 M0,15 h60"/></g></svg>;
      case 'de': return <svg width="20" height="20" viewBox="0 0 5 3"><rect width="5" height="1" fill="#000"/><rect width="5" height="1" y="1" fill="#FF0000"/><rect width="5" height="1" y="2" fill="#FFCC00"/></svg>;
      case 'fr': return <svg width="20" height="20" viewBox="0 0 3 2"><rect width="1" height="2" fill="#0055A4"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#EF4135"/></svg>;
      default: return null;
    }
  };

  return (
    <header className={`navbar${scrolled ? ' scrolled' : ' hidden'}`}>
      <div className="navbar-container">
        <div className="logo">
          <a href="#home">
            <img src="/logo.svg" alt="Vincanto" className="logo-img" />
          </a>
        </div>

        <nav id="navMenu" className={`nav-menu ${isOpen ? 'active' : ''}`}>
          {isOpen && (
            <div className="mobile-logo">
              <a href="#home" onClick={closeMenu}>
                <img src="/logo.svg" alt="Vincanto logo" className="mobile-logo-img" />
              </a>
            </div>
          )}

          <ul className="nav-links">
            <li><a href="#home" onClick={closeMenu}>{t('Home')}</a></li>
            <li><a href="#about" onClick={closeMenu}>{t('Chi Siamo')}</a></li>
            <li><a href="#proprieta" onClick={closeMenu}>{t('La Proprietà')}</a></li>
            <li><a href="#contact" onClick={closeMenu}>{t('Contatti')}</a></li>
          </ul>
          <a href="#booking" className="btn btn-navbar" onClick={closeMenu}>
            {t('Prenota Ora')}
          </a>

          {isOpen && (
            <>
              <div className="language-selector-mobile">
                {['it', 'en', 'de', 'fr'].map(lang => (
                  <button key={lang} onClick={() => { i18n.changeLanguage(lang); closeMenu(); }} className="language-flag-button" aria-label={lang}>
                    {renderFlagSVG(lang)}
                  </button>
                ))}
                <ThemeSwitcher />
              </div>

              <button onClick={closeMenu} className="close-menu-button" aria-label="Chiudi menu">
                ❌ {t('Chiudi Menu')}
              </button>
            </>
          )}
        </nav>

        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu" aria-expanded={isOpen} aria-controls="navMenu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="language-selector-wrapper">
        {['it', 'en', 'de', 'fr'].map(lang => (
          <button key={lang} onClick={() => i18n.changeLanguage(lang)} className="language-flag-button" aria-label={lang}>
            {renderFlagSVG(lang)}
          </button>
        ))}
        <ThemeSwitcher />
      </div>

      {isOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
    </header>
  );
};

export default Navbar;