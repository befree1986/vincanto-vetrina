import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import SafeSeo from '../Seo';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import PricingTable from '../components/PricingTable.tsx';
import { getSafeTranslation } from '../i18n';
import { usePricing } from '../hooks/usePricing.ts';
import './Propriety.css';

const Propriety: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  // Hook per pricing dinamico
  const { currentPrice, priceHistory, loading: priceLoading } = usePricing();

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    console.log('Data selezionata:', date);
  };

  return (
    <>
      <SafeSeo
        title={getSafeTranslation(t, 'seo.propriety.title', 'Casa Vacanze Vincanto - Dettagli e Disponibilità')}
        description={getSafeTranslation(t, 'seo.propriety.description', 'Scopri tutti i dettagli della casa vacanze Vincanto: caratteristiche, servizi, disponibilità e prenota il tuo soggiorno perfetto.')}
      />

      <div className="propriety-page">
        <div className="container">
          {/* Header proprietà */}
          <div className="propriety-header">
            <div className="breadcrumb">
              <Link to="/" className="breadcrumb-link">
                {getSafeTranslation(t, 'navigation.home', 'Home')}
              </Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">
                {getSafeTranslation(t, 'propriety.title', 'La Proprietà')}
              </span>
            </div>

            <h1 className="propriety-title">
              🏠 {getSafeTranslation(t, 'propriety.title', 'Casa Vacanze Vincanto')}
            </h1>
            
            <div className="propriety-meta">
              <div className="location">
                📍 {getSafeTranslation(t, 'propriety.location', 'Maori, Viterbo - Lazio')}
              </div>
              <div className="rating">
                ⭐ 4.9 • {getSafeTranslation(t, 'propriety.reviews', '127 recensioni')}
              </div>
            </div>
          </div>

          <div className="propriety-content">
            {/* Sezione principale */}
            <div className="main-content">
              {/* Galleria immagini placeholder */}
              <div className="image-gallery">
                <div className="main-image">
                  <img 
                    src="/esterni/facciata-principale.webp" 
                    alt={getSafeTranslation(t, 'propriety.images.facade', 'Facciata principale Casa Vincanto')}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxODBIMTc1VjEyMFoiIGZpbGw9IiNEREREREQiLz4KPHBhdGggZD0iTTEwMCAxMDBIMTUwVjE0MEgxMDBWMTAwWiIgZmlsbD0iI0RERERERCIvPgo8cGF0aCBkPSJNMjUwIDEwMEgzMDBWMTQwSDI1MFYxMDBaIiBmaWxsPSIjRERERERkIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjE0Ij5JbW1hZ2luZSBub24gZGlzcG9uaWJpbGU8L3RleHQ+Cjwvc3ZnPgo=';
                    }}
                  />
                </div>
                <div className="image-thumbnails">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="thumbnail">
                      <div className="thumbnail-placeholder">
                        📷
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dettagli proprietà */}
              <div className="propriety-details">
                <div className="details-section">
                  <h2>
                    <span className="section-icon">📋</span>
                    {getSafeTranslation(t, 'propriety.details.title', 'Dettagli della Proprietà')}
                  </h2>
                  
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-icon">🛏️</span>
                      <div className="detail-content">
                        <strong>{getSafeTranslation(t, 'propriety.details.bedrooms', 'Camere da letto')}</strong>
                        <span>3 camere + soggiorno</span>
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-icon">🚿</span>
                      <div className="detail-content">
                        <strong>{getSafeTranslation(t, 'propriety.details.bathrooms', 'Bagni')}</strong>
                        <span>2 bagni completi</span>
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-icon">👥</span>
                      <div className="detail-content">
                        <strong>{getSafeTranslation(t, 'propriety.details.guests', 'Ospiti')}</strong>
                        <span>Fino a 8 persone</span>
                      </div>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-icon">🏡</span>
                      <div className="detail-content">
                        <strong>{getSafeTranslation(t, 'propriety.details.size', 'Superficie')}</strong>
                        <span>120 mq + giardino</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Servizi Inclusi - Versione Originale */}
                <div className="amenities-section">
                  <h2>
                    <span className="section-icon">✨</span>
                    {getSafeTranslation(t, 'section.includedServices.title', 'Servizi Inclusi')}
                  </h2>
                  
                  {/* Comfort */}
                  <div className="amenities-category">
                    <h3>{getSafeTranslation(t, 'section.includedServices.comfortTitle', 'Comfort')}</h3>
                    <div className="amenities-grid">
                      {[
                        { icon: '🛏️', name: getSafeTranslation(t, 'section.includedServices.comfortList1', 'Biancheria da letto e da bagno') },
                        { icon: '❄️', name: getSafeTranslation(t, 'section.includedServices.comfortList2', 'Aria condizionata') },
                        { icon: '🔥', name: getSafeTranslation(t, 'section.includedServices.comfortList3', 'Riscaldamento') },
                        { icon: '💇', name: getSafeTranslation(t, 'section.includedServices.comfortList4', 'Asciugacapelli') },
                        { icon: '👔', name: getSafeTranslation(t, 'section.includedServices.comfortList5', 'Asse e ferro da stiro') },
                        { icon: '🧴', name: getSafeTranslation(t, 'section.includedServices.comfortList6', 'Prodotti da bagno') },
                        { icon: '🚑', name: getSafeTranslation(t, 'section.includedServices.comfortList7', 'Kit di pronto soccorso') },
                        { icon: '☕', name: getSafeTranslation(t, 'section.includedServices.comfortList8', 'Macchina da caffè') },
                        { icon: '🧊', name: getSafeTranslation(t, 'section.includedServices.comfortList9', 'Frigorifero') },
                        { icon: '📱', name: getSafeTranslation(t, 'section.includedServices.comfortList10', 'Forno a microonde') },
                        { icon: '🍽️', name: getSafeTranslation(t, 'section.includedServices.comfortList11', 'Stoviglie e posate') },
                        { icon: '🍽️', name: getSafeTranslation(t, 'section.includedServices.comfortList12', 'Lavastoviglie') }
                      ].map((amenity, index) => (
                        <div key={index} className="amenity-item">
                          <span className="amenity-icon">{amenity.icon}</span>
                          <span className="amenity-name">{amenity.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connettività */}
                  <div className="amenities-category">
                    <h3>{getSafeTranslation(t, 'section.includedServices.connectivityTitle', 'Connettività')}</h3>
                    <div className="amenities-grid">
                      {[
                        { icon: '🌐', name: getSafeTranslation(t, 'section.includedServices.connectivityList1', 'Wi-Fi gratuito') },
                        { icon: '🔗', name: getSafeTranslation(t, 'section.includedServices.connectivityList2', 'Connessione Ethernet LAN in tutte le stanze') }
                      ].map((amenity, index) => (
                        <div key={index} className="amenity-item">
                          <span className="amenity-icon">{amenity.icon}</span>
                          <span className="amenity-name">{amenity.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Costi Extra - Versione Originale */}
                <div className="extra-costs-section">
                  <h2>
                    <span className="section-icon">💰</span>
                    {getSafeTranslation(t, 'section.extraCosts.title', 'Costi Extra (non inclusi)')}
                  </h2>
                  
                  {/* Obbligatori */}
                  <div className="extra-costs-category">
                    <h3>{getSafeTranslation(t, 'section.extraCosts.mandatoryTitle', 'Obbligatori')}</h3>
                    <div className="extra-costs-list">
                      <div className="extra-cost-item">
                        <span className="cost-icon">🧽</span>
                        <div className="cost-details">
                          <span className="cost-name">{getSafeTranslation(t, 'section.extraCosts.mandatoryList1', 'Pulizia finale obbligatoria: 40€')}</span>
                        </div>
                      </div>
                      <div className="extra-cost-item">
                        <span className="cost-icon">🏛️</span>
                        <div className="cost-details">
                          <span className="cost-name">{getSafeTranslation(t, 'section.extraCosts.mandatoryList2', 'Tassa di soggiorno secondo normativa comunale')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Su richiesta */}
                  <div className="extra-costs-category">
                    <h3>{getSafeTranslation(t, 'section.extraCosts.onRequestTitle', 'Su richiesta')}</h3>
                    <div className="extra-costs-list">
                      <div className="extra-cost-item">
                        <span className="cost-icon">🚗</span>
                        <div className="cost-details">
                          <span className="cost-name">{getSafeTranslation(t, 'section.extraCosts.onRequestList1', 'Posto auto riservato e custodito a 20€/giorno')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="extra-costs-note">
                    <p><strong>Nota:</strong> I costi extra sono da pagare in loco al momento del check-in.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar con calendario e prenotazione */}
            <div className="sidebar">
              {/* Prezzi - Versione Dinamica */}
              <div className="pricing-card">
                <div className="price-display">
                  <span className="price">
                    {priceLoading ? 'Caricamento...' : `€${currentPrice?.basePrice || 75}`}
                  </span>
                  <span className="price-unit">
                    {getSafeTranslation(t, 'propriety.pricing.perNight', 'a persona/notte')}
                  </span>
                </div>
                
                {/* Tabella prezzi dinamici */}
                <PricingTable 
                  priceHistory={priceHistory}
                  loading={priceLoading}
                  selectedDate={selectedDate}
                />
                
                <div className="price-notes">
                  <div className="discount-info">
                    🎉 Sconto 10% per soggiorni di 7+ notti
                  </div>
                  <div className="discount-info">
                    🎯 Sconto 15% per soggiorni di 30+ giorni
                  </div>
                  <div className="pricing-note">
                    <small>*I prezzi variano in base al periodo e alla durata del soggiorno</small>
                  </div>
                </div>
              </div>

              {/* Calendario disponibilità */}
              <div className="availability-card">
                <h3 className="card-title">
                  <span className="title-icon">📅</span>
                  {getSafeTranslation(t, 'propriety.availability.title', 'Verifica Disponibilità')}
                </h3>
                
                <AvailabilityCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  minDate={new Date().toISOString().split('T')[0]}
                  maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                  className="propriety-calendar"
                />

                {selectedDate && (
                  <div className="selected-date-info">
                    <p>
                      <strong>Data selezionata:</strong><br />
                      {new Date(selectedDate).toLocaleDateString('it-IT', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Pulsante prenotazione */}
              <div className="booking-cta">
                <Link 
                  to="/booking" 
                  className="book-now-button"
                  state={selectedDate ? { selectedDate } : undefined}
                >
                  <span className="button-icon">🛎️</span>
                  {getSafeTranslation(t, 'propriety.booking.cta', 'Prenota Ora')}
                </Link>
                
                <div className="booking-info">
                  <span className="info-text">
                    {getSafeTranslation(t, 'propriety.booking.info', 'Prenotazione sicura • Cancellazione gratuita')}
                  </span>
                </div>
              </div>

              {/* Contatti rapidi */}
              <div className="contact-card">
                <h4>{getSafeTranslation(t, 'propriety.contact.title', 'Hai domande?')}</h4>
                <div className="contact-options">
                  <a href="tel:+393123456789" className="contact-item">
                    <span className="contact-icon">📞</span>
                    <span>Chiamaci</span>
                  </a>
                  <a href="mailto:info@vincantomaori.it" className="contact-item">
                    <span className="contact-icon">✉️</span>
                    <span>Scrivici</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Propriety;
