import React, { useState } from "react";
import "./Booking.css";
import LemonDivider from "../components/LemonDivider";
import BookingModal from "../components/BookingModal";
import { useTranslation } from "react-i18next";

const Booking: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
  <React.Fragment>

     <section id="booking" className="booking-section">
      <div className="container">
        <header>
          <h2 className="section-title underline-title titolo-sezione">
            {t('section.booking.title')}
          </h2>
          <p className="section-subtitle booking-subtitle">
            {t('section.booking.subtitle')}
          </p>
        </header>
        
        {/* Pulsante per aprire modale prenotazione */}
        <div className="booking-cta-container">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="booking-open-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{t('section.booking.openButton', 'Prenota ora')}</span>
          </button>
          <p className="booking-cta-subtitle">
            {t('section.booking.ctaSubtitle', 'Sistema di prenotazione sicuro e veloce')}
          </p>
        </div>

        {/* Modale con sistema prenotazione */}
        <BookingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </div>
      <LemonDivider position="left" />
      </section>
    </React.Fragment>
  );
};

export default Booking;