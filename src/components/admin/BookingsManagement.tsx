import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import AdminApiService from '../../services/adminApiService';
import BookingDetailModal from './BookingDetailModal';
import './BookingsManagement.css';

// Definizione del tipo per una singola prenotazione
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

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: keyof Booking;
    direction: SortDirection;
}

const TableStatusBadge = ({ status }: { status: string }) => {
    const { t } = useTranslation();
    const label = t(`booking.summary.status${status.charAt(0).toUpperCase() + status.slice(1)}`, status);

    return (
        <span className={`status-badge-table status-${status || 'default'}`}>
            {label}
        </span>
    );
};

const BookingsManagement = () => {
    const { t } = useTranslation();
    const apiService = useMemo(() => new AdminApiService(), []);

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiService.getBookings();
            setBookings(data);
        } catch (err: any) {
            setError(t('booking.error.unexpected', 'Errore nel caricamento delle prenotazioni.'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [apiService, t]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Resetta la pagina quando il filtro di ricerca cambia
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, dateFilter]);

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => {
            // Filtro per termine di ricerca
            if (searchTerm) {
                const lowercasedFilter = searchTerm.toLowerCase();
                const matchesSearch = booking.customer_name.toLowerCase().includes(lowercasedFilter) ||
                    (booking.customer_email && booking.customer_email.toLowerCase().includes(lowercasedFilter)) ||
                    booking.booking_id.toLowerCase().includes(lowercasedFilter);
                if (!matchesSearch) return false;
            }

            // Filtro per stato
            if (statusFilter !== 'all' && booking.status !== statusFilter) {
                return false;
            }

            // Filtro per intervallo di date (controlla se il check-in rientra nell'intervallo)
            if (dateFilter.start && new Date(booking.check_in) < new Date(dateFilter.start)) {
                return false;
            }
            if (dateFilter.end && new Date(booking.check_in) > new Date(dateFilter.end)) {
                return false;
            }

            return true;
        });
    }, [bookings, searchTerm, statusFilter, dateFilter]);

    const sortedBookings = useMemo(() => {
        let sortableItems = [...filteredBookings];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key]! < b[sortConfig.key]!) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key]! > b[sortConfig.key]!) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredBookings, sortConfig]);

    const totalPages = Math.ceil(sortedBookings.length / itemsPerPage);

    const paginatedBookings = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedBookings.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedBookings, currentPage, itemsPerPage]);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDateFilter({ start: '', end: '' });
        setCurrentPage(1);
        setSortConfig(null);
    };

    const requestSort = (key: keyof Booking) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

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

            <div className="bookings-filters" role="search" aria-labelledby="filters-heading">
                <h3 id="filters-heading" className="sr-only">Filtri prenotazioni</h3>
                <input
                    type="text"
                    placeholder={t('admin.bookings.searchPlaceholder', 'Cerca per nome, email o ID...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                    aria-label={t('admin.bookings.filterByStatus', 'Filtra per stato')}
                >
                    <option value="all">{t('admin.bookings.allStatuses', 'Tutti gli stati')}</option>
                    <option value="pending">{t('booking.summary.statusPending', 'In attesa')}</option>
                    <option value="confirmed">{t('booking.summary.statusConfirmed', 'Confermata')}</option>
                    <option value="cancelled">{t('booking.summary.statusCancelled', 'Cancellata')}</option>
                </select>
                <div className="date-filter-group">
                    <input type="date" value={dateFilter.start} onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))} className="date-input" aria-label={t('booking.checkin', 'Check-in')} />
                    <span>-</span>
                    <input type="date" value={dateFilter.end} onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))} className="date-input" aria-label={t('booking.checkout', 'Check-out')} />
                </div>
                <button onClick={resetFilters} className="reset-filters-btn">
                    {t('admin.bookings.resetFilters', 'Resetta Filtri')}
                </button>
            </div>

            <div className="table-responsive">
                <table className="bookings-table">
                    <thead>
                        <tr>
                            <th>
                                <button type="button" onClick={() => requestSort('booking_id')} className={`sortable-th ${sortConfig?.key === 'booking_id' ? sortConfig.direction : ''}`}>
                                    {t('booking.summary.bookingId', 'ID')}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => requestSort('customer_name')} className={`sortable-th ${sortConfig?.key === 'customer_name' ? sortConfig.direction : ''}`}>
                                    {t('booking.guestInfo', 'Ospite')}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => requestSort('check_in')} className={`sortable-th ${sortConfig?.key === 'check_in' ? sortConfig.direction : ''}`}>
                                    {t('booking.checkin', 'Check-in')}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => requestSort('check_out')} className={`sortable-th ${sortConfig?.key === 'check_out' ? sortConfig.direction : ''}`}>
                                    {t('booking.checkout', 'Check-out')}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => requestSort('status')} className={`sortable-th ${sortConfig?.key === 'status' ? sortConfig.direction : ''}`}>
                                    {t('booking.summary.status', 'Stato')}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => requestSort('payment_status')} className={`sortable-th ${sortConfig?.key === 'payment_status' ? sortConfig.direction : ''}`}>
                                    {t('booking.payment', 'Pagamento')}
                                </button>
                            </th>
                            <th>
                                <button type="button" onClick={() => requestSort('total_amount')} className={`sortable-th ${sortConfig?.key === 'total_amount' ? sortConfig.direction : ''}`}>
                                    {t('booking.total', 'Totale')}
                                </button>
                            </th>
                            <th>{t('admin.actions', 'Azioni')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedBookings.length > 0 ? (
                            paginatedBookings.map((booking) => (
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
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="text-center">{t('admin.bookings.noResults', 'Nessuna prenotazione trovata.')}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination-controls">
                    <span>
                        <Trans i18nKey="admin.pagination.info"
                            values={{ currentPage, totalPages, totalResults: sortedBookings.length }}
                            components={{ bold: <strong /> }}
                        />
                    </span>
                    <div className="pagination-buttons">
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                            &laquo; Precedente
                        </button>
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                            Successivo &raquo;
                        </button>
                    </div>
                </div>
            )}


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