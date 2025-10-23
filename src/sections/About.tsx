import React from 'react';
import ParallaxBackground from '../components/ParallaxBackground';
import LemonDivider from '../components/LemonDivider';
import Propriety from './Propriety';
import './About.css';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';

const About: React.FC = () => {
  const { t } = useTranslation();
  return (
  <React.Fragment>
      <Helmet>
        <title>{t('seo.about.title')}</title>
        <meta name="description" content={t('seo.about.description')} />
      </Helmet>
      <section id="about" className="about-section">
      <ParallaxBackground imageUrl="/lemon.webp">
        <div className="about-hero">
          <h2>{t('Chi Siamo')}</h2>
        </div>
      </ParallaxBackground>
      <div className="container">
        <div className="about-content">
          <div className="about-description">
            <h2 className="about-title">VINCANTO</h2>
            <p className="proprieta-description">{t('about.longdesc1')}</p>
            <p className="proprieta-description">{t('about.longdesc2')}</p>
            <p className="proprieta-description">{t('about.longdesc3')}</p>
            <p>{t('about.longdesc4')}</p>
          </div>
          
                {/* Inserisco qui la sezione Propriety prima di 'La Nostra Posizione' */}
          <Propriety />

          <div className="location-info">
            <div className="location-text">
              <h4>
                {t('about.positionTitle')}
              </h4>
              <div className="location-description">
                <p>
                  {t('about.positionDesc1')}
                </p>
                <p>
                  {t('about.positionDesc2')}
                </p>
             </div>
              <div className="distances">
                {/* Riga 1 */}
                <div className="distances-row">
                  <div className="distance-item"><strong>{t('about.position.mai')}:</strong> {t('about.position.mai2')}</div>
                  <div className="distance-item"><strong>{t('about.position.ama')}:</strong> {t('about.position.ama2')}</div>
                  <div className="distance-item"><strong>{t('about.position.rav')}:</strong> {t('about.position.rav2')}</div>
                </div>
                {/* Riga 2 */}
                <div className="distances-row">
                  <div className="distance-item"><strong>{t('about.position.pos')}:</strong> {t('about.position.pos2')}</div>
                  <div className="distance-item"><strong>{t('about.position.sal')}:</strong> {t('about.position.sal2')}</div>
                  <div className="distance-item"><strong>{t('about.position.nap')}:</strong> {t('about.position.nap2')}</div>
                </div>
                {/* Riga 3 (con un solo elemento) */}
                <div className="distances-row">
                  <div className="distance-item"><strong>{t('about.position.sar')}:</strong> {t('about.position.sar2')}</div>
                </div>
              </div>
            </div>
            <div className="location-image-container">
              <img 
                src="/contact3.webp" 
                alt="Vista panoramica su Maiori e la Costiera Amalfitana" 
                className="img-fluid"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
      
      <LemonDivider position="right" />
      </section>
    </React.Fragment>
  );
};

export default About;