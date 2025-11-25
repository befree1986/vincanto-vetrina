import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import './BookingModal.css';

const BookingSystemEnhanced = lazy(() => import('./BookingSystemEnhanced'));

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Blocca scroll della pagina quando modale è aperta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Chiusura con tasto ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Chiudi quando clicchi sul backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="booking-modal-overlay" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className={`booking-modal-container ${isFullscreen ? 'fullscreen' : ''}`}>
        {/* Header con controlli */}
        <div className="booking-modal-header">
          <h2 id="booking-modal-title" className="booking-modal-title">
            {t('section.booking.title', 'Prenota il tuo soggiorno')}
          </h2>
          
          <div className="booking-modal-controls">
            {/* Pulsante Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="booking-modal-btn"
              title={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
              aria-label={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
            >
              {isFullscreen ? (
                // Icona minimize
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                // Icona maximize
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>

            {/* Pulsante Chiudi */}
            <button
              onClick={onClose}
              className="booking-modal-btn booking-modal-close"
              title="Chiudi"
              aria-label="Chiudi finestra prenotazione"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenuto scrollabile */}
        <div className="booking-modal-content">
          <Suspense fallback={
            <div className="booking-modal-loading">
              <div className="spinner"></div>
              <span>Caricamento sistema prenotazioni...</span>
            </div>
          }>
            <BookingSystemEnhanced />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
