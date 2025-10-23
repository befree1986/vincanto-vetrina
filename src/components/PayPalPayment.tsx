import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PayPalPaymentProps {
  amount: number;
  currency?: string;
  bookingData: any;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel: () => void;
}

interface PayPalWindow extends Window {
  paypal?: any;
}

declare const window: PayPalWindow;

const PayPalPayment: React.FC<PayPalPaymentProps> = ({
  amount,
  currency = 'EUR',
  bookingData,
  onSuccess,
  onError,
  onCancel
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);

  useEffect(() => {
    // Check if PayPal script is already loaded
    if (window.paypal) {
      setPaypalLoaded(true);
      setIsLoading(false);
      renderPayPalButtons();
      return;
    }

    // Load PayPal script
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}&currency=${currency}&components=buttons`;
    script.async = true;
    
    script.onload = () => {
      setPaypalLoaded(true);
      setIsLoading(false);
      renderPayPalButtons();
    };
    
    script.onerror = () => {
      setError('Errore nel caricamento PayPal');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [currency]);

  const renderPayPalButtons = () => {
    if (!window.paypal || !paypalLoaded) return;

    // Clear existing buttons
    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = '';
    }

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 45
      },
      
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            description: `Prenotazione Vincanto - ${bookingData.checkIn} / ${bookingData.checkOut}`,
            amount: {
              currency_code: currency,
              value: amount.toFixed(2)
            },
            custom_id: bookingData.tempId || Date.now().toString(),
            invoice_id: `VINCANTO-${Date.now()}`,
            soft_descriptor: 'VINCANTO'
          }],
          application_context: {
            brand_name: 'Vincanto Maori',
            locale: 'it-IT',
            landing_page: 'BILLING',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW'
          }
        });
      },

      onApprove: async (data: any, actions: any) => {
        try {
          const order = await actions.order.capture();
          
          // Send payment data to backend
          const response = await fetch('/api/payment/paypal/capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderID: data.orderID,
              paypalOrder: order,
              bookingData: bookingData
            }),
          });

          if (response.ok) {
            const result = await response.json();
            onSuccess({
              orderId: data.orderID,
              paypalOrder: order,
              bookingId: result.bookingId
            });
          } else {
            throw new Error('Errore nel processamento del pagamento');
          }
          
        } catch (error) {
          console.error('PayPal payment error:', error);
          onError(error);
        }
      },

      onCancel: (data: any) => {
        console.log('PayPal payment cancelled:', data);
        onCancel();
      },

      onError: (err: any) => {
        console.error('PayPal button error:', err);
        setError('Errore durante il pagamento PayPal');
        onError(err);
      }
    }).render('#paypal-button-container');
  };

  if (isLoading) {
    return (
      <div className="paypal-payment-loading">
        <div className="spinner"></div>
        <p>{t('booking.payment.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="paypal-payment-error">
        <p className="error-message">{error}</p>
        <button 
          onClick={() => {
            setError(null);
            setIsLoading(true);
            renderPayPalButtons();
          }}
          className="btn-secondary"
        >
          {t('booking.payment.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="paypal-payment">
      <div className="payment-header">
        <h3>{t('booking.payment.paypal.title')}</h3>
        <p className="payment-amount">
          {t('booking.payment.amount')}: <strong>€{amount.toFixed(2)}</strong>
        </p>
        <p className="payment-description">
          {t('booking.payment.paypal.description')}
        </p>
      </div>
      
      <div id="paypal-button-container" className="paypal-buttons"></div>
      
      <div className="payment-security">
        <div className="security-badges">
          <span className="security-badge">🔒 SSL</span>
          <span className="security-badge">✓ PayPal</span>
          <span className="security-badge">💳 Sicuro</span>
        </div>
        <p className="security-text">
          {t('booking.payment.security')}
        </p>
      </div>
    </div>
  );
};

export default PayPalPayment;