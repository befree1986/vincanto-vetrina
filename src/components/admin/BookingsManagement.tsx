import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import AdminApiService, { Booking } from '../../services/adminApiService';
import BookingDetailModal from './BookingDetailModal';
import './BookingsManagement.css';

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
    key: keyof Booking;
    direction: SortDirection;
}

export interface BookingFilter {
    dateFilter?: {
        type: 'check-in' | 'check-out' | 'upcoming';
        date?: string; // YYYY-MM-DD for single day
    };
    statusFilter?: string;
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

interface BookingsManagementProps {
    initialFilter?: BookingFilter | null;
    onFilterConsumed?: () => void;
}

const BookingsManagement: React.FC<BookingsManagementProps> = ({ initialFilter, onFilterConsumed }) => {
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
    const [isSendingReminder, setIsSendingReminder] = useState<string | number | null>(null);
    const [dateFilter, setDateFilter] = useState<{ start: string; end: string; type?: 'check-in' | 'check-out' }>({ start: '', end: '', type: 'check-in' });
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

    useEffect(() => {
        if (initialFilter) {
            resetFilters(); // Pulisce i filtri precedenti
            if (initialFilter.dateFilter) {
                const { type, date } = initialFilter.dateFilter;
                if ((type === 'check-in' || type === 'check-out') && date) {
                    setDateFilter({ start: date, end: date, type: type });
                } else if (type === 'upcoming') {
                    setDateFilter({ start: new Date().toISOString().split('T')[0], end: '', type: 'check-in' });
                    setStatusFilter('confirmed'); // Mostra solo le confermate future
                }
            }
            if (initialFilter.statusFilter) {
                setStatusFilter(initialFilter.statusFilter);
            }
            // Notifica il genitore che il filtro è stato applicato e può essere resettato
            onFilterConsumed?.();
        }
    }, [initialFilter, onFilterConsumed]);

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

            // Filtro per intervallo di date
            if (dateFilter.type === 'check-out') {
                if (dateFilter.start && !booking.check_out.startsWith(dateFilter.start)) return false;
            } else { // Default to check-in
                if (dateFilter.start && booking.check_in < dateFilter.start) return false;
                if (dateFilter.end && booking.check_in > dateFilter.end) return false;
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
        setDateFilter({ start: '', end: '', type: 'check-in' });
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

    const handleExportCSV = () => {
        if (sortedBookings.length === 0) {
            alert(t('admin.bookings.noDataToExport', 'Nessuna prenotazione da esportare.'));
            return;
        }

        const headers = [
            'ID Prenotazione', 'Nome Cliente', 'Email', 'Telefono',
            'Check-in', 'Check-out', 'Ospiti', 'Stato', 'Stato Pagamento',
            'Importo Totale', 'Data Creazione'
        ];

        const csvRows = [headers.join(',')];

        sortedBookings.forEach(booking => {
            const row = [
                `"${booking.booking_id}"`,
                `"${booking.customer_name.replace(/"/g, '""')}"`, // Escape double quotes
                `"${booking.customer_email || ''}"`,
                `"${booking.phone || ''}"`,
                booking.check_in,
                booking.check_out,
                booking.guests || 1,
                booking.status,
                booking.payment_status,
                booking.total_amount.toFixed(2),
                booking.created_at ? new Date(booking.created_at).toLocaleString('it-IT') : ''
            ].join(',');
            csvRows.push(row);
        });

        const csvString = `\uFEFF${csvRows.join('\n')}`; // Add BOM for Excel
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `vincanto_prenotazioni_${date}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendReminder = async (booking: Booking) => {
        if (!window.confirm(`Inviare un promemoria di pagamento a ${booking.customer_name}?`)) {
            return;
        }
        setIsSendingReminder(booking.id);
        try {
            await apiService.sendPaymentReminder(booking.id);
            alert('Promemoria inviato con successo!');
        } catch (error) {
            console.error('Errore invio promemoria:', error);
            alert(`Errore durante l'invio del promemoria: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        } finally {
            setIsSendingReminder(null);
        }
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
                    <option value="draft">{t('booking.summary.statusDraft', 'Bozza')}</option>
                </select>
                <div className="date-filter-group">
                    <input type="date" value={dateFilter.start} onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))} className="date-input" aria-label={t('booking.checkin', 'Check-in')} />
                    <span>-</span>
                    <input type="date" value={dateFilter.end} onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))} className="date-input" aria-label={t('booking.checkout', 'Check-out')} />
                </div>
                <button onClick={resetFilters} className="reset-filters-btn">
                    {t('admin.bookings.resetFilters', 'Resetta Filtri')}
                </button>
                <button onClick={handleExportCSV} className="export-btn" disabled={sortedBookings.length === 0}>
                    {t('admin.bookings.exportCSV', 'Esporta CSV')}
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
                                    <td data-label="Ospite">
                                        {booking.customer_name}
                                        {booking.internal_notes && <span className="notes-indicator" title={t('admin.bookings.hasInternalNotes', 'Questa prenotazione ha una nota interna')}>📝</span>}
                                    </td>
                                    <td data-label="Check-in">{new Date(booking.check_in).toLocaleDateString('it-IT')}</td>
                                    <td data-label="Check-out">{new Date(booking.check_out).toLocaleDateString('it-IT')}</td>
                                    <td data-label="Stato"><TableStatusBadge status={booking.status} /></td>
                                    <td data-label="Pagamento"><TableStatusBadge status={booking.payment_status} /></td>
                                    <td data-label="Totale">€{booking.total_amount.toFixed(2)}</td>
                                    <td data-label="Azioni">
                                        <div className="action-buttons-container">
                                            <button onClick={() => setSelectedBooking(booking)} className="manage-btn">
                                                {t('admin.manage', 'Gestisci')}
                                            </button>
                                            <button
                                                onClick={() => handleSendReminder(booking)}
                                                className="reminder-btn"
                                                disabled={isSendingReminder === booking.id || booking.payment_status === 'paid_full' || booking.status === 'cancelled'}
                                                title={t('admin.bookings.sendReminder', 'Invia promemoria pagamento')}
                                            >
                                                {isSendingReminder === booking.id ? '...' : '📧'}
                                            </button>
                                        </div>
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