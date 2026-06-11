/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminUXResponsive.css';
import './AdminPanelBasic.css';
import ExtraServicesAdmin from './admin/ExtraServicesAdmin';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import GalleryManager from './admin/GalleryManager';
import ContentManager from './admin/ContentManager';
import { useAdminRole } from '../hooks/useAdminRole';
import { devLog, devError } from '../utils/debug';
import { log } from '../utils/logger';
import AdminApiService from '../services/adminApiService';

/**
 * Pannello Amministratore Completo (Basic)
 * Accessibile agli admin ordinari
 * Include: Dashboard, Prenotazioni, Calendari, Servizi Extra
 */
const AdminPanelBasic = (): JSX.Element => {
  devLog('🚀 AdminPanelBasic component rendering...');

  const { role, isLoading: roleLoading, isAdmin, isSuperAdmin } = useAdminRole();
  const navigate = useNavigate();
  // Tab navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPreview, setShowPreview] = useState(true);

  const basicTabs = [
    { id: 'dashboard', label: '📊 Dashboard', requiresSuperAdmin: false },
    { id: 'prenotazioni', label: '📅 Prenotazioni', requiresSuperAdmin: false },
    { id: 'calendari', label: '📆 Calendari', requiresSuperAdmin: false },
    { id: 'servizi', label: '🛎️ Servizi Extra', requiresSuperAdmin: false },
    { id: 'gallery', label: '🖼️ Gestione Immagini', requiresSuperAdmin: false },
    { id: 'contenuti', label: '📝 Contenuti Sito', requiresSuperAdmin: false },
    { id: 'switch-superadmin', label: '⚡ Vista SuperAdmin', requiresSuperAdmin: true },
  ];

  // Data states
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [extraServices, setExtraServices] = useState<any[]>([]); // 🛎️ Servizi extra
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Stati per Calendario Visuale
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Stati per Form Manuali
  const [showManualForm, setShowManualForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [manualBooking, setManualBooking] = useState({
    id: '', // Per modifiche
    first_name: '',
    last_name: '',
    customer_email: '',
    phone: '',
    check_in: '',
    check_out: '',
    guests: 2,
    total_amount: 0,
    status: 'confirmed',
    payment_method: 'bank_transfer',
    payment_type: 'deposit', // 'deposit' o 'full'
    selected_services: [] as any[],
    platform: 'manual' // Identifica prenotazioni manuali
  });
  const [blockDate, setBlockDate] = useState({ start_date: '', end_date: '', reason: 'maintenance' });
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null); // Stato per modifica blocco

  // Admin API Service
  const [adminApiService] = useState(() => {
    try {
      devLog('🔧 Inizializzazione AdminApiService...');
      return new AdminApiService();
    } catch (error) {
      devError('❌ Errore AdminApiService:', error);
      return null;
    }
  });

  // Funzione per aggiornare le impostazioni di sistema (Testi e Immagini)
  const updateSystemSettingValue = async (key: string, value: any) => {
    if (!adminApiService) return;
    try {
      const result = await adminApiService.updateSystemSetting(key, value);
      log('✅ Impostazione aggiornata:', { key, value });
      return result;
    } catch (error) {
      console.error('❌ Errore aggiornamento impostazione:', error);
      throw error;
    }
  };

  // Funzione per gestire l'upload, ridimensionamento e compressione
  const handleImageUpload = async (file: File, key: string) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Per favore seleziona un file immagine valido.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Ridimensionamento: max 1200px lato lungo
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Conversione in WebP (qualità 0.7)
          const dataUrl = canvas.toDataURL('image/webp', 0.7);
          
          setSystemSettings(prev => {
            const current = Array.isArray(prev) ? prev : [];
            const index = current.findIndex(s => s.key === key);
            const updated = [...current];
            if (index > -1) {
              updated[index] = { ...updated[index], value: dataUrl };
            } else {
              updated.push({ key, value: dataUrl, category: 'gallery' });
            }
            return updated;
          });
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Errore elaborazione immagine:', error);
      alert('Errore durante l\'elaborazione dell\'immagine.');
    }
  };

  // Load real API data
  const loadRealApiData = async () => {
    if (!adminApiService) {
      console.warn('âš ï¸ AdminApiService non disponibile');
      return;
    }

    setIsLoadingData(true);
    try {
      log('📄 Caricamento dati API...');

      const [stats, bookings, calendarBookings, settings, analyticsData, notifs, transactions, blocks, services] = await Promise.allSettled([
        adminApiService.getDashboardStats(),
        adminApiService.getBookings(),
        adminApiService.getCalendarBookings({ futureOnly: true, limit: 100 }),
        adminApiService.getSystemSettings(),
        adminApiService.getAnalytics(),
        adminApiService.getNotifications(),
        adminApiService.getPayments(),
        adminApiService.getBlockedDates(),
        adminApiService.getExtraServices()
      ]);

      if (stats.status === 'fulfilled') setDashboardStats(stats.value || {});
      if (bookings.status === 'fulfilled') setRealBookings(bookings.value || []);
      if (calendarBookings.status === 'fulfilled') setCalendarEvents(calendarBookings.value?.bookings || []);
      if (settings.status === 'fulfilled') setSystemSettings(settings.value || []);
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value || []);
      if (notifs.status === 'fulfilled') setNotifications(notifs.value || []);
      if (transactions.status === 'fulfilled') setPaymentTransactions(transactions.value || []);
      if (blocks.status === 'fulfilled') setBlockedDates(blocks.value || []);
      if (services.status === 'fulfilled') setExtraServices(services.value || []);

      log('✅ Dati caricati con successo');
    } catch (error) {
      devError('❌ Errore caricamento dati:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ✨ NUOVE FUNZIONI PER GESTIONE PAGAMENTI E CANCELLAZIONI
  const handleConfirmPayment = async (bookingId: string, paymentType: 'deposit' | 'full') => {
    const typeLabel = paymentType === 'deposit' ? "l'acconto" : "il saldo completo";
    if (!confirm(`Sei sicuro di voler confermare la ricezione del${typeLabel}? Verrà inviata l'email di conferma al cliente.`)) {
      return;
    }

    try {
      setIsLoadingData(true);
      // Usa l'endpoint unificato
      const response = await fetch('/api/unified?action=capture-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          paymentType: paymentType
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Pagamento confermato con successo!');
        await loadRealApiData();
      } else {
        alert('❌ Errore: ' + (result.error || result.message));
      }
    } catch (error) {
      console.error('❌ Errore conferma pagamento:', error);
      alert('❌ Errore di comunicazione con il server');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('⚠️ Sei sicuro di voler ELIMINARE definitivamente questa prenotazione? Questa azione rimuoverà anche le date bloccate.')) {
      return;
    }
    try {
      setIsLoadingData(true);
      await adminApiService?.deleteBooking(id);
      await loadRealApiData();
      alert('✅ Prenotazione eliminata con successo!');
    } catch (error) {
      alert('❌ Errore nell\'eliminazione della prenotazione');
    } finally {
      setIsLoadingData(false);
    }
  };

  // ✨ NUOVO: Invia Promemoria Pagamento
  const handleSendReminder = async (booking: any) => {
    let type = 'full';
    if (booking.payment_method === 'deposit_paid' || booking.payment_status === 'deposit_paid') {
      type = 'balance';
    } else if (booking.deposit_amount && booking.deposit_amount < booking.total_amount) {
      type = 'deposit';
    }

    if (!confirm(`📧 Inviare email di promemoria pagamento (${type === 'balance' ? 'Saldo' : type === 'deposit' ? 'Acconto' : 'Totale'}) a ${booking.customer_name}?`)) {
      return;
    }

    try {
      setIsLoadingData(true);
      const response = await fetch('/api/unified?action=send-payment-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id || booking.booking_id, paymentType: type })
      });
      const result = await response.json();
      alert(result.success ? '✅ Email di promemoria inviata con successo!' : '❌ Errore: ' + result.error);
    } catch (error) { alert('❌ Errore di comunicazione'); }
    finally { setIsLoadingData(false); }
  };

  const handleCancelBookingAction = async (bookingId: string) => {
    const reason = prompt("Inserisci il motivo della cancellazione (es. Mancato pagamento, Richiesta cliente):");
    if (reason === null) return;

    try {
      setIsLoadingData(true);
      const response = await fetch('/api/unified?action=cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          reason: reason
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Prenotazione annullata e date liberate dal calendario!');
        await loadRealApiData();
      } else {
        alert('❌ Errore: ' + (result.error || result.message));
      }
    } catch (error) {
      console.error('❌ Errore cancellazione:', error);
      alert('❌ Errore di comunicazione con il server');
    } finally {
      setIsLoadingData(false);
    }
  };

  // ✨ NUOVE FUNZIONI: Creazione Manuale e Blocco Date
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBooking.check_in || !manualBooking.check_out || !manualBooking.first_name || !manualBooking.last_name) {
      alert('Compila tutti i campi obbligatori');
      return;
    }
    try {
      setIsLoadingData(true);

      // Determina se è creazione o modifica
      const isEdit = !!manualBooking.id;
      const method = isEdit ? 'PUT' : 'POST';

      // Calcola costi extra per il breakdown
      const extraServicesCost = manualBooking.selected_services.reduce((sum, s) => sum + parseFloat(s.price), 0);
      // Per le manuali, assumiamo che il resto sia soggiorno base (o 0 se non specificato)
      const accommodationCost = Math.max(0, manualBooking.total_amount - extraServicesCost);

      // Prepara payload
      const payload = {
        ...manualBooking,
        customer_name: `${manualBooking.first_name} ${manualBooking.last_name}`, // Fallback
        // Se è modifica, assicurati di passare l'ID corretto
        booking_id: isEdit ? manualBooking.id : undefined,
        // 🛎️ Invia breakdown costi esplicito per l'email
        accommodationCost: accommodationCost,
        extraServicesCost: extraServicesCost,
        cleaningFee: 0, // Default 0 per manuali se non specificato
        touristTax: 0,  // Default 0 per manuali se non specificato
        extra_services: manualBooking.selected_services // Assicura formato array
      };

      const response = await fetch('/api/unified?action=booking', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        alert(isEdit ? '✅ Prenotazione aggiornata!' : '✅ Prenotazione manuale creata!');
        setShowManualForm(false);
        resetManualForm();
        await loadRealApiData();
      } else {
        alert('❌ Errore: ' + (result.error || result.message));
      }
    } catch (error) {
      console.error('Errore creazione manuale:', error);
      alert('Errore di comunicazione');
    } finally {
      setIsLoadingData(false);
    }
  };

  const resetManualForm = () => {
    setManualBooking({
      id: '',
      first_name: '',
      last_name: '',
      customer_email: '',
      phone: '',
      check_in: '',
      check_out: '',
      guests: 2,
      total_amount: 0,
      status: 'confirmed',
      payment_method: 'bank_transfer',
      payment_type: 'deposit',
      selected_services: [],
      platform: 'manual'
    });
  };

  const handleEditBooking = (booking: any) => {
    // Parsing nome se necessario
    const nameParts = (booking.customer_name || booking.guestName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setManualBooking({
      id: booking.booking_id || booking.id, // Usa booking_id preferibilmente
      first_name: firstName,
      last_name: lastName,
      customer_email: booking.customer_email || booking.email || '',
      phone: booking.phone || '',
      check_in: booking.check_in ? new Date(booking.check_in).toISOString().split('T')[0] : '',
      check_out: booking.check_out ? new Date(booking.check_out).toISOString().split('T')[0] : '',
      guests: booking.guests || 2,
      total_amount: booking.total_amount || 0,
      status: booking.status || 'confirmed',
      payment_method: booking.payment_method || 'bank_transfer',
      payment_type: booking.deposit_amount && booking.deposit_amount < booking.total_amount ? 'deposit' : 'full',
      selected_services: [], // Difficile recuperare servizi dalle note, lasciamo vuoto o da gestire
      platform: 'manual'
    });
    setShowManualForm(true);
    document.querySelector('.admin-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleService = (service: any) => {
    const isSelected = manualBooking.selected_services.find(s => s.id === service.id);
    let newServices = isSelected
      ? manualBooking.selected_services.filter(s => s.id !== service.id)
      : [...manualBooking.selected_services, service];

    // Aggiorna totale (opzionale, ma utile)
    const servicesTotal = newServices.reduce((sum, s) => sum + parseFloat(s.price), 0);
    // Nota: qui non sommiamo al totale base perché l'utente può volerlo modificare manualmente
    // Ma potremmo suggerire un aggiornamento

    setManualBooking({ ...manualBooking, selected_services: newServices });
  };

  const handleBlockDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate.start_date || !blockDate.end_date) {
      alert('Seleziona le date');
      return;
    }
    try {
      setIsLoadingData(true);

      // Determina se è una creazione (POST) o modifica (PUT)
      const method = editingBlockId ? 'PUT' : 'POST';
      const body = editingBlockId
        ? { ...blockDate, id: editingBlockId }
        : blockDate;

      const response = await fetch('/api/unified?action=blocked-dates', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (result.success) {
        alert(editingBlockId ? '✅ Blocco aggiornato!' : '✅ Date bloccate con successo!');
        setShowBlockForm(false);
        setBlockDate({ start_date: '', end_date: '', reason: 'maintenance' });
        setEditingBlockId(null);
        await loadRealApiData();
      } else {
        alert('❌ Errore: ' + result.error);
      }
    } catch (error) {
      console.error('Errore blocco date:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 🔧 FIX: Funzione diretta per eliminare date bloccate
  const handleDeleteBlockedDate = async (id: string) => {
    if (!confirm('⚠️ Rimuovere il blocco per queste date?')) return;

    try {
      setIsLoadingData(true);
      const response = await fetch('/api/unified?action=blocked-dates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Blocco rimosso!');
        await loadRealApiData();
      } else {
        alert('❌ Errore: ' + result.error);
      }
    } catch (error) {
      console.error('Errore rimozione blocco:', error);
      alert('❌ Errore di comunicazione');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleEditBlockedDate = (block: any) => {
    setBlockDate({
      start_date: block.start_date,
      end_date: block.end_date,
      reason: block.reason
    });
    setEditingBlockId(block.id);
    setShowBlockForm(true);
    // Scroll to form
    document.querySelector('.admin-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 📅 LOGICA CALENDARIO VISUALE
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Dom, 1 = Lun...
    return { days, firstDay };
  };

  // Helper per visualizzare nomi piattaforma leggibili (es. cal_3 -> Holidu)
  const getPlatformLabel = (platform: string) => {
    if (!platform) return 'Altro';
    const p = platform.toLowerCase();
    if (p === 'direct' || p === 'manual') return 'Sito';
    if (p === 'cal_3' || p === 'holidu') return 'Holidu';
    if (p === 'airbnb') return 'Airbnb';
    if (p === 'booking' || p === 'booking.com') return 'Booking';
    return p.charAt(0).toUpperCase() + p.slice(1);
  };

  const renderCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i); // Adjust for Monday start

    // Helper per normalizzare le date a mezzanotte locale per confronto corretto
    const normalizeDate = (dateInput: string | Date) => {
      if (!dateInput) return null;
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;
      // Se è una stringa YYYY-MM-DD, forziamo l'interpretazione locale per evitare shift di fuso orario
      if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, day] = dateInput.split('-').map(Number);
        return new Date(y, m - 1, day);
      }
      // Altrimenti convertiamo a data locale pura
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    // Unifica tutti gli eventi per il calendario
    const allEvents = [
      ...realBookings.map(b => ({ ...b, type: 'booking', start: normalizeDate(b.check_in), end: normalizeDate(b.check_out) })),
      ...calendarEvents.map(e => ({ ...e, type: 'external', start: normalizeDate(e.checkIn || e.start_date), end: normalizeDate(e.checkOut || e.end_date), customer_name: e.title || 'Esterno', platform: e.platform })),
      ...blockedDates.map(b => ({ ...b, type: 'blocked', start: normalizeDate(b.start_date), end: normalizeDate(b.end_date), customer_name: 'Chiuso', platform: 'admin' }))
    ].filter(e => e.start && e.end); // Rimuove eventi con date non valide

    return (
      <div className="admin-calendar-wrapper">
        <div className="calendar-controls">
          <button className="admin-btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>◀ Mese Prec.</button>
          <h3>{monthName}</h3>
          <button className="admin-btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>Mese Succ. ▶</button>
        </div>
        <div className="calendar-grid">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="calendar-header-cell">{d}</div>)}
          {blanks.map(b => <div key={`blank-${b}`} className="calendar-day-cell empty"></div>)}
          {daysArray.map(day => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = date.toISOString().split('T')[0];

            // Trova eventi per questo giorno
            const dayEvents = allEvents.filter(ev => {
              const start = ev.start;
              const end = ev.end;
              // Mostra se il giorno è compreso nel range (inclusivo start, esclusivo end per checkout, ma mostriamo checkout come evento parziale)
              return date >= start && date <= end;
            });

            return (
              <div key={day} className="calendar-day-cell">
                <span className="day-number">{day}</span>
                {dayEvents.map((ev, idx) => {
                  const isStart = ev.start.getTime() === date.getTime();
                  const isEnd = ev.end.getTime() === date.getTime();

                  let eventClass = 'calendar-event';
                  if (ev.type === 'booking') eventClass += ' event-booking';
                  if (ev.type === 'external') eventClass += ' event-external';
                  if (ev.type === 'blocked') eventClass += ' event-blocked';
                  if (isStart) eventClass += ' event-checkin';
                  if (isEnd) eventClass += ' event-checkout';

                  // Non mostrare se è solo checkout e non checkin (per evitare confusione visiva, o gestiscilo come preferisci)
                  // Qui mostriamo tutto per chiarezza "Occupato"

                  return (
                    <div key={idx} className={eventClass} title={`${ev.customer_name} (${getPlatformLabel(ev.platform)})`}>
                      <div className="event-info">
                        <span>{isStart ? '📥' : isEnd ? '📤' : '🔒'}</span>
                        <span>{getPlatformLabel(ev.platform)}</span>
                      </div>
                      <div className="calendar-event-name">{ev.customer_name || ev.guestName}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="calendar-legend calendar-legend-container">
          <span className="legend-item-flex"><div className="legend-color-box legend-color-blue"></div> Prenotazione Sito</span>
          <span className="legend-item-flex"><div className="legend-color-box legend-color-purple"></div> Esterno (Airbnb/Booking)</span>
          <span className="legend-item-flex"><div className="legend-color-box legend-color-red"></div> Chiuso/Bloccato</span>
          <span className="legend-item-flex"><div className="legend-color-box legend-color-checkin"></div> Check-in</span>
          <span className="legend-item-flex"><div className="legend-color-box legend-color-checkout"></div> Check-out</span>
        </div>
      </div>
    );
  };

  const loadCalendarData = async () => {
    setIsLoadingCalendar(true);
    try {
      await loadRealApiData();
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (!roleLoading && isAdmin()) {
      loadRealApiData();
    }
  }, [roleLoading]);

  // Effetto per gestire lo switch al pannello SuperAdmin
  useEffect(() => {
    if (activeTab === 'switch-superadmin') {
      // IMPORTANTE: Reset tab prima della navigazione
      setActiveTab('dashboard'); // Reset tab per evitare loop
      navigate('/admin/pro');
    }
  }, [activeTab, navigate]);

  // === RENDER ADMIN ROLE GUARD ===
  if (!roleLoading && !isAdmin()) {
    return (
      <div className="admin-access-denied-container">
        <div className="admin-access-denied-card">
          <h1 className="admin-access-denied-icon">🔒</h1>
          <h2 className="admin-access-denied-title">Accesso Negato</h2>
          <p className="admin-access-denied-text">
            Questo pannello richiede i diritti di <strong>amministratore</strong>.
          </p>
          <p className="admin-access-denied-role">
            Ruolo attuale: <strong>{role || 'Non disponibile'}</strong>
          </p>
          <p className="admin-access-denied-hint">
            Contatta il SuperAdmin per ottenere i diritti necessari.
          </p>
        </div>
      </div>
    );
  }

  // Nessun login client-side: accesso gestito da `/admin/login` e ProtectedRoute

  // === RENDER MAIN PANEL ===
  devLog('🎯 Rendering basic admin panel...');

  return (
    <AdminLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={() => {
        localStorage.removeItem('vincanto_admin_session');
        localStorage.removeItem('vincanto_admin_token');
        localStorage.removeItem('vincanto_admin_role');
        localStorage.removeItem('vincanto_admin_email');
        window.location.href = '/admin/login';
      }}
      isSuperAdmin={isSuperAdmin()}
      role={role}
      adminEmail={localStorage.getItem('vincanto_admin_email') || role || 'Admin'}
      tabs={basicTabs}
    >
      <div className="admin-panel-basic admin-panel-fullheight">
        <main className="admin-main">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard-wrapper">
            <AdminDashboard
              dashboardStats={dashboardStats}
              realBookings={realBookings}
              paymentTransactions={paymentTransactions}
              notifications={notifications}
              systemSettings={systemSettings}
              analytics={analytics}
              calendarEvents={calendarEvents}
              blockedDates={blockedDates}
              isLoadingData={isLoadingData}
              isLoadingCalendar={isLoadingCalendar}
              loadCalendarData={loadCalendarData}
              setActiveTab={setActiveTab}
            />

            {/* Calendario aggiunto anche nella Dashboard */}
            <div className="admin-pricing-section admin-mt-20">
              <h3>📅 Calendario Occupazioni</h3>
              <p className="admin-section-description">
                Panoramica rapida delle disponibilità.
              </p>
              {renderCalendar()}
            </div>
          </div>
        )}

        {/* Prenotazioni Tab */}
        {activeTab === 'prenotazioni' && (
          <div className="admin-prenotazioni">
            <h2>📅 Gestione Prenotazioni {isLoadingData && '(Caricamento...)'}</h2>

            {/* SEZIONE AZIONI RAPIDE: NUOVA PRENOTAZIONE E BLOCCO DATE */}
            <div className="admin-forms-container">
              {/* Card Nuova Prenotazione */}
              <div className="admin-form-card">
                <div className="admin-flex-between">
                  <h3>{manualBooking.id ? '✏️ Modifica Prenotazione' : '➕ Nuova Prenotazione Manuale'}</h3>
                  <button className="admin-btn-small" onClick={() => {
                    setShowManualForm(!showManualForm);
                    if (showManualForm) resetManualForm();
                  }}>{showManualForm ? 'Chiudi' : 'Apri'}</button>
                </div>
                {showManualForm && (
                  <form onSubmit={handleCreateManualBooking}>
                    <div className="form-group admin-grid-2-col">
                      <div><label htmlFor="manual_first_name">Nome:</label><input id="manual_first_name" type="text" className="admin-input" value={manualBooking.first_name} onChange={e => setManualBooking({ ...manualBooking, first_name: e.target.value })} required /></div>
                      <div><label htmlFor="manual_last_name">Cognome:</label><input id="manual_last_name" type="text" className="admin-input" value={manualBooking.last_name} onChange={e => setManualBooking({ ...manualBooking, last_name: e.target.value })} required /></div>
                    </div>
                    <div className="form-group admin-grid-2-col">
                      <div><label htmlFor="manual_email">Email:</label><input id="manual_email" type="email" className="admin-input" value={manualBooking.customer_email} onChange={e => setManualBooking({ ...manualBooking, customer_email: e.target.value })} /></div>
                      <div><label htmlFor="manual_phone">Telefono:</label><input id="manual_phone" type="text" className="admin-input" value={manualBooking.phone} onChange={e => setManualBooking({ ...manualBooking, phone: e.target.value })} /></div>
                    </div>
                    <div className="form-group admin-grid-2-col">
                      <div><label htmlFor="manual_check_in">Check-in:</label><input id="manual_check_in" type="date" className="admin-input" value={manualBooking.check_in} onChange={e => setManualBooking({ ...manualBooking, check_in: e.target.value })} required /></div>
                      <div><label htmlFor="manual_check_out">Check-out:</label><input id="manual_check_out" type="date" className="admin-input" value={manualBooking.check_out} onChange={e => setManualBooking({ ...manualBooking, check_out: e.target.value })} required /></div>
                    </div>

                    {/* Servizi Extra */}
                    <div className="form-group">
                      <label>Servizi Extra:</label>
                      <div className="admin-services-grid">
                        {extraServices.map(service => (
                          <label key={service.id} className="admin-service-label">
                            <input
                              type="checkbox"
                              checked={!!manualBooking.selected_services.find(s => s.id === service.id)}
                              onChange={() => toggleService(service)}
                              className="admin-service-checkbox"
                            />
                            {service.name} (€{service.price})
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group admin-grid-2-col">
                      <div><label htmlFor="manual_guests">Ospiti:</label><input id="manual_guests" type="number" className="admin-input" value={manualBooking.guests} onChange={e => setManualBooking({ ...manualBooking, guests: parseInt(e.target.value) })} min="1" /></div>
                      <div><label htmlFor="manual_total_amount">Totale (€):</label><input id="manual_total_amount" type="number" className="admin-input" value={manualBooking.total_amount} onChange={e => setManualBooking({ ...manualBooking, total_amount: parseFloat(e.target.value) })} /></div>
                    </div>

                    <div className="form-group admin-grid-2-col">
                      <div>
                        <label htmlFor="manual_payment_method">Metodo Pagamento:</label>
                        <select id="manual_payment_method" className="admin-input" value={manualBooking.payment_method} onChange={e => setManualBooking({ ...manualBooking, payment_method: e.target.value })}>
                          <option value="">Seleziona metodo</option>
                          <option value="bank_transfer">Bonifico</option>
                          <option value="cash">Contanti</option>
                          <option value="pos">POS / Carta</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="manual_payment_type">Tipo Pagamento:</label>
                        <select id="manual_payment_type" className="admin-input" value={manualBooking.payment_type} onChange={e => setManualBooking({ ...manualBooking, payment_type: e.target.value })}>
                          <option value="">Seleziona tipo</option>
                          <option value="deposit">Acconto (20%)</option>
                          <option value="full">Saldo Completo</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="admin-btn-primary admin-w-full">{manualBooking.id ? 'Aggiorna Prenotazione' : 'Crea Prenotazione'}</button>
                  </form>
                )}
              </div>

              {/* Card Blocca Date */}
              <div className="admin-form-card">
                <div className="admin-flex-between">
                  <h3>{editingBlockId ? '✏️ Modifica Blocco' : '🚫 Blocca/Chiudi Date'}</h3>
                  <button className="admin-btn-small" onClick={() => {
                    setShowBlockForm(!showBlockForm);
                    if (showBlockForm) { setEditingBlockId(null); setBlockDate({ start_date: '', end_date: '', reason: 'maintenance' }); }
                  }}>{showBlockForm ? 'Chiudi' : 'Apri'}</button>
                </div>
                {showBlockForm && (
                  <form onSubmit={handleBlockDates}>
                    <div className="form-group admin-grid-2-col">
                      <div><label htmlFor="block_start_date">Dal:</label><input id="block_start_date" type="date" className="admin-input" value={blockDate.start_date} onChange={e => setBlockDate({ ...blockDate, start_date: e.target.value })} required /></div>
                      <div><label htmlFor="block_end_date">Al:</label><input id="block_end_date" type="date" className="admin-input" value={blockDate.end_date} onChange={e => setBlockDate({ ...blockDate, end_date: e.target.value })} required /></div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="block_reason">Motivo:</label>
                      <select id="block_reason" className="admin-input" value={blockDate.reason} onChange={e => setBlockDate({ ...blockDate, reason: e.target.value })}>
                        <option value="maintenance">Manutenzione</option>
                        <option value="closed">Chiusura Stagionale</option>
                        <option value="private">Uso Privato</option>
                        <option value="other">Altro</option>
                      </select>
                    </div>
                    <button type="submit" className="admin-btn-danger admin-w-full">{editingBlockId ? 'Aggiorna Blocco' : 'Blocca Date'}</button>
                  </form>
                )}
              </div>
            </div>

            <div className="admin-pricing-section">
              <div className="admin-flex-between margin-bottom">
                <h3>📥 Prenotazioni Attive</h3>
                <button
                  className="admin-btn-secondary"
                  onClick={loadRealApiData}
                >
                  🔄 Ricarica Dati
                </button>
              </div>
              <div className="bookings-table-container">
                {realBookings.length > 0 ? (
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Ospiti</th>
                        <th>Stato</th>
                        <th>Totale</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realBookings.map((booking) => (
                        <tr key={booking.id} className="booking-row">
                          <td><strong>#{booking.id}</strong></td>
                          <td>{booking.customer_name || booking.guestName || 'N/A'}</td>
                          <td>{booking.customer_email || booking.email || 'N/A'}</td>
                          <td>{booking.check_in ? new Date(booking.check_in).toLocaleDateString('it-IT') : 'N/A'}</td>
                          <td>{booking.check_out ? new Date(booking.check_out).toLocaleDateString('it-IT') : 'N/A'}</td>
                          <td>{booking.guests}</td>
                          <td>
                            <span className={`status ${booking.status}`}>
                              {booking.status === 'confirmed' && '✅ Confermata'}
                              {booking.status === 'pending' && '🟡 In attesa'}
                              {booking.status === 'cancelled' && '❌ Cancellata'}
                              {!booking.status && '📊 Backend'}
                            </span>
                          </td>
                          <td>€{(booking.total_amount || booking.totalPrice || 0).toFixed(2)}</td>
                          <td>
                            <div className="action-buttons action-buttons-flex">
                              {/* Pulsante Modifica */}
                              <button
                                className="admin-btn-small admin-btn-custom admin-btn-edit"
                                onClick={() => handleEditBooking(booking)}
                                title="Modifica"
                              >
                                ✏️
                              </button>

                              {/* Pulsanti Conferma Pagamento */}
                              {booking.status !== 'cancelled' && booking.payment_method !== 'paid_full' && (
                                <>
                                  {booking.payment_method !== 'deposit_paid' && (
                                    <button
                                      className="admin-btn-small admin-btn-warning admin-btn-custom admin-btn-custom-warning"
                                      onClick={() => handleConfirmPayment(booking.booking_id || booking.id, 'deposit')}
                                      title="Conferma Acconto"
                                    >
                                      💰 Acconto
                                    </button>
                                  )}
                                  <button
                                    className="admin-btn-small admin-btn-success admin-btn-custom admin-btn-custom-success"
                                    onClick={() => handleConfirmPayment(booking.booking_id || booking.id, 'full')}
                                    title="Conferma Saldo"
                                  >
                                    ✅ Saldo
                                  </button>
                                  <button
                                    className="admin-btn-small admin-btn-custom admin-btn-reminder"
                                    onClick={() => handleSendReminder(booking)}
                                    title="Invia Promemoria Pagamento"
                                  >
                                    📧 Sollecito
                                  </button>
                                </>
                              )}

                              {/* Pulsante Annulla */}
                              {booking.status !== 'cancelled' ? (
                                <button
                                  className="admin-btn-small admin-btn-danger admin-btn-custom admin-btn-custom-danger"
                                  onClick={() => handleCancelBookingAction(booking.booking_id || booking.id)}
                                  title="Annulla"
                                >
                                  ❌ Annulla
                                </button>
                              ) : (
                                <span className="admin-text-muted admin-text-cancelled-small">Già cancellata</span>
                              )}

                              {/* Pulsante Elimina */}
                              <button
                                className="admin-btn-small admin-btn-danger admin-btn-custom admin-btn-custom-danger admin-ml-5px"
                                onClick={() => handleDeleteBooking(booking.id)}
                                title="Elimina definitivamente"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-pricing-card">
                    <p>📊 Nessuna prenotazione trovata</p>
                    <button className="admin-btn-primary" onClick={loadRealApiData}>
                      🔄 Ricarica Prenotazioni
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Calendari Tab */}
        {activeTab === 'calendari' && (
          <div className="admin-calendari">
            <h2>📋 Gestione Calendari {isLoadingCalendar && '(Caricamento...)'}</h2>

            <div className="admin-pricing-actions margin-bottom">
              <button
                className="admin-btn-primary"
                onClick={loadCalendarData}
              >
                🔄 Ricarica Calendari
              </button>
            </div>

            <div className="admin-pricing-section">
              <h3> Calendario Occupazioni</h3>
              <p className="admin-section-description">
                Visualizza tutte le occupazioni: prenotazioni dal sito (blu), calendari esterni (viola) e date chiuse manualmente (rosso).
              </p>
              {renderCalendar()}
            </div>
          </div>
        )}

        {/* Servizi Extra Tab */}
        {activeTab === 'servizi' && (
          <div className="admin-section admin-animate-fade-in">
            <h2>🛎️ Gestione Servizi Extra</h2>
            <p className="admin-section-description">
              Modifica e configura i servizi aggiuntivi disponibili per gli ospiti.
            </p>

            <ExtraServicesAdmin />
          </div>
        )}

        {/* Gestione Immagini Tab */}
        {activeTab === 'gallery' && (
          <div className="admin-section admin-animate-fade-in">
            <h2>🖼️ Gestione Immagini Sito</h2>
            <div className="admin-notice">
              <p>Inserisci gli URL delle immagini per aggiornare le gallerie del sito pubblico.</p>
            </div>

            <div className="admin-pricing-section">
              <h3>📸 Galleria e Immagini Sezioni</h3>
              <div className="admin-pricing-grid">
                {(Array.isArray(systemSettings) ? systemSettings : [])
                  .filter(s => s.category === 'gallery')
                  .map(setting => (
                  <div key={setting.key} className="admin-stat-card">
                    <div className="admin-mb-sm">
                      <label className="admin-text-xs admin-text-muted">Etichetta:</label>
                      <input 
                        type="text" 
                        className="admin-input-small admin-w-full"
                        value={setting.label || ''}
                        onChange={(e) => {
                          setSystemSettings(prev => prev.map(s => s.key === setting.key ? { ...s, label: e.target.value } : s));
                        }}
                      />
                    </div>
                    <div className="admin-flex-between admin-mt-sm">
                      <h4>{setting.label || setting.key}</h4>
                      <button 
                        className="admin-btn-small admin-btn-danger"
                        onClick={async () => {
                          if(confirm('Cancellare questa immagine?')) {
                            await updateSystemSettingValue(setting.key, '');
                            alert('Immagine rimossa');
                            loadRealApiData();
                          }
                        }}
                      >🗑️</button>
                    </div>
                    <div className="pricing-controls">
                      {setting.value ? (
                        <img src={setting.value} alt={setting.label} className="admin-gallery-image-preview admin-gallery-image-preview-styles" />
                      ) : (
                        <div className="admin-text-muted admin-py-lg admin-text-center admin-no-image-placeholder">Nessuna immagine</div>
                      )}

                      <label className="admin-btn admin-btn-secondary admin-btn-small admin-btn-fullwidth admin-image-upload-label">
                        📁 {setting.value ? 'Cambia' : 'Carica'}
                        <input // Safe
                          type="file"
                          accept="image/*"
                          className="admin-hidden-file-input"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, setting.key);
                          }}
                        />
                      </label>

                      {setting.value?.startsWith('data:') && (
                        <button className="admin-btn-primary admin-btn-small admin-btn-fullwidth admin-mt-sm" onClick={async () => {
                          await updateSystemSettingValue(setting.key, setting.value);
                          alert('✅ Salvato!');
                          loadRealApiData();
                        }}>💾 Salva</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Gestione Contenuti Tab */}
        {activeTab === 'contenuti' && (
          <div className="admin-section admin-animate-fade-in">
            <div className="admin-flex-between admin-mb-lg">
              <div>
                <h2>📝 Gestione Contenuti Frontend</h2>
                <p className="admin-section-description">Modifica i testi e visualizza l'anteprima in tempo reale.</p>
              </div>
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? '👁️ Nascondi Anteprima' : '👁️ Mostra Anteprima'}
              </button>
            </div>

            <div className={`admin-content-layout ${showPreview ? 'admin-content-layout-preview' : ''}`}>
              <div className="admin-editor-side">
                <div className="admin-pricing-section">
                  <h3>🏠 Testi Principali e Hero</h3>
                  <div className="admin-pricing-grid admin-pricing-grid-single">
                    {(Array.isArray(systemSettings) ? systemSettings : [])
                  .filter(s => ['home', 'about', 'general'].includes(s.category))
                  .map(setting => (
                    <div key={setting.key} className="admin-stat-card">
                      <h4>{setting.label || setting.key}</h4>
                      <div className="pricing-controls">
                        {setting.type === 'textarea' ? (
                          <textarea
                            className="admin-input admin-textarea"
                            aria-label={setting.label || setting.key}
                            value={setting.value}
                            onChange={(e) => {
                              const currentSettings = Array.isArray(systemSettings) ? systemSettings : [];
                              const updated = currentSettings.map(s =>
                                s.key === setting.key ? { ...s, value: e.target.value } : s
                              );
                              setSystemSettings(updated);
                            }}
                            rows={4}
                          />
                        ) : (
                          <input
                            type="text"
                            className="admin-input"
                            title={setting.label || setting.key}
                            aria-label={setting.label || setting.key}
                            value={setting.value}
                            onChange={(e) => {
                              const currentSettings = Array.isArray(systemSettings) ? systemSettings : [];
                              const updated = currentSettings.map(s =>
                                s.key === setting.key ? { ...s, value: e.target.value } : s
                              );
                              setSystemSettings(updated);
                            }}
                            placeholder={`Modifica ${setting.label || setting.key}`}
                          />
                        )}
                        <button
                          className="admin-btn-primary admin-btn-small admin-btn-fullwidth"
                          onClick={async () => {
                            try {
                              await updateSystemSettingValue(setting.key, setting.value);
                              alert('✅ Contenuto salvato!');
                            } catch (e) {
                              alert('❌ Errore durante il salvataggio');
                            }
                          }}
                        >
                          💾 Salva Testo
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
                </div>
              </div>

              {showPreview && (
                <div className="admin-preview-side">
                  <div className="preview-container">
                    <div className="preview-top-bar">
                      <div className="preview-dot preview-dot-red"></div>
                      <div className="preview-dot preview-dot-yellow"></div>
                      <div className="preview-dot preview-dot-green"></div>
                    </div>
                    <div className="preview-scroll-area">
                      <div className="preview-site-header">
                        <h1 className="preview-title">
                          {(Array.isArray(systemSettings) ? systemSettings : []).find(s => s.key === 'home_hero_title')?.value || 'Vincanto Maori'}
                        </h1>
                        <p className="preview-subtitle">
                          {(Array.isArray(systemSettings) ? systemSettings : []).find(s => s.key === 'home_hero_subtitle')?.value || 'Sottotitolo Hero'}
                        </p>
                      </div>

                      <div className="preview-section">
                        <h2 className="preview-section-title">La nostra storia</h2>
                        <div className="preview-section-content">
                          {(Array.isArray(systemSettings) ? systemSettings : []).find(s => s.key === 'about_description_main')?.value || 'Descrizione chi siamo...'}
                        </div>
                      </div>

                      <div className="preview-cta">
                        <p className="preview-cta-text">Soggiorno a partire da</p>
                        <h3 className="preview-cta-price">
                          € {(Array.isArray(systemSettings) ? systemSettings : []).find(s => s.key === 'display_price_base')?.value || '70'}
                        </h3>
                        <button className="preview-cta-button">
                          Verifica Disponibilità
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="preview-caption">L'anteprima riflette le modifiche non salvate</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  </AdminLayout>
  );
};

export default AdminPanelBasic;
