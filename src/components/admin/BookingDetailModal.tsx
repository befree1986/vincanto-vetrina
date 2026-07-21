import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminApiService from '../../services/adminApiService';
import './BookingDetailModal.css';

// Definizione del tipo per una singola prenotazione (da spostare in un file di tipi condiviso)
interface Booking {
    id: string | number;
    booking_id: string;
    customer_name: string;
    check_in: string;
    check_out: string;
    status: string;
    payment_status: string;
    total_amount: number;
    first_name?: string;
    last_name?: string;
    customer_email?: string;
    phone?: string;
    deposit_amount?: number;
}

interface BookingDetailModalProps {
    booking: Booking;
    onClose: () => void;
    onUpdate: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, onClose, onUpdate }) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(booking);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const apiService = new AdminApiService();

    useEffect(() => {
        setFormData(booking);
    }, [booking]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            await apiService.updateBooking(String(booking.id), formData);
            onUpdate();
        } catch (err) {
            setError(t('booking.error.save', 'Errore durante il salvataggio.'));
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAction = async (action: 'confirm' | 'cancel' | 'send-email') => {
        setIsSaving(true);
        setError('');
        try {
            if (action === 'confirm') {
                await apiService.confirmBookingPayment(booking.id);
            } else if (action === 'cancel') {
                if (window.confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
                    await apiService.cancelBooking(booking.id);
                }
            } else if (action === 'send-email') {
                const subject = prompt('Oggetto dell\'email:');
                const message = prompt('Messaggio:');
                if (subject && message) {
                    await apiService.sendEmailToCustomer(booking.id, { subject, message });
                    alert('Email inviata!');
                }
            }
            onUpdate();
        } catch (err) {
            setError(t('booking.error.action', "Errore durante l'esecuzione dell'azione."));
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <button onClick={onClose} className="modal-close-btn">&times;</button>
                <div className="modal-header">
                    <h2>Dettagli Prenotazione #{booking.booking_id.substring(0, 8)}</h2>
                    <div className="status-badges">
                        <span className="badge">{booking.status}</span>
                        <span className="badge">{booking.payment_status}</span>
                    </div>
                </div>

                {error && <div className="modal-error">{error}</div>}

                <div className="admin-form">
                    <h4>Azioni Rapide</h4>
                    <div className="quick-actions">
                        <button onClick={() => handleAction('confirm')} className="btn-success" disabled={isSaving || booking.payment_status === 'paid_full'}>Conferma Pagamento</button>
                        <button onClick={() => handleAction('cancel')} className="btn-danger" disabled={isSaving || booking.status === 'cancelled'}>Cancella Prenotazione</button>
                        <button onClick={() => handleAction('send-email')} className="btn-primary" disabled={isSaving}>Invia Email</button>
                    </div>

                    <hr />

                    <h4>Dettagli Cliente</h4>
                    <div className="form-grid">
                        <div><label>Nome</label><input name="customer_name" value={formData.customer_name} onChange={handleInputChange} disabled={!isEditing} /></div>
                        <div><label>Email</label><input name="customer_email" type="email" value={formData.customer_email || ''} onChange={handleInputChange} disabled={!isEditing} /></div>
                        <div><label>Telefono</label><input name="phone" value={formData.phone || ''} onChange={handleInputChange} disabled={!isEditing} /></div>
                    </div>

                    <h4>Dettagli Soggiorno</h4>
                    <div className="form-grid-small">
                        <div><label>Check-in</label><input name="check_in" type="date" value={new Date(formData.check_in).toISOString().split('T')[0]} onChange={handleInputChange} disabled={!isEditing} /></div>
                        <div><label>Check-out</label><input name="check_out" type="date" value={new Date(formData.check_out).toISOString().split('T')[0]} onChange={handleInputChange} disabled={!isEditing} /></div>
                        <div>
                            <label>{t('booking.summary.status', 'Stato')}</label>
                            <select name="status" value={formData.status} onChange={handleInputChange} disabled={!isEditing}>
                                <option value="pending">{t('booking.summary.statusPending', 'In attesa')}</option>
                                <option value="confirmed">{t('booking.summary.statusConfirmed', 'Confermata')}</option>
                                <option value="cancelled">{t('booking.summary.statusCancelled', 'Cancellata')}</option>
                            </select>
                        </div>
                        <div>
                            <label>{t('booking.payment', 'Stato Pagamento')}</label>
                            <select name="payment_status" value={formData.payment_status} onChange={handleInputChange} disabled={!isEditing}>
                                <option value="unpaid">{t('booking.summary.statusUnpaid', 'Non pagato')}</option>
                                <option value="deposit_paid">{t('booking.summary.statusDeposit_paid', 'Acconto pagato')}</option>
                                <option value="paid_full">{t('booking.summary.statusPaid_full', 'Pagato')}</option>
                                <option value="cancelled">{t('booking.summary.statusCancelled', 'Cancellata')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-footer">
                        {isEditing ? (
                            <><button onClick={handleSave} className="btn-primary" disabled={isSaving}>{isSaving ? 'Salvataggio...' : 'Salva Modifiche'}</button><button onClick={() => setIsEditing(false)} className="btn-secondary">Annulla</button></>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="btn-primary">Modifica Dati</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailModal;