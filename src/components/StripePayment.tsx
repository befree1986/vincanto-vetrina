import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { createStripePaymentIntent, confirmStripePayment, handleApiError } from '../services/api';
import './StripePayment.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentProps {
    bookingId: string;
    amount: number;
    customerEmail: string;
    customerName: string;
    onPaymentSuccess: (result: any) => void;
    onPaymentError: (error: string) => void;
    onCancel: () => void;
}

interface PaymentFormProps extends StripePaymentProps {
    clientSecret: string;
}

const cardElementOptions = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
        },
        invalid: {
            color: '#9e2146',
        },
    },
    hidePostalCode: false,
};

const PaymentForm: React.FC<PaymentFormProps> = ({
    bookingId,
    amount,
    customerEmail,
    customerName,
    clientSecret,
    onPaymentSuccess,
    onPaymentError,
    onCancel
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            return;
        }

        setIsProcessing(true);
        setCardError(null);

        try {
            // Conferma il pagamento
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: customerName,
                        email: customerEmail,
                    },
                },
            });

            if (error) {
                setCardError(error.message || 'Errore durante il pagamento');
                onPaymentError(error.message || 'Errore durante il pagamento');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Conferma il pagamento nel nostro backend
                const result = await confirmStripePayment(paymentIntent.id);
                onPaymentSuccess(result);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            setCardError(errorMessage);
            onPaymentError(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCardChange = (event: any) => {
        setCardComplete(event.complete);
        setCardError(event.error ? event.error.message : null);
    };

    return (
        <div className="stripe-payment-form">
            <div className="payment-header">
                <h3>Pagamento con Carta di Credito</h3>
                <div className="payment-amount">
                    <strong>Importo: €{amount.toFixed(2)}</strong>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="payment-form">
                <div className="card-element-container">
                    <label htmlFor="card-element">
                        Dati della Carta
                    </label>
                    <CardElement
                        id="card-element"
                        options={cardElementOptions}
                        onChange={handleCardChange}
                    />
                    {cardError && (
                        <div className="card-error" role="alert">
                            {cardError}
                        </div>
                    )}
                </div>

                <div className="payment-details">
                    <div className="customer-info">
                        <p><strong>Nome:</strong> {customerName}</p>
                        <p><strong>Email:</strong> {customerEmail}</p>
                        <p><strong>Prenotazione:</strong> #{bookingId}</p>
                    </div>
                </div>

                <div className="payment-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-cancel"
                        disabled={isProcessing}
                    >
                        Annulla
                    </button>
                    <button
                        type="submit"
                        disabled={!stripe || !cardComplete || isProcessing}
                        className="btn-pay"
                    >
                        {isProcessing ? (
                            <>
                                <span className="spinner"></span>
                                Elaborazione...
                            </>
                        ) : (
                            `Paga €${amount.toFixed(2)}`
                        )}
                    </button>
                </div>
            </form>

            <div className="payment-security">
                <div className="security-badges">
                    <span className="badge">🔒 SSL Sicuro</span>
                    <span className="badge">💳 Stripe</span>
                    <span className="badge">✓ PCI Compliant</span>
                </div>
                <p className="security-text">
                    I tuoi dati di pagamento sono protetti con crittografia SSL e non vengono mai salvati sui nostri server.
                </p>
            </div>
        </div>
    );
};

const StripePayment: React.FC<StripePaymentProps> = (props) => {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializePayment = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await createStripePaymentIntent({
                    booking_id: props.bookingId,
                    amount: props.amount
                });

                setClientSecret(response.client_secret);
            } catch (error) {
                const errorMessage = handleApiError(error);
                setError(errorMessage);
                props.onPaymentError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        initializePayment();
    }, [props.bookingId, props.amount, props.onPaymentError]);

    if (isLoading) {
        return (
            <div className="stripe-payment-loading">
                <div className="spinner"></div>
                <p>Inizializzazione pagamento...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stripe-payment-error">
                <h3>Errore Inizializzazione Pagamento</h3>
                <p>{error}</p>
                <button onClick={props.onCancel} className="btn-cancel">
                    Torna Indietro
                </button>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="stripe-payment-error">
                <h3>Errore di Configurazione</h3>
                <p>Impossibile inizializzare il pagamento. Riprova più tardi.</p>
                <button onClick={props.onCancel} className="btn-cancel">
                    Torna Indietro
                </button>
            </div>
        );
    }

    const elementsOptions: StripeElementsOptions = {
        clientSecret,
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#d2691e',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                spacingUnit: '4px',
                borderRadius: '6px',
            },
        },
    };

    return (
        <Elements stripe={stripePromise} options={elementsOptions}>
            <PaymentForm {...props} clientSecret={clientSecret} />
        </Elements>
    );
};

export default StripePayment;