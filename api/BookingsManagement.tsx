import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AdminApiService from '../../services/adminApiService';
import BookingDetailModal from './BookingDetailModal';
import './BookingsManagement.css';

// Componente Badge riutilizzabile per la tabella
const TableStatusBadge = ({ status }: { status: string }) => {
    const { t } = useTranslation();
    const styles: Record<string, string> = {
        pending: 'bg-yellow-200 text-yellow-800',
        confirmed: 'bg-green-200 text-green-800',
        cancelled: 'bg-red-200 text-red-800',
        unpaid: 'bg-gray-300 text-gray-800',
        deposit_paid: 'bg-blue-200 text-blue-800',
        paid_full: 'bg-green-200 text-green-800',
    };
    const label = t(`booking.summary.status${status.charAt(0).toUpperCase() + status.slice(1)}`, status);

    return (
        <span className={`status-badge-table ${styles[status] || 'bg-gray-200'}`}>
            {label}
        </span>
    );
};

const BookingsManagement = () => {
    const { t } = useTranslation();
    const apiService = useMemo(() => new AdminApiService(), []);

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiService.getBookings();
            setBookings(data);
        } catch (err) {
            setError(t('booking.error.unexpected', 'Errore nel caricamento delle prenotazioni.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [apiService, t]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleCloseModal = () => {
        setSelectedBooking(null);
    };

    const handleUpdate = () => {
        setSelectedBooking(null); // Chiude il modale
        fetchBookings(); // Ricarica la lista aggiornata
    };

    if (loading) {
        return <div>{t('calendar.loading', 'Caricamento...')}</div>;
    }

    if (error) {
        return <div className="admin-error">{error}</div>;
    }

    return (
        <div className="bookings-management-container">
            <div className="bookings-header">
                <h2>{t('admin.bookings.title', 'Gestione Prenotazioni')}</h2>
                <button onClick={fetchBookings} className="refresh-btn" aria-label={t('admin.refresh', 'Aggiorna')}>
                    &#x21bb;
                </button>
            </div>

            <div className="table-responsive">
                <table className="bookings-table">
                    <thead>
                        <tr>
                            <th>{t('booking.summary.bookingId', 'ID')}</th>
                            <th>{t('booking.guestInfo', 'Ospite')}</th>
                            <th>{t('booking.checkin', 'Check-in')}</th>
                            <th>{t('booking.checkout', 'Check-out')}</th>
                            <th>{t('booking.summary.status', 'Stato')}</th>
                            <th>{t('booking.payment', 'Pagamento')}</th>
                            <th>{t('booking.total', 'Totale')}</th>
                            <th>{t('admin.actions', 'Azioni')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking.id}>
                                <td data-label="ID">#{booking.booking_id?.substring(0, 8)}...</td>
                                <td data-label="Ospite">{booking.customer_name}</td>
                                <td data-label="Check-in">{new Date(booking.check_in).toLocaleDateString('it-IT')}</td>
                                <td data-label="Check-out">{new Date(booking.check_out).toLocaleDateString('it-IT')}</td>
                                <td data-label="Stato"><TableStatusBadge status={booking.status} /></td>
                                <td data-label="Pagamento"><TableStatusBadge status={booking.payment_status} /></td>
                                <td data-label="Totale">€{booking.total_amount.toFixed(2)}</td>
                                <td data-label="Azioni">
                                    <button onClick={() => setSelectedBooking(booking)} className="manage-btn">
                                        {t('admin.manage', 'Gestisci')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedBooking && (
                <BookingDetailModal
                    booking={selectedBooking}
                    onClose={handleCloseModal}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
};

export default BookingsManagement;