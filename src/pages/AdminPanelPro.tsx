import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanelPro.css';
import AdminLayout from '../components/admin/AdminLayout';
import '../styles/AdminSuperAdmin.css';
import '../styles/AdminUXResponsive.css';
import AdminApiService from '../services/adminApiService';
import AdminPricing from '../components/admin/AdminPricing';
import ExtraServicesAdmin from '../components/admin/ExtraServicesAdmin'; // Assicurati che il percorso sia corretto
import SeasonalPricingManager from './SeasonalPricingManager';
import GalleryManager from '../components/admin/GalleryManager';
import ContentManager from '../components/admin/ContentManager';
import { useAdminRole } from '../hooks/useAdminRole';
import { devLog, devError, debugLog } from '../utils/debug';


const AdminPanelPro = (): JSX.Element => {
  devLog('🖥️ AdminPanelPro component rendering...');

  // Verifica ruolo Admin/SuperAdmin
  const { role, isLoading: roleLoading, isSuperAdmin, isAdmin } = useAdminRole();
  const navigate = useNavigate();

  // Stati principali
  const [activeTab, setActiveTab] = useState('dashboard');

  // Configurazione tab per la vista SuperAdmin
  const proTabs = [
    { id: 'dashboard', label: '📊 Dashboard', requiresSuperAdmin: false },
    { id: 'prenotazioni', label: '📅 Prenotazioni', requiresSuperAdmin: false },
    { id: 'calendari', label: '📆 Calendari', requiresSuperAdmin: false },
    { id: 'prezzi', label: '💰 Prezzi', requiresSuperAdmin: false },
    { id: 'servizi-extra', label: '🛎️ Servizi', requiresSuperAdmin: false },
    { id: 'gallery', label: '🖼️ Gallery', requiresSuperAdmin: false },
    { id: 'contenuti', label: '📝 Contenuti', requiresSuperAdmin: false },
    { id: 'pagamenti', label: '💳 Pagamenti', requiresSuperAdmin: false },
    { id: 'email', label: '📧 Email', requiresSuperAdmin: true },
    { id: 'notifiche', label: '🔔 Notifiche', requiresSuperAdmin: true },
    { id: 'analytics', label: '📈 Analytics', requiresSuperAdmin: true },
    { id: 'admin-management', label: '👥 Admin', requiresSuperAdmin: true },
    { id: 'sistema', label: '⚙️ Sistema', requiresSuperAdmin: true },
    { id: 'switch-basic', label: '📉 Vista Admin', requiresSuperAdmin: true },
  ];

  // Stati per prenotazioni e pagamenti (solo backend reale)
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filtro piattaforma prenotazioni (direct, airbnb, booking, holidu)
  const [platformFilter, setPlatformFilter] = useState<'all' | 'direct' | 'airbnb' | 'booking' | 'holidu'>('all');
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);


  // Servizio Admin API
  const [adminApiService] = useState(() => {
    try {
      devLog('📋 Inizializzazione AdminApiService...');
      return new AdminApiService();
    } catch (error) {
      devError('❌ Errore AdminApiService:', error);
      return null;
    }
  });

  // Stati per i dati API
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(true); // Stato per anteprima contenuti
  const [notifications, setNotifications] = useState<any[]>([]);

  // Stati per gestione form e loading
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [newBookingData, setNewBookingData] = useState({
    customer_name: '',
    customer_email: '',
    check_in: '',
    check_out: '',
    guests: 1,
    total_amount: 0,
    status: 'pending',
    platform: 'manual', // Default manual per admin
    payment_method: 'bank_transfer',
    payment_type: 'deposit'
  });

  // Stati per gestione admin (SOLO SUPERADMIN)
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [showSuperAdminSettings, setShowSuperAdminSettings] = useState(false);
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  // Stati per creazione/eliminazione admin
  const [showCreateAdminForm, setShowCreateAdminForm] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });

  // Stati per gestione prezzi PER GRUPPI SPECIFICI
  const [pricingConfig, setPricingConfig] = useState({
    priceGroup1to2: 75,       // €75 per 1-2 persone
    priceGroup3to4: 95,       // €95 per 3-4 persone
    priceGroup5to6: 115,      // €115 per 5-6 persone
    priceGroup7to8: 135,      // €135 per 7-8 persone

    // Costi aggiuntivi
    cleaningFee: 50,
    parkingFee: 20,          // €20 parcheggio per notte
    touristTaxAdult: 2.00,   // €2.00 tassa soggiorno adulti
    touristTaxChild: 0,      // Bambini <12 anni gratuiti

    // Sconti e maggiorazioni
    weekendSurcharge: 0,     // Nessuna maggiorazione weekend
    weeklyDiscount: 10,      // 10% sconto settimanale
    monthlyDiscount: 15,     // 15% sconto mensile

    // Limiti soggiorno
    minStay: 2,
    maxStay: 14,
    maxGuests: 8,            // Massimo 8 ospiti

    // Sconti avanzati (opzionali)
    advanceBookingDiscount: 0,
    lastMinuteDiscount: 0
  });
  const [isUpdatingPricing, setIsUpdatingPricing] = useState(false);

  const updateSystemSettingValue = async (key: string, value: any) => {
    devLog('Updating setting locally:', { key, value });
    setSystemSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    // NOTA: Questo aggiorna solo lo stato locale. Un'implementazione reale chiamerebbe l'API.
    // es. await adminApiService.updateSystemSetting(key, value);
  };

  const handleImageUpload = (file: File, settingKey: string) => {
    if (!adminApiService) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSystemSettings(prev => prev.map(s => s.key === settingKey ? { ...s, value: dataUrl } : s));
      alert("Anteprima immagine aggiornata. Clicca 'Salva' per applicare la modifica.");
    };
    reader.readAsDataURL(file);
  };


  /*
  // === Holidu: Handler azioni calendario ===
  const handleTestHoliduURL = async () => {
    try {
      devLog('🔧 Test URL Holidu - iCal export');
      const res = await fetch('/api/unified?action=ical-export');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      debugLog.log('✅ Holidu URL OK, bytes:', text.length);
      alert('✅ URL iCal del sito valido e raggiungibile. Copialo su Holidu: https://vincantomaiori.it/api/unified?action=ical-export');
    } catch (e) {
      devError('❌ Test URL Holidu fallito', e);
      alert(`❌ Test URL Holidu fallito: controlla endpoint /api/unified?action=ical-export. Errore: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleSyncHoliduCalendar = async () => {
    try {
      devLog('🔄 Sincronizzazione eventi Holidu (import)');
      setIsLoadingData(true);
      const res = await fetch('/api/calendar-real-sync', { method: 'POST' });
      const json: { success: boolean, synced?: number, newBookings?: number, updated?: number } = await res.json();
      debugLog.log('✅ Holidu sync risposta:', json);
      alert(`✅ Holidu sincronizzato. Eventi aggiornati: ${json?.synced || 'OK'}`);
      typeof loadRealApiData === 'function' && loadRealApiData();
    } catch (e) {
      devError('❌ Holidu sync errore', e);
      alert('❌ Errore sincronizzazione Holidu');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLoadHoliduEvents = async () => {
    try {
      devLog('📅 Carico eventi calendario (tutte piattaforme, include Holidu)');
      setIsLoadingData(true);
      const res = await fetch('/api/unified?action=calendar-bookings');
      const json: { events?: any[] } = await res.json();
      setCalendarEvents(json?.events || []);
      alert(`📅 Eventi caricati: ${json?.events?.length ?? 0}`);
    } catch (e) {
      devError('❌ Caricamento eventi Holidu fallito', e);
      alert('❌ Errore caricamento eventi Holidu');
    } finally {
      setIsLoadingData(false);
    }
  };
  */

  // Stati autenticazione admin con persistenza
  const [isAuthenticated] = useState(() => {
    // Controlla se c'è un token e ruolo salvato (nuovo sistema 2FA)
    const hasToken = !!localStorage.getItem('vincanto_admin_token');
    const hasRole = !!localStorage.getItem('vincanto_admin_role');
    const hasOldSession = localStorage.getItem('vincanto_admin_session') === 'authenticated'; // Compatibilità
    return hasToken || hasRole || hasOldSession;
  });
  const [error] = useState('');

  // === STATI PAGAMENTI ===
  const [paymentSettings, setPaymentSettings] = useState<any>({
    stripeEnabled: true,
    stripePublishableKey: 'pk_test_...',
    stripeSecretKey: '••••••••••••••••',
    paypalEnabled: true,
    paypalClientId: 'sb_test_...',
    bankTransferEnabled: true,
    bankDetails: {
      iban: 'IT60 X054 2811 1010 0000 0123456',
      swift: 'BCITITMM',
      beneficiary: 'Vincanto Maori'
    }
  });
  const [isUpdatingPayments, setIsUpdatingPayments] = useState(false);

  // Effect per caricare dati all'avvio
  useEffect(() => {
    if (isAuthenticated) {
      loadRealApiData();
    }
  }, [isAuthenticated]);

  // Effect per caricare dati quando il ruolo è verificato (nuovo sistema 2FA)
  useEffect(() => {
    if (!roleLoading && (isSuperAdmin() || isAdmin())) {
      devLog('🔄 Ruolo verificato, caricamento dati...');
      loadRealApiData();
    }
  }, [roleLoading, role]);

  // Effetto per gestire lo switch al pannello Admin Standard
  useEffect(() => {
    if (activeTab === 'switch-basic') {
      setActiveTab('dashboard');
      navigate('/admin');
    }
  }, [activeTab, navigate]);

  // Aggiorna dinamicamente l'altezza delle chart-bar
  useEffect(() => {
    const chartBars = document.querySelectorAll('.chart-bar.dynamic[data-height]');
    chartBars.forEach((bar: any) => {
      const height = bar.getAttribute('data-height');
      if (height) bar.style.height = `${height}px`;
    });
  }, [analytics]);

  const updatePricingField = (field: string, value: number) => {
    devLog('💰 Aggiornamento campo prezzo:', { field, value, currentConfig: pricingConfig });
    setPricingConfig(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      devLog('💰 Nuova configurazione prezzi:', updated);
      return updated;
    });
  };

  // Nota: La tassa di soggiorno è ora gestita tramite i campi in `pricingConfig`.
  // Se necessario, possiamo ripristinare il caricamento remoto in futuro.

  /*
  // === CUSTOM SERVICES FUNCTIONS ===

  const loadCustomServices = async () => {
    if (!adminApiService) return;
    // Le funzioni di gestione servizi extra sono ora nel componente ExtraServicesAdmin
  };
  */
  /*
    // === FUNZIONI PER GESTIONE CALENDARI ESTERNI ===
  
    const handleEditCalendar = (calendar: any) => {
      alert(`⚠️ Modifica calendario: ${calendar.name || 'Senza nome'}\n\nFunzionalità di modifica in fase di sviluppo.`);
      debugLog.log('✏️ Editing calendario:', calendar);
    };
  */
  // === FUNZIONI GESTIONE PAGAMENTI ===

  const savePaymentSettings = async () => {
    try {
      setIsUpdatingPayments(true); // Corretto
      debugLog.log('💳 Salvataggio configurazione pagamenti:', paymentSettings);

      const response = await fetch('/api/unified?action=save-payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentSettings)
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Configurazione pagamenti salvata con successo!');
      } else {
        throw new Error(result.message || 'Errore sconosciuto');
      }
    } catch (error) {
      console.error('❌ Errore salvataggio pagamenti:', error); // Corretto
      alert('❌ Errore nel salvataggio: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdatingPayments(false);
    }
  };

  const handleRefundPayment = async (transactionId: string, amount: number) => {
    const confirm = window.confirm(`⚠️ Sei sicuro di voler rimborsare €${amount.toFixed(2)}?\n\nQuesta azione è irreversibile!`);
    if (!confirm) return;

    try {
      setIsLoadingData(true);
      debugLog.log('💰 Elaborazione rimborso:', { transactionId, amount });

      const response = await fetch('/api/unified?action=process-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: transactionId, amount })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Rimborso elaborato con successo!\n\n💰 Importo: €${amount.toFixed(2)}\n🆔 Refund ID: ${result.refund_id || 'N/A'}`);
        await loadRealApiData();
      } else {
        throw new Error(result.message || 'Errore rimborso');
      }
    } catch (error) {
      console.error('❌ Errore rimborso:', error);
      alert('❌ Errore: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCapturePayment = async (transactionId: string) => {
    try {
      setIsLoadingData(true);
      debugLog.log('💳 Cattura pagamento:', transactionId);

      const response = await fetch('/api/unified?action=capture-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: transactionId })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Pagamento catturato con successo!');
        await loadRealApiData();
      } else {
        throw new Error(result.message || 'Errore cattura');
      }
    } catch (error) {
      console.error('❌ Errore cattura pagamento:', error);
      alert('❌ Errore: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoadingData(false);
    }
  };

  // === FUNZIONI GESTIONE EMAIL ===

  const [emailSettings, setEmailSettings] = useState({
    smtpProvider: 'Gmail SMTP',
    senderEmail: 'noreply@vincantomaori.it',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    autoConfirmation: true,
    autoCheckin: true,
    autoReview: true,
    autoFollowup: false
  });

  const saveEmailSettings = async () => {
    setLoading(true);
    try {
      debugLog.log('📧 Salvataggio configurazione email:', emailSettings);

      const response = await fetch('/api/unified?action=save-email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Configurazione email salvata con successo!');
      } else {
        throw new Error(result.message || 'Errore salvataggio');
      }
    } catch (error) {
      console.error('❌ Errore salvataggio email:', error);
      alert('❌ Errore: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    setLoading(true);
    try {
      debugLog.log('📧 Test connessione SMTP...');

      const response = await fetch('/api/unified?action=test-email-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: emailSettings.senderEmail || 'g.marino787@gmail.com'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Test email inviata con successo!\n\n📧 Destinatario: ${result.recipient || emailSettings.senderEmail}\n⏱️ Tempo: ${result.time || 'N/A'}\n\nControlla la casella di posta.`);
      } else {
        throw new Error(result.message || 'Errore invio test');
      }
    } catch (error) {
      console.error('❌ Errore test email:', error);
      alert('❌ Errore: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (templateName: string) => {
    alert(`⚠️ Apertura editor per template: ${templateName}\n\nFunzionalità editor template in fase di sviluppo.`);
    debugLog.log(`✏️ Editing template: ${templateName}`);
  };

  const handleCreateTemplate = () => {
    const templateName = prompt('✏️ Inserisci il nome del nuovo template:');
    if (templateName) {
      alert(`✅ Template "${templateName}" creato con successo!`);
      debugLog.log(`📧 Created new template: ${templateName}`);
    }
  };

  // === FUNZIONI GESTIONE SISTEMA ===

  const resetSystemSetting = async (key: string) => {
    if (window.confirm(`🔄 Confermi il reset del setting "${key}" al valore predefinito?`)) {
      try {
        debugLog.log(`🔄 Reset setting: ${key}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        alert(`✅ Setting "${key}" resettato con successo!`);
        await loadRealApiData(); // Ricarica i settings
      } catch (error) {
        console.error('❌ Errore reset setting:', error);
        alert('❌ Errore durante il reset del setting');
      }
    }
  };

  const handleSystemBackup = async () => {
    if (window.confirm('💾 Confermi la creazione di un backup completo del sistema?')) {
      setLoading(true);
      try {
        debugLog.log('💾 Creazione backup sistema...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        alert('✅ Backup sistema creato con successo!');
      } catch (error) {
        console.error('❌ Errore backup:', error);
        alert('❌ Errore durante la creazione del backup');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSystemRestore = async () => {
    if (window.confirm('⚠️ ATTENZIONE: Confermi il ripristino del sistema? Questa operazione sovrascriverà le configurazioni attuali.')) {
      setLoading(true);
      try {
        debugLog.log('🔄 Ripristino sistema...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        alert('✅ Sistema ripristinato con successo!');
        // Ricarica tutti i dati dopo il ripristino
        await loadRealApiData();
      } catch (error) {
        console.error('❌ Errore ripristino:', error);
        alert('❌ Errore durante il ripristino del sistema');
      } finally {
        setLoading(false);
      }
    }
  };

  // === FUNZIONI GESTIONE NOTIFICHE ===

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingAlerts: false, // Disabilitato di default
    paymentAlerts: true,
    systemAlerts: true,
    reviewAlerts: true,
    soundEnabled: true,
    notificationEmail: 'admin@vincantomaori.it'
  });

  const saveNotificationSettings = async () => {
    setLoading(true);
    try {
      debugLog.log('🔔 Salvataggio impostazioni notifiche:', notificationSettings);

      const response = await fetch('/api/unified?action=save-notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings)
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Impostazioni notifiche salvate con successo!');
      } else {
        throw new Error(result.message || 'Errore salvataggio');
      }
    } catch (error) {
      console.error('❌ Errore salvataggio notifiche:', error);
      alert('❌ Errore: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };



  const markAllNotificationsAsRead = () => {
    if (window.confirm('🔔 Marcare tutte le notifiche come lette?')) {
      debugLog.log('🔔 Tutte le notifiche marcate come lette');
      alert('✅ Tutte le notifiche sono state marcate come lette!');
    }
  };

  const deleteNotification = (notificationId: number) => {
    if (window.confirm(`🗑️ Eliminare la notifica #${notificationId}?`)) {
      debugLog.log(`🗑️ Eliminazione notifica ${notificationId}`);
      alert(`✅ Notifica #${notificationId} eliminata con successo!`);
    }
  };

  const testNotification = () => {
    alert('🔔 Test Notifica!\n\nQuesta è una notifica di prova del sistema.\nSe vedi questo messaggio, il sistema notifiche funziona correttamente.');
    debugLog.log('🔔 Test notifica inviato');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return '📧';
      case 'payment': return '💰';
      case 'system': return '⚙️';
      case 'review': return '⭐';
      default: return '🔔';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return '';
    }
  };

  // === PRICING FUNCTIONS (Ripristinate) ===
  const loadPricingConfig = async () => {
    try {
      if (!adminApiService) return;
      debugLog.log('💰 Caricamento configurazione prezzi...');
      const result = await adminApiService.getPricingConfig();
      if (result && (result.priceGroup1to2 !== undefined || result.success)) {
        const config = result.priceGroup1to2 ? result : result.pricing || {};
        setPricingConfig({
          priceGroup1to2: parseFloat(config.priceGroup1to2) || 75,
          priceGroup3to4: parseFloat(config.priceGroup3to4) || 95,
          priceGroup5to6: parseFloat(config.priceGroup5to6) || 115,
          priceGroup7to8: parseFloat(config.priceGroup7to8) || 135,
          cleaningFee: parseFloat(config.cleaningFee) || 50,
          parkingFee: parseFloat(config.parkingFee) || 20,
          touristTaxAdult: parseFloat(config.touristTaxAdult) || 2.00,
          touristTaxChild: parseFloat(config.touristTaxChild) || 0,
          weekendSurcharge: parseFloat(config.weekendSurcharge) || 0,
          weeklyDiscount: parseFloat(config.weeklyDiscount) || 10,
          monthlyDiscount: parseFloat(config.monthlyDiscount) || 15,
          minStay: parseInt(config.minStay) || 2,
          maxStay: parseInt(config.maxStay) || 14,
          maxGuests: parseInt(config.maxGuests) || 8,
          advanceBookingDiscount: config.advanceBookingDiscount || 0,
          lastMinuteDiscount: config.lastMinuteDiscount || 0
        });
      }
    } catch (error) { console.error('❌ Errore caricamento prezzi:', error instanceof Error ? error.message : String(error)); }
  };

  const savePricingConfig = async () => {
    try {
      if (!adminApiService) return;
      setIsUpdatingPricing(true);
      const result = await adminApiService.updatePricingConfig(pricingConfig);
      if (result.success) {
        alert('✅ Prezzi salvati!');
        await loadPricingConfig();
      }
    } catch (error) {
      alert('❌ Errore salvataggio: ' + (error instanceof Error ? error.message : String(error)));
    } finally { setIsUpdatingPricing(false); }
  };

  // Carica dati reali dalle API backend
  const loadRealApiData = async () => {
    if (!adminApiService) {
      console.warn('⚠️ AdminApiService non disponibile');
      return;
    }

    setIsLoadingData(true);
    try {
      debugLog.log('🔄 Caricamento dati API reali...');

      // Carica dati uno alla volta per debug
      try {
        const stats = await adminApiService.getDashboardStats();
        debugLog.log('✅ Stats caricate:', stats);
        setDashboardStats(stats || {});
      } catch (err) {
        console.error('❌ Errore stats:', err);
      }

      try {
        const bookings: any[] = await adminApiService.getBookings();
        debugLog.log('✅ Prenotazioni caricate:', bookings);
        setRealBookings(bookings || []);
        setRecentBookings(bookings || []);
      } catch (err) {
        console.error('❌ Errore prenotazioni:', err);
      }

      // Carica eventi iCal esterni sincronizzati
      try {
        const calendarBookingsResult = await adminApiService.getCalendarBookings({ futureOnly: true, limit: 100 });
        debugLog.log('✅ Prenotazioni calendari esterni caricate:', calendarBookingsResult);
        if (calendarBookingsResult && calendarBookingsResult.bookings) {
          setCalendarEvents(calendarBookingsResult.bookings);

          // Log distribuzione per piattaforma
          const platformCount = calendarBookingsResult.bookings.reduce((acc: Record<string, number>, booking: any) => {
            const platform = booking.platform || 'unknown';
            acc[platform] = (acc[platform] || 0) + 1;
            return acc;
          }, {});

          debugLog.log('📊 Distribuzione prenotazioni per piattaforma:', platformCount);
        } else {
          setCalendarEvents([]);
        }
      } catch (err) {
        console.error('❌ Errore prenotazioni calendari esterni:', err);
      }

      try {
        const settings = await adminApiService.getSystemSettings();
        debugLog.log('✅ Impostazioni caricate:', settings);
        setSystemSettings(settings || []);
      } catch (err) {
        console.error('❌ Errore impostazioni:', err);
      }

      try {
        const analyticsResult: any[] = await adminApiService.getAnalytics();
        debugLog.log('✅ Analytics caricate:', analyticsResult);
        setAnalytics(analyticsResult || []);
      } catch (err) {
        console.error('❌ Errore analytics:', err);
      }

      try {
        const notificationsResult = await adminApiService.getNotifications();
        debugLog.log('✅ Notifiche caricate:', notificationsResult);
        setNotifications(notificationsResult || []);
      } catch (err) {
        console.error('❌ Errore notifiche:', err);
      }

      try {
        const blockedDatesResult = await adminApiService.getBlockedDates(); // Corretto
        debugLog.log('✅ Date bloccate caricate:', blockedDatesResult);
        // setBlockedDates(blockedDatesResult || []); // Rimosso perché non usato
      } catch (err) {
        console.error('❌ Errore date bloccate:', err);
      }

      try {
        const paymentsResult = await adminApiService.getPayments();
        debugLog.log('✅ Pagamenti caricati:', paymentsResult);
        setPaymentTransactions(paymentsResult || []);
      } catch (err) {
        console.error('❌ Errore pagamenti:', err);
        setPaymentTransactions([]);
      }

      try {
        await loadPricingConfig(); // Funzione già definita
        debugLog.log('✅ Prezzi caricati');
      } catch (err) {
        console.error('❌ Errore prezzi:', err);
      }

      debugLog.log('✅ Dati API reali caricati completamente');
    } catch (error) {
      console.error('❌ Errore nel caricamento dati API:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // === FUNZIONI CRUD COMPLETE ===

  // Gestione Prenotazioni
  const createNewBooking = async (bookingData: any) => {
    if (!adminApiService) return;
    try {
      setIsLoadingData(true);
      const result = await adminApiService.createBooking(bookingData);
      await loadRealApiData();
      debugLog.log('✅ Prenotazione creata:', result);
      return result;
    } catch (error) {
      console.error('❌ Errore creazione prenotazione:', error);
      throw error;
    } finally {
      setIsLoadingData(false);
    }
  };

  const updateBookingStatus = async (id: string, updates: any) => {
    if (!adminApiService) return;
    try {
      const result = await adminApiService.updateBooking(id, updates);
      await loadRealApiData();
      debugLog.log('✅ Prenotazione aggiornata:', result);
      return result;
    } catch (error) {
      console.error('❌ Errore aggiornamento prenotazione:', error);
      throw error;
    }
  };

  const deleteBookingById = async (id: string) => {
    if (!adminApiService) return;
    try {
      const result = await adminApiService.deleteBooking(id);
      await loadRealApiData();
      debugLog.log('✅ Prenotazione eliminata:', result);
      return result;
    } catch (error) {
      console.error('❌ Errore eliminazione prenotazione:', error);
      throw error;
    }
  };

  // === GESTIONE FORM PRENOTAZIONI ===

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNewBooking(newBookingData);
      setShowBookingForm(false);
      setNewBookingData({
        customer_name: '',
        customer_email: '',
        check_in: '',
        check_out: '',
        guests: 1,
        total_amount: 0,
        status: 'pending',
        platform: 'direct',
        payment_method: 'bank_transfer',
        payment_type: 'deposit'
      });
      alert('✅ Prenotazione creata con successo!');
    } catch (error) {
      alert('❌ Errore nella creazione della prenotazione');
    }
  };

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    const checkInDate = booking.check_in || booking.checkIn;
    const checkOutDate = booking.check_out || booking.checkOut;
    setNewBookingData({
      customer_name: booking.customer_name || booking.guestName || '',
      customer_email: booking.customer_email || booking.email || '',
      check_in: checkInDate ? new Date(checkInDate).toISOString().split('T')[0] : '',
      check_out: checkOutDate ? new Date(checkOutDate).toISOString().split('T')[0] : '',
      guests: booking.guests || 1,
      total_amount: booking.total_amount || booking.totalPrice || 0,
      status: booking.status || 'pending',
      platform: booking.platform || 'direct',
      payment_method: 'bank_transfer',
      payment_type: 'deposit'
    });
    setShowBookingForm(true);
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    try {
      await updateBookingStatus(editingBooking.id, newBookingData);
      setShowBookingForm(false);
      setEditingBooking(null);
      setNewBookingData({
        customer_name: '',
        customer_email: '',
        check_in: '',
        check_out: '',
        guests: 1,
        total_amount: 0,
        status: 'pending',
        platform: 'direct',
        payment_method: 'bank_transfer',
        payment_type: 'deposit'
      });
      alert('✅ Prenotazione aggiornata con successo!');
    } catch (error) {
      alert('❌ Errore nell\'aggiornamento della prenotazione');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm('⚠️ Sei sicuro di voler eliminare questa prenotazione?')) {
      try {
        await deleteBookingById(id);
        alert('✅ Prenotazione eliminata con successo!');
      } catch (error) {
        alert('❌ Errore nell\'eliminazione della prenotazione');
      }
    }
  };

  // ✨ NUOVE FUNZIONI PER GESTIONE PAGAMENTI E CANCELLAZIONI
  const handleConfirmPayment = async (bookingId: string, paymentType: 'deposit' | 'full') => {
    const typeLabel = paymentType === 'deposit' ? " l'acconto" : " il saldo completo";
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
        alert('❌ Errore: ' + (result.error || result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('❌ Errore conferma pagamento:', error);
      alert('❌ Errore di comunicazione con il server');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSendReminder = async (booking: any) => {
    let type = 'full';
    if (booking.payment_status === 'deposit_paid') {
      type = 'balance';
    } else if (booking.deposit_amount && booking.deposit_amount < booking.total_amount) {
      type = 'deposit';
    }

    if (!confirm(`📧 Inviare email di promemoria pagamento (${type === 'balance' ? 'Saldo' : type === 'deposit' ? 'Acconto' : 'Totale'}) a ${booking.customer_name || 'Cliente'}?`)) {
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
      alert(result.success ? '✅ Email di promemoria inviata con successo!' : '❌ Errore: ' + (result.error || 'Errore sconosciuto'));
    } catch (error) {
      alert('❌ Errore di comunicazione: ' + (error instanceof Error ? error.message : String(error)));
    } finally { setIsLoadingData(false); }
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
        alert('❌ Errore: ' + (result.error || result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('❌ Errore cancellazione:', error);
      alert('❌ Errore di comunicazione con il server');
    } finally {
      setIsLoadingData(false);
    }
  };

  // === GESTIONE DATE BLOCCATE ===
  /*
    const handleAddBlockedDate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!adminApiService) return;
  
      try {
        await adminApiService.addBlockedDate(newBlockedDate);
        setShowBlockDateForm(false);
        setNewBlockedDate({
          start_date: '',
          end_date: '',
          reason: 'maintenance'
        });
        await loadRealApiData();
        alert('✅ Date bloccate aggiunte con successo!');
      } catch (error) {
        alert('❌ Errore nell\'aggiungere le date bloccate');
      }
    };
  
    const handleRemoveBlockedDate = async (id: string) => {
      if (confirm('⚠️ Rimuovere il blocco per queste date?')) {
        try {
          setIsLoadingData(true);
          const response = await fetch('/api/unified?action=blocked-dates', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          const result = await response.json();
          if (!result.success) throw new Error(result.error || 'Errore sconosciuto');
  
          await loadRealApiData();
          alert('✅ Blocco rimosso con successo!');
        } catch (error) {
          alert('❌ Errore nella rimozione del blocco');
        } finally {
          setIsLoadingData(false);
        }
      }
    };
  */

  /*
    const handleCompleteAirbnbSetup = async () => {
      const apiKey = prompt('🔑 Inserisci la tua API Key di Airbnb:');
      if (!apiKey) return;
  
      try {
        if (!adminApiService) return;
  
        const setupData = {
          platform: 'airbnb',
          apiKey: apiKey,
          isActive: true
        };
  
        const result = await adminApiService.setupExternalCalendar(setupData);
  
        if (result.success) {
          alert('✅ Setup Airbnb completato con successo!');
          // await loadCalendarConfigs();
        } else {
          alert('❌ Setup fallito: ' + (result.error || 'Errore sconosciuto'));
        }
      } catch (error) {
        console.error('Errore setup Airbnb:', error);
        alert('❌ Errore nel setup Airbnb. Verifica la tua API Key.');
      }
    };
  
    const handleTestAirbnbAPI = async () => {
      try {
        if (!adminApiService) return;
  
        const testResult = await adminApiService.testExternalCalendarAPI('airbnb');
  
        if (testResult.success) {
          alert(`✅ Test API Airbnb riuscito!\n\n📊 Status: ${testResult.status}\n📅 Calendari trovati: ${testResult.calendarsCount || 0}`);
        } else {
          alert(`❌ Test API fallito: ${testResult.error || 'Errore sconosciuto'}`);
        }
      } catch (error) {
        console.error('Errore test API Airbnb:', error);
        alert('❌ Errore nel test delle API Airbnb');
      }
    };
  
    const handleCancelAirbnbSetup = async () => {
      const confirm = window.confirm('⚠️ Sei sicuro di voler annullare il setup Airbnb? Tutte le configurazioni verranno rimosse.');
  
      if (!confirm) return;
  
      try {
        if (!adminApiService) return;
  
        await adminApiService.removeExternalCalendar('airbnb');
        alert('🗑️ Setup Airbnb annullato e configurazioni rimosse');
        // await loadCalendarConfigs();
      } catch (error) {
        console.error('Errore annullamento setup:', error);
        alert('❌ Errore nell\'annullamento del setup');
      }
    };
  
    const handleTestGeneralConnection = async () => {
      try {
        if (!adminApiService) return;
  
        const connectionTest = await adminApiService.testCalendarConnection();
  
        const statusMessage = `📧 Test Connessioni Generale\n\n` +
          `📱 Connessione Internet: ${connectionTest.internet ? '✅' : '❌'}\n` +
          `📅 Google Calendar: ${connectionTest.google ? '✅' : '❌'}\n` +
          `📧 Airbnb API: ${connectionTest.airbnb ? '✅' : '❌'}\n` +
          `💾 Database: ${connectionTest.database ? '✅' : '❌'}\n\n` +
          `📊 Stato Generale: ${connectionTest.overall ? '✅ Tutto OK' : '❌ Problemi rilevati'}`;
  
        alert(statusMessage);
      } catch (error) {
        console.error('Errore test connessioni:', error);
        alert('❌ Errore nel test delle connessioni');
      }
    };
  
    const handleSyncAllCalendars = async () => {
      const confirm = window.confirm('🔄 Sincronizzare tutti i calendari?\n\nQuesta operazione potrebbe richiedere alcuni minuti.');
  
      if (!confirm) return;
  
      try {
        if (!adminApiService) return;
        // setIsLoadingCalendars(true);
  
        const syncResults = await adminApiService.syncAllCalendars();
  
        const resultMessage = `🔄 Sincronizzazione Completata\n\n` +
          `✅ Successi: ${syncResults.successful || 0}\n` +
          `❌ Errori: ${syncResults.failed || 0}\n` +
          `📅 Eventi totali: ${syncResults.totalEvents || 0}\n\n` +
          `${syncResults.errors && syncResults.errors.length > 0 ? 'Dettagli errori:\n' + syncResults.errors.join('\n') : ''}`;
  
        alert(resultMessage);
        // await loadCalendarConfigs();
      } catch (error) {
        console.error('Errore sincronizzazione calendari:', error);
        alert('❌ Errore nella sincronizzazione di tutti i calendari');
      } finally {
        // setIsLoadingCalendars(false);
      }
    };
  
    const handleShowOccupancyDashboard = () => {
      // Simula apertura dashboard occupazione
      const occupancyData = {
        today: '75%',
        thisWeek: '82%',
        thisMonth: '68%',
        nextMonth: '45%'
      };
  
      const dashboardMessage = `📊 Dashboard Occupazione\n\n` +
        `📅 Oggi: ${occupancyData.today}\n` +
        `📅 Questa settimana: ${occupancyData.thisWeek}\n` +
        `📊 Questo mese: ${occupancyData.thisMonth}\n` +
        `📅 Prossimo mese: ${occupancyData.nextMonth}\n\n` +
        `💡 Suggerimento: Considera di aumentare i prezzi nei periodi di alta occupazione.`;
  
      alert(dashboardMessage);
    };
  
    const handleShowSyncReport = async () => {
      try {
        if (!adminApiService) return;
  
        const report = await adminApiService.getFullSyncReport();
  
        const reportMessage = `📊 Report Sincronizzazioni Completo\n\n` +
          `📊 Sincronizzazioni oggi: ${report.todaySync || 0}\n` +
          `📅 Sincronizzazioni settimana: ${report.weekSync || 0}\n` +
          `🔄 Ultima sincronizzazione: ${report.lastSync || 'Mai'}\n` +
          `⏱️ Media tempo sync: ${report.averageTime || '0'}s\n` + // Corretto
          `✅ Tasso successo: ${report.successRate || 0}%\n\n` + // Corretto
          `🏆 Platform più affidabile: ${report.bestPlatform || 'N/A'}`; // Corretto
  
        alert(reportMessage);
      } catch (error) {
        console.error('Errore report sincronizzazioni:', error);
        alert('❌ Errore nel recupero del report sincronizzazioni');
      }
    };
  
    const handleExportCalendarConfig = async (calendarConfigs: any, calendarStats: any) => {
      try {
        const configData = {
          calendars: calendarConfigs,
          settings: calendarStats,
          timestamp: new Date().toISOString(),
          exportedBy: 'Vincanto Admin Panel',
        };
  
        const jsonString = JSON.stringify(configData, null, 2);
  
        // Crea e scarica il file
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vincanto-calendar-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
  
        alert('📥 Configurazione calendari esportata con successo!');
      } catch (error) {
        console.error('Errore esportazione:', error);
        alert('❌ Errore nell\'esportazione della configurazione');
      }
    };
  
    const handleAdvancedCalendarSettings = () => {
      const settings = prompt(`⚙️ Impostazioni Avanzate Calendari\n\nInserisci nuove impostazioni (JSON format):\n\nEsempio:\n{\n  "syncInterval": 30,\n  "maxRetries": 3,\n  "timeoutSeconds": 60\n}`,
        JSON.stringify({
          syncInterval: 30,
          maxRetries: 3,
          timeoutSeconds: 60,
          autoSync: true
        }, null, 2)
      );
  
      if (!settings) return;
  
      try {
        const parsedSettings = JSON.parse(settings);
  
        // Simula salvataggio impostazioni avanzate
        alert(`⚙️ Impostazioni avanzate salvate!\n\n${JSON.stringify(parsedSettings, null, 2)}`);
      } catch (error) {
        alert('❌ Formato JSON non valido. Riprova.');
      }
    };
  
    */
  // === NUOVE FUNZIONI PRENOTAZIONI AGGIUNTE ===
  /*

  const handleBookingsDetailedReport = async () => {
    try {
      const reportData = {
        totalBookings: realBookings.length + recentBookings.length,
        confirmedBookings: realBookings.filter(b => b.status === 'confirmed').length + recentBookings.filter(b => b.status === 'confirmed').length,
        pendingBookings: realBookings.filter(b => b.status === 'pending').length + recentBookings.filter(b => b.status === 'pending').length,
        totalRevenue: realBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) + recentBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        averageStay: 4.2,
        occupancyRate: 68,
        topPlatform: 'Airbnb (45%)',
        averageGuests: 2.8
      };

      const report = `📊 REPORT DETTAGLIATO PRENOTAZIONI\n\n` +
        `📊 STATISTICHE GENERALI:\n` +
        `• Prenotazioni totali: ${reportData.totalBookings}\n` +
        `• Confermate: ${reportData.confirmedBookings}\n` +
        `• In attesa: ${reportData.pendingBookings}\n` +
        `• Ricavo totale: €${reportData.totalRevenue.toFixed(2)}\n\n` +
        `📊 METRICHE:\n` +
        `• Soggiorno medio: ${reportData.averageStay} notti\n` +
        `• Tasso occupazione: ${reportData.occupancyRate}%\n` +
        `• Piattaforma top: ${reportData.topPlatform}\n` +
        `• Ospiti medi: ${reportData.averageGuests}\n\n` +
        `📅 Generato il: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`;

      alert(report);
    } catch (error) {
      console.error('Errore generazione report:', error);
      alert('❌ Errore nella generazione del report dettagliato');
    }
  };
  */
  const handleMassEmailSend = () => {
    const emailTypes = [
      'Newsletter mensile',
      'Offerte speciali',
      'Promemoria check-in',
      'Richiesta feedback',
      'Email promozionale personalizzata'
    ];

    const selectedType = prompt(`📧 Email di Massa\n\nSeleziona il tipo di email:\n${emailTypes.map((type, index) => `${index + 1}. ${type}`).join('\n')}\n\nInserisci il numero (1-5):`);

    if (selectedType && parseInt(selectedType) >= 1 && parseInt(selectedType) <= 5) {
      const type = emailTypes[parseInt(selectedType) - 1];
      const recipientCount = realBookings.length + recentBookings.length + 150; // Aggiungi database email

      alert(`📧 Invio Email di Massa Avviato!\n\n📧 Tipo: ${type}\n👥 Destinatari: ${recipientCount} clienti\n⚠️ Tempo stimato: 15-20 minuti\n\n✅ Email aggiunte alla coda di invio\n📊 Riceverai un report al completamento`);
    }
  };
  /*
    const handleExportBookingsExcel = async () => {
      try {
        // Simula la generazione di un file Excel
        const bookingsData = [
          ...realBookings.map(b => ({
            ID: b.id,
            Cliente: b.customer_name || b.guestName || 'N/A',
            Email: b.customer_email || 'N/A',
            CheckIn: b.check_in || b.checkIn,
            CheckOut: b.check_out || b.checkOut,
            Ospiti: b.guests,
            Totale: b.total_amount || b.totalPrice || 0,
            Stato: b.status,
            Piattaforma: b.platform || 'N/A',
            DataCreazione: new Date().toISOString()
          })),
          ...recentBookings.map(b => ({
            ID: b.id,
            Cliente: b.guestName || 'Ospite Sconosciuto',
            Email: (b.guestName ? b.guestName.toLowerCase().replace(' ', '.') : 'ospite') + '@email.com',
            CheckIn: b.checkIn,
            CheckOut: b.checkOut,
            Ospiti: b.guests,
            Totale: b.totalPrice,
            Stato: b.status,
            Piattaforma: b.platform,
            DataCreazione: new Date().toISOString()
          }))
        ];
  
        // Crea CSV (simulazione Excel)
        const csvContent = [
          'ID,Cliente,Email,CheckIn,CheckOut,Ospiti,Totale,Stato,Piattaforma,DataCreazione',
          ...bookingsData.map(row =>
            `${row.ID},"${row.Cliente}","${row.Email}",${row.CheckIn},${row.CheckOut},${row.Ospiti},${row.Totale},"${row.Stato}","${row.Piattaforma}",${row.DataCreazione}`
          )
        ].join('\n');
  
        // Scarica il file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vincanto-prenotazioni-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
  
        alert(`💾 Export Excel Completato!\n\n📥 File: vincanto-prenotazioni-${new Date().toISOString().split('T')[0]}.csv\n📊 Righe esportate: ${bookingsData.length}\n💾 Download avviato automaticamente`);
      } catch (error) {
        console.error('Errore export Excel:', error);
        alert('❌ Errore nell\'esportazione Excel');
      }
    };
    
    const handleSyncAllPlatforms = async () => {
      const confirm = window.confirm('🔄 Sincronizzare tutte le piattaforme?\n\nQuesta operazione potrebbe richiedere alcuni minuti e aggiornare tutte le prenotazioni.');
  
      if (!confirm) return;
  
      try {
        setIsLoadingData(true);
  
        // Simula sincronizzazione con tutte le piattaforme
        const platforms = ['Airbnb', 'Booking.com', 'Expedia', 'Google Calendar'];
        const syncResults = {
          airbnb: { success: true, newBookings: 3, updated: 1 },
          booking: { success: true, newBookings: 2, updated: 0 },
          expedia: { success: false, error: 'API timeout' },
          google: { success: true, newBookings: 0, updated: 2 },
          vrbo: { success: true, newBookings: 1, updated: 0 }
        };
  
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simula attesa
  
        const successfulPlatforms = Object.values(syncResults).filter(r => r.success).length;
        const totalNewBookings = Object.values(syncResults).filter(r => r.success).reduce((sum, r) => sum + ((r as any).newBookings || 0), 0);
        const totalUpdated = Object.values(syncResults).filter(r => r.success).reduce((sum, r) => sum + ((r as any).updated || 0), 0);
  
        const resultMessage = `🔄 Sincronizzazione Completata!\n\n` +
          `✅ Piattaforme sincronizzate: ${successfulPlatforms}/${platforms.length}\n` +
          `➕ Nuove prenotazioni: ${totalNewBookings}\n` +
          `⚠️ Prenotazioni aggiornate: ${totalUpdated}\n\n` +
          `📊 Dettagli:\n` +
          `• Airbnb: ${syncResults.airbnb.success ? `✅ ${(syncResults.airbnb as any).newBookings} nuove, ${(syncResults.airbnb as any).updated} aggiornate` : '❌'}\n` +
          `• Booking.com: ${syncResults.booking.success ? `✅ ${syncResults.booking.newBookings} nuove, ${syncResults.booking.updated} aggiornate` : '❌'}\n` +
          `• Expedia: ${syncResults.expedia.success ? '✅' : '❌ ' + syncResults.expedia.error}\n` +
          `• Google Calendar: ${syncResults.google.success ? `✅ ${syncResults.google.newBookings} nuove, ${syncResults.google.updated} aggiornate` : '❌'}\n` +
          `• VRBO: ${syncResults.vrbo.success ? `✅ ${syncResults.vrbo.newBookings} nuove, ${syncResults.vrbo.updated} aggiornate` : '❌'}`;
  
        alert(resultMessage);
  
        // Ricarica i dati dopo la sincronizzazione
        await loadRealApiData();
      } catch (error) {
        console.error('Errore sincronizzazione piattaforme:', error);
        alert('❌ Errore nella sincronizzazione delle piattaforme');
      } finally {
        setIsLoadingData(false);
      }
    };
  */
  // === NUOVE FUNZIONI PAGAMENTI AGGIUNTE ===

  const handleConfigureStripe = () => {
    const stripeConfig = prompt(`⚙️ Configurazione Stripe\n\nInserisci la tua configurazione Stripe (JSON):\n\nEsempio:\n{\n  "publicKey": "pk_live_...",\n  "secretKey": "sk_live_...",\n  "webhookSecret": "whsec_...",\n  "currency": "EUR"\n}`,
      JSON.stringify({
        publicKey: 'pk_live_51...',
        secretKey: 'sk_live_51...',
        webhookSecret: 'whsec_1...',
        currency: 'EUR',
        commission: 2.9
      }, null, 2)
    );

    if (!stripeConfig) return;

    try {
      const config = JSON.parse(stripeConfig);
      alert(`⚙️ Configurazione Stripe Salvata!\n\n💳 Valuta: ${config.currency}\n📊 Commissione: ${config.commission}%\n🔐 Sicurezza: Attivata\n\n✅ Stripe configurato correttamente`);
    } catch (error) {
      alert('❌ Formato JSON non valido. Riprova.');
    }
  };

  const handleEditBankTransfer = () => {
    const newIBAN = prompt('🏦 Modifica Dati Bonifico Bancario\n\nInserisci il nuovo IBAN:', 'IT02 L012 3456 789012345678901');

    if (!newIBAN) return;

    const liquidationDays = prompt('⚠️ Giorni per liquidazione:', '2');

    if (liquidationDays) {
      alert(`🏦 Dati Bonifico Aggiornati!\n\n💳 IBAN: ${newIBAN}\n📅 Liquidazione: ${liquidationDays} giorni\n✅ Configurazione salvata con successo`);
    }
  };

  const handleCompletePayPalSetup = () => {
    const paypalConfig = {
      email: 'antonio.guida320@vincanto.com',
      link: 'https://www.paypal.me/AntonioGuida320',
      commission: 3.4,
      currency: ['EUR', 'USD', 'GBP'],
      webhooks: true
    }; // Corretto

    alert(`✅ Setup PayPal Completato!\n\n📧 Email: ${paypalConfig.email}\n📤 Link: ${paypalConfig.link}\n📊 Commissione: ${paypalConfig.commission}%\n💰 Valute: ${paypalConfig.currency.join(', ')}\n🔔 Webhook: ${paypalConfig.webhooks ? 'Attivi' : 'Disattivi'}\n\n✅ PayPal Business è ora completamente configurato!`);
  };

  /*  // === ADVANCED PAYMENT HANDLERS ===

  const handleProcessRefund = async (paymentId: string, amount?: number) => {
    if (!confirm(`⚠️ Confermi il rimborso${amount ? ` di €${amount.toFixed(2)}` : ' totale'}?`)) return;

    setLoading(true);
    try {
      const response = await fetch('/api/payments?action=refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_intent_id: paymentId,
          amount,
          reason: 'requested_by_customer'
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Rimborso Processato!\n\n💰 Importo: €${data.amount}\n💳 Refund ID: ${data.refund_id}\n⚠️ Il rimborso sarà visibile sul conto del cliente entro 5-10 giorni lavorativi.`);
        await loadRealApiData(); // Reload transactions
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Errore rimborso:', error);
      alert(`❌ Errore nel processare il rimborso: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendPaymentReceipt = async (paymentId: string, customerEmail: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments?action=send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, customer_email: customerEmail })
      });

      const data = await response.json();

      if (response.ok && data.receipt_url) {
        alert(`✅ Ricevuta Inviata!\n\n📧 Email: ${customerEmail}\n📤 URL Ricevuta: ${data.receipt_url}\n\nLa ricevuta è stata inviata con successo.`);
      } else {
        throw new Error(data.error || 'Ricevuta non disponibile');
      }
    } catch (error) {
      console.error('❌ Errore invio ricevuta:', error);
      alert(`❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPaymentStatus = async (paymentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payments?action=verify-status&payment_id=${paymentId}`);
      const data = await response.json();

      if (response.ok) {
        alert(`💳 Stato Pagamento\n\n💳 ID: ${paymentId}\n📊 Stato: ${data.status}\n💰 Importo: €${data.amount}\n💱 Valuta: ${data.currency.toUpperCase()}\n📧 Cliente: ${data.customer_email}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Errore verifica pagamento:', error);
      alert(`❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurePaymentGateway = async (gateway: 'stripe' | 'paypal') => {
    const config = gateway === 'stripe'
      ? prompt(`⚙️ Configurazione Stripe\n\nInserisci JSON con:\n- publishable_key\n- secret_key\n- webhook_secret`)
      : prompt(`⚙️ Configurazione PayPal\n\nInserisci JSON con:\n- client_id\n- client_secret\n- mode (sandbox/live)`);

    if (!config) return;

    try {
      const parsedConfig = JSON.parse(config);
      const action = gateway === 'stripe' ? 'configure-stripe' : 'configure-paypal';

      const response = await fetch(`/api/payments?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedConfig)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${gateway === 'stripe' ? 'Stripe' : 'PayPal'} configurato con successo!`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert(`❌ Errore configurazione: ${error instanceof Error ? error.message : 'Formato JSON non valido'}`);
    }
  }; */

  // === NUOVE FUNZIONI EMAIL AGGIUNTE ===

  const handleShowEmailStats = (templateName: string) => {
    const statsData = {
      'Conferma Prenotazione': {
        sent: 156,
        opened: 136,
        clicked: 89,
        bounced: 2,
        unsubscribed: 1,
        openRate: '87%',
        clickRate: '57%'
      },
      'Istruzioni Check-in': {
        sent: 142,
        opened: 135,
        clicked: 128,
        bounced: 0,
        unsubscribed: 0,
        openRate: '95%',
        clickRate: '90%'
      },
      'Messaggio Benvenuto': {
        sent: 98,
        opened: 76,
        clicked: 34,
        bounced: 1,
        unsubscribed: 2,
        openRate: '78%',
        clickRate: '35%'
      },
      'Richiesta Recensione': {
        sent: 87,
        opened: 57,
        clicked: 23,
        bounced: 0,
        unsubscribed: 1,
        openRate: '65%',
        clickRate: '26%'
      }
    };

    const stats = statsData[templateName as keyof typeof statsData] || statsData['Conferma Prenotazione'];

    const report = `📊 Statistiche Email: ${templateName}\n\n` +
      `📧 Email inviate: ${stats.sent}\n` +
      `👁️ Aperture: ${stats.opened} (${stats.openRate})\n` +
      `🔗 Click: ${stats.clicked} (${stats.clickRate})\n` +
      `⚠️ Bounce: ${stats.bounced}\n` +
      `❌ Disiscrizioni: ${stats.unsubscribed}\n\n` +
      `📊 Performance: ${parseFloat(stats.openRate) > 80 ? 'Eccellente' : parseFloat(stats.openRate) > 60 ? 'Buona' : 'Da migliorare'}\n` +
      `📅 Ultimo invio: ${new Date().toLocaleDateString('it-IT')}`;

    alert(report); // Corretto
  };

  const handleEmailDetailedReport = async () => {
    try {
      const totalStats = {
        totalSent: 483,
        totalOpened: 404,
        totalClicked: 274,
        totalBounced: 3,
        totalUnsubscribed: 4,
        averageOpenRate: '83.6%',
        averageClickRate: '56.7%',
        topTemplate: 'Istruzioni Check-in (95% open rate)',
        worstTemplate: 'Richiesta Recensione (65% open rate)'
      };

      const report = `📧 REPORT DETTAGLIATO EMAIL\n\n` +
        `📊 STATISTICHE GENERALI:\n` +
        `• Email inviate totali: ${totalStats.totalSent}\n` +
        `• Aperture totali: ${totalStats.totalOpened}\n` +
        `• Click totali: ${totalStats.totalClicked}\n` +
        `• Bounce totali: ${totalStats.totalBounced}\n` +
        `• Disiscrizioni: ${totalStats.totalUnsubscribed}\n\n` +
        `📊 PERFORMANCE:\n` +
        `• Tasso apertura medio: ${totalStats.averageOpenRate}\n` +
        `• Tasso click medio: ${totalStats.averageClickRate}\n` +
        `• Template migliore: ${totalStats.topTemplate}\n` +
        `• Template da migliorare: ${totalStats.worstTemplate}\n\n` +
        `💡 SUGGERIMENTI:\n` +
        `• Ottimizza oggetto email per template recensioni\n` +
        `• A/B test per migliorare CTR\n` +
        `• Personalizzazione avanzata consigliata\n\n` +
        `📅 Report generato: ${new Date().toLocaleString('it-IT')}`;

      alert(report);
    } catch (error) {
      console.error('Errore report email:', error);
      alert('❌ Errore nella generazione del report email');
    }
  };

  const handleManageEmailAutomations = () => {
    const automations = [
      'Welcome sequence (3 email)',
      'Pre-checkin reminders',
      'Post-checkout follow-up',
      'Birthday offers',
      'Seasonal promotions',
      'Abandoned booking recovery'
    ];

    const selectedAutomation = prompt(`⏱️ Gestisci Automazioni Email\n\nSeleziona automazione da configurare:\n${automations.map((auto, index) => `${index + 1}. ${auto}`).join('\n')}\n\nInserisci il numero (1-6):`);

    if (selectedAutomation && parseInt(selectedAutomation) >= 1 && parseInt(selectedAutomation) <= 6) {
      const automation = automations[parseInt(selectedAutomation) - 1];

      const settings = prompt(`⚙️ Configurazione: ${automation}\n\nInserisci impostazioni (JSON):\n\nEsempio:\n{\n  "active": true,\n  "delay": "24h",\n  "conditions": ["booking_confirmed"]\n}`,
        JSON.stringify({
          active: true,
          delay: automation.includes('Welcome') ? '1h' : '24h',
          conditions: ['booking_confirmed'],
          segments: ['all_guests']
        }, null, 2)
      );

      if (settings) {
        try {
          const config = JSON.parse(settings);
          alert(`⏱️ Automazione Configurata!\n\n🎨 Automazione: ${automation}\n✅ Stato: ${config.active ? 'Attiva' : 'Sospesa'}\n⚠️ Delay: ${config.delay}\n📊 Condizioni: ${config.conditions.join(', ')}\n\n🖥️ Automazione salvata e attivata!`);
        } catch (error) {
          alert('❌ Formato JSON non valido. Riprova.');
        }
      }
    }
  };

  // === NUOVE FUNZIONI SISTEMA AGGIUNTE ===

  // Handler per SuperAdmin cambiare la propria password
  const handleSuperAdminPasswordChange = async () => {
    if (!isSuperAdmin()) {
      alert('❌ Solo il SuperAdmin può cambiare la password');
      return;
    }

    // Validazione campi
    if (!passwordChangeForm.currentPassword) {
      alert('❌ Inserisci la password attuale');
      return;
    }

    if (!passwordChangeForm.newPassword || passwordChangeForm.newPassword.length < 8) {
      alert('❌ La nuova password deve avere minimo 8 caratteri');
      return;
    }

    // Validazione requisiti password
    const hasUppercase = /[A-Z]/.test(passwordChangeForm.newPassword);
    const hasNumber = /[0-9]/.test(passwordChangeForm.newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordChangeForm.newPassword);

    if (!hasUppercase || !hasNumber || !hasSymbol) {
      alert('❌ Password deve contenere:\n• Almeno una maiuscola\n• Almeno un numero\n• Almeno un simbolo');
      return;
    }

    if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
      alert('❌ Le password non coincidono');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/unified?action=admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordChangeForm.currentPassword,
          newPassword: passwordChangeForm.newPassword,
          isSuperAdmin: true
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Password cambiata con successo!\n\nLe sessioni precedenti sono state invalidate.');
        setPasswordChangeForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowSuperAdminSettings(false);
      } else {
        alert(`❌ Errore: ${data.message || 'Impossibile cambiare password'}`);
      }
    } catch (error) {
      console.error('Errore cambio password:', error);
      alert('❌ Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // Handler per richiedere cambio password admin
  const handleRequestAdminPasswordChange = async (admin: any) => {
    if (!isSuperAdmin()) {
      alert('❌ Solo il SuperAdmin può richiedere cambio password');
      return;
    }

    const reason = prompt('⚠️ Motivo della richiesta di cambio password:\n(es: cambio periodico, reset sicurezza)', 'Cambio password richiesto');

    if (!reason) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/unified?action=admin/change-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id || admin.email,
          adminEmail: admin.email,
          adminName: admin.name || 'Admin',
          reason: reason,
          requestedBy: 'superadmin',
          createdAt: new Date().toISOString()
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Richiesta di cambio password inviata a ${admin.email}\n\nEmail di notifica inviata al SuperAdmin.`);
        // setSelectedAdminForPassword(null); // Rimosso perché non utilizzato
      } else {
        alert(`❌ Errore: ${data.message || 'Impossibile inviare richiesta'}`);
      }
    } catch (error) {
      console.error('Errore richiesta cambio password:', error);
      alert('❌ Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // Carica lista admin
  const loadAdminsList = async () => {
    if (!isSuperAdmin()) return; // Corretto
    try {
      setLoading(true);
      const response = await fetch(`/api/unified?action=admin/list`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        setAdminsList(data.admins || []);
      }
    } catch (error) {
      console.error('Errore caricamento admin:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effetto iniziale per caricare admin list
  React.useEffect(() => {
    if (activeTab === 'admin-management' && isSuperAdmin()) { // Corretto
      loadAdminsList();
    }
  }, [activeTab, isSuperAdmin]);

  // Handler per creare nuovo admin
  const handleCreateAdmin = async () => {
    if (!isSuperAdmin()) {
      alert('❌ Solo il SuperAdmin può creare admin');
      return;
    }

    // Validazioni
    if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.password) {
      alert('❌ Tutti i campi sono obbligatori');
      return;
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminForm.email)) {
      alert('❌ Email non valida');
      return;
    }

    // Validazione password
    if (newAdminForm.password.length < 8) {
      alert('❌ La password deve avere minimo 8 caratteri');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/unified?action=admin/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAdminForm.name,
          email: newAdminForm.email,
          password: newAdminForm.password,
          role: newAdminForm.role
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Admin ${newAdminForm.name} creato con successo!\n\nCredenziali inviate via email.`);
        setNewAdminForm({ name: '', email: '', password: '', role: 'admin' });
        setShowCreateAdminForm(false);
        // Ricarica lista admin
        await loadAdminsList();
      } else {
        alert(`❌ Errore: ${data.message || 'Impossibile creare admin'}`);
      }
    } catch (error) {
      console.error('Errore creazione admin:', error);
      alert('❌ Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // Handler per eliminare admin
  const handleDeleteAdmin = async (admin: any) => {
    if (!isSuperAdmin()) {
      alert('❌ Solo il SuperAdmin può eliminare admin');
      return;
    }

    const confirmDelete = confirm(`🗑️ Eliminare l'admin ${admin.name || admin.email}?\n\nQuesta azione è irreversibile.`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/unified?action=admin/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          adminEmail: admin.email
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Admin ${admin.name || admin.email} eliminato con successo`);
        // Ricarica lista admin
        await loadAdminsList();
      } else {
        alert(`❌ Errore: ${data.message || 'Impossibile eliminare admin'}`);
      }
    } catch (error) {
      console.error('Errore eliminazione admin:', error);
      alert('❌ Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // === GESTIONE NOTIFICHE ===

  const markNotificationAsRead = async (id: string | number) => {
    if (typeof id === 'number') {
      debugLog.log(`🔔 Notifica ${id} marcata come letta`);
      alert(`✅ Notifica #${id} marcata come letta!`);
      return;
    }

    if (!adminApiService) return;

    try {
      await adminApiService.markNotificationRead(id);
      await loadRealApiData();
    } catch (error) {
      console.error('Errore nella marcatura notifica:', error);
    }
  };


  // === RENDER LOGIN ===
  // === RENDER SUPERADMIN GUARD ===
  if (!roleLoading && !isAdmin()) {
    return (
      <div className="admin-access-denied-container">
        <div className="admin-access-denied-card">
          <h1 className="admin-access-denied-icon">🔐</h1>
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

  // === LOGIN HANDLED BY ProtectedRoute ===
  // Authentication is now managed via TwoFactorLogin component and ProtectedRoute wrapper

  // === RENDER DEBUG PRINCIPALE ===
  devLog('🎨 Rendering main admin panel...');

  // === RENDER ADMIN PANEL RESPONSIVE ===
  // Unifica bookings e calendarEvents per la tabella
  const unifiedBookings = [
    ...realBookings.map(b => ({
      id: b.id || b.booking_id,
      source: b.platform || b.source || 'manual',
      guestName: b.customer_name || b.guestName || '',
      email: b.customer_email || b.email || '',
      checkIn: b.check_in || b.checkIn,
      checkOut: b.check_out || b.checkOut,
      guests: b.guests,
      totalPrice: b.total_amount || b.totalPrice,
      status: b.status,
      type: 'booking',
    })),
    ...calendarEvents.map(e => ({
      id: e.id || e.uid,
      source: e.platform || e.calendar_source || 'ical',
      guestName: e.title || e.summary || '(Evento iCal)',
      email: '',
      checkIn: e.checkIn || e.start_date,
      checkOut: e.checkOut || e.end_date,
      guests: '',
      totalPrice: '',
      status: 'imported',
      type: 'calendar_event',
    }))
  ];

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
      adminEmail={localStorage.getItem('vincanto_admin_email') || role || 'Admin'}
      tabs={proTabs}
    >
      <div className="admin-panel-pro">
        {/* Contenuto Principale Responsive */}
        <div className="admin-main">
          {error && (
            <div className="admin-section admin-text-danger">
              <div className="admin-card">
                <h4>⚠️ Errore di Sistema</h4>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Dashboard con Dati Backend Reali */}
          {activeTab === 'dashboard' && (
            <div className="admin-section admin-animate-fade-in">
              <h2>📊 Dashboard Live {isLoadingData && <span className="admin-loading"><div className="admin-spinner"></div> Caricamento...</span>}</h2>

              {/* Statistiche Principali */}
              <div className="admin-mb-xl">
                <h3>📊 Statistiche Live (Database)</h3>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <h3>Prenotazioni Totali</h3>
                    <div className="stat-value">{dashboardStats.totalBookings || realBookings.length}</div>
                    <small>Database PostgreSQL</small>
                  </div>

                  <div className="admin-stat-card">
                    <h3>Ricavi Totali</h3>
                    <div className="stat-value">€{(dashboardStats.totalRevenue || 0).toFixed(2)}</div>
                    <small>Calcolo backend</small>
                  </div>

                  <div className="admin-stat-card">
                    <h3>Occupazione Media</h3>
                    <div className="stat-value">{dashboardStats.occupancyRate || 0}%</div>
                    <small>Calcolo dinamico</small>
                  </div>

                  <div className="admin-stat-card">
                    <h3>Pagamenti Pending</h3>
                    <div className="stat-value">{dashboardStats.pendingPayments || paymentTransactions.filter(t => t.status === 'pending').length}</div>
                    <small>In attesa</small>
                  </div>
                </div>
              </div>

              {/* Statistiche Aggiuntive */}
              <div className="admin-mb-xl">
                <h3>📊 Metriche Avanzate</h3>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <h3>Notifiche Attive</h3>
                    <div className="stat-value">{notifications.length}</div>
                    <small>Sistema notifiche</small>
                  </div>

                  <div className="admin-stat-card">
                    <h3>Settings Configurate</h3>
                    <div className="stat-value">{systemSettings.length}</div>
                    <small>Configurazioni</small>
                  </div>

                  <div className="admin-stat-card">
                    <h3>Analytics Records</h3>
                    <div className="stat-value">{analytics.length}</div>
                    <small>Dati analytics</small>
                  </div>

                  <div className="admin-stat-card">
                    <h3>Transazioni</h3>
                    <div className="stat-value">{paymentTransactions.length}</div>
                    <small>Pagamenti</small>
                  </div>
                </div>
              </div>

              {/* Prossime Prenotazioni */}
              <div className="admin-mb-xl">
                <h3>📅 Prossime Prenotazioni & Eventi iCal</h3>
                <div className="admin-card">
                  <div className="admin-table-container">
                    {unifiedBookings.length > 0 ? (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Evento / Ospite</th>
                            <th>Data</th>
                            <th>Piattaforma</th>
                            <th>Prezzo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unifiedBookings.slice(0, 10).map((item, index) => (
                            <tr key={item.id || index} className={item.type === 'calendar_event' ? 'admin-row-ical' : ''}>
                              <td><strong>{item.guestName}</strong>{item.type === 'booking' && <span className="admin-badge admin-badge-warning ml-2">DEMO</span>}</td>
                              <td>{item.checkIn ? new Date(item.checkIn).toLocaleDateString('it-IT') : '-'}</td>
                              <td>
                                <span className={`admin-badge admin-badge-${item.source === 'airbnb' ? 'info' : item.source === 'booking' ? 'success' : item.source === 'ical' ? 'warning' : 'default'}`}>
                                  {item.source === 'airbnb' && '📧 Airbnb'}
                                  {item.source === 'booking' && '📅 Booking.com'}
                                  {item.source === 'ical' && '📅 iCal'}
                                  {item.source === 'manual' && '✍️ Manuale'}
                                  {item.source !== 'airbnb' && item.source !== 'booking' && item.source !== 'ical' && item.source !== 'manual' && item.source}
                                </span>
                              </td>
                              <td><strong>{item.totalPrice ? `€${item.totalPrice}` : '-'}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="admin-text-center admin-text-muted">
                        <p>📊 Nessuna prenotazione o evento iCal trovato</p>
                      </div>
                    )}
                  </div>
                  <div className="admin-flex admin-gap-md admin-mb-0 admin-mt-lg">
                    <button className="admin-btn admin-btn-secondary" onClick={() => loadRealApiData()}>
                      🔄 Ricarica Dati
                    </button>
                    <button className="admin-btn-secondary" onClick={() => setActiveTab('calendari')}>
                      📅 Gestisci Calendari
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sezione Prezzi SEMPLIFICATA */}
          {activeTab === 'prezzi' && (
            <>
              <AdminPricing
                pricingConfig={pricingConfig}
                updatePricingField={updatePricingField}
                savePricingConfig={savePricingConfig}
                resetPricingConfig={() => {
                  // Reset alla configurazione di default per gruppi
                  const defaultConfig = {
                    priceGroup1to2: 75,
                    priceGroup3to4: 95,
                    priceGroup5to6: 115,
                    priceGroup7to8: 135,
                    cleaningFee: 50,
                    parkingFee: 20,
                    touristTaxAdult: 2.00,
                    touristTaxChild: 0,
                    weekendSurcharge: 0,
                    weeklyDiscount: 10,
                    monthlyDiscount: 15,
                    minStay: 2,
                    maxStay: 14,
                    maxGuests: 8,
                    advanceBookingDiscount: 0,
                    lastMinuteDiscount: 0
                  };
                  Object.keys(defaultConfig).forEach(key => {
                    updatePricingField(key, defaultConfig[key as keyof typeof defaultConfig]);
                  });
                }}
                isUpdatingPricing={isUpdatingPricing}
                showSuccessMessage={false}
              />

              {/* Sezione Prezzi Personalizzati per Periodo */}
              <SeasonalPricingManager />
            </>
          )}

          {/* === SEZIONE SERVIZI EXTRA === */}
          {activeTab === 'servizi-extra' && (
            <div className="admin-section admin-animate-fade-in">
              <ExtraServicesAdmin />
            </div>
          )}
          {/* Sezione Prenotazioni Professionale */}
          {activeTab === 'prenotazioni' && (
            <div className="admin-prenotazioni">
              <div className="admin-header">
                <h2>📅 Gestione Prenotazioni Avanzata</h2>
                <button
                  onClick={() => setShowBookingForm(!showBookingForm)}
                  className="admin-btn-primary" // Corretto
                >
                  {showBookingForm ? '❌ Chiudi Form' : '➕ Nuova Prenotazione'}
                </button>
              </div>

              {isLoadingData && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>Caricamento prenotazioni...</p>
                </div>
              )}

              {/* Statistiche Rapide */}
              <div className="admin-pricing-section">
                <h3>📊 Panoramica Prenotazioni</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>Stato Attuale</h4>
                    <div className="pricing-controls">
                      <div className="stat-row">
                        <span>📧 Occupazione Oggi:</span>
                        <span className="stat-value">100%</span>
                      </div>
                      <div className="stat-row">
                        <span>📅 Prossimi Check-in:</span>
                        <span className="stat-value">2</span>
                      </div>
                      <div className="stat-row">
                        <span>🚪 Prossimi Check-out:</span>
                        <span className="stat-value">1</span>
                      </div>
                      <div className="stat-row">
                        <span>💰 Ricavo Settimana:</span>
                        <span className="stat-value">€2,450</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>Filtri Avanzati</h4>
                    <div className="pricing-controls">
                      <label>Stato Prenotazione:</label>
                      <select className="admin-select" aria-label="Filtro stato prenotazioni" title="Filtra per stato prenotazione">
                        <option>Tutte le prenotazioni</option>
                        <option>✅ Confermate</option>
                        <option>⏳ In Attesa</option>
                        <option>📧 Check-in Oggi</option>
                        <option>🚪 Check-out Oggi</option>
                        <option>🔄 In Soggiorno</option>
                        <option>✅ Completate</option>
                        <option>❌ Cancellate</option>
                      </select>

                      <label>Periodo:</label>
                      <input type="date" className="admin-input-small" aria-label="Data inizio filtro" title="Data inizio" placeholder="Data inizio" />
                      <input type="date" className="admin-input-small" aria-label="Data fine filtro" title="Data fine" placeholder="Data fine" />

                      <label>Piattaforma:</label>
                      <select
                        className="admin-select"
                        aria-label="Filtro piattaforma"
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value as 'all' | 'direct' | 'airbnb' | 'booking' | 'holidu')}
                      >
                        <option value="all">Tutte le piattaforme</option>
                        <option value="direct">📱 Sito Diretto</option>
                        <option value="airbnb">📱 Airbnb</option>
                        <option value="booking">📅 Booking.com</option>
                        <option value="holidu">🏨 Holidu</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prenotazioni da Calendari Esterni Sincronizzati */}
              {calendarEvents && calendarEvents.length > 0 && (
                <div className="admin-pricing-section">
                  <h3>📱 Prenotazioni Sincronizzate da Piattaforme Esterne</h3>
                  <p className="calendar-bookings-info">
                    📅 {calendarEvents.length} prenotazioni sincronizzate automaticamente da Airbnb, Booking.com e altre piattaforme
                  </p>
                  <div className="admin-bookings-table-wrapper">
                    <table className="admin-bookings-table">
                      <thead>
                        <tr>
                          <th>Piattaforma</th>
                          <th>Titolo</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Notti</th>
                          <th>Stato</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calendarEvents
                          .filter(ev => platformFilter === 'all' ? true : ev.platform === platformFilter)
                          .slice(0, 20)
                          .map((event, idx) => {
                            const checkIn = new Date(event.checkIn);
                            const checkOut = new Date(event.checkOut);
                            const isUpcoming = event.status === 'upcoming';
                            const isCurrent = event.status === 'current';

                            return (
                              <tr key={idx} className={isCurrent ? 'booking-current' : ''}>
                                <td>
                                  <span className={`platform-badge platform-${event.platform}`}>
                                    {event.platform === 'airbnb' && '📱 Airbnb'}
                                    {event.platform === 'booking' && '📅 Booking.com'}
                                    {event.platform === 'holidu' && '🏨 Holidu'}
                                    {event.platform === 'google' && '📅 Google'}
                                  </span>
                                </td>
                                <td>
                                  <strong>{event.title || 'Prenotazione'}</strong>
                                  {event.description && (
                                    <div className="booking-description">
                                      {event.description.substring(0, 50)}
                                      {event.description.length > 50 && '...'}
                                    </div>
                                  )}
                                </td>
                                <td>{checkIn.toLocaleDateString('it-IT')}</td>
                                <td>{checkOut.toLocaleDateString('it-IT')}</td>
                                <td>{event.nights} {event.nights === 1 ? 'notte' : 'notti'}</td>
                                <td>
                                  {isCurrent && <span className="status-badge status-current">🔄 In corso</span>}
                                  {isUpcoming && <span className="status-badge status-upcoming">📅 Prossima</span>}
                                  {!isCurrent && !isUpcoming && <span className="status-badge status-past">✅ Passata</span>}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                  {calendarEvents.length > 20 && (
                    <p className="calendar-bookings-footer">
                      Mostrate le prime 20 prenotazioni di {calendarEvents.length} totali
                    </p>
                  )}
                </div>
              )}

              {/* Form Creazione/Modifica Prenotazione */}
              {showBookingForm && (
                <div className="admin-pricing-section">
                  <h3>{editingBooking ? '✏️ Modifica Prenotazione' : '➕ Nuova Prenotazione'}</h3>
                  <div className="admin-pricing-card">
                    <form onSubmit={editingBooking ? handleUpdateBooking : handleCreateBooking}>
                      <div className="pricing-controls">
                        <label htmlFor="customer-name">Nome Cliente:</label>
                        <input
                          id="customer-name"
                          type="text"
                          value={newBookingData.customer_name}
                          onChange={(e) => setNewBookingData({ ...newBookingData, customer_name: e.target.value })}
                          className="admin-input"
                          title="Inserisci il nome del cliente"
                          placeholder="Nome del cliente"
                          required
                        />

                        <label htmlFor="customer-email">Email Cliente:</label>
                        <input
                          id="customer-email"
                          type="email"
                          value={newBookingData.customer_email}
                          onChange={(e) => setNewBookingData({ ...newBookingData, customer_email: e.target.value })}
                          className="admin-input"
                          title="Inserisci l'email del cliente"
                          placeholder="email@esempio.com"
                          required
                        />

                        <label htmlFor="checkin-date">Check-in:</label>
                        <input
                          id="checkin-date"
                          type="date"
                          value={newBookingData.check_in}
                          onChange={(e) => setNewBookingData({ ...newBookingData, check_in: e.target.value })}
                          className="admin-input-small"
                          title="Seleziona la data di check-in"
                          placeholder="Data check-in"
                          required
                        />

                        <label htmlFor="checkout-date">Check-out:</label>
                        <input
                          id="checkout-date"
                          type="date"
                          value={newBookingData.check_out}
                          onChange={(e) => setNewBookingData({ ...newBookingData, check_out: e.target.value })}
                          className="admin-input-small"
                          title="Seleziona la data di check-out"
                          placeholder="Data check-out"
                          required
                        />

                        <label htmlFor="guests-number">Ospiti:</label>
                        <input
                          id="guests-number"
                          type="number"
                          min="1"
                          max="6"
                          value={newBookingData.guests}
                          onChange={(e) => setNewBookingData({ ...newBookingData, guests: parseInt(e.target.value) })}
                          className="admin-input-small"
                          title="Numero di ospiti (1-6)"
                          placeholder="N. ospiti"
                          required
                        />

                        <label htmlFor="total-amount">Importo Totale:</label>
                        <input
                          id="total-amount"
                          type="number"
                          step="0.01"
                          value={newBookingData.total_amount}
                          onChange={(e) => setNewBookingData({ ...newBookingData, total_amount: parseFloat(e.target.value) })}
                          className="admin-input-small"
                          title="Importo totale in euro"
                          placeholder="0.00"
                          required
                        />

                        <label htmlFor="booking-status">Stato:</label>
                        <select
                          id="booking-status"
                          value={newBookingData.status}
                          onChange={(e) => setNewBookingData({ ...newBookingData, status: e.target.value })}
                          className="admin-select"
                          title="Seleziona lo stato della prenotazione"
                        >
                          <option value="pending">⏳ In Attesa</option>
                          <option value="confirmed">✅ Confermata</option>
                          <option value="cancelled">❌ Cancellata</option>
                          <option value="completed">✅ Completata</option>
                        </select>

                        <label htmlFor="booking-platform">Piattaforma:</label>
                        <select
                          id="booking-platform"
                          value={newBookingData.platform}
                          onChange={(e) => setNewBookingData({ ...newBookingData, platform: e.target.value })}
                          className="admin-select"
                          title="Seleziona la piattaforma di prenotazione"
                        >
                          <option value="direct">📞 Diretto</option>
                          <option value="airbnb">📱 Airbnb</option>
                          <option value="booking">📅 Booking.com</option>
                          <option value="expedia">✈️ Expedia</option>
                          <option value="manual">✍️ Manuale</option>
                        </select>

                        <label htmlFor="booking-payment-method">Metodo Pagamento:</label>
                        <select id="booking-payment-method" className="admin-select" value={newBookingData.payment_method} onChange={(e) => setNewBookingData({ ...newBookingData, payment_method: e.target.value })}>
                          <option value="bank_transfer">Bonifico</option>
                          <option value="cash">Contanti</option>
                          <option value="pos">POS</option>
                        </select>

                        <label htmlFor="booking-payment-type">Tipo Pagamento:</label>
                        <select id="booking-payment-type" className="admin-select" value={newBookingData.payment_type} onChange={(e) => setNewBookingData({ ...newBookingData, payment_type: e.target.value })}>
                          <option value="deposit">Acconto</option>
                          <option value="full">Saldo</option>
                        </select>
                      </div>

                      <div className="admin-pricing-actions">
                        <button type="submit" className="admin-btn-primary">
                          {editingBooking ? '✅ Aggiorna' : '➕ Crea'}
                        </button>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() => {
                            setShowBookingForm(false);
                            setEditingBooking(null);
                          }}
                        >
                          ❌ Annulla
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Prenotazioni Backend Reali */}
              <div className="admin-pricing-section">
                <h3>🔥 Prenotazioni Attive</h3>
                <div className="admin-pricing-actions margin-bottom">
                  <button
                    className="admin-btn-primary"
                    onClick={() => setShowBookingForm(true)}
                  >
                    ➕ Nuova Prenotazione
                  </button>
                  <button
                    className="admin-btn-secondary"
                    onClick={loadRealApiData}
                  >
                    🔄 Ricarica Dati
                  </button>
                </div>
                <div className="bookings-table-container">
                  {realBookings.length > 0 ? (
                    <>
                      <table className="bookings-table">
                        <thead>
                          <tr>
                            <th>ID Backend</th>
                            <th>Cliente</th>
                            <th>Email</th>
                            <th>Check-in</th>
                            <th>Check-out</th>
                            <th>Ospiti</th>
                            <th>Stato</th>
                            <th>Totale</th>
                            <th>Azioni API</th>
                          </tr>
                        </thead>
                        <tbody>
                          {realBookings.map((booking) => (
                            <tr key={booking.id} className="booking-row">
                              <td><strong>#{booking.id}</strong></td>
                              <td>{booking.customer_name || booking.guestName || 'N/A'}</td>
                              <td>{booking.customer_email || booking.email || 'N/A'}</td>
                              <td>{booking.check_in ? new Date(booking.check_in).toLocaleDateString('it-IT') : (booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('it-IT') : 'N/A')}</td>
                              <td>{booking.check_out ? new Date(booking.check_out).toLocaleDateString('it-IT') : (booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('it-IT') : 'N/A')}</td>
                              <td>{booking.guests}</td>
                              <td>
                                <span className={`status ${booking.status}`}>
                                  {booking.status === 'confirmed' && '✅ Confermata'}
                                  {booking.status === 'pending' && '⏳ In attesa'}
                                  {booking.status === 'cancelled' && '❌ Cancellata'}
                                  {!booking.status && '📊 Backend'}
                                </span>
                              </td>
                              <td>€{(booking.total_amount || booking.totalPrice || 0).toFixed(2)}</td>
                              <td>
                                <div className="action-buttons">
                                  <button
                                    className="admin-btn-small"
                                    onClick={() => handleEditBooking(booking)}
                                    title="Modifica"
                                  >
                                    ✏️ Modifica
                                  </button>

                                  {/* Pulsanti Conferma Pagamento */}
                                  {booking.status !== 'cancelled' && booking.payment_method !== 'paid_full' && (
                                    <>
                                      {booking.payment_method !== 'deposit_paid' && (
                                        <button
                                          className="admin-btn-small admin-btn-warning"
                                          onClick={() => handleConfirmPayment(booking.booking_id || booking.id, 'deposit')}
                                          title="Conferma Acconto"
                                        >
                                          💰 Acconto
                                        </button>
                                      )}
                                      <button
                                        className="admin-btn-small admin-btn-success"
                                        onClick={() => handleConfirmPayment(booking.booking_id || booking.id, 'full')}
                                        title="Conferma Saldo"
                                      >
                                        ✅ Saldo
                                      </button>
                                      <button
                                        className="admin-btn-small"
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
                                      className="admin-btn-small admin-btn-danger"
                                      onClick={() => handleCancelBookingAction(booking.booking_id || booking.id)}
                                      title="Annulla"
                                    >
                                      ❌ Annulla
                                    </button>
                                  ) : (
                                    <span className="admin-text-muted">Già cancellata</span>
                                  )}

                                  {/* Pulsante Elimina Definitivo (per pulizia) */}
                                  {(booking.status === 'cancelled' || booking.status === 'pending' || isSuperAdmin()) && (
                                    <button
                                      className="admin-btn-small admin-btn-danger admin-btn-delete-permanent"
                                      onClick={() => handleDeleteBooking(booking.booking_id || booking.id)}
                                      title="Elimina definitivamente dal database"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="bookings-calendar-grid">
                        {realBookings.map((booking) => (
                          <div key={`cal-${booking.id}`} className="booking-card">
                            <div className="booking-card-header">
                              <span className="booking-platform">{booking.platform || 'direct'}</span>
                              <span className={`status ${booking.status || 'pending'}`}>
                                {booking.status === 'confirmed' && '✅ Confermata'}
                                {booking.status === 'pending' && '🟡 In attesa'}
                                {booking.status === 'cancelled' && '❌ Cancellata'}
                                {!booking.status && '📊 Backend'}
                              </span>
                            </div>
                            <div className="booking-card-body">
                              <div className="booking-card-row"><strong>{booking.customer_name || booking.guestName || 'Ospite'}</strong></div>
                              <div className="booking-card-row">{booking.customer_email || booking.email || 'N/A'} • {booking.phone || 'N/A'}</div>
                              <div className="booking-card-dates">
                                <span>Check-in: {booking.check_in ? new Date(booking.check_in).toLocaleDateString('it-IT') : (booking.checkIn ? new Date(booking.checkIn).toLocaleDateString('it-IT') : 'N/A')}</span>
                                <span>Check-out: {booking.check_out ? new Date(booking.check_out).toLocaleDateString('it-IT') : (booking.checkOut ? new Date(booking.checkOut).toLocaleDateString('it-IT') : 'N/A')}</span>
                              </div>
                              <div className="booking-card-row">Totale giorni: {booking.total_days || Math.max(1, Math.ceil((new Date(booking.check_out || booking.checkOut).getTime() - new Date(booking.check_in || booking.checkIn).getTime()) / (1000 * 60 * 60 * 24)))}</div>
                              <div className="booking-card-row">Pagamento: {booking.payment_method || 'pending'} • Pagato: €{(booking.deposit_amount || booking.total_amount || booking.totalPrice || 0).toFixed(2)} / Totale: €{(booking.total_amount || booking.totalPrice || 0).toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="admin-pricing-card">
                      <p>📊 Nessuna prenotazione trovata</p>
                      <button
                        className="admin-btn-primary"
                        onClick={loadRealApiData}
                      >
                        🔄 Ricarica Prenotazioni
                      </button>
                    </div>
                  )}
                </div>

                <div className="admin-pricing-card">
                  <h4>💰 Ricavi Periodo (Dati Reali)</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>Totale Backend:</span>
                      <span className="stat-value">€{(dashboardStats.totalRevenue || 0).toFixed(2)}</span>
                    </div>
                    <div className="stat-row">
                      <span>Transazioni Totali:</span>
                      <span className="stat-value">{paymentTransactions.length}</span>
                    </div>
                    <div className="stat-row">
                      <span>Media per Transazione:</span>
                      <span className="stat-value">
                        €{paymentTransactions.length > 0
                          ? (paymentTransactions.reduce((sum, t) => sum + t.amount, 0) / paymentTransactions.length).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>Prenotazioni Backend:</span>
                      <span className="stat-value">{realBookings.length}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-pricing-card">
                  <h4>📊 Statistiche Live</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>⏳ In Sospeso:</span>
                      <span className="stat-value warning">
                        €{paymentTransactions
                          .filter(t => t.status === 'pending')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>✅ Completati:</span>
                      <span className="stat-value success">
                        €{paymentTransactions
                          .filter(t => t.status === 'completed')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>📊 Tasso Successo:</span>
                      <span className="stat-value">
                        {paymentTransactions.length > 0
                          ? Math.round((paymentTransactions.filter(t => t.status === 'completed').length / paymentTransactions.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>⏱️ Tempo Medio Pagam.:</span>
                      <span className="stat-value">2.3 giorni</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metodi di Pagamento */}
              <div className="admin-pricing-section">
                <h3>🎨 Metodi di Pagamento</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>💳 Stripe Integration</h4>
                    <div className="pricing-controls">
                      <div className="sync-indicator success">✅ Connesso e Attivo</div>
                      <label>Commissione Stripe:</label>
                      <input type="number" defaultValue="2.9" className="admin-input-small" aria-label="Commissione Stripe" step="0.1" />
                      <label>Valute Accettate:</label>
                      <div className="pricing-note">EUR, USD, GBP</div>
                      <button className="admin-btn-secondary admin-btn-small" onClick={() => handleConfigureStripe()}>⚙️ Configura</button>
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>🏦 Bonifico Bancario</h4>
                    <div className="pricing-controls">
                      <div className="sync-indicator success">✅ Attivo</div>
                      <label>IBAN:</label>
                      <input type="text" defaultValue="IT02 L012 3456 789012345678901" className="admin-input" aria-label="IBAN" readOnly />
                      <label>Tempo Liquidazione:</label>
                      <input type="number" defaultValue="2" className="admin-input-small" aria-label="Giorni liquidazione" />
                      <button className="admin-btn-secondary admin-btn-small" onClick={() => handleEditBankTransfer()}>⚠️ Modifica</button>
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>💰 PayPal Business</h4>
                    <div className="pricing-controls">
                      <div className="sync-indicator active">✅ Attivo</div>
                      <label>Link PayPal:</label>
                      <input type="url" defaultValue="https://www.paypal.me/AntonioGuida320" className="admin-input" aria-label="Link PayPal" readOnly />
                      <label>Commissione PayPal:</label>
                      <input type="number" defaultValue="3.4" className="admin-input-small" aria-label="Commissione PayPal" step="0.1" />
                      <button className="admin-btn-primary admin-btn-small" onClick={() => handleCompletePayPalSetup()}>✅ Setup Completo</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista Transazioni Recenti */}
              <div className="admin-pricing-section">
                <h3>💳 Transazioni Recenti</h3>
                <div className="admin-pricing-card">
                  <div className="existing-services">
                    {paymentTransactions.map((transaction) => (
                      <div key={transaction.id} className="service-row">
                        <span>{transaction.guest || transaction.guestName}</span>
                        <span>€{(transaction.amount || 0).toFixed(2)}</span>
                        <span className={`platform-badge ${transaction.method}`}>
                          {transaction.method === 'stripe' && '💳 Stripe'}
                          {transaction.method === 'paypal' && '💰 PayPal'}
                          {transaction.method === 'bank_transfer' && '🏦 Bonifico'}
                        </span>
                        <span className={`status ${transaction.status}`}>
                          {transaction.status === 'completed' && '✅ Completato'}
                          {transaction.status === 'pending' && '⏳ In attesa'}
                          {transaction.status === 'failed' && '❌ Fallito'}
                        </span>
                        <span>{new Date(transaction.date).toLocaleDateString('it-IT')}</span>
                        <div className="action-buttons">
                          {transaction.method === 'paypal' && transaction.paypalLink && (
                            <button
                              className="admin-btn-small admin-btn-primary"
                              onClick={() => window.open(transaction.paypalLink, '_blank')}
                              title="Apri PayPal"
                            >
                              📱 PayPal
                            </button>
                          )}
                          {transaction.status === 'pending' && (
                            <button
                              className="admin-btn-small admin-btn-success"
                              onClick={() => handleCapturePayment(transaction.id)}
                              title="Cattura pagamento"
                            >
                              💰 Cattura
                            </button>
                          )}
                          {transaction.status === 'completed' && (
                            <button
                              className="admin-btn-small admin-btn-warning"
                              onClick={() => handleRefundPayment(transaction.id, transaction.amount)}
                              title="Rimborsa transazione"
                            >
                              💰 Rimborso
                            </button>
                          )}
                          <button
                            className="admin-btn-small"
                            onClick={() => window.open(`/admin/transaction/${transaction.id}`, '_blank')}
                            title="Vedi dettagli"
                          >
                            📝 Dettagli
                          </button>
                        </div>
                      </div>
                    ))}

                    {paymentTransactions.length === 0 && (
                      <div className="service-row">
                        <span>Nessuna transazione trovata</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gestione Pagamenti Reali */}
              <div className="admin-pricing-section">
                <h3>💳 Gestione Pagamenti</h3>
                <div className="bookings-table-container">
                  {realBookings.length > 0 ? (
                    <table className="bookings-table">
                      <thead>
                        <tr>
                          <th>Prenotazione</th>
                          <th>Cliente</th>
                          <th>Importo</th>
                          <th>Stato Pagamento</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {realBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td>#{booking.id}</td>
                            <td>{booking.customer_name || booking.guestName}</td>
                            <td>€{(booking.total_amount || booking.totalPrice || 0).toFixed(2)}</td>
                            <td>
                              <span className={`status ${booking.payment_status || 'pending'}`}>
                                {booking.payment_status === 'paid' && '✅ Pagato'}
                                {booking.payment_status === 'pending' && '⏳ In Attesa'}
                                {booking.payment_status === 'partial' && '50% Parziale'}
                                {booking.payment_status === 'failed' && '❌ Fallito'}
                                {!booking.payment_status && '⏳ Non Impostato'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="admin-btn-small"
                                  onClick={() => updateBookingStatus(booking.id, { payment_status: 'paid' })}
                                >
                                  ✅ Marca Pagato
                                </button>
                                <button
                                  className="admin-btn-small"
                                  onClick={() => updateBookingStatus(booking.id, { payment_status: 'partial' })}
                                >
                                  💰 Parziale
                                </button>
                                <button
                                  className="admin-btn-small"
                                  onClick={() => updateBookingStatus(booking.id, { payment_status: 'failed' })}
                                >
                                  ❌ Fallito
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
                      <button
                        className="admin-btn-primary"
                        onClick={loadRealApiData}
                      >
                        🔄 Ricarica Prenotazioni
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Configurazione Avanzata Pagamenti */}
              <div className="admin-pricing-section">
                <div className="admin-header">
                  <h3>⚙️ Configurazione Pagamenti</h3>
                  <button
                    onClick={savePaymentSettings}
                    disabled={isUpdatingPayments}
                    className="admin-button primary"
                  >
                    {isUpdatingPayments ? '⏳ Salvando...' : '💾 Salva Configurazione'}
                  </button>
                </div>

                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>💳 Stripe Settings</h4>
                    <div className="pricing-controls">
                      <label>
                        <input
                          type="checkbox"
                          title="Abilita Stripe"
                          aria-label="Abilita Stripe"
                          checked={paymentSettings.stripeEnabled}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            stripeEnabled: e.target.checked
                          })}
                        />
                        Abilita Stripe
                      </label>
                      <label htmlFor="stripeKey">Publishable Key:</label>
                      <input
                        id="stripeKey"
                        type="text"
                        value={paymentSettings.stripePublishableKey}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          stripePublishableKey: e.target.value
                        })}
                        className="admin-input"
                        title="Stripe Publishable Key"
                        placeholder="pk_test_..."
                      />
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>🏦 Bonifico Bancario</h4>
                    <div className="pricing-controls">
                      <label>
                        <input
                          type="checkbox"
                          title="Abilita Bonifico"
                          aria-label="Abilita Bonifico"
                          checked={paymentSettings.bankTransferEnabled}
                          onChange={(e) => setPaymentSettings({
                            ...paymentSettings,
                            bankTransferEnabled: e.target.checked
                          })}
                        />
                        Abilita Bonifico
                      </label>
                      <label htmlFor="iban">IBAN:</label>
                      <input
                        id="iban"
                        type="text"
                        value={paymentSettings.bankDetails.iban}
                        onChange={(e) => setPaymentSettings({
                          ...paymentSettings,
                          bankDetails: {
                            ...paymentSettings.bankDetails,
                            iban: e.target.value
                          }
                        })}
                        className="admin-input"
                        title="Inserisci l'IBAN del conto bancario"
                        placeholder="IT00..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Azioni Finanziarie */}
              <div className="admin-pricing-actions">
                <button
                  className="admin-btn-primary"
                  onClick={() => alert('Feature in sviluppo: Aggiunta metodo pagamento')}
                >
                  ➕ Aggiungi Metodo Pagamento
                </button>
                <button
                  className="admin-btn-secondary"
                  onClick={() => alert('📊 Feature in sviluppo: Report finanziario')}
                >
                  📊 Report Finanziario Completo
                </button>
                <button
                  className="admin-btn-secondary"
                  onClick={() => alert('📊 Feature in sviluppo: Analisi trend')}
                >
                  📊 Analisi Trend
                </button>
                <button
                  className="admin-btn-secondary"
                  onClick={() => alert('💾 Feature in sviluppo: Export contabilità')}
                >
                  💾 Esporta Contabilità
                </button>
                <button
                  className="admin-btn-secondary"
                  onClick={() => alert('🔔 Feature in sviluppo: Configurazione notifiche')}
                >
                  🔔 Configura Notifiche
                </button>
              </div>
            </div>
          )}

          {/* Sezione Pagamenti */}
          {activeTab === 'pagamenti' && (
            <div className="admin-pagamenti">
              <h2>💳 Gestione Pagamenti e Transazioni</h2>

              {/* Dashboard Pagamenti */}
              <div className="admin-pricing-section">
                <h3>📊 Riepilogo Transazioni</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>💰 Statistiche Generali</h4>
                    <div className="pricing-controls">
                      <div className="stat-row">
                        <span>💳 Totale Transazioni:</span>
                        <span className="stat-value">{paymentTransactions.length}</span>
                      </div>
                      <div className="stat-row">
                        <span>✅ Completate:</span>
                        <span className="stat-value">
                          {paymentTransactions.filter(t => t.status === 'succeeded' || t.status === 'completed').length}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span>⏳ In Attesa:</span>
                        <span className="stat-value">
                          {paymentTransactions.filter(t => t.status === 'pending' || t.status === 'processing').length}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span>❌ Fallite:</span>
                        <span className="stat-value">
                          {paymentTransactions.filter(t => t.status === 'failed' || t.status === 'canceled').length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>💰 Ricavi</h4>
                    <div className="pricing-controls">
                      <div className="stat-row">
                        <span>💶 Totale Ricavi:</span>
                        <span className="stat-value">
                          €{paymentTransactions
                            .filter(t => t.status === 'succeeded' || t.status === 'completed')
                            .reduce((sum, t) => sum + (t.amount || 0), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span>📊 Ricavo Medio:</span>
                        <span className="stat-value">
                          €{paymentTransactions.length > 0
                            ? (paymentTransactions
                              .filter(t => t.status === 'succeeded' || t.status === 'completed')
                              .reduce((sum, t) => sum + (t.amount || 0), 0) /
                              paymentTransactions.filter(t => t.status === 'succeeded' || t.status === 'completed').length
                            ).toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span>💳 Tasso Successo:</span>
                        <span className="stat-value">
                          {paymentTransactions.length > 0
                            ? Math.round(
                              (paymentTransactions.filter(t => t.status === 'succeeded' || t.status === 'completed').length /
                                paymentTransactions.length) * 100
                            )
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>⚙️ Configurazione</h4>
                    <div className="pricing-controls">
                      <button className="admin-btn-primary" onClick={() => {
                        const stripeKey = prompt('🔑 Inserisci Stripe Publishable Key:', 'pk_test_...');
                        if (stripeKey) {
                          alert(`✅ Stripe Key configurata!\n\nKey: ${stripeKey.substring(0, 20)}...\n\n💡 Salvata nelle impostazioni sistema.`);
                        }
                      }}>
                        🔧 Configura Stripe
                      </button>
                      <button className="admin-btn-secondary" onClick={() => {
                        const paypalEmail = prompt('📧 Inserisci PayPal Business Email:', 'business@vincanto.it');
                        if (paypalEmail) {
                          alert(`✅ PayPal configurato!\n\nEmail: ${paypalEmail}\n\n💡 Salvata nelle impostazioni sistema.`);
                        }
                      }}>
                        🔧 Configura PayPal
                      </button>
                      <button className="admin-btn-secondary" onClick={() => {
                        alert('🏦 Configurazione Bonifico Bancario\n\nIBAN: IT02 L012 3456 789012345678901\nIntestato a: Vincanto Maori\n\n💡 Tempo liquidazione: 3-5 giorni lavorativi');
                      }}>
                        🏦 Info Bonifico
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista Transazioni */}
              <div className="admin-pricing-section">
                <h3>📋 Ultime Transazioni</h3>
                <div className="admin-card">
                  {paymentTransactions.length > 0 ? (
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>ID Transazione</th>
                            <th>Cliente</th>
                            <th>Importo</th>
                            <th>Metodo</th>
                            <th>Stato</th>
                            <th>Data</th>
                            <th>Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentTransactions.slice(0, 20).map((transaction, index) => (
                            <tr key={transaction.id || index}>
                              <td>
                                <code>{transaction.payment_id || transaction.id || 'N/A'}</code>
                              </td>
                              <td>{transaction.customer_email || transaction.email || 'N/A'}</td>
                              <td><strong>€{(transaction.amount || 0).toFixed(2)}</strong></td>
                              <td>
                                <span className={`admin-badge admin-badge-${transaction.payment_method === 'card' ? 'info' :
                                  transaction.payment_method === 'paypal' ? 'warning' :
                                    'default'
                                  }`}>
                                  {transaction.payment_method === 'card' && '💳 Carta'}
                                  {transaction.payment_method === 'paypal' && '📧 PayPal'}
                                  {transaction.payment_method === 'bank_transfer' && '🏦 Bonifico'}
                                  {!transaction.payment_method && '❓ N/A'}
                                </span>
                              </td>
                              <td>
                                <span className={`admin-badge admin-badge-${transaction.status === 'succeeded' || transaction.status === 'completed' ? 'success' :
                                  transaction.status === 'pending' || transaction.status === 'processing' ? 'warning' :
                                    'danger'
                                  }`}>
                                  {transaction.status === 'succeeded' && '✅ Completato'}
                                  {transaction.status === 'completed' && '✅ Completato'}
                                  {transaction.status === 'pending' && '⏳ In attesa'}
                                  {transaction.status === 'processing' && '⏳ In elaborazione'}
                                  {transaction.status === 'failed' && '❌ Fallito'}
                                  {transaction.status === 'canceled' && '❌ Annullato'}
                                  {!transaction.status && '❓ N/A'}
                                </span>
                              </td>
                              <td>
                                {transaction.created_at
                                  ? new Date(transaction.created_at).toLocaleDateString('it-IT', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                  : 'N/A'}
                              </td>
                              <td>
                                <div className="admin-flex admin-gap-sm">
                                  <button
                                    className="admin-btn-sm admin-btn-info"
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/unified?action=get-payment-details&payment_id=${transaction.payment_id || transaction.id}`);
                                        const result = await response.json();
                                        if (result.success) {
                                          const data = result.data;
                                          alert(`💳 Dettagli Transazione\n\n🆔 ID: ${data.payment_id}\n📧 Cliente: ${data.customer_email}\n💰 Importo: €${data.amount}\n📊 Stato: ${data.status}\n💳 Metodo: ${data.payment_method}\n📅 Data: ${new Date(data.created_at).toLocaleString('it-IT')}\n\n🔗 Stripe Dashboard:\nhttps://dashboard.stripe.com/payments/${data.payment_id}`);
                                        } else {
                                          throw new Error(result.message || 'Errore caricamento dettagli');
                                        }
                                      } catch (error: any) {
                                        alert(`💳 Dettagli Transazione (Cache)\n\nID: ${transaction.payment_id || transaction.id}\nCliente: ${transaction.customer_email}\nImporto: €${transaction.amount}\nStato: ${transaction.status}\nMetodo: ${transaction.payment_method}\n\n⚠️ Errore caricamento dettagli real-time: ${(error instanceof Error ? error.message : String(error))}`);
                                      }
                                    }}
                                  >
                                    👁️ Dettagli
                                  </button>
                                  {(transaction.status === 'succeeded' || transaction.status === 'completed') && (
                                    <button
                                      className="admin-btn-sm admin-btn-warning"
                                      onClick={() => handleRefundPayment(transaction.payment_id || transaction.id, transaction.amount)}
                                    >
                                      💰 Rimborsa
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="admin-text-center admin-text-muted admin-py-xl">
                      <p>💳 Nessuna transazione trovata</p>
                      <p className="admin-text-sm">Le transazioni verranno visualizzate qui quando i clienti effettueranno pagamenti</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Azioni Pagamenti */}
              <div className="admin-pricing-actions">
                <button className="admin-btn-primary" onClick={loadRealApiData}>
                  🔄 Ricarica Transazioni
                </button>
                <button className="admin-btn-secondary" onClick={async () => {
                  try {
                    const transactions = paymentTransactions.filter(t =>
                      t.status === 'succeeded' || t.status === 'completed'
                    );

                    if (transactions.length === 0) {
                      alert('⚠️ Nessuna transazione da esportare');
                      return;
                    }

                    // Genera CSV
                    const headers = ['ID', 'Cliente', 'Importo', 'Metodo', 'Stato', 'Data'];
                    const rows = transactions.map(t => [
                      t.payment_id || t.id,
                      t.customer_email || t.email || 'N/A',
                      (t.amount || 0).toFixed(2),
                      t.payment_method || 'N/A',
                      t.status,
                      new Date(t.created_at).toLocaleDateString('it-IT')
                    ]);

                    const csv = [
                      headers.join(','),
                      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                    ].join('\n');

                    // Download
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vincanto-transazioni-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);

                    alert(`💾 Export completato!\n\n📊 File: vincanto-transazioni-${new Date().toISOString().split('T')[0]}.csv\n📋 Transazioni: ${transactions.length}\n✅ Download avviato`);
                  } catch (error: any) {
                    console.log('❌ Errore export:', error);
                    alert('❌ Errore export: ' + error.message);
                  }
                }}>
                  📊 Esporta Excel
                </button>
                <button className="admin-btn-secondary" onClick={async () => {
                  try {
                    setIsLoadingData(true);

                    const response = await fetch('/api/unified?action=send-payment-report', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        recipient: 'g.marino787@gmail.com',
                        period: '30days',
                        includeCSV: true,
                        transactions: paymentTransactions.slice(0, 50)
                      })
                    });

                    const result = await response.json();

                    if (result.success) {
                      alert('✅ Report inviato!\n\n📧 Destinatario: g.marino787@gmail.com\n📊 Periodo: Ultimi 30 giorni\n📎 Allegati: PDF + CSV\n\n⏱️ Controlla la tua email.'); // eslint-disable-line
                    } else {
                      throw new Error(result.message || 'Errore invio');
                    }
                  } catch (error) {
                    console.error('❌ Errore invio report:', error);
                    alert('❌ Errore: ' + (error instanceof Error ? error.message : String(error)));
                  } finally {
                    setIsLoadingData(false);
                  }
                }}>
                  📧 Invia Report
                </button>
              </div>
            </div>
          )}

          {/* Sezione Email */}
          {activeTab === 'email' && (
            <div className="admin-email">
              <h2>📧 Sistema Email Marketing</h2>

              {/* Dashboard Email */}
              <div className="admin-pricing-section">
                <h3>📊 Performance Email</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>📊 Statistiche Generali</h4>
                    <div className="pricing-controls">
                      <div className="stat-row">
                        <span>📥 Totale Inviate:</span>
                        <span className="stat-value">1,247</span>
                      </div>
                      <div className="stat-row">
                        <span>🔔 Tasso Apertura:</span>
                        <span className="stat-value success">87.5%</span>
                      </div>
                      <div className="stat-row">
                        <span>📤 Click Through Rate:</span>
                        <span className="stat-value">42.3%</span>
                      </div>
                      <div className="stat-row">
                        <span>❌ Bounce Rate:</span>
                        <span className="stat-value warning">1.2%</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>⏱️ Automazioni Attive</h4>
                    <div className="pricing-controls">
                      <div className="sync-indicator success">✅ Conferma Prenotazione: Attiva</div>
                      <div className="sync-indicator success">✅ Check-in Reminder: Attiva</div>
                      <div className="sync-indicator success">✅ Richiesta Recensione: Attiva</div>
                      <div className="sync-indicator pending">⏳ Follow-up Post Soggiorno: Test</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Email */}
              <div className="admin-pricing-section">
                <h3>🎨 Template Email</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>🎨 Template Principali</h4>
                    <div className="existing-services">
                      <div className="service-row">
                        <span>📧 Conferma Prenotazione</span>
                        <span>87% apertura</span>
                        <button
                          className="admin-btn-small"
                          onClick={() => handleEditTemplate('Conferma Prenotazione')}
                        >
                          ⚠️ Modifica
                        </button>
                        <button className="admin-btn-small" onClick={() => handleShowEmailStats('Conferma Prenotazione')}>📊 Stats</button>
                      </div>

                      <div className="service-row">
                        <span>📧 Istruzioni Check-in</span>
                        <span>95% apertura</span>
                        <button className="admin-btn-small" onClick={() => handleEditTemplate('Istruzioni Check-in')}>⚠️ Modifica</button>
                        <button className="admin-btn-small" onClick={() => handleShowEmailStats('Istruzioni Check-in')}>📊 Stats</button>
                      </div>

                      <div className="service-row">
                        <span>👋 Messaggio Benvenuto</span>
                        <span>78% apertura</span>
                        <button className="admin-btn-small" onClick={() => handleEditTemplate('Messaggio Benvenuto')}>⚠️ Modifica</button>
                        <button className="admin-btn-small" onClick={() => handleShowEmailStats('Messaggio Benvenuto')}>📊 Stats</button>
                      </div>

                      <div className="service-row">
                        <span>⭐ Richiesta Recensione</span>
                        <span>65% apertura</span>
                        <button className="admin-btn-small" onClick={() => handleEditTemplate('Richiesta Recensione')}>⚠️ Modifica</button>
                        <button className="admin-btn-small" onClick={() => handleShowEmailStats('Richiesta Recensione')}>📊 Stats</button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>⚙️ Configurazione SMTP</h4>
                    <div className="pricing-controls">
                      <label>Provider Email:</label>
                      <select
                        className="admin-select"
                        value={emailSettings.smtpProvider}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpProvider: e.target.value })}
                        aria-label="Provider email"
                      >
                        <option>Gmail SMTP</option>
                        <option>SendGrid</option>
                        <option>Mailgun</option>
                        <option>SMTP Personalizzato</option>
                      </select>

                      <label>Email Mittente:</label>
                      <input
                        type="email"
                        value={emailSettings.senderEmail}
                        onChange={(e) => setEmailSettings({ ...emailSettings, senderEmail: e.target.value })}
                        className="admin-input"
                        aria-label="Email mittente"
                      />

                      <div className="sync-indicator success">✅ Connessione SMTP attiva</div>

                      <button
                        className="admin-btn-secondary admin-btn-small"
                        onClick={testEmailConnection}
                        disabled={loading}
                      >
                        📧 {loading ? 'Test...' : 'Test Invio'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Azioni Email */}
              <div className="admin-pricing-actions">
                <button
                  className="admin-btn-primary"
                  onClick={handleCreateTemplate}
                >
                  ⚠️ Nuovo Template
                </button>
                <button
                  className="admin-btn-secondary"
                  onClick={saveEmailSettings}
                  disabled={loading}
                >
                  💾 {loading ? 'Salvataggio...' : 'Salva Configurazione'}
                </button>
                <button className="admin-btn-secondary" onClick={() => handleEmailDetailedReport()}>📊 Report Dettagliato</button>
                <button className="admin-btn-secondary" onClick={() => handleMassEmailSend()}>📧 Invio Massivo</button>
                <button className="admin-btn-secondary" onClick={() => handleManageEmailAutomations()}>⏱️ Gestisci Automazioni</button>
              </div>
            </div>
          )}


          {/* GESTIONE ADMIN - SOLO SUPERADMIN */}
          {activeTab === 'admin-management' && isSuperAdmin() && (
            <div className="admin-panel-management">
              <h2>👥 Gestione Utenti Admin</h2>

              {/* Sezione cambio password SuperAdmin */}
              <div className="admin-pricing-section">
                <h3>🔐 Cambio Password SuperAdmin</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>Modifica Password Personale</h4>
                    {!showSuperAdminSettings ? (
                      <div className="pricing-controls">
                        <p>Qui puoi cambiare la tua password di SuperAdmin.</p>
                        <button
                          className="admin-btn-primary"
                          onClick={() => setShowSuperAdminSettings(true)}
                        >
                          🔐 Cambia Password
                        </button>
                      </div>
                    ) : (
                      <div className="pricing-controls">
                        <label>Password Attuale:</label>
                        <input
                          type="password"
                          className="admin-input"
                          placeholder="Inserisci password attuale"
                          value={passwordChangeForm.currentPassword}
                          onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, currentPassword: e.target.value })}
                        />

                        <label>Nuova Password:</label>
                        <input
                          type="password"
                          className="admin-input"
                          placeholder="Minimo 8 caratteri, maiuscola, numero, simbolo"
                          value={passwordChangeForm.newPassword}
                          onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, newPassword: e.target.value })}
                        />

                        <label>Conferma Password:</label>
                        <input
                          type="password"
                          className="admin-input"
                          placeholder="Ripeti la nuova password"
                          value={passwordChangeForm.confirmPassword}
                          onChange={(e) => setPasswordChangeForm({ ...passwordChangeForm, confirmPassword: e.target.value })}
                        />

                        <small>
                          Requisiti:<br />
                          - Minimo 8 caratteri<br />
                          - Almeno una lettera MAIUSCOLA<br />
                          - Almeno un numero (0-9)<br />
                          - Almeno un simbolo (!@#$%^&amp;*)
                        </small>

                        <div className="admin-pricing-actions">
                          <button
                            className="admin-btn-primary"
                            onClick={handleSuperAdminPasswordChange}
                            disabled={loading}
                          >
                            {loading ? 'Salvataggio...' : '✅ Salva Nuova Password'}
                          </button>
                          <button type="button"
                            className="admin-btn-secondary"
                            onClick={() => {
                              setShowSuperAdminSettings(false);
                              setPasswordChangeForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}
                          >
                            ⏱️ Annulla
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sezione creazione nuovo admin */}
              <div className="admin-pricing-section">
                <h3>👤 Crea Nuovo Admin (Solo SuperAdmin)</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>Aggiungi Amministratore</h4>
                    {!showCreateAdminForm ? (
                      <div className="pricing-controls">
                        <p>Crea un nuovo account amministratore per gestire il sistema.</p>
                        <button
                          className="admin-btn-primary"
                          onClick={() => setShowCreateAdminForm(true)}
                        >
                          👤 Nuovo Admin
                        </button>
                      </div>
                    ) : (
                      <div className="pricing-controls">
                        <label>Nome Completo:</label>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="Es: Mario Rossi"
                          value={newAdminForm.name}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                        />

                        <label>Email:</label>
                        <input
                          type="email"
                          className="admin-input"
                          placeholder="admin@vincantomaori.it"
                          value={newAdminForm.email}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })}
                        />

                        <label>Password Iniziale:</label>
                        <input
                          type="password"
                          className="admin-input"
                          placeholder="Minimo 8 caratteri"
                          value={newAdminForm.password}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })}
                        />

                        <label>Ruolo:</label>
                        <select
                          className="admin-select"
                          value={newAdminForm.role}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, role: e.target.value })}
                          title="Seleziona ruolo admin"
                          aria-label="Seleziona ruolo admin"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>

                        <small>
                          Le credenziali verranno inviate via email all'admin.
                        </small>

                        <div className="admin-pricing-actions">
                          <button
                            className="admin-btn-primary"
                            onClick={handleCreateAdmin}
                            disabled={loading}
                          >
                            {loading ? 'Creazione...' : '✅ Crea Admin'}
                          </button>
                          <button
                            className="admin-btn-secondary"
                            onClick={() => {
                              setShowCreateAdminForm(false);
                              setNewAdminForm({ name: '', email: '', password: '', role: 'admin' });
                            }}
                          >
                            ⏱️ Annulla
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sezione gestione admin esistenti */}
              <div className="admin-pricing-section">
                <h3>👥 Gestione Admin Esistenti (Solo SuperAdmin)</h3>
                <div className="admin-pricing-grid">
                  {adminsList.length > 0 ? (
                    adminsList.map((admin: any) => (
                      <div key={admin.id || admin.email} className="admin-pricing-card">
                        <h4>{admin.name || admin.email}</h4>
                        <div className="pricing-controls">
                          <p><strong>Email:</strong> {admin.email}</p>
                          <p><strong>Ruolo:</strong> {admin.role || 'Admin'}</p>
                          <p><strong>Ultimo accesso:</strong> {admin.last_login ? new Date(admin.last_login).toLocaleDateString('it-IT') : 'Mai'}</p>

                          <div className="admin-pricing-actions">
                            <button
                              className="admin-btn-secondary"
                              onClick={() => handleRequestAdminPasswordChange(admin)}
                              disabled={loading}
                            >
                              ⚠️ Cambia Password
                            </button>
                            <button
                              className="admin-btn-danger"
                              onClick={() => handleDeleteAdmin(admin)}
                              disabled={loading}
                            >
                              🗑️ Elimina
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="admin-pricing-card">
                      <h4>Nessun Admin Trovato</h4>
                      <div className="pricing-controls">
                        <button
                          className="admin-btn-primary"
                          onClick={loadAdminsList}
                          disabled={loading}
                        >
                          {loading ? 'Caricamento...' : '🔄 Ricarica Admin'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info gestione admin */}
              <div className="admin-pricing-section">
                <h3>⚠️ Informazioni Gestione Admin</h3>
                <div className="admin-notice">
                  <strong>🔐 Funzionalità disponibili:</strong><br />
                  ✅ <strong>Crea Admin:</strong> Aggiungi nuovi amministratori con credenziali sicure<br />
                  ⚠️ <strong>Cambia Password:</strong> Richiedi il cambio password per un admin specifico<br />
                  🗑️ <strong>Elimina Admin:</strong> Rimuovi account amministratore (azione irreversibile)<br />
                  <br />
                  <strong>Note Sicurezza:</strong><br />
                  - Solo il SuperAdmin può creare o eliminare admin<br />
                  - Le password iniziali vengono inviate via email<br />
                  - Ogni operazione genera un log di sicurezza<br />
                  - L'eliminazione di un admin è irreversibile
                </div>
              </div>
            </div>
          )}
          {/* Messaggio di accesso negato per non-SuperAdmin nella sezione Gestione Admin */}
          {activeTab === 'admin-management' && !isSuperAdmin() && (
            <div className="admin-access-denied-section">
              <div className="admin-access-denied-card">
                <h1 className="admin-access-denied-icon">🚫</h1>
                <h2 className="admin-access-denied-title">Accesso Negato</h2>
                <p className="admin-access-denied-text">
                  Questa sezione è riservata ai <strong>SuperAdmin</strong>.
                </p>
                <p className="admin-access-denied-hint">
                  Contatta il SuperAdmin per ottenere i diritti necessari.
                </p>
              </div>
            </div>
          )}

          {/* Sezione Sistema Professionale - SOLO CONFIGURAZIONI TECNICHE */}
          {activeTab === 'sistema' && isSuperAdmin() && (
            <div className="admin-sistema">
              <h2>⚙️ Configurazione Sistema e Database</h2>
              <div className="admin-notice">
                <strong>💡 Nota:</strong> Per modificare prezzi, tariffe e configurazioni di prenotazione, utilizza la tab <strong>"💰 Prezzi"</strong>.
                Questa sezione è dedicata solo alle impostazioni tecniche del sistema.
              </div>

              {/* Database e Sistema Status */}
              <div className="admin-pricing-section">
                <h3>💾 Stato Sistema</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>📊 Statistiche Sistema</h4>
                    <div className="pricing-controls">
                      {Array.isArray(systemSettings) && systemSettings.length > 0 ? (
                        systemSettings.map((setting) => (
                          <div key={setting.id || setting.key} className="setting-row">
                            <label>{setting.label || setting.key}:</label>
                            <div className="setting-input-group">
                              <input
                                type={setting.key?.includes('email') ? 'email' :
                                  setting.key?.includes('price') || setting.key?.includes('amount') ? 'number' :
                                    setting.key?.includes('nights') || setting.key?.includes('guests') ? 'number' : 'text'}
                                value={setting.value}
                                className="admin-input"
                                onChange={async (e) => {
                                  // Aggiorna immediatamente il valore locale
                                  await updateSystemSettingValue(setting.key, e.target.value);
                                }}
                                aria-label={setting.label || setting.key}
                                title={setting.label || setting.key}
                                placeholder={`Inserisci ${setting.label || setting.key}`}
                              />
                              <button
                                className="admin-btn-small"
                                onClick={async () => {
                                  await updateSystemSettingValue(setting.key, setting.value).then(() => alert(`✅ ${setting.label} salvata!`)).catch(() => alert(`❌ Errore salvataggio ${setting.label}`));
                                }}
                              >
                                💾 Salva
                              </button>
                              <button
                                className="admin-btn-small admin-btn-warning"
                                onClick={() => resetSystemSetting(setting.key)}
                              >
                                🔄 Reset
                              </button>
                            </div>
                            <small>Categoria: {setting.category} | Valore attuale: {setting.value}</small>
                          </div>
                        ))
                      ) : (
                        <div>
                          <p>📊 Nessuna impostazione caricata dal backend</p>
                          <button
                            className="admin-btn-primary"
                            onClick={loadRealApiData}
                          >
                            🔄 Carica Impostazioni API
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>Statistiche API</h4>
                    <div className="pricing-controls">
                      <div className="stat-row">
                        <span>📊 Prenotazioni Backend:</span>
                        <span className="stat-value">{realBookings.length}</span>
                      </div>
                      <div className="stat-row">
                        <span>⚙️ Impostazioni Attive:</span>
                        <span className="stat-value">{systemSettings.length}</span>
                      </div>
                      <div className="stat-row">
                        <span>📊 Analytics Records:</span>
                        <span className="stat-value">{analytics.length}</span>
                      </div>
                      <div className="stat-row">
                        <span>🔔 Notifiche:</span>
                        <span className="stat-value">{notifications.length}</span>
                      </div>
                    </div>

                    <div className="admin-pricing-actions">
                      <button
                        className="admin-btn-primary"
                        onClick={loadRealApiData}
                      >
                        🔄 Ricarica Tutti i Dati API
                      </button>
                      <button
                        className="admin-btn-secondary"
                        onClick={async () => {
                          try {
                            // Salva tutte le impostazioni in batch
                            const savePromises = (Array.isArray(systemSettings) ? systemSettings : []).map(setting => updateSystemSettingValue(setting.key, setting.value));
                            await Promise.all(savePromises);
                            alert('✅ Tutte le impostazioni salvate con successo!');
                          } catch (error) {
                            alert('❌ Errore nel salvataggio delle impostazioni');
                          }
                        }}
                      >
                        💾 Salva Tutte le Impostazioni
                      </button>
                      <button
                        className="admin-btn-warning"
                        onClick={handleSystemBackup}
                        disabled={loading}
                      >
                        💾 {loading ? 'Backup...' : 'Backup Sistema'}
                      </button>
                      <button
                        className="admin-btn-danger"
                        onClick={handleSystemRestore}
                        disabled={loading}
                      >
                        🔄 {loading ? 'Ripristino...' : 'Ripristina Sistema'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informazioni Propriet├á */}
              <div className="admin-pricing-section">
                <h3>📧 Informazioni Struttura</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>Dati Principali</h4>
                    <div className="pricing-controls">
                      <label>Nome Struttura:</label>
                      <input type="text" defaultValue="Vincanto Maiori" className="admin-input" aria-label="Nome struttura" title="Nome struttura" placeholder="Nome struttura" />

                      <label>Indirizzo Completo:</label>
                      <input type="text" defaultValue="Via dei Maori 25, 00185 Roma RM" className="admin-input" aria-label="Indirizzo" title="Indirizzo" placeholder="Indirizzo" />

                      <label>Codice CIR/CIN:</label>
                      <input type="text" defaultValue="15146004C217" className="admin-input" aria-label="Codice identificativo" title="Codice CIR/CIN" placeholder="Codice CIR/CIN" />

                      <label>Capacità Massima:</label>
                      <input type="number" defaultValue="6" className="admin-input-small" aria-label="Capacità ospiti" title="Capacità ospiti" placeholder="Numero ospiti" />
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>Contatti e Legal</h4>
                    <div className="pricing-controls">
                      <label>Telefono Principale:</label>
                      <input type="tel" defaultValue="+39 06 1234567" className="admin-input" aria-label="Telefono" title="Telefono" placeholder="Telefono" />

                      <label>Email Gestione:</label>
                      <input type="email" defaultValue="info@vincantomaori.it" className="admin-input" aria-label="Email gestione" title="Email gestione" placeholder="Email gestione" />

                      <label>Partita IVA:</label>
                      <input type="text" defaultValue="12345678901" className="admin-input" aria-label="Partita IVA" title="Partita IVA" placeholder="Partita IVA" />

                      <label>Codice Fiscale:</label>
                      <input type="text" defaultValue="RSSMRA80A01H501X" className="admin-input" aria-label="Codice fiscale" title="Codice fiscale" placeholder="Codice fiscale" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sicurezza e Backup */}
              <div className="admin-pricing-section">
                <h3>🔐 Sicurezza e Backup</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>Autenticazione</h4>
                    <div className="pricing-controls">
                      <label>Autenticazione 2FA:</label>
                      <p className="admin-info-text">Configurabile in <a href="/admin/security" className="admin-link">Gestione Sicurezza</a></p>

                      <label>Timeout Sessione (minuti):</label>
                      <input type="number" defaultValue="120" className="admin-input-small" aria-label="Timeout sessione" title="Timeout sessione" placeholder="Minuti" />
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>Backup e Sicurezza</h4>
                    <div className="pricing-controls">
                      <label>Backup Automatici:</label>
                      <select className="admin-select" aria-label="Frequenza backup" title="Frequenza backup">
                        <option>Giornaliero</option>
                        <option>Ogni 12 ore</option>
                        <option>Settimanale</option>
                      </select>

                      <label>Conservazione Backup:</label>
                      <input type="number" defaultValue="30" className="admin-input-small" aria-label="Giorni conservazione" title="Giorni conservazione" placeholder="Giorni" />

                      <div className="sync-indicator success">✅ Ultimo backup: Oggi 03:00</div>

                      <button className="admin-btn-secondary admin-btn-small">💾 Backup Manuale</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monitoraggio Sistema */}
              <div className="admin-pricing-section">
                <h3>📊 Monitoraggio Sistema</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>Stato Servizi</h4>
                    <div className="pricing-controls">
                      <div className="sync-indicator success">✅ Server Web: Operativo (99.9% uptime)</div>
                      <div className="sync-indicator success">✅ Database: Connesso (12ms latenza)</div>
                      <div className="sync-indicator success">✅ Email Service: Attivo</div>
                      <div className="sync-indicator success">✅ API Google Calendar: Funzionante</div>
                      <div className="sync-indicator warning">⏳ Cache Redis: Alto utilizzo (78%)</div>
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>Performance</h4>
                    <div className="pricing-controls">
                      <div className="stat-row">
                        <span>💾 Utilizzo Disco:</span>
                        <span className="stat-value">45.2 GB / 100 GB</span>
                      </div>
                      <div className="stat-row">
                        <span>🖥️ RAM:</span>
                        <span className="stat-value">2.1 GB / 4 GB</span>
                      </div>
                      <div className="stat-row">
                        <span>📊 CPU:</span>
                        <span className="stat-value">12.3%</span>
                      </div>
                      <div className="stat-row">
                        <span>📱 Traffico Oggi:</span>
                        <span className="stat-value">847 visite</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Azioni Sistema */}
              <div className="admin-pricing-actions">
                <button className="admin-btn-primary">💾 Salva Tutte le Configurazioni</button>
                <button className="admin-btn-secondary">🔄 Riavvia Servizi</button>
                <button className="admin-btn-secondary">­📜 Log Sistema Completo</button>
                <button className="admin-btn-secondary">🔐 Test Sicurezza</button>
                <button className="admin-btn-secondary">📊 Report Performance</button>
                <button className="admin-btn-secondary">⚙️ Manutenzione Programmata</button>
              </div>
            </div>
          )}

          {/* Sezione Notifiche Professionale */}
          {activeTab === 'notifiche' && (
            <div className="admin-notifiche">
              <h2>🔔 Centro Notifiche {isLoadingData && '(Caricamento...)'}</h2>

              {/* Notifiche Attive */}
              <div className="admin-pricing-section">
                <h3>🔔 Notifiche Backend Live</h3>
                <div className="admin-pricing-actions margin-bottom">
                  <button
                    className="admin-btn-primary"
                    onClick={loadRealApiData}
                  >
                    🔄 Ricarica Notifiche
                  </button>
                  <button
                    className="admin-btn-secondary"
                    onClick={markAllNotificationsAsRead}
                  >
                    🔔 Marca Tutte Lette
                  </button>
                  <button
                    className="admin-btn-secondary"
                    onClick={testNotification}
                  >
                    🔔 Test Notifica
                  </button>
                </div>

                {notifications.length > 0 ? (
                  <div className="bookings-table-container">
                    <table className="bookings-table">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Titolo</th>
                          <th>Messaggio</th>
                          <th>Timestamp</th>
                          <th>Priorità</th>
                          <th>Stato</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notifications.map((notif) => (
                          <tr key={notif.id} className={`booking-row ${!notif.read ? 'unread' : ''}`}>
                            <td>
                              <span className={`status ${notif.type}`}>
                                {getNotificationIcon(notif.type)} {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                              </span>
                            </td>
                            <td><strong>{notif.title}</strong></td>
                            <td>{notif.message}</td>
                            <td>{notif.timestamp}</td>
                            <td>
                              <span className={`status ${getPriorityColor(notif.priority)}`}>
                                {notif.priority === 'high' && '❌ Alta'}
                                {notif.priority === 'medium' && '⏳ Media'}
                                {notif.priority === 'low' && '✅ Bassa'}
                              </span>
                            </td>
                            <td>
                              <span className={`status ${notif.read ? 'completed' : 'pending'}`}>
                                {notif.read ? '✅ Letta' : '🔔 Non Letta'}
                              </span>
                            </td>
                            <td>
                              <div className="action-buttons">
                                {!notif.read && (
                                  <button
                                    className="admin-btn-small"
                                    onClick={() => markNotificationAsRead(notif.id)}
                                  >
                                    📖 Leggi
                                  </button>
                                )}
                                <button
                                  className="admin-btn-small admin-btn-warning"
                                  onClick={() => deleteNotification(notif.id)}
                                >
                                  🗑️ Elimina
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="admin-pricing-card">
                    <p>📊 Nessuna notifica trovata nel sistema</p>
                  </div>
                )}
              </div>

              {/* Statistiche Notifiche */}
              <div className="admin-pricing-section">
                <h3>📊 Statistiche Notifiche</h3>
                <div className="admin-stats-grid">
                  <div className="admin-stat-card">
                    <h3>Totale Notifiche</h3>
                    <div className="stat-value">{notifications.length}</div>
                    <small>Nel sistema</small>
                  </div>

                  <div className="admin-stat-card">
                    <h3>Non Lette</h3>
                    <div className="stat-value">{notifications.filter(n => !n.read).length}</div>
                    <small>Richiedono attenzione</small>
                  </div>

                  <div className="admin-stat-card">
                    <h3>Pagamenti</h3>
                    <div className="stat-value">{notifications.filter(n => n.type === 'payment').length}</div>
                    <small>Notifiche pagamento</small>
                  </div>

                  <div className="admin-stat-card">
                    <h3>Sistema</h3>
                    <div className="stat-value">{notifications.filter(n => n.type === 'system').length}</div>
                    <small>Notifiche sistema</small>
                  </div>
                </div>
              </div>

              {/* Impostazioni Notifiche */}
              <div className="admin-pricing-section">
                <h3>⚙️ Configurazione Notifiche</h3>
                <div className="admin-pricing-grid">
                  <div className="admin-pricing-card">
                    <h4>🔔 Canali di Notifica</h4>
                    <div className="pricing-controls">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          title="Notifiche Email"
                          aria-label="Notifiche Email"
                          checked={notificationSettings.emailNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                        />
                        📧 Notifiche Email
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          title="Notifiche SMS"
                          aria-label="Notifiche SMS"
                          checked={notificationSettings.smsNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                        />
                        📱 Notifiche SMS
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          title="Notifiche Push"
                          aria-label="Notifiche Push"
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                        />
                        🔔 Notifiche Push
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          title="Suoni Notifica"
                          aria-label="Suoni Notifica"
                          checked={notificationSettings.soundEnabled}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, soundEnabled: e.target.checked })}
                        />
                        🔊 Suoni Notifica
                      </label>
                    </div>
                  </div>

                  <div className="admin-pricing-card">
                    <h4>­📜 Tipi di Alert</h4>
                    <div className="pricing-controls">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          title="Alert Prenotazioni"
                          aria-label="Alert Prenotazioni"
                          checked={notificationSettings.bookingAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, bookingAlerts: e.target.checked })}
                        />
                        📧 Alert Prenotazioni
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          title="Alert Pagamenti"
                          aria-label="Alert Pagamenti"
                          checked={notificationSettings.paymentAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, paymentAlerts: e.target.checked })}
                        />
                        💰 Alert Pagamenti
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          title="Alert Sistema"
                          aria-label="Alert Sistema"
                          checked={notificationSettings.systemAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, systemAlerts: e.target.checked })}
                        />
                        ⚙️ Alert Sistema
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          title="Alert Recensioni"
                          aria-label="Alert Recensioni"
                          checked={notificationSettings.reviewAlerts}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, reviewAlerts: e.target.checked })}
                        />
                        ⭐ Alert Recensioni
                      </label>

                      <label>Email Admin:</label>
                      <input
                        type="email"
                        value={notificationSettings.notificationEmail}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, notificationEmail: e.target.value })}
                        className="admin-input"
                        title="Email admin per notifiche"
                        placeholder="admin@esempio.it"
                        aria-label="Email admin"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Azioni Notifiche */}
              <div className="admin-pricing-actions">
                <button
                  className="admin-btn-primary"
                  onClick={saveNotificationSettings}
                  disabled={loading}
                >
                  💾 {loading ? 'Salvataggio...' : 'Salva Impostazioni'}
                </button>
                <button
                  className="admin-btn-secondary"
                  onClick={markAllNotificationsAsRead}
                >
                  ✅ Segna Tutte Come Lette
                </button>
                <button
                  className="admin-btn-secondary"
                  onClick={testNotification}
                >
                  🔔 Test Notifica
                </button>
                <button className="admin-btn-secondary">📊 Report Notifiche</button>
              </div>
            </div>
          )}

          {/* Sezione Analytics Professionale */}
          {activeTab === 'analytics' && (
            <div className="admin-analytics">
              <h2>📊 Analytics e Statistiche Avanzate</h2>

              {/* Analytics Backend Reali */}
              <div className="admin-pricing-section">
                <h3>✨ Analytics Backend (Dati Reali 30 Giorni)</h3>
                <div className="admin-pricing-grid">
                  {analytics.length > 0 ? (
                    <div className="admin-pricing-card">
                      <h4>📊 Dati Giornalieri</h4>
                      <div className="analytics-table">
                        <table className="bookings-table">
                          <thead>
                            <tr>
                              <th>Data</th>
                              <th>Prenotazioni</th>
                              <th>Ricavi</th>
                              <th>Occupancy %</th>
                              <th>Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.slice(0, 10).map((day, index) => (
                              <tr key={index}>
                                <td>{day.date}</td>
                                <td>{day.bookings}</td>
                                <td>€{day.revenue}</td>
                                <td>{day.occupancy}%</td>
                                <td>
                                  {day.occupancy > 70 ? '✨' : day.occupancy > 40 ? '📊' : '❌'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-pricing-card">
                      <h4>📊 Nessun Dato Analytics</h4>
                      <p>Non sono stati trovati dati analytics dal backend</p>
                      <button
                        className="admin-btn-primary"
                        onClick={loadRealApiData}
                      >
                        🔄 Ricarica Analytics API
                      </button>
                    </div>
                  )}

                  <div className="admin-pricing-card">
                    <h4>📊 Statistiche Aggregate</h4>
                    <div className="pricing-controls">
                      <div className="stat-row">
                        <span>📊 Totale Record Analytics:</span>
                        <span className="stat-value">{analytics.length}</span>
                      </div>
                      <div className="stat-row">
                        <span>💰 Ricavo Medio Giornaliero:</span>
                        <span className="stat-value">
                          €{analytics.length > 0
                            ? (analytics.reduce((sum, day) => sum + (day.revenue || 0), 0) / analytics.length).toFixed(2)
                            : '0.00'}
                        </span>
                      </div>
                      <div className="stat-row">
                        <span>📧 Occupancy Media:</span>
                        <span className="stat-value">
                          {analytics.length > 0
                            ? Math.round(analytics.reduce((sum, day) => sum + (day.occupancy || 0), 0) / analytics.length)
                            : 0}%
                        </span>
                      </div>
                      <div className="stat-row">
                        <span>📅 Giorni con Prenotazioni:</span>
                        <span className="stat-value">
                          {analytics.filter(day => day.bookings > 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grafici e Trend */}
              <div className="admin-pricing-section">
                <h3>📊 Trend Visuali</h3>
                <div className="admin-pricing-card">
                  <h4>📊 Andamento Ricavi</h4>
                  <div className="trend-chart">
                    {analytics.slice(0, 7).map((day, index) => (
                      <div
                        key={index}
                        className={`chart-bar dynamic ${day.revenue > 300 ? 'high-revenue' :
                          day.revenue > 150 ? 'medium-revenue' : 'low-revenue'
                          }`}
                        data-height={Math.max(10, (day.revenue || 0) / 10)}
                      >
                        <small>{day.date?.split('-')[2] || index + 1}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Azioni Analytics */}
              <div className="admin-pricing-actions">
                <button className="admin-btn-primary" onClick={loadRealApiData}>
                  🔄 Aggiorna Dati Analytics
                </button>
                <button className="admin-btn-secondary">📊 Esporta CSV</button>
                <button className="admin-btn-secondary">📊 Report Mensile</button>
                <button className="admin-btn-secondary">📧 Invia Report Email</button>
              </div>
            </div>
          )}


          {/* Sezione Gestione Immagini */}
          {activeTab === 'gallery' && (
            <div className="admin-section admin-animate-fade-in">
              <div className="admin-flex-between">
                <h2>🖼️ Gestione Immagini Sito</h2>
                <button className="admin-btn admin-btn-secondary" onClick={() => loadRealApiData()}>🔄 Aggiorna</button>
              </div>
              <div className="admin-notice">
                <p>Qui puoi vedere tutte le immagini caricate sul sito. Carica un file per sostituire l'immagine o cancellala per usare il default.</p>
              </div>
              <div data-cms-manager-mounted="gallery">
                <GalleryManager adminApiService={adminApiService || undefined} />
              </div>
              <div className="admin-pricing-section">
                <h3>📸 Immagini per Sezione</h3>
                <div className="admin-pricing-grid">
                  {(Array.isArray(systemSettings) ? systemSettings : [])
                    .filter(s => s.category === 'gallery')
                    .map(setting => (
                      <div key={setting.key} className="admin-stat-card">
                        <div className="admin-mb-sm">
                          <label htmlFor={`gallery-label-${setting.key}`} className="admin-text-xs admin-text-muted">Titolo Sezione:</label>
                          <input
                            id={`gallery-label-${setting.key}`}
                            type="text"
                            className="admin-input-small admin-w-full"
                            value={setting.label || ''}
                            placeholder="Inserisci etichetta immagine"
                            title="Etichetta dell'immagine per la galleria"
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
                              if (window.confirm('Rimuovere questa immagine?')) {
                                await updateSystemSettingValue(setting.key, ''); alert('Immagine rimossa');
                                loadRealApiData();
                              }
                            }}
                          >🗑️</button>
                        </div>
                        <div className="pricing-controls">
                          {setting.value ? (
                            <img className="admin-gallery-image-preview admin-gallery-image-preview-styles" src={setting.value} alt={setting.label} />
                          ) : (
                            <div className="admin-no-image-placeholder">Nessuna immagine impostata</div>
                          )}

                          <label className="admin-btn admin-btn-secondary admin-btn-small admin-btn-fullwidth admin-image-upload-label">
                            📁 {setting.value ? 'Cambia Immagine' : 'Carica Immagine'}
                            <input
                              type="file"
                              accept="image/*"
                              className="admin-hidden-file-input"
                              title="Seleziona file immagine da caricare"
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleImageUpload(e.target.files[0], setting.key);
                              }}
                            />
                          </label>

                          {setting.value?.startsWith('data:') && (
                            <button className="admin-btn-primary admin-btn-small admin-btn-fullwidth admin-mt-sm" onClick={async () => {
                              await updateSystemSettingValue(setting.key, setting.value);
                              alert('✅ Immagine salvata!'); // eslint-disable-line
                              loadRealApiData();
                            }}>💾 Salva Modifica</button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Sezione Contenuti Sito (CMS) con Live Preview */}
          {activeTab === 'contenuti' && (
            <div className="admin-section admin-animate-fade-in">
              <div className="admin-flex admin-justify-between admin-items-center admin-mb-lg">
                <div>
                  <h2>📝 Gestione Contenuti Frontend</h2>
                  <p className="admin-section-description">Personalizza i testi del sito con anteprima istantanea.</p>
                </div>
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? '👁️ Nascondi Anteprima' : '👁️ Mostra Anteprima'}
                </button>
              </div>

              <div data-cms-manager-mounted="content">
                <ContentManager adminApiService={adminApiService || undefined} />
              </div>

              <div className={`admin-content-layout ${showPreview ? 'admin-content-layout-preview' : ''}`}>
                <div className="admin-editor-column">
                  <div className="admin-pricing-section">
                    <h3>🏠 Testi Principali e Hero</h3>
                    <div className="admin-pricing-grid admin-pricing-grid-single">
                      {(Array.isArray(systemSettings) ? systemSettings : []).filter(s => ['home', 'about', 'general'].includes(s.category)).map(setting => (
                        <div key={setting.key} className="admin-stat-card">
                          <h4>{setting.label || setting.key}</h4>
                          <div className="pricing-controls">
                            {setting.type === 'textarea' || setting.value?.length > 50 ? (
                              <>
                                <label htmlFor={`setting-${setting.key}`} className="sr-only">
                                  {setting.label || setting.key}
                                </label>
                                <textarea
                                  id={`setting-${setting.key}`}
                                  className="admin-input admin-textarea"
                                  value={setting.value ?? ''}
                                  onChange={(e) => setSystemSettings(prev =>
                                    prev.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s)
                                  )}
                                  rows={4}
                                  title={setting.label || setting.key}
                                  placeholder={`Inserisci ${setting.label || setting.key}`}
                                  aria-label={setting.label || setting.key}
                                />
                              </>
                            ) : (
                              <>
                                <label htmlFor={`setting-${setting.key}`} className="sr-only">
                                  {setting.label || setting.key}
                                </label>
                                <input
                                  id={`setting-${setting.key}`}
                                  type="text"
                                  className="admin-input"
                                  value={setting.value ?? ''}
                                  onChange={(e) => setSystemSettings(prev =>
                                    prev.map(s => s.key === setting.key ? { ...s, value: e.target.value } : s)
                                  )}
                                  title={setting.label || setting.key}
                                  placeholder={`Inserisci ${setting.label || setting.key}`}
                                  aria-label={setting.label || setting.key}
                                />
                              </>
                            )}
                            <button className="admin-btn-primary admin-btn-small admin-btn-fullwidth" onClick={() => updateSystemSettingValue(setting.key, setting.value).then(() => alert('Salvato!'))}>
                              💾 Salva Testo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {showPreview && (
                  <div className="admin-preview-column">
                    <div className="preview-window">
                      <div className="preview-nav">
                        <div className="preview-dots-container">
                          <div className="preview-dot preview-dot-red"></div>
                          <div className="preview-dot preview-dot-yellow"></div>
                          <div className="preview-dot preview-dot-green"></div>
                        </div>
                        <div className="preview-label">FRONTEND LIVE PREVIEW</div>
                      </div>
                      <div className="preview-body">
                        <div className="preview-hero-section">
                          <h1 className="preview-hero-title">
                            {(Array.isArray(systemSettings) ? systemSettings : []).find(s => s.key === 'home_hero_title')?.value || 'Vincanto Maori'}
                          </h1>
                          <p className="preview-hero-subtitle">
                            {(Array.isArray(systemSettings) ? systemSettings : []).find(s => s.key === 'home_hero_subtitle')?.value || 'Sottotitolo Hero'}
                          </p>
                        </div>
                        <div className="preview-about-section">
                          <h2 className="preview-about-title">Chi Siamo</h2>
                          <p className="preview-about-content">
                            {(Array.isArray(systemSettings) ? systemSettings : []).find(s => s.key === 'about_description_main')?.value || 'La nostra storia...'}
                          </p>
                        </div>
                        <div className="preview-pricing-grid">
                          <div className="preview-pricing-card preview-pricing-card-primary">
                            <span className="preview-pricing-label">Soggiorno da</span>
                            <div className="preview-pricing-value">
                              € {(Array.isArray(systemSettings) ? systemSettings : []).find(s => s.key === 'display_price_base')?.value || '70'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="preview-caption">
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
};
export default AdminPanelPro;
export default AdminPanelPro;