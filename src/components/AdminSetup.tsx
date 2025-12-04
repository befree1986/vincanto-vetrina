/**
 * 🎯 VINCANTO - CONFIGURAZIONE PRODUZIONE
 * Sistema per configurare calendari, prezzi, pagamenti da zero
 */

import React, { useState } from 'react';
import './AdminSetup.css';

interface SetupState {
  calendars: {
    bookingCom: string;
    airbnb: string;
    googleCalendar: boolean;
  };
  payments: {
    stripeEnabled: boolean;
    stripePublicKey: string;
    paypalEnabled: boolean;
    paypalClientId: string;
    bankTransferEnabled: boolean;
    bankDetails: {
      name: string;
      iban: string;
      bic: string;
      beneficiary: string;
    };
  };
  pricing: {
    basePrice: number;
    cleaningFee: number;
    weekendSurcharge: number;
    minStay: number;
    maxStay: number;
    checkInTime: string;
    checkOutTime: string;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun';
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
  };
  admin: {
    username: string;
    password: string;
    email: string;
  };
}

export const AdminSetup: React.FC = () => {
  const [setupState, setSetupState] = useState<SetupState>({
    calendars: {
      bookingCom: '',
      airbnb: '',
      googleCalendar: false
    },
    payments: {
      stripeEnabled: false,
      stripePublicKey: '',
      paypalEnabled: false,
      paypalClientId: '',
      bankTransferEnabled: true,
      bankDetails: {
        name: '',
        iban: '',
        bic: '',
        beneficiary: ''
      }
    },
    pricing: {
      basePrice: 100,
      cleaningFee: 50,
      weekendSurcharge: 20,
      minStay: 2,
      maxStay: 14,
      checkInTime: '15:00',
      checkOutTime: '11:00'
    },
    email: {
      provider: 'smtp',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: ''
    },
    admin: {
      username: 'admin',
      password: '',
      email: ''
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    'Configurazione Calendari',
    'Metodi di Pagamento', 
    'Prezzi e Regole',
    'Email e Notifiche',
    'Credenziali Admin',
    'Conferma e Attivazione'
  ];

  const saveConfiguration = async () => {
    setIsLoading(true);
    try {
      // 🎯 USA L'API UNIFICATA per il setup admin
      const response = await fetch('/api/unified?action=settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'admin_setup', settings: setupState })
      });

      if (response.ok) {
        alert('✅ Configurazione salvata con successo!');
        window.location.href = '/admin';
      } else {
        throw new Error('Errore nel salvataggio');
      }
    } catch (error) {
      console.error('Errore setup:', error);
      alert('❌ Errore nel salvataggio della configurazione');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-setup">
      <div className="setup-header">
        <h1>🎯 Vincanto - Configurazione Iniziale</h1>
        <p>Configura il sistema da zero per la produzione</p>
        
        <div className="setup-progress">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`step ${index + 1 === currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-title">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="setup-content">
        {/* STEP 1: CALENDARI */}
        {currentStep === 1 && (
          <div className="setup-section">
            <h2>📅 Configurazione Calendari</h2>
            <div className="form-group">
              <label htmlFor="bookingcom">URL iCal Booking.com:</label>
              <input
                id="bookingcom"
                type="url"
                value={setupState.calendars.bookingCom}
                onChange={(e) => setSetupState(prev => ({
                  ...prev,
                  calendars: { ...prev.calendars, bookingCom: e.target.value }
                }))}
                placeholder="https://calendar.booking.com/your-property-ical"
              />
            </div>
            <div className="form-group">
              <label htmlFor="airbnb">URL iCal Airbnb:</label>
              <input
                id="airbnb"
                type="url"
                value={setupState.calendars.airbnb}
                onChange={(e) => setSetupState(prev => ({
                  ...prev,
                  calendars: { ...prev.calendars, airbnb: e.target.value }
                }))}
                placeholder="https://calendar.airbnb.com/your-property-ical"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={setupState.calendars.googleCalendar}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    calendars: { ...prev.calendars, googleCalendar: e.target.checked }
                  }))}
                />
                Abilita sincronizzazione Google Calendar
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: PAGAMENTI */}
        {currentStep === 2 && (
          <div className="setup-section">
            <h2>💳 Metodi di Pagamento</h2>
            
            <div className="payment-method">
              <label>
                <input
                  type="checkbox"
                  checked={setupState.payments.stripeEnabled}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    payments: { ...prev.payments, stripeEnabled: e.target.checked }
                  }))}
                />
                Stripe (Carte di Credito)
              </label>
              {setupState.payments.stripeEnabled && (
                <div className="form-group">
                  <input
                    type="text"
                    value={setupState.payments.stripePublicKey}
                    onChange={(e) => setSetupState(prev => ({
                      ...prev,
                      payments: { ...prev.payments, stripePublicKey: e.target.value }
                    }))}
                    placeholder="pk_live_... (Chiave Pubblica Stripe Live)"
                  />
                </div>
              )}
            </div>

            <div className="payment-method">
              <label>
                <input
                  type="checkbox"
                  checked={setupState.payments.paypalEnabled}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    payments: { ...prev.payments, paypalEnabled: e.target.checked }
                  }))}
                />
                PayPal
              </label>
              {setupState.payments.paypalEnabled && (
                <div className="form-group">
                  <input
                    type="text"
                    value={setupState.payments.paypalClientId}
                    onChange={(e) => setSetupState(prev => ({
                      ...prev,
                      payments: { ...prev.payments, paypalClientId: e.target.value }
                    }))}
                    placeholder="PayPal Client ID Live"
                  />
                </div>
              )}
            </div>

            <div className="payment-method">
              <h3>🏦 Bonifico Bancario</h3>
              <div className="form-group">
                <input
                  type="text"
                  value={setupState.payments.bankDetails.name}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    payments: { 
                      ...prev.payments, 
                      bankDetails: { ...prev.payments.bankDetails, name: e.target.value }
                    }
                  }))}
                  placeholder="Nome Banca"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={setupState.payments.bankDetails.iban}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    payments: { 
                      ...prev.payments, 
                      bankDetails: { ...prev.payments.bankDetails, iban: e.target.value }
                    }
                  }))}
                  placeholder="IT00X0000000000000000000000"
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  value={setupState.payments.bankDetails.beneficiary}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    payments: { 
                      ...prev.payments, 
                      bankDetails: { ...prev.payments.bankDetails, beneficiary: e.target.value }
                    }
                  }))}
                  placeholder="Nome Beneficiario"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PREZZI */}
        {currentStep === 3 && (
          <div className="setup-section">
            <h2>💰 Prezzi e Regole</h2>
            <div className="pricing-grid">
              <div className="form-group">
                <label htmlFor="basePrice">Prezzo base per notte (€):</label>
                <input
                  id="basePrice"
                  type="number"
                  value={setupState.pricing.basePrice}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, basePrice: Number(e.target.value) }
                  }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cleaningFee">Tassa di pulizia (€):</label>
                <input
                  id="cleaningFee"
                  type="number"
                  value={setupState.pricing.cleaningFee}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, cleaningFee: Number(e.target.value) }
                  }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="minStay">Soggiorno minimo (notti):</label>
                <input
                  id="minStay"
                  type="number"
                  value={setupState.pricing.minStay}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, minStay: Number(e.target.value) }
                  }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="checkIn">Check-in:</label>
                <input
                  id="checkIn"
                  type="time"
                  value={setupState.pricing.checkInTime}
                  onChange={(e) => setSetupState(prev => ({
                    ...prev,
                    pricing: { ...prev.pricing, checkInTime: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: EMAIL */}
        {currentStep === 4 && (
          <div className="setup-section">
            <h2>📧 Email e Notifiche</h2>
            <div className="form-group">
              <label htmlFor="emailUser">Email amministratore:</label>
              <input
                id="emailUser"
                type="email"
                value={setupState.email.smtpUser}
                onChange={(e) => setSetupState(prev => ({
                  ...prev,
                  email: { ...prev.email, smtpUser: e.target.value }
                }))}
                placeholder="admin@vincantomaori.it"
              />
            </div>
            <div className="form-group">
              <label htmlFor="emailPass">Password app Gmail:</label>
              <input
                id="emailPass"
                type="password"
                value={setupState.email.smtpPass}
                onChange={(e) => setSetupState(prev => ({
                  ...prev,
                  email: { ...prev.email, smtpPass: e.target.value }
                }))}
                placeholder="Password specifica per app Gmail"
              />
            </div>
          </div>
        )}

        {/* STEP 5: ADMIN */}
        {currentStep === 5 && (
          <div className="setup-section">
            <h2>👤 Credenziali Amministratore</h2>
            <div className="form-group">
              <label htmlFor="adminEmail">Email admin:</label>
              <input
                id="adminEmail"
                type="email"
                value={setupState.admin.email}
                onChange={(e) => setSetupState(prev => ({
                  ...prev,
                  admin: { ...prev.admin, email: e.target.value }
                }))}
                placeholder="admin@vincantomaori.it"
              />
            </div>
            <div className="form-group">
              <label htmlFor="adminPassword">Password admin:</label>
              <input
                id="adminPassword"
                type="password"
                value={setupState.admin.password}
                onChange={(e) => setSetupState(prev => ({
                  ...prev,
                  admin: { ...prev.admin, password: e.target.value }
                }))}
                placeholder="Password sicura per accesso admin"
              />
            </div>
          </div>
        )}

        {/* STEP 6: CONFERMA */}
        {currentStep === 6 && (
          <div className="setup-section">
            <h2>✅ Conferma Configurazione</h2>
            <div className="config-summary">
              <h3>Riepilogo configurazione:</h3>
              <ul>
                <li>📅 Calendari configurati: {Object.values(setupState.calendars).filter(Boolean).length}</li>
                <li>💳 Metodi pagamento: {[setupState.payments.stripeEnabled, setupState.payments.paypalEnabled, setupState.payments.bankTransferEnabled].filter(Boolean).length}</li>
                <li>💰 Prezzo base: €{setupState.pricing.basePrice}/notte</li>
                <li>📧 Email: {setupState.email.smtpUser}</li>
                <li>👤 Admin: {setupState.admin.email}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="setup-navigation">
        {currentStep > 1 && (
          <button onClick={() => setCurrentStep(prev => prev - 1)}>
            ← Precedente
          </button>
        )}
        {currentStep < 6 ? (
          <button onClick={() => setCurrentStep(prev => prev + 1)}>
            Successivo →
          </button>
        ) : (
          <button 
            onClick={saveConfiguration}
            disabled={isLoading}
            className="save-button"
          >
            {isLoading ? 'Salvando...' : '🎯 Attiva Sistema!'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminSetup;