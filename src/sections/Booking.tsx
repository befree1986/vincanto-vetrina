import React, { Suspense, lazy } from "react";
import "./Booking.css";
import LemonDivider from "../components/LemonDivider";
import { useTranslation } from "react-i18next";

// Lazy loading per il sistema di booking pesante
const BookingSystemEnhanced = lazy(() => import("../components/BookingSystemEnhanced"));

const Booking: React.FC = () => {
  const { t } = useTranslation();
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
        
        {/* SOLO prenotazione diretta - opzioni esterne rimosse */}
        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Caricamento sistema prenotazioni...</span>
          </div>
        }>
          <BookingSystemEnhanced />
        </Suspense>
      </div>
      <LemonDivider position="left" />
      </section>
    </React.Fragment>
  );
};

export default Booking;