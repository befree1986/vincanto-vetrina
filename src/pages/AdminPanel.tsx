import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import BookingsManagement, { BookingFilter } from '../components/admin/BookingsManagement';
import ContentManager from '../components/admin/ContentManager';
import AdminApiService, { Booking } from '../services/adminApiService';
import { useAdminRole } from '../hooks/useAdminRole';
import SubscriptionRequired from '../components/admin/SubscriptionRequired';
import './AdminPanel.css'; // Nuovo file CSS

const AdminPanel = () => {
    // Aggiungiamo un'asserzione di tipo per includere `subscriptionStatus`, risolvendo l'errore di compilazione.
    const { role, isSuperAdmin, subscriptionStatus } = useAdminRole() as ReturnType<typeof useAdminRole> & { subscriptionStatus: 'active' | 'inactive' | 'not_applicable' | 'loading' };
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({
        upcomingBookings: 0,
        pendingMessages: 0,
        todayCheckIns: 0,
        todayCheckOuts: 0,
    });
    const [todaysActivities, setTodaysActivities] = useState<(Booking & { activityType: 'check-in' | 'check-out' })[]>([]);
    const [initialBookingFilter, setInitialBookingFilter] = useState<BookingFilter | null>(null);
    const [loading, setLoading] = useState(true);
    const adminApiService = useMemo(() => new AdminApiService(), []);

    const adminTabs = [
        { id: 'dashboard', label: '📊 Dashboard', requiresSuperAdmin: false },
        { id: 'prenotazioni', label: '📅 Prenotazioni', requiresSuperAdmin: false },
        { id: 'contenuti', label: '📝 Contenuti', requiresSuperAdmin: false },
        // Un superadmin che visualizza il pannello base può tornare a quello pro
        ...(isSuperAdmin() ? [{ id: 'switch-pro', label: '🚀 Vista SuperAdmin', requiresSuperAdmin: true }] : []),
    ];

    const handleStatClick = (filter: BookingFilter) => {
        setInitialBookingFilter(filter);
        setActiveTab('prenotazioni');
    };


    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const bookings: Booking[] = await adminApiService.getBookings();

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split('T')[0];

            const upcoming = bookings.filter((b: Booking) => new Date(b.check_in) >= today && ['confirmed', 'pending'].includes(b.status));
            const todayCheckIns = upcoming.filter(b => b.check_in.startsWith(todayString));
            const todayCheckOuts = bookings.filter(b => b.check_out.startsWith(todayString) && b.status === 'confirmed');

            // NOTA: Il conteggio dei messaggi è un segnaposto.
            // Sarebbe necessario un endpoint API per contare le richieste di contatto non lette.
            const messages = 5;
            setStats({
                upcomingBookings: upcoming.length,
                pendingMessages: messages,
                todayCheckIns: todayCheckIns.length,
                todayCheckOuts: todayCheckOuts.length,
            });

            const activities = [
                ...todayCheckIns.map((b: Booking) => ({ ...b, activityType: 'check-in' as const })),
                ...todayCheckOuts.map((b: Booking) => ({ ...b, activityType: 'check-out' as const })),
            ].sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());
            setTodaysActivities(activities);

        } catch (error) {
            console.error("Impossibile caricare i dati della dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, [adminApiService]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (activeTab === 'switch-pro' && isSuperAdmin()) {
            navigate('/admin/pro');
        }
    }, [activeTab, isSuperAdmin, navigate]);

    // 🆕 Blocco per abbonamento non attivo
    if (role === 'admin' && subscriptionStatus === 'inactive') {
        return <SubscriptionRequired />;
    }

    return (
        <AdminLayout
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={() => {
                localStorage.clear();
                navigate('/admin/login');
            }}
            isSuperAdmin={isSuperAdmin()}
            adminEmail={localStorage.getItem('vincanto_admin_email') || role || 'Admin'}
            tabs={adminTabs}
        >
            <div className="admin-panel-basic">
                {activeTab === 'dashboard' && (
                    <div className="admin-section admin-animate-fade-in">
                        <h2>Dashboard Operativa</h2>
                        {loading ? <p>Caricamento dati...</p> : (
                            <>
                                <div className="admin-stats-grid">
                                    <div className="admin-stat-card check-in clickable" onClick={() => handleStatClick({ dateFilter: { type: 'check-in', date: new Date().toISOString().split('T')[0] } })}>
                                        <h3>Check-in di Oggi</h3>
                                        <div className="stat-value">{stats.todayCheckIns}</div>
                                        <small>Arrivi previsti oggi</small>
                                    </div>
                                    <div className="admin-stat-card check-out clickable" onClick={() => handleStatClick({ dateFilter: { type: 'check-out', date: new Date().toISOString().split('T')[0] } })}>
                                        <h3>Check-out di Oggi</h3>
                                        <div className="stat-value">{stats.todayCheckOuts}</div>
                                        <small>Partenze previste oggi</small>
                                    </div>
                                    <div className="admin-stat-card clickable" onClick={() => handleStatClick({ dateFilter: { type: 'upcoming' }, statusFilter: 'confirmed' })}>
                                        <h3>Prossime Prenotazioni</h3>
                                        <div className="stat-value">{stats.upcomingBookings}</div>
                                        <small>Confermate e in attesa</small>
                                    </div>
                                    <div className="admin-stat-card" title="Funzionalità in sviluppo">
                                        <h3>Messaggi da Leggere</h3>
                                        <div className="stat-value">{stats.pendingMessages}</div>
                                        <small>Dal form di contatto (dato fittizio)</small>
                                    </div>
                                </div>

                                <div className="admin-activity-list">
                                    <h3>Attività di Oggi</h3>
                                    {todaysActivities.length > 0 ? (
                                        <ul>
                                            {todaysActivities.map(activity => (
                                                <li key={`${activity.id}-${activity.activityType}`} className={`activity-item ${activity.activityType}`}>
                                                    <span className="activity-type">
                                                        {activity.activityType === 'check-in' ? 'Arrivo' : 'Partenza'}
                                                    </span>
                                                    <span className="activity-guest">{activity.customer_name}</span>
                                                    <span className="activity-details">ID: #{activity.booking_id.substring(0, 8)}</span>
                                                    <span className={`activity-status-badge status-${activity.status}`}>{activity.status}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="no-activity">Nessuna attività prevista per oggi.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'prenotazioni' && <BookingsManagement initialFilter={initialBookingFilter} onFilterConsumed={() => setInitialBookingFilter(null)} />}

                {activeTab === 'contenuti' && <ContentManager adminApiService={adminApiService} />}
            </div>
        </AdminLayout>
    );
};

export default AdminPanel;