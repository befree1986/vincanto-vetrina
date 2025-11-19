import React, { useEffect, useRef } from 'react';

interface PayPalPaymentButtonProps {
  amount: number;
  currency?: string;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

const PayPalPaymentButton: React.FC<PayPalPaymentButtonProps> = ({ amount, currency = 'EUR', onSuccess, onError }) => {
  const paypalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.paypal) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.REACT_APP_PAYPAL_CLIENT_ID}&currency=${currency}`;
      script.async = true;
      script.onload = () => renderButton();
      document.body.appendChild(script);
    } else {
      renderButton();
    }
    // eslint-disable-next-line
  }, [amount, currency]);

  function renderButton() {
    if (!window.paypal || !paypalRef.current) return;
    window.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{ amount: { value: amount.toFixed(2) } }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        const details = await actions.order.capture();
        onSuccess(details.id);
      },
      onError: (err: any) => {
        onError(err.message || 'Errore PayPal');
      }
    }).render(paypalRef.current);
  }

  return <div ref={paypalRef} />;
};

export default PayPalPaymentButton;
