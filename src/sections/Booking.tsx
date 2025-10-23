import React, { useState } from "react";
import "./Booking.css";
import LemonDivider from "../components/LemonDivider";
import BookingSystemEnhanced from "../components/BookingSystemEnhanced";
import { useTranslation } from "react-i18next";

const BOOKING_URL = "https://www.booking.com/hotel/it/vincanto-maiori-costiera-amalfitana.it.html";
const AIRBNB_URL = "https://www.airbnb.it/rooms/1387891577187940063";

const BookingForm: React.FC = () => {
  const bookingPlatforms = [
    {
      name: "Booking.com",
      url: BOOKING_URL,
      logo: "/assets/booking-logo.webp",
    },
    {
      name: "Airbnb",
      url: AIRBNB_URL,
      logo: "/assets/airbnb-logo.svg",
    },
  ];

  const { t } = useTranslation();

  return (
    <div className="booking-showcase" role="region" aria-label="Piattaforme di prenotazione">
      <div className="logo-only-links">
        {bookingPlatforms.map(({ name, url, logo }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="logo-link"
            title={`${t('section.booking.platformShowcase')} ${name}`}
          >
            <img
              src={logo}
              alt={name}
              className="logo-image"
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </div>
  );
};

const Booking: React.FC = () => {
  const { t } = useTranslation();
  const [showBookingSystem, setShowBookingSystem] = useState(false);

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
        
        {/* Toggle tra booking esterno e sistema interno */}
        <div className="booking-options">
          <div className="option-toggle">
            <button 
              className={`toggle-btn ${!showBookingSystem ? 'active' : ''}`}
              onClick={() => setShowBookingSystem(false)}
            >
              🏨 Prenota su Booking.com/Airbnb
            </button>
            <button 
              className={`toggle-btn ${showBookingSystem ? 'active' : ''}`}
              onClick={() => setShowBookingSystem(true)}
            >
              💳 Prenota Direttamente
            </button>
          </div>
        </div>

        {showBookingSystem ? <BookingSystemEnhanced /> : <BookingForm />}
      </div>
      <LemonDivider position="left" />
      </section>
    </React.Fragment>
  );
};

export default Booking;