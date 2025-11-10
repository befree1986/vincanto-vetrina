import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { galleryData } from '../data/galleryData';
import type { GalleryImage } from '../data/galleryData';
import '../styles/Propriety.base.css';
import '../styles/Propriety.desktop.css';
import '../styles/Propriety.mobile.css';
import LemonDivider from '../components/LemonDivider';
import { Helmet } from 'react-helmet';
import { usePricing } from '../hooks/usePricing';

const Propriety: React.FC = () => {
  const { t } = useTranslation();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<GalleryImage[]>([]);
  const touchStartX = useRef(0);
  const pricing = usePricing();

  // Debug: log dello stato pricing
  useEffect(() => {
    console.log('🎯 Stato pricing in Propriety.tsx:', pricing);
    console.log('🎯 currentPrice:', pricing.currentPrice);
    console.log('🎯 loading:', pricing.loading);
    console.log('🎯 error:', pricing.error);
  }, [pricing]);

  const openLightbox = useCallback((images: GalleryImage[], startIndex: number) => {
    if (images.length === 0) return;
    setLightboxImages(images);
    setCurrentImageIndex(startIndex);
    setIsLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    document.body.style.overflow = 'auto';
  }, []);

  const showNextImage = useCallback(() => {
    if (lightboxImages.length <= 1) return;
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % lightboxImages.length);
  }, [lightboxImages.length]);

  const showPrevImage = useCallback(() => {
    if (lightboxImages.length <= 1) return;
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + lightboxImages.length) % lightboxImages.length);
  }, [lightboxImages.length]);

  // Touch handling ottimizzato per performance
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) showPrevImage();
      else showNextImage();
    }
  }, [showPrevImage, showNextImage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (event.key === 'Escape') closeLightbox();
      else if (event.key === 'ArrowLeft') showPrevImage();
      else if (event.key === 'ArrowRight') showNextImage();
    };
    window.addEventListener('keydown', handleKeyDown, { passive: true });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, closeLightbox, showPrevImage, showNextImage]);

  useEffect(() => {
    const images = document.querySelectorAll('.gallery-img');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          el.classList.add('visible');
          if (window.innerWidth < 600) {
            el.classList.add('mobile-reveal');
          }
        }
      });
    }, { threshold: 0.3 });

    images.forEach((img) => observer.observe(img));
    return () => observer.disconnect();
  }, []);
    return (
    <section id="proprieta" className="proprieta-section">
      <Helmet>
        <title>{t('seo.propriety.title')}</title>
        <meta name="description" content={t('seo.propriety.description')} />
      </Helmet>
      <div className="container">
        {/* Titolo galleria */}
        <h2
          className="section-title underline-title section-title-margin-top"
        >
          {t('propriety.gallery.mainTitle')}
        </h2>

        {/* Galleria immagini */}
        <div className="gallery-grid">
          {galleryData.map((section, sectionIndex) => {
            const allImages = section.mainImage
              ? [section.mainImage, ...section.images]
              : section.images;

            return (
              <div
                key={section.titleKey || `section-${sectionIndex}`}
                className="gallery-section-container"
              >
                <h3 className="gallery-section-title">
                  {t(section.titleKey)}
                </h3>

                {section.mainImage && (
                  <div
                    className="gallery-main-image-card"
                    onClick={() => openLightbox(allImages, 0)}
                  >
                    <img
                      src={section.mainImage.src}
                      alt={t(section.mainImage.altKey)}
                      className="img-fluid-main gallery-img"
                      loading="lazy"
                    />
                    {(section.mainImage.captionKey ||
                      section.mainImage.captionText) && (
                      <p className="image-caption">
                        {section.mainImage.captionText ||
                          t(section.mainImage.captionKey!)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Lightbox */}
        {isLightboxOpen && lightboxImages.length > 0 && (
          <div className="lightbox-overlay" onClick={closeLightbox}>
            <div
              className="lightbox-content"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <button
                className="lightbox-close"
                onClick={closeLightbox}
              >
                &times;
              </button>
              {lightboxImages.length > 1 && (
                <>
                  <button
                    className="lightbox-prev"
                    onClick={showPrevImage}
                  >
                    &#10094;
                  </button>
                  <button
                    className="lightbox-next"
                    onClick={showNextImage}
                  >
                    &#10095;
                  </button>
                </>
              )}
              <img
                src={lightboxImages[currentImageIndex].src}
                alt={t(lightboxImages[currentImageIndex].altKey)}
                className="lightbox-img"
              />
              {lightboxImages.length > 1 && (
              <div className="lightbox-indicator">
               {currentImageIndex + 1} / {lightboxImages.length}
              </div>
)}
              {(lightboxImages[currentImageIndex].captionKey ||
                lightboxImages[currentImageIndex].captionText) && (
                <div className="lightbox-caption">
                  {lightboxImages[currentImageIndex].captionText ||
                    t(
                      lightboxImages[currentImageIndex]
                        .captionKey!
                    )}
                </div>
              )}
            </div>
          </div>
        )}
                {/* Tabella Tariffe */}
        <h2
          className="section-title underline-title titolo-sezione section-title-margin-top"
        >
          {t('propriety.rates.title')}
        </h2>
        <div className="tariffe-table-container">
          <table className="tariffe-table">
            <thead>
              <tr>
                <th>{t('propriety.rates.table.personsHeader')}</th>
                <th>{t('propriety.rates.table.pricePerNightHeader')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t('propriety.rates.table.persons1to2')}</td>
                <td>
                  {pricing.loading ? (
                    <span>Caricamento...</span>
                  ) : pricing.error ? (
                    <span>€ 75</span>
                  ) : (
                    <span>€ {pricing.currentPrice?.priceByGuests?.persons1to2 || pricing.currentPrice?.basePrice || 75}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>{t('propriety.rates.table.persons3to4')}</td>
                <td>
                  {pricing.loading ? (
                    <span>Caricamento...</span>
                  ) : pricing.error ? (
                    <span>€ 95</span>
                  ) : (
                    <span>€ {pricing.currentPrice?.priceByGuests?.persons3to4 || (pricing.currentPrice?.basePrice || 75) + 20}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>{t('propriety.rates.table.persons5to6')}</td>
                <td>
                  {pricing.loading ? (
                    <span>Caricamento...</span>
                  ) : pricing.error ? (
                    <span>€ 95</span>
                  ) : (
                    <span>€ {pricing.currentPrice?.priceByGuests?.persons5to6 || (pricing.currentPrice?.basePrice || 75) + 20}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td>{t('propriety.rates.table.persons7to8')}</td>
                <td>
                  {pricing.loading ? (
                    <span>Caricamento...</span>
                  ) : pricing.error ? (
                    <span>€ 95</span>
                  ) : (
                    <span>€ {pricing.currentPrice?.priceByGuests?.persons7to8 || (pricing.currentPrice?.basePrice || 75) + 20}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Regole di Prenotazione */}
        <section className="booking-rules">
          <h2 className="section-title">{t('section.booking.rules.title')}</h2>

          <div className="rule-group">
            <h4 className="section-subtitle">{t('section.booking.rules.minoriTitle')}</h4>
            <ul className="section-list">
              <li>{t('section.booking.rules.minoriList1')}</li>
            </ul>
          </div>

          <div className="rule-group">
            <h4 className="section-subtitle">{t('section.booking.rules.summerTitle')}</h4>
            <ul className="section-list">
              <li>{t('section.booking.rules.summerList1')}</li>
            </ul>
          </div>

          <div className="rule-group">
            <h4 className="section-subtitle">{t('section.booking.rules.allYearTitle')}</h4>
            <ul className="section-list">
              <li>{t('section.booking.rules.allYearList1')}</li>
            </ul>
          </div>

          <div className="rule-group">
            <h4 className="section-subtitle">{t('section.booking.rules.checkinoutTitle')}</h4>
            <ul className="section-list">
              <li>{t('section.booking.rules.checkinoutList1')}</li>
              <li>{t('section.booking.rules.checkinoutList2')}</li>
            </ul>
          </div>

          <div className="rule-group">
            <h4 className="section-subtitle">{t('section.booking.rules.paymentTitle')}</h4>
            <ul className="section-list">
              <li>{t('section.booking.rules.paymentList1')}</li>
            </ul>
          </div>
        </section>

        {/* Servizi Inclusi */}
        <section className="included-services">
          <h2 className="section-title">{t('section.includedServices.title')}</h2>

          <div className="service-group">
            <h4 className="section-subtitle">{t('section.includedServices.comfortTitle')}</h4>
            <ul className="section-list">
              <li>{t('section.includedServices.comfortList1')}</li>
              <li>{t('section.includedServices.comfortList2')}</li>
              <li>{t('section.includedServices.comfortList3')}</li>
              <li>{t('section.includedServices.comfortList4')}</li>
              <li>{t('section.includedServices.comfortList5')}</li>
              <li>{t('section.includedServices.comfortList6')}</li>
              <li>{t('section.includedServices.comfortList7')}</li>
              <li>{t('section.includedServices.comfortList8')}</li>
              <li>{t('section.includedServices.comfortList9')}</li>
              <li>{t('section.includedServices.comfortList10')}</li>
              <li>{t('section.includedServices.comfortList11')}</li>
              <li>{t('section.includedServices.comfortList12')}</li>
            </ul>
          </div>

          <div className="service-group">
            <h4 className="section-subtitle">{t('section.includedServices.connectivityTitle')}</h4>
            <ul className="section-list">
              <li>{t('section.includedServices.connectivityList1')}</li>
              <li>{t('section.includedServices.connectivityList2')}</li>
            </ul>
          </div>
        </section>

        {/* Costi Extra */}
        <section className="extra-costs">
          <h2 className="section-title">{t('section.extraCosts.title')}</h2>

          <div className="cost-group">
            <h4 className="section-subtitle">{t('section.extraCosts.mandatoryTitle')}</h4>
            <ul className="section-list">
              <li>{t('section.extraCosts.mandatoryList1')}</li>
              <li>{t('section.extraCosts.mandatoryList2')}</li>
            </ul>
          </div>

          <div className="cost-group">
            <h4 className="section-subtitle">{t('section.extraCosts.onRequestTitle')}</h4>
            <ul className="section-list">
              <li>{t('section.extraCosts.onRequestList2')}</li>
              <li>{t('section.extraCosts.onRequestList1')}</li>
            </ul>
          </div>
        </section>

        {/* Info Tassa di Soggiorno */}
        <div className="tariffe-note">
          <p>{t('propriety.rates.touristTaxCost')}</p>
          <p>{t('propriety.rates.touristTaxExemptions')}</p>
          <p>{t('propriety.rates.touristTaxPaymentInfo')}</p>
          <p>
            <Trans i18nKey="propriety.rates.touristTaxLinkText">
              Per tutti i dettagli, potete consultare il sito del&nbsp;
              <a
                href="https://www.comune.maiori.sa.it/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Comune di Maiori
              </a>
              &nbsp;o il portale dedicato&nbsp;
              <a
                href="https://maiori.paytourist.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                PayTourist
              </a>.
            </Trans>
          </p>
        </div>

        {/* Divider finale */}
        <LemonDivider position="left" />
      </div>
    </section>
  );
};

export default Propriety;