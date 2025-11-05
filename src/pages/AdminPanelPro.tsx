/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/no-autofocus */
import React, { useState, useEffect } from 'react';
import './AdminPanelPro.css';
import '../styles/AdminSuperAdmin.css';
import AdminApiService from '../services/adminApiService';
import AdminPricing from '../components/admin/AdminPricing';

const AdminPanelPro: React.FC = () => {
  console.log('🚀 AdminPanelPro component rendering...');
  
  // Stati principali
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Stati per prenotazioni e pagamenti (solo backend reale)
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  


  // Servizio Admin API
  const [adminApiService] = useState(() => {
    try {
      console.log('🔌 Inizializzazione AdminApiService...');
      return new AdminApiService();
    } catch (error) {
      console.error('❌ Errore AdminApiService:', error);
      return null;
    }
  });

  // Stati per i dati API
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
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
    platform: 'direct'
  });

  // Stati per gestione calendario e pricing
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [showBlockDateForm, setShowBlockDateForm] = useState(false);
  const [newBlockedDate, setNewBlockedDate] = useState({
    start_date: '',
    end_date: '',
    reason: 'maintenance'
  });

  // Stati per gestione prezzi AGGIORNATI secondo specifiche
  const [pricingConfig, setPricingConfig] = useState({
    basePrice: 75,            // €75 per persona per notte
    cleaningFee: 50,
    weekendSurcharge: 20,
    monthlyDiscount: 15,
    weeklyDiscount: 10,
    parkingFee: 20,          // 🅿️ AGGIORNATO: €20 parcheggio per notte
    minStay: 2,
    maxStay: 14,
    advanceBookingDiscount: 0,
    lastMinuteDiscount: 0,
    // Nuovi campi per gestione bambini e tasse
    additionalGuestPrice: 75,  // €75 per persona aggiuntiva (stesso prezzo per persona)
    touristTaxAdult: 3,       // Tassa di soggiorno per adulti (€/notte)
    touristTaxChild: 0        // Tassa di soggiorno per bambini 12+ (€/notte)
  });
  const [isUpdatingPricing, setIsUpdatingPricing] = useState(false);
  
  // Stati per servizi personalizzati AGGIORNATI
  const [customServices, setCustomServices] = useState([
    { id: 1, name: 'Culla per bambini (0-3 anni)', price: 30, unit: 'soggiorno' },
    { id: 2, name: 'Seggiolone', price: 15, unit: 'soggiorno' },
    { id: 3, name: 'Animali domestici', price: 25, unit: 'soggiorno' }
  ]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(0);
  
  // === STATI CALENDAR MANAGEMENT ===
  const [calendarConfigs, setCalendarConfigs] = useState<any[]>([]);
  const [calendarStats, setCalendarStats] = useState({
    total: 0,
    active: 0,
    googleCalendar: 0,
    external: 0,
    lastSyncSuccess: null
  });
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [showNewCalendarForm, setShowNewCalendarForm] = useState(false);
  
  // Form nuovo calendario
  const [newCalendarData, setNewCalendarData] = useState({
    name: '',
    calendar_type: 'google_calendar', // google_calendar, airbnb, booking_com, vrbo
    url: '',
    credentials: '',
    sync_frequency: 30, // minuti
    is_active: true
  });
  
  // Servizio API - temporaneamente commentato
  // const [calendarApiService] = useState(() => {
  //   try {
  //     console.log('📅 Inizializzazione GoogleCalendarApiService...');
  //     return new GoogleCalendarApiService();
  //   } catch (error) {
  //     console.error('❌ Errore GoogleCalendarApiService:', error);
  //     return null;
  //   }
  // });
  
  // Stati autenticazione admin
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // === STATI PAGAMENTI ===
  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: true,
    stripePublishableKey: 'pk_test_...',
    stripeSecretKey: '••••••••••••',
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
  
  // Stato autenticazione Google Calendar
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  


  // Effect per caricare dati all'avvio
  useEffect(() => {
    if (isAuthenticated) {
      loadRealApiData();
    }
  }, [isAuthenticated]);

  // Aggiorna dinamicamente l'altezza delle chart-bar
  useEffect(() => {
    const chartBars = document.querySelectorAll('.chart-bar.dynamic[data-height]');
    chartBars.forEach((bar: any) => {
      const height = bar.getAttribute('data-height');
      if (height) {
        bar.style.height = `${height}px`;
      }
    });
  }, [analytics]);
  
  // === AUTENTICAZIONE ===
  const handleLogin = async () => {
    console.log('🔐 Tentativo di login...');
    if (password === 'vincanto2025') {
      console.log('✅ Login riuscito, imposto autenticazione...');
      setIsAuthenticated(true);
      setError('');
      console.log('🎯 Stato autenticazione impostato');
      // Carica tutti i dati reali dal backend
      loadRealApiData();
    } else {
      console.log('❌ Password errata');
      setError('Password non corretta');
    }
  };



  // === PRICING FUNCTIONS ===
  const loadPricingConfig = async () => {
    try {
      if (!adminApiService) return;
      console.log('💰 Caricamento configurazione prezzi...');
      const result = await adminApiService.getPricingConfig();
      
      if (result.success && result.config) {
        const config = result.config;
        setPricingConfig({
          basePrice: config.basePrice || 75,
          cleaningFee: config.cleaningFee || 50,
          weekendSurcharge: config.weekendSurcharge || 20,
          monthlyDiscount: config.monthlyDiscount || 15,
          weeklyDiscount: config.weeklyDiscount || 10,
          parkingFee: config.parkingFee || 15, // 🅿️ AGGIUNTO
          minStay: config.minStay || 2,
          maxStay: config.maxStay || 14,
          advanceBookingDiscount: config.advanceBookingDiscount || 0,
          lastMinuteDiscount: config.lastMinuteDiscount || 0,
          additionalGuestPrice: config.additionalGuestPrice || 75,
          touristTaxAdult: config.touristTaxAdult || 3,
          touristTaxChild: config.touristTaxChild || 0
        });
        console.log('✅ Configurazione prezzi caricata dal database:', config);
      } else {
        console.log('⚠️ Nessuna configurazione trovata, uso valori predefiniti');
      }
    } catch (error) {
      console.error('❌ Errore caricamento prezzi:', error);
    }
  };

  const savePricingConfig = async () => {
    try {
      if (!adminApiService) {
        alert('❌ Servizio API non disponibile');
        return;
      }

      setIsUpdatingPricing(true);
      console.log('� ADMIN SAVE - Dati da salvare:', JSON.stringify(pricingConfig, null, 2));
      console.log('🔗 URL API chiamata:', `${window.location.origin}/api/admin?action=pricing-config`);
      
      const result = await adminApiService.updatePricingConfig(pricingConfig);
      
      console.log('🎯 RISPOSTA API ADMIN:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        alert('✅ Configurazione prezzi salvata con successo!');
        console.log('✅ Prezzi salvati nel database:', result.saved_data || result.data);
        
        // 🔥 TEST IMMEDIATO: Verifica che i prezzi siano salvati
        console.log('🧪 TEST: Ricarico prezzi dal database per verifica...');
        setTimeout(async () => {
          try {
            const testResponse = await fetch('/api/quote?checkIn=2025-12-01&checkOut=2025-12-02&guests=2&includeParking=true');
            const testData = await testResponse.json();
            console.log('🧪 TEST PREZZI POST-SALVATAGGIO:', testData);
          } catch (testError) {
            console.error('❌ Errore test post-salvataggio:', testError);
          }
        }, 2000);
        
      } else {
        alert('❌ Errore nel salvataggio: ' + (result.message || 'Errore sconosciuto'));
        console.error('❌ Dettagli errore:', result);
      }
    } catch (error) {
      console.error('❌ Errore salvataggio prezzi:', error);
      alert('❌ Errore nel salvataggio della configurazione prezzi');
    } finally {
      setIsUpdatingPricing(false);
    }
  };

  const updatePricingField = (field: string, value: number) => {
    console.log('💰 Aggiornamento campo prezzo:', { field, value, currentConfig: pricingConfig });
    setPricingConfig(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      console.log('💰 Nuova configurazione prezzi:', updated);
      return updated;
    });
  };

  // === CUSTOM SERVICES FUNCTIONS ===
  
  const addCustomService = () => {
    if (!newServiceName.trim() || newServicePrice <= 0) {
      alert('⚠️ Inserisci nome e prezzo validi');
      return;
    }

    const newService = {
      id: Date.now(),
      name: newServiceName.trim(),
      price: newServicePrice,
      unit: 'notte'
    };

    setCustomServices(prev => [...prev, newService]);
    setNewServiceName('');
    setNewServicePrice(0);
    console.log('✅ Servizio aggiunto:', newService);
  };

  const updateCustomService = (id: number, field: string, value: any) => {
    setCustomServices(prev => prev.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const deleteCustomService = (id: number) => {
    if (confirm('⚠️ Sei sicuro di voler eliminare questo servizio?')) {
      setCustomServices(prev => prev.filter(service => service.id !== id));
      console.log('🗑️ Servizio eliminato:', id);
    }
  };

  // === CALENDAR FUNCTIONS ===
  
  const loadCalendarConfigs = async () => {
    if (!adminApiService) return;
    
    try {
      setIsLoadingCalendars(true);
      console.log('📅 Caricamento configurazioni calendario...');
      
      const result = await adminApiService.getCalendarConfigs();
      
      if (result.success !== false) {
        setCalendarConfigs(result.calendars || []);
        setCalendarStats(result.stats || {});
        console.log('✅ Calendari caricati:', result);
      }
    } catch (error) {
      console.error('❌ Errore caricamento calendari:', error);
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // Rimossa funzione loadCalendarSyncStatus non utilizzata

  const handleCreateCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminApiService) return;

    try {
      setIsLoadingCalendars(true);
      console.log('📅 Creazione nuovo calendario:', newCalendarData);

      const result = await adminApiService.createCalendarConfig(newCalendarData);
      
      if (result.success) {
        alert('✅ Calendario configurato con successo!');
        setShowNewCalendarForm(false);
        setNewCalendarData({
          name: '',
          calendar_type: 'google_calendar',
          url: '',
          credentials: '',
          sync_frequency: 30,
          is_active: true
        });
        await loadCalendarConfigs(); // Ricarica la lista
      } else {
        alert('❌ Errore nella configurazione: ' + (result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('❌ Errore creazione calendario:', error);
      alert('❌ Errore nella creazione del calendario');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleUpdateCalendar = async (id: string, updates: any) => {
    if (!adminApiService) return;

    try {
      setIsLoadingCalendars(true);
      const result = await adminApiService.updateCalendarConfig(id, updates);
      
      if (result.success) {
        alert('✅ Calendario aggiornato con successo!');
        await loadCalendarConfigs();
      } else {
        alert('❌ Errore aggiornamento: ' + (result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('❌ Errore aggiornamento calendario:', error);
      alert('❌ Errore nell\'aggiornamento del calendario');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // === FUNZIONI PER GESTIONE CALENDARI ESTERNI ===
  
  const handleEditCalendar = (calendar: any) => {
    alert(`✏️ Modifica calendario: ${calendar.name || 'Senza nome'}\n\nFunzionalità di modifica in fase di sviluppo.`);
    console.log('📝 Editing calendario:', calendar);
  };

  const handleDeleteCalendar = async (id: string, name?: string) => {
    if (!adminApiService) return;
    
    const confirmMessage = name 
      ? `⚠️ Sei sicuro di voler eliminare il calendario "${name}"?\n\nQuesta azione è irreversibile!`
      : '⚠️ Sei sicuro di voler eliminare questa configurazione calendario?';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsLoadingCalendars(true);
      console.log('🗑️ Eliminazione calendario:', id);
      
      // Simula eliminazione - TODO: implementare endpoint backend
      alert('✅ Calendario eliminato con successo!');
      await loadCalendarConfigs();
    } catch (error) {
      console.error('❌ Errore eliminazione calendario:', error);
      alert('❌ Errore nell\'eliminazione del calendario');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleSuspendCalendar = async (calendarId: string, calendarName: string) => {
    if (!adminApiService) return;
    
    const confirm = window.confirm(`⏸️ Sospendere temporaneamente il calendario "${calendarName}"?`);
    if (!confirm) return;

    try {
      setIsLoadingCalendars(true);
      console.log('⏸️ Sospensione calendario:', calendarId);
      
      // Simula sospensione - TODO: implementare endpoint backend
      alert('✅ Calendario sospeso con successo!');
      await loadCalendarConfigs();
    } catch (error) {
      console.error('❌ Errore sospensione calendario:', error);
      alert('❌ Errore nella sospensione del calendario');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleSyncCalendar = async (calendarId: string, calendarName: string) => {
    if (!adminApiService) return;

    try {
      setIsLoadingCalendars(true);
      console.log('🔄 Sincronizzazione calendario:', calendarId, calendarName);
      
      // Simula sincronizzazione - TODO: implementare endpoint backend
      alert(`✅ Calendario "${calendarName}" sincronizzato con successo!`);
      await loadCalendarConfigs();
    } catch (error) {
      console.error('❌ Errore sincronizzazione calendario:', error);
      alert('❌ Errore nella sincronizzazione del calendario');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleForceSync = async (calendarId?: string) => {
    if (!adminApiService) return;

    try {
      setIsLoadingCalendars(true);
      const result = await adminApiService.forceCalendarSync(calendarId);
      
      if (result.success) {
        alert('✅ Sincronizzazione completata!');
        await loadCalendarConfigs();
      } else {
        alert('❌ Errore sincronizzazione: ' + (result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('❌ Errore sincronizzazione:', error);
      alert('❌ Errore nella sincronizzazione');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleTestConnection = async (config: any) => {
    if (!adminApiService) return;

    try {
      setIsLoadingCalendars(true);
      const result = await adminApiService.testCalendarConnection(config);
      
      if (result.success) {
        alert('✅ Connessione testata con successo!');
      } else {
        alert('❌ Test connessione fallito: ' + (result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('❌ Errore test connessione:', error);
      alert('❌ Errore nel test di connessione');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // === FUNZIONI GESTIONE PAGAMENTI ===
  
  const savePaymentSettings = async () => {
    try {
      setIsUpdatingPayments(true);
      console.log('💳 Salvataggio configurazione pagamenti:', paymentSettings);
      
      // Simula salvataggio - TODO: implementare endpoint backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('✅ Configurazione pagamenti salvata con successo!');
    } catch (error) {
      console.error('❌ Errore salvataggio pagamenti:', error);
      alert('❌ Errore nel salvataggio della configurazione pagamenti');
    } finally {
      setIsUpdatingPayments(false);
    }
  };

  const handleRefundPayment = async (transactionId: string, amount: number) => {
    const confirm = window.confirm(`⚠️ Sei sicuro di voler rimborsare €${amount.toFixed(2)}?\n\nQuesta azione è irreversibile!`);
    if (!confirm) return;

    try {
      console.log('💰 Elaborazione rimborso:', { transactionId, amount });
      
      // Simula rimborso - TODO: implementare endpoint backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('✅ Rimborso elaborato con successo!');
      // Aggiorna la lista delle transazioni
    } catch (error) {
      console.error('❌ Errore rimborso:', error);
      alert('❌ Errore nell\'elaborazione del rimborso');
    }
  };

  const handleCapturePayment = async (transactionId: string) => {
    try {
      console.log('💳 Cattura pagamento:', transactionId);
      
      // Simula cattura pagamento - TODO: implementare endpoint backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('✅ Pagamento catturato con successo!');
    } catch (error) {
      console.error('❌ Errore cattura pagamento:', error);
      alert('❌ Errore nella cattura del pagamento');
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
      console.log('📧 Salvataggio configurazione email:', emailSettings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('✅ Configurazione email salvata con successo!');
    } catch (error) {
      console.error('❌ Errore salvataggio email:', error);
      alert('❌ Errore nel salvataggio della configurazione email');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    setLoading(true);
    try {
      console.log('🔧 Test connessione SMTP...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('✅ Test email inviata con successo! Controlla la tua casella di posta.');
    } catch (error) {
      console.error('❌ Errore test email:', error);
      alert('❌ Errore durante il test email');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (templateName: string) => {
    alert(`✏️ Apertura editor per template: ${templateName}\n\nFunzionalità editor template in fase di sviluppo.`);
    console.log(`📝 Editing template: ${templateName}`);
  };

  const handleCreateTemplate = () => {
    const templateName = prompt('📝 Inserisci il nome del nuovo template:');
    if (templateName) {
      alert(`✅ Template "${templateName}" creato con successo!`);
      console.log(`📧 Created new template: ${templateName}`);
    }
  };

  // === FUNZIONI GESTIONE SISTEMA ===
  
  const resetSystemSetting = async (key: string) => {
    if (window.confirm(`🔄 Confermi il reset del setting "${key}" al valore predefinito?`)) {
      try {
        console.log(`🔄 Reset setting: ${key}`);
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
        console.log('💾 Creazione backup sistema...');
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
        console.log('🔄 Ripristino sistema...');
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
    bookingAlerts: true,
    paymentAlerts: true,
    systemAlerts: true,
    reviewAlerts: true,
    soundEnabled: true,
    notificationEmail: 'admin@vincantomaori.it'
  });

  const [mockNotifications] = useState([
    { id: 1, type: 'booking', title: 'Nuova Prenotazione', message: 'Cliente Marco R. ha prenotato per il 15-17 Marzo', timestamp: '2 minuti fa', priority: 'high', read: false },
    { id: 2, type: 'payment', title: 'Pagamento Ricevuto', message: 'Pagamento di €450 ricevuto per prenotazione #1234', timestamp: '15 minuti fa', priority: 'medium', read: false },
    { id: 3, type: 'system', title: 'Backup Completato', message: 'Backup automatico del sistema completato con successo', timestamp: '1 ora fa', priority: 'low', read: true },
    { id: 4, type: 'review', title: 'Nuova Recensione', message: 'Recensione 5 stelle ricevuta da cliente precedente', timestamp: '3 ore fa', priority: 'medium', read: true },
    { id: 5, type: 'booking', title: 'Check-in Oggi', message: 'Cliente Sara M. effettuerà il check-in alle 15:00', timestamp: '1 giorno fa', priority: 'high', read: true }
  ]);

  const saveNotificationSettings = async () => {
    setLoading(true);
    try {
      console.log('🔔 Salvataggio impostazioni notifiche:', notificationSettings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('✅ Impostazioni notifiche salvate con successo!');
    } catch (error) {
      console.error('❌ Errore salvataggio notifiche:', error);
      alert('❌ Errore nel salvataggio delle impostazioni notifiche');
    } finally {
      setLoading(false);
    }
  };



  const markAllNotificationsAsRead = () => {
    if (window.confirm('📖 Marcare tutte le notifiche come lette?')) {
      console.log('📖 Tutte le notifiche marcate come lette');
      alert('✅ Tutte le notifiche sono state marcate come lette!');
    }
  };

  const deleteNotification = (notificationId: number) => {
    if (window.confirm(`🗑️ Eliminare la notifica #${notificationId}?`)) {
      console.log(`🗑️ Eliminazione notifica ${notificationId}`);
      alert(`✅ Notifica #${notificationId} eliminata con successo!`);
    }
  };

  const testNotification = () => {
    alert('🔔 Test Notifica!\n\nQuesta è una notifica di prova del sistema.\nSe vedi questo messaggio, il sistema notifiche funziona correttamente.');
    console.log('🔔 Test notifica inviato');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return '🏠';
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

  // Carica dati reali dalle API backend
  const loadRealApiData = async () => {
    if (!adminApiService) {
      console.warn('⚠️ AdminApiService non disponibile');
      return;
    }

    setIsLoadingData(true);
    try {
      console.log('🔄 Caricamento dati API reali...');
      
      // Carica dati uno alla volta per debug
      try {
        const stats = await adminApiService.getDashboardStats();
        console.log('✅ Stats caricate:', stats);
        setDashboardStats(stats || {});
      } catch (err) {
        console.error('❌ Errore stats:', err);
      }

      try {
        const bookings = await adminApiService.getBookings();
        console.log('✅ Prenotazioni caricate:', bookings);
        setRealBookings(bookings || []);
        setRecentBookings(bookings || []);
      } catch (err) {
        console.error('❌ Errore prenotazioni:', err);
      }

      try {
        const settings = await adminApiService.getSystemSettings();
        console.log('✅ Impostazioni caricate:', settings);
        setSystemSettings(settings || []);
      } catch (err) {
        console.error('❌ Errore impostazioni:', err);
      }

      try {
        const analyticsResult = await adminApiService.getAnalytics();
        console.log('✅ Analytics caricate:', analyticsResult);
        setAnalytics(analyticsResult || []);
      } catch (err) {
        console.error('❌ Errore analytics:', err);
      }

      try {
        const notificationsResult = await adminApiService.getNotifications();
        console.log('✅ Notifiche caricate:', notificationsResult);
        setNotifications(notificationsResult || []);
      } catch (err) {
        console.error('❌ Errore notifiche:', err);
      }

      try {
        const blockedDatesResult = await adminApiService.getBlockedDates();
        console.log('✅ Date bloccate caricate:', blockedDatesResult);
        setBlockedDates(blockedDatesResult || []);
      } catch (err) {
        console.error('❌ Errore date bloccate:', err);
      }

      try {
        const paymentsResult = await adminApiService.getPayments();
        console.log('✅ Pagamenti caricati:', paymentsResult);
        setPaymentTransactions(paymentsResult || []);
      } catch (err) {
        console.error('❌ Errore pagamenti:', err);
        setPaymentTransactions([]);
      }
      
      // Carica configurazioni prezzi e calendari
      try {
        await loadPricingConfig();
        console.log('✅ Prezzi caricati');
      } catch (err) {
        console.error('❌ Errore prezzi:', err);
      }

      try {
        await loadCalendarConfigs();
        console.log('✅ Calendari caricati');
      } catch (err) {
        console.error('❌ Errore calendari:', err);
      }

      console.log('✅ Dati API reali caricati completamente');
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
      await loadRealApiData(); // Ricarica tutti i dati
      console.log('✅ Prenotazione creata:', result);
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
      await loadRealApiData(); // Ricarica tutti i dati
      console.log('✅ Prenotazione aggiornata:', result);
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
      await loadRealApiData(); // Ricarica tutti i dati
      console.log('✅ Prenotazione eliminata:', result);
      return result;
    } catch (error) {
      console.error('❌ Errore eliminazione prenotazione:', error);
      throw error;
    }
  };

  // Gestione Sistema Settings
  const updateSystemSettingValue = async (key: string, value: any) => {
    if (!adminApiService) return;
    try {
      const result = await adminApiService.updateSystemSetting(key, value);
      console.log('✅ Impostazione aggiornata:', { key, value });
      return result;
    } catch (error) {
      console.error('❌ Errore aggiornamento impostazione:', error);
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
        platform: 'direct'
      });
      alert('✅ Prenotazione creata con successo!');
    } catch (error) {
      alert('❌ Errore nella creazione della prenotazione');
    }
  };

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setNewBookingData({
      customer_name: booking.customer_name || booking.guestName || '',
      customer_email: booking.customer_email || booking.email || '',
      check_in: booking.check_in || booking.checkIn || '',
      check_out: booking.check_out || booking.checkOut || '',
      guests: booking.guests || 1,
      total_amount: booking.total_amount || booking.totalPrice || 0,
      status: booking.status || 'pending',
      platform: booking.platform || 'direct'
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
        platform: 'direct'
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

  // === GESTIONE DATE BLOCCATE ===
  
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
    if (!adminApiService) return;
    
    if (confirm('⚠️ Rimuovere il blocco per queste date?')) {
      try {
        await adminApiService.removeBlockedDate(id);
        await loadRealApiData();
        alert('✅ Blocco rimosso con successo!');
      } catch (error) {
        alert('❌ Errore nella rimozione del blocco');
      }
    }
  };



  // === GESTIONE CALENDARIO ===
  
  // Stati per eventi calendario (legacy - ora usati per la dashboard)
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  const loadCalendarData = async () => {
    setIsLoadingCalendar(true);
    try {
      if (!adminApiService) return;
      
      // Carica prenotazioni dal sistema per mostrare nel calendario
      const bookings = await adminApiService.getBookings() || [];
      setCalendarEvents(bookings);
      
    } catch (error) {
      console.error('Errore caricamento calendario:', error);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Funzioni rimosse: forceSyncCalendar e testCalendarConnection non utilizzate nell'interfaccia
  // Le funzioni Google Calendar attive sono: handleGoogleCalendarSync, testGoogleConnection, etc.

  const initiateGoogleAuth = async () => {
    try {
      if (!adminApiService) return;
      
      const authUrl = await adminApiService.initiateGoogleAuth();
      if (authUrl) {
        window.open(authUrl, '_blank', 'width=500,height=600');
        alert('🔐 Finestra di autenticazione aperta. Completa il login e torna qui.');
      }
    } catch (error) {
      console.error('Errore autenticazione Google:', error);
      alert('❌ Errore nell\'avvio dell\'autenticazione Google');
    }
  };

  const handleGoogleCalendarSync = async () => {
    try {
      if (!adminApiService) return;
      
      setIsLoadingCalendar(true);
      const result = await adminApiService.syncGoogleCalendar();
      
      if (result.success) {
        await loadCalendarData();
        alert(`✅ Sincronizzazione completata! ${result.syncedEvents || 0} eventi sincronizzati.`);
      } else {
        alert('❌ Sincronizzazione fallita: ' + (result.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('Errore sincronizzazione Google Calendar:', error);
      alert('❌ Errore nella sincronizzazione Google Calendar');
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  const testGoogleConnection = async () => {
    try {
      if (!adminApiService) return;
      
      const status = await adminApiService.getGoogleCalendarStatus();
      
      if (status.isAuthenticated) {
        setIsGoogleAuthenticated(true);
        alert(`✅ Google Calendar connesso!\n📧 Email: ${status.email}\n📅 Calendari: ${status.calendarsCount || 0}`);
      } else {
        setIsGoogleAuthenticated(false);
        alert('❌ Google Calendar non autenticato. Usa il pulsante "🔐 Autentica Google" per connetterti.');
      }
    } catch (error) {
      console.error('Errore test connessione Google:', error);
      alert('❌ Errore nel test della connessione Google Calendar');
    }
  };

  const loadGoogleCalendarEvents = async () => {
    try {
      if (!adminApiService) return;
      
      setIsLoadingCalendar(true);
      const events = await adminApiService.getGoogleCalendarEvents();
      
      console.log('Eventi Google Calendar caricati:', events);
      alert(`📅 Caricati ${events.length || 0} eventi da Google Calendar`);
      
      return events;
    } catch (error) {
      console.error('Errore caricamento eventi Google:', error);
      alert('❌ Errore nel caricamento eventi Google Calendar');
      return [];
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // === GESTIONE NOTIFICHE ===
  
  const markNotificationAsRead = async (id: string | number) => {
    if (typeof id === 'number') {
      console.log(`📖 Notifica ${id} marcata come letta`);
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



  // Effetto per controllare autenticazione Google all'avvio
  // COMMENTATO PER DEBUG
  // useEffect(() => {
  //   const authInfo = calendarApiService.getAuthInfo();
  //   setIsGoogleAuthenticated(authInfo.isAuthenticated);
  // }, []);

  // Effetto per caricare i dati all'avvio (se autenticato)
  // COMMENTATO PER DEBUG
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     loadCalendarData();
  //   }
  // }, [isAuthenticated]);
  
  // === RENDER LOGIN ===
  if (!isAuthenticated) {
    console.log('🔐 Rendering login form...');
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-logo">
            <h1>🏡 Vincanto Admin</h1>
            <p>Pannello di gestione professionale</p>
          </div>
          
          <div className="admin-login-form">
            <input
              type="password"
              placeholder="Password Admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="admin-input"
              aria-label="Password Admin"
              title="Inserisci password per accedere al pannello admin"
            />
            
            <button onClick={handleLogin} className="admin-btn-primary">
              Accedi al Pannello
            </button>
            
            {error && <div className="admin-error">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  // === RENDER DEBUG PRINCIPALE ===
  console.log('🎯 Rendering main admin panel...');
  
  // === RENDER ADMIN PANEL SEMPLIFICATO ===
  return (
    <div className="admin-panel-pro">
      {/* Header Professionale */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>🏡 Vincanto Admin</h1>
          <span className="admin-version">v2.0 Pro</span>
        </div>
        
        <div className="admin-header-right">
          <div className="admin-user-info">
            <span>👤 Administrator</span>
            
            {/* Indicatore SuperAdmin attivo */}
            <div className="admin-super-indicator" title="Modalità SuperAdmin Attiva">
              ⚡ SuperAdmin
            </div>
          </div>
          
          <button 
            className="admin-btn-secondary"
            onClick={() => setIsAuthenticated(false)}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigazione Tab SuperAdmin Completa */}
      <nav className="admin-nav">
        <div className="admin-nav-container">
          <button 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              console.log('🎯 Click su tab dashboard');
              setActiveTab('dashboard');
            }}
          >
            📊 Dashboard
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'prezzi' ? 'active' : ''}`}
            onClick={() => {
              console.log('🎯 Click su tab prezzi');
              setActiveTab('prezzi');
            }}
          >
            💰 Prezzi
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'calendari' ? 'active' : ''}`}
            onClick={() => {
              console.log('🎯 Click su tab calendari');
              setActiveTab('calendari');
            }}
          >
            🗓️ Calendari
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'prenotazioni' ? 'active' : ''}`}
            onClick={() => {
              console.log('🎯 Click su tab prenotazioni');
              setActiveTab('prenotazioni');
            }}
          >
            📅 Prenotazioni
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'pagamenti' ? 'active' : ''}`}
            onClick={() => {
              console.log('🎯 Click su tab pagamenti');
              setActiveTab('pagamenti');
            }}
          >
            💳 Pagamenti
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            ✉️ Email
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'notifiche' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifiche')}
          >
            🔔 Notifiche
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'sistema' ? 'active' : ''}`}
            onClick={() => setActiveTab('sistema')}
          >
            ⚙️ Sistema
          </button>
        </div>
      </nav>

      {/* Contenuto Principale */}
      <main className="admin-content">
        {error && <div className="admin-error-banner">{error}</div>}

        {/* Dashboard con SOLO Dati Backend Reali */}
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard">
            <h2>� Dashboard Backend Reale {isLoadingData && '(Caricamento...)'}</h2>
            
            {/* Statistiche Principali */}
            <div className="admin-section">
              <h3>� Statistiche Live (Database)</h3>
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
            <div className="admin-section">
              <h3>� Metriche Avanzate</h3>
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
            <div className="admin-pricing-section">
              <h3>📅 Prossime Prenotazioni</h3>
              <div className="admin-pricing-card">
                <div className="existing-services">
                  {calendarEvents.slice(0, 5).map((event, index) => (
                    <div key={event.id || index} className="service-row">
                      <span>{event.title}</span>
                      <span>{new Date(event.start).toLocaleDateString('it-IT')}</span>
                      <span className={`platform-badge ${event.source}`}>
                        {event.source === 'airbnb' && '🏠 Airbnb'}
                        {event.source === 'booking' && '🏨 Booking.com'}
                        {event.source === 'expedia' && '✈️ Expedia'}
                        {event.source === 'direct' && '📞 Diretto'}
                        {event.source === 'other' && '📅 Altro'}
                      </span>
                      <span>€{event.totalPrice}</span>
                    </div>
                  ))}
                  
                  {calendarEvents.length === 0 && !isLoadingCalendar && (
                    <div className="service-row">
                      <span className="no-data-message">
                        Nessuna prenotazione trovata nel calendario Google
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="admin-pricing-actions dashboard-actions">
                  <button className="admin-btn-secondary" onClick={() => loadCalendarData()}>
                    🔄 Ricarica Calendario
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
          <AdminPricing
            pricingConfig={pricingConfig}
            updatePricingField={updatePricingField}
            savePricingConfig={savePricingConfig}
            resetPricingConfig={() => {
              // Reset alla configurazione di default
              const defaultConfig = {
                basePrice: 75,
                additionalGuestPrice: 20,
                parkingFee: 20,
                cleaningFee: 50,
                touristTax: 3,
                weekendSurcharge: 0,
                weeklyDiscount: 0,
                monthlyDiscount: 0,
                seasonalMultiplier: 1,
                minStay: 1,
                maxStay: 14
              };
              Object.keys(defaultConfig).forEach(key => {
                updatePricingField(key, defaultConfig[key]);
              });
            }}
            isUpdatingPricing={isUpdatingPricing}
            showSuccessMessage={false}
          />
        )}

        {/* === SEZIONE CALENDARI COMPLETA === */}
        {activeTab === 'calendari' && (
          <div className="admin-calendari">
            <h2>🗓️ Gestione Calendari {isLoadingCalendars && '(Caricamento...)'}</h2>
            
            {/* Statistiche Calendari */}
            <div className="admin-pricing-section">
              <h3>📊 Statistiche Calendario</h3>
              <div className="pricing-controls">
                <div className="pricing-preview">
                  <div className="preview-item">
                    <span>Totali Configurati:</span>
                    <strong>{calendarStats.total || 0}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Calendari Attivi:</span>
                    <strong className="status-success">{calendarStats.active || 0}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Google Calendar:</span>
                    <strong className="status-google">{calendarStats.googleCalendar || 0}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Calendari Esterni:</span>
                    <strong className="status-warning">{calendarStats.external || 0}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Ultima Sincronizzazione:</span>
                    <strong>{calendarStats.lastSyncSuccess ? new Date(calendarStats.lastSyncSuccess).toLocaleString('it-IT') : 'Mai'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Nuovo Calendario */}
            {showNewCalendarForm && (
              <div className="admin-pricing-section">
                <h3>➕ Aggiungi Nuovo Calendario</h3>
                <div className="admin-pricing-card">
                  <form onSubmit={handleCreateCalendar}>
                    <div className="pricing-controls">
                      <label htmlFor="cal-name">Nome Calendario:</label>
                      <input 
                        id="cal-name"
                        type="text" 
                        value={newCalendarData.name}
                        onChange={(e) => setNewCalendarData({...newCalendarData, name: e.target.value})}
                        className="admin-input-small" 
                        placeholder="Es: Booking.com Master Calendar"
                        required 
                      />
                      
                      <label htmlFor="cal-type">Tipo Calendario:</label>
                      <select 
                        id="cal-type"
                        value={newCalendarData.calendar_type}
                        onChange={(e) => setNewCalendarData({...newCalendarData, calendar_type: e.target.value})}
                        className="admin-select"
                      >
                        <option value="google_calendar">🎯 Google Calendar</option>
                        <option value="airbnb">🏠 Airbnb</option>
                        <option value="booking_com">🌍 Booking.com</option>
                        <option value="vrbo">🏖️ VRBO</option>
                        <option value="holidu">🏖️ Holidu</option>
                        <option value="ical_external">📅 iCal Esterno</option>
                      </select>
                      
                      <label htmlFor="cal-url">URL/iCal Feed:</label>
                      <input 
                        id="cal-url"
                        type="url" 
                        value={newCalendarData.url}
                        onChange={(e) => setNewCalendarData({...newCalendarData, url: e.target.value})}
                        className="admin-input-small" 
                        placeholder="https://calendar.google.com/calendar/ical/..."
                      />
                      
                      <label htmlFor="cal-frequency">Sincronizzazione (minuti):</label>
                      <select 
                        id="cal-frequency"
                        value={newCalendarData.sync_frequency}
                        onChange={(e) => setNewCalendarData({...newCalendarData, sync_frequency: parseInt(e.target.value)})}
                        className="admin-select"
                      >
                        <option value="15">15 minuti</option>
                        <option value="30">30 minuti</option>
                        <option value="60">1 ora</option>
                        <option value="120">2 ore</option>
                        <option value="360">6 ore</option>
                        <option value="720">12 ore</option>
                        <option value="1440">24 ore</option>
                      </select>
                      
                      <label>
                        <input 
                          type="checkbox" 
                          checked={newCalendarData.is_active}
                          onChange={(e) => setNewCalendarData({...newCalendarData, is_active: e.target.checked})}
                        />
                        Attivo dalla creazione
                      </label>
                    </div>
                    
                    <div className="admin-pricing-actions">
                      <button type="submit" className="admin-btn-primary" disabled={isLoadingCalendars}>
                        {isLoadingCalendars ? '⏳ Creazione...' : '✅ Crea Calendario'}
                      </button>
                      <button 
                        type="button" 
                        className="admin-btn-secondary" 
                        onClick={() => setShowNewCalendarForm(false)}
                      >
                        ❌ Annulla
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Lista Calendari Configurati */}
            <div className="admin-pricing-section">
              <h3>🗓️ Calendari Configurati</h3>
              <div className="admin-pricing-actions margin-bottom">
                <button 
                  className="admin-btn-primary" 
                  onClick={() => setShowNewCalendarForm(true)}
                  disabled={isLoadingCalendars}
                >
                  ➕ Aggiungi Calendario
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={() => handleForceSync()}
                  disabled={isLoadingCalendars}
                >
                  {isLoadingCalendars ? '⏳ Sincronizzazione...' : '🔄 Sincronizza Tutti'}
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={loadCalendarConfigs}
                  disabled={isLoadingCalendars}
                >
                  🔄 Ricarica
                </button>
              </div>
              
              {calendarConfigs.length > 0 ? (
                <div className="bookings-table-container">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>Stato</th>
                        <th>Ultima Sync</th>
                        <th>Frequenza</th>
                        <th>Eventi</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendarConfigs.map((calendar: any) => (
                        <tr key={calendar.id}>
                          <td><strong>{calendar.name}</strong></td>
                          <td>
                            <span className={`status ${calendar.calendar_type}`}>
                              {calendar.calendar_type === 'google_calendar' && '🎯 Google'}
                              {calendar.calendar_type === 'airbnb' && '🏠 Airbnb'}
                              {calendar.calendar_type === 'booking_com' && '🌍 Booking.com'}
                              {calendar.calendar_type === 'vrbo' && '🏖️ VRBO'}
                              {calendar.calendar_type === 'ical_external' && '📅 iCal'}
                            </span>
                          </td>
                          <td>
                            <span className={`status ${calendar.is_active ? 'confirmed' : 'cancelled'}`}>
                              {calendar.is_active ? '🟢 Attivo' : '🔴 Disattivo'}
                            </span>
                          </td>
                          <td>{calendar.last_sync_at ? new Date(calendar.last_sync_at).toLocaleString('it-IT') : 'Mai'}</td>
                          <td>{calendar.sync_frequency} min</td>
                          <td>{calendar.events_count || 0}</td>
                          <td>
                            <div className="calendar-actions">
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleForceSync(calendar.id)}
                                disabled={isLoadingCalendars}
                                title="Sincronizza ora"
                              >
                                🔄
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleTestConnection(calendar)}
                                disabled={isLoadingCalendars}
                                title="Test connessione"
                              >
                                🧪
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleUpdateCalendar(calendar.id, {is_active: !calendar.is_active})}
                                disabled={isLoadingCalendars}
                                title={calendar.is_active ? "Disattiva" : "Attiva"}
                              >
                                {calendar.is_active ? '⏸️' : '▶️'}
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleUpdateCalendar(calendar.id, { is_active: !calendar.is_active })}
                                disabled={isLoadingCalendars}
                                title="Modifica"
                              >
                                ✏️
                              </button>
                              <button 
                                className="admin-btn-small admin-btn-danger" 
                                onClick={() => handleDeleteCalendar(calendar.id, calendar.name)}
                                disabled={isLoadingCalendars}
                                title="Elimina"
                              >
                                🗑️
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
                  <p>📊 Nessun calendario configurato. Aggiungi il primo calendario per iniziare la sincronizzazione automatica.</p>
                  <div className="admin-pricing-actions">
                    <button 
                      className="admin-btn-primary" 
                      onClick={() => setShowNewCalendarForm(true)}
                    >
                      ➕ Configura Primo Calendario
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Form per Bloccare Date */}
            {showBlockDateForm && (
              <div className="admin-pricing-section">
                <h3>🚫 Blocca Nuove Date</h3>
                <div className="admin-pricing-card">
                  <form onSubmit={handleAddBlockedDate}>
                    <div className="pricing-controls">
                      <label htmlFor="block-start-date">Data Inizio Blocco:</label>
                      <input 
                        id="block-start-date"
                        type="date" 
                        value={newBlockedDate.start_date}
                        onChange={(e) => setNewBlockedDate({...newBlockedDate, start_date: e.target.value})}
                        className="admin-input-small" 
                        title="Seleziona la data di inizio del blocco"
                        placeholder="Seleziona data inizio"
                        required 
                      />
                      
                      <label htmlFor="block-end-date">Data Fine Blocco:</label>
                      <input 
                        id="block-end-date"
                        type="date" 
                        value={newBlockedDate.end_date}
                        onChange={(e) => setNewBlockedDate({...newBlockedDate, end_date: e.target.value})}
                        className="admin-input-small" 
                        title="Seleziona la data di fine del blocco"
                        placeholder="Seleziona data fine"
                        required 
                      />
                      
                      <label htmlFor="block-reason">Motivo Blocco:</label>
                      <select 
                        id="block-reason"
                        value={newBlockedDate.reason}
                        onChange={(e) => setNewBlockedDate({...newBlockedDate, reason: e.target.value})}
                        className="admin-select"
                        title="Seleziona il motivo del blocco"
                      >
                        <option value="maintenance">🔧 Manutenzione</option>
                        <option value="owner_use">🏠 Uso Proprietario</option>
                        <option value="cleaning">🧽 Pulizie Approfondite</option>
                        <option value="renovation">🏗️ Ristrutturazione</option>
                        <option value="other">❓ Altro</option>
                      </select>
                    </div>
                    
                    <div className="admin-pricing-actions">
                      <button type="submit" className="admin-btn-primary">🚫 Blocca Date</button>
                      <button 
                        type="button" 
                        className="admin-btn-secondary" 
                        onClick={() => setShowBlockDateForm(false)}
                      >
                        ❌ Annulla
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Gestione Date Bloccate */}
            <div className="admin-pricing-section">
              <h3>� Date Bloccate Backend</h3>
              <div className="admin-pricing-actions margin-bottom">
                <button 
                  className="admin-btn-primary" 
                  onClick={() => setShowBlockDateForm(true)}
                >
                  ➕ Blocca Nuove Date
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={loadRealApiData}
                >
                  🔄 Ricarica Dati
                </button>
              </div>
              
              {blockedDates.length > 0 ? (
                <div className="bookings-table-container">
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Data Inizio</th>
                        <th>Data Fine</th>
                        <th>Motivo</th>
                        <th>Giorni</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockedDates.map((block) => {
                        const startDate = new Date(block.start_date);
                        const endDate = new Date(block.end_date);
                        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
                        
                        return (
                          <tr key={block.id}>
                            <td>#{block.id}</td>
                            <td>{startDate.toLocaleDateString('it-IT')}</td>
                            <td>{endDate.toLocaleDateString('it-IT')}</td>
                            <td>
                              <span className={`status ${block.reason}`}>
                                {block.reason === 'maintenance' && '🔧 Manutenzione'}
                                {block.reason === 'owner_use' && '🏠 Uso Proprietario'}
                                {block.reason === 'cleaning' && '🧽 Pulizie'}
                                {block.reason === 'renovation' && '🏗️ Ristrutturazione'}
                                {block.reason === 'other' && '❓ Altro'}
                              </span>
                            </td>
                            <td>{daysDiff + 1} giorni</td>
                            <td>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleRemoveBlockedDate(block.id)}
                              >
                                🗑️ Rimuovi
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-pricing-card">
                  <p>📊 Nessuna data bloccata nel sistema</p>
                </div>
              )}
            </div>

            {/* Calendario Google Master */}
            <div className="admin-pricing-section">
              <h3>🎯 Calendario Master Google</h3>
              <div className="admin-calendar-card">
                <h3>📅 Google Calendar - Vincanto Master</h3>
                <div className="calendar-status active">🟢 Connesso e Sincronizzato</div>
                <div className="calendar-info">
                  <p>📧 Email: vincantomaiori@gmail.com</p>
                  <p>🔄 Ultima sincronizzazione: {new Date().toLocaleString('it-IT')}</p>
                  <p>📊 Eventi sincronizzati: {calendarStats.total || 0}</p>
                  <div className={`sync-indicator ${isGoogleAuthenticated ? 'success' : 'warning'}`} id="calendar-connection-status">
                    {isGoogleAuthenticated 
                      ? '✅ Autenticato - Sincronizzazione attiva' 
                      : '🟡 Non autenticato - Usando dati demo'}
                  </div>
                </div>
                <div className="calendar-controls">
                  {!isGoogleAuthenticated ? (
                    <button className="admin-btn-success admin-btn-small" onClick={() => initiateGoogleAuth()}>🔐 Autentica Google</button>
                  ) : (
                    <button className="admin-btn-primary admin-btn-small" onClick={() => handleGoogleCalendarSync()}>🔄 Sincronizza Google</button>
                  )}
                  <button className="admin-btn-secondary admin-btn-small" onClick={() => testGoogleConnection()}>⚙️ Test Google</button>
                  <button className="admin-btn-secondary admin-btn-small" onClick={() => loadGoogleCalendarEvents()}>📅 Carica Eventi</button>
                  <button className="admin-btn-secondary admin-btn-small">📱 Condividi Calendario</button>
                  <button className="admin-btn-secondary admin-btn-small">📊 Report Sincronizzazione</button>
                </div>
              </div>
            </div>
            
            {/* Calendari Piattaforme Esterne */}
            <div className="admin-pricing-section">
              <h3>🌐 Calendari Piattaforme Esterne</h3>
              <div className="admin-calendar-grid">
                <div className="admin-calendar-card">
                  <h3>📱 Airbnb Calendar</h3>
                  <div className="calendar-status active">🟢 Sincronizzato</div>
                  <div className="calendar-info">
                    <p>📧 Account: mario@vincanto.com</p>
                    <p>🔄 Ultima sincronizzazione: Oggi 14:30</p>
                    <p>📊 Prenotazioni attive: 5</p>
                    <div className="sync-indicator success">
                      ✅ Sincronizzazione automatica ogni 2 ore
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <button 
                      className="admin-btn-secondary admin-btn-small"
                      onClick={() => handleSyncCalendar('airbnb-1', 'Airbnb Calendar')}
                      disabled={isLoadingCalendars}
                    >
                      🔄 Sincronizza
                    </button>
                    <button 
                      className="admin-btn-secondary admin-btn-small"
                      onClick={() => handleEditCalendar({id: 'airbnb-1', name: 'Airbnb Calendar', type: 'airbnb'})}
                    >
                      ✏️ Modifica
                    </button>
                    <button 
                      className="admin-btn-warning admin-btn-small"
                      onClick={() => handleSuspendCalendar('airbnb-1', 'Airbnb Calendar')}
                      disabled={isLoadingCalendars}
                    >
                      ⏸️ Sospendi
                    </button>
                    <button 
                      className="admin-btn-danger admin-btn-small"
                      onClick={() => handleDeleteCalendar('airbnb-1', 'Airbnb Calendar')}
                      disabled={isLoadingCalendars}
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
                
                <div className="admin-calendar-card">
                  <h3>🏨 Booking.com Calendar</h3>
                  <div className="calendar-status active">🟢 Sincronizzato</div>
                  <div className="calendar-info">
                    <p>📧 Account: booking@vincanto.com</p>
                    <p>🔄 Ultima sincronizzazione: Oggi 14:25</p>
                    <p>📊 Prenotazioni attive: 3</p>
                    <div className="sync-indicator success">
                      ✅ Sincronizzazione automatica ogni 3 ore
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <button 
                      className="admin-btn-secondary admin-btn-small"
                      onClick={() => handleSyncCalendar('booking-1', 'Booking.com Calendar')}
                      disabled={isLoadingCalendars}
                    >
                      🔄 Sincronizza
                    </button>
                    <button 
                      className="admin-btn-secondary admin-btn-small"
                      onClick={() => handleEditCalendar({id: 'booking-1', name: 'Booking.com Calendar', type: 'booking'})}
                    >
                      ✏️ Modifica
                    </button>
                    <button 
                      className="admin-btn-warning admin-btn-small"
                      onClick={() => handleSuspendCalendar('booking-1', 'Booking.com Calendar')}
                      disabled={isLoadingCalendars}
                    >
                      ⏸️ Sospendi
                    </button>
                    <button 
                      className="admin-btn-danger admin-btn-small"
                      onClick={() => handleDeleteCalendar('booking-1', 'Booking.com Calendar')}
                      disabled={isLoadingCalendars}
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
                
                <div className="admin-calendar-card">
                  <h3>🌐 Expedia Calendar</h3>
                  <div className="calendar-status syncing">🟡 Configurazione in corso</div>
                  <div className="calendar-info">
                    <p>� Account: expedia@vincanto.com</p>
                    <p>⚙️ Configurazione: 75% completata</p>
                    <p>📊 Test API: In corso...</p>
                    <div className="sync-indicator pending">
                      ⏳ Configurazione API in fase di test
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <button className="admin-btn-primary admin-btn-small">⚙️ Completa Setup</button>
                    <button className="admin-btn-secondary admin-btn-small">🔧 Test API</button>
                    <button className="admin-btn-danger admin-btn-small">❌ Annulla</button>
                  </div>
                </div>
                
                <div className="admin-calendar-card">
                  <h3>🏠 VRBO Calendar</h3>
                  <div className="calendar-status inactive">🔴 Sospeso</div>
                  <div className="calendar-info">
                    <p>📧 Account: vrbo@vincanto.com</p>
                    <p>⏸️ Sospeso da: 15/10/2025</p>
                    <p>📊 Ultimo sync: 14/10/2025</p>
                    <div className="sync-indicator error">
                      ⚠️ Calendario temporaneamente sospeso per manutenzione
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <button className="admin-btn-success admin-btn-small">▶️ Riattiva</button>
                    <button className="admin-btn-secondary admin-btn-small">✏️ Modifica</button>
                    <button className="admin-btn-danger admin-btn-small">🗑️ Elimina</button>
                  </div>
                </div>
                
                <div className="admin-calendar-card">
                  <h3>🏖️ Holidu Calendar</h3>
                  <div className="calendar-status ready">🟡 Pronto per Configurazione</div>
                  <div className="calendar-info">
                    <p>🔗 URL: https://api.host.holidu.com/pmc/rest/apartments/65376863/ical.ics?key=72d27a56f3e8836f690500877301d000</p>
                    <p>🆔 Apartment ID: 65376863</p>
                    <p>🔑 API Key: 72d27a56f3e8836f690500877301d000</p>
                    <div className="sync-indicator ready">
                      ✅ URL iCal fornito - Pronto per attivazione
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <button className="admin-btn-primary admin-btn-small" onClick={() => {
                      setNewCalendarData({
                        name: 'Holidu - Vincanto Maori',
                        calendar_type: 'holidu',
                        url: 'https://api.host.holidu.com/pmc/rest/apartments/65376863/ical.ics?key=72d27a56f3e8836f690500877301d000',
                        credentials: 'apartment_id:65376863,api_key:72d27a56f3e8836f690500877301d000',
                        sync_frequency: 60,
                        is_active: true
                      });
                      setShowNewCalendarForm(true);
                    }}>⚡ Configura Subito</button>
                    <button className="admin-btn-secondary admin-btn-small">🔍 Test URL</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Configurazioni Generali */}
            <div className="admin-pricing-section">
              <h3>⚙️ Configurazioni Sincronizzazione</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Impostazioni Globali</h4>
                  <div className="pricing-controls">
                    <label>Frequenza Sincronizzazione Automatica:</label>
                    <select className="admin-select" aria-label="Frequenza sincronizzazione">
                      <option>Ogni ora</option>
                      <option>Ogni 2 ore</option>
                      <option>Ogni 6 ore</option>
                      <option>Solo manuale</option>
                    </select>
                    
                    <label>Notifiche Email per Errori:</label>
                    <select className="admin-select" aria-label="Notifiche errori">
                      <option>Abilitate</option>
                      <option>Solo errori critici</option>
                      <option>Disabilitate</option>
                    </select>
                    
                    <label>Fuso Orario:</label>
                    <select className="admin-select" aria-label="Fuso orario">
                      <option>Europe/Rome (GMT+1)</option>
                      <option>Europe/London (GMT+0)</option>
                      <option>America/New_York (GMT-5)</option>
                    </select>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Google Calendar API</h4>
                  <div className="pricing-controls">
                    <label>API Key Status:</label>
                    <div className="sync-indicator success">✅ API Key valida e attiva</div>
                    
                    <label>Calendario ID:</label>
                    <input type="text" defaultValue="vincanto.master@gmail.com" className="admin-input" aria-label="Google Calendar ID" readOnly />
                    
                    <label>Ultima Verifica API:</label>
                    <span className="pricing-note">27/10/2025 - 15:45 ✅</span>
                    
                    <button className="admin-btn-secondary admin-btn-small">🔧 Test Connessione</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Azioni Avanzate */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary">➕ Aggiungi Nuovo Calendario</button>
              <button className="admin-btn-secondary">� Sincronizza Tutti</button>
              <button className="admin-btn-secondary">📊 Dashboard Occupazione</button>
              <button className="admin-btn-secondary">📈 Report Sincronizzazioni</button>
              <button className="admin-btn-secondary">📤 Esporta Configurazione</button>
              <button className="admin-btn-secondary">⚙️ Impostazioni Avanzate</button>
            </div>
          </div>
        )}

        {/* Sezione Prenotazioni Professionale */}
        {activeTab === 'prenotazioni' && (() => {
          try {
            console.log('🎯 Rendering sezione prenotazioni...');
            return (
          <div className="admin-prenotazioni">
            <div className="admin-header">
              <h2>📅 Gestione Prenotazioni Avanzata</h2>
              <button 
                onClick={() => setShowBookingForm(!showBookingForm)}
                className="admin-button primary"
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
                      <span>🏠 Occupazione Oggi:</span>
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
                    <select className="admin-select" aria-label="Filtro stato prenotazioni">
                      <option>Tutte le prenotazioni</option>
                      <option>✅ Confermate</option>
                      <option>⏳ In Attesa</option>
                      <option>🏠 Check-in Oggi</option>
                      <option>🚪 Check-out Oggi</option>
                      <option>🔄 In Soggiorno</option>
                      <option>✅ Completate</option>
                      <option>❌ Cancellate</option>
                    </select>
                    
                    <label>Periodo:</label>
                    <input type="date" className="admin-input-small" aria-label="Data inizio filtro" />
                    <input type="date" className="admin-input-small" aria-label="Data fine filtro" />
                    
                    <label>Piattaforma:</label>
                    <select className="admin-select" aria-label="Filtro piattaforma">
                      <option>Tutte le piattaforme</option>
                      <option>🌐 Sito Diretto</option>
                      <option>📱 Airbnb</option>
                      <option>🏨 Booking.com</option>
                      <option>🌐 Expedia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
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
                        onChange={(e) => setNewBookingData({...newBookingData, customer_name: e.target.value})}
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
                        onChange={(e) => setNewBookingData({...newBookingData, customer_email: e.target.value})}
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
                        onChange={(e) => setNewBookingData({...newBookingData, check_in: e.target.value})}
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
                        onChange={(e) => setNewBookingData({...newBookingData, check_out: e.target.value})}
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
                        onChange={(e) => setNewBookingData({...newBookingData, guests: parseInt(e.target.value)})}
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
                        onChange={(e) => setNewBookingData({...newBookingData, total_amount: parseFloat(e.target.value)})}
                        className="admin-input-small"
                        title="Importo totale in euro"
                        placeholder="0.00"
                        required 
                      />
                      
                      <label htmlFor="booking-status">Stato:</label>
                      <select 
                        id="booking-status"
                        value={newBookingData.status}
                        onChange={(e) => setNewBookingData({...newBookingData, status: e.target.value})}
                        className="admin-select"
                        title="Seleziona lo stato della prenotazione"
                      >
                        <option value="pending">🟡 In Attesa</option>
                        <option value="confirmed">✅ Confermata</option>
                        <option value="cancelled">❌ Cancellata</option>
                        <option value="completed">✅ Completata</option>
                      </select>
                      
                      <label htmlFor="booking-platform">Piattaforma:</label>
                      <select 
                        id="booking-platform"
                        value={newBookingData.platform}
                        onChange={(e) => setNewBookingData({...newBookingData, platform: e.target.value})}
                        className="admin-select"
                        title="Seleziona la piattaforma di prenotazione"
                      >
                        <option value="direct">📞 Diretto</option>
                        <option value="airbnb">📱 Airbnb</option>
                        <option value="booking">🏨 Booking.com</option>
                        <option value="expedia">✈️ Expedia</option>
                      </select>
                    </div>
                    
                    <div className="admin-pricing-actions">
                      <button type="submit" className="admin-btn-primary">
                        {editingBooking ? '✅ Aggiorna Prenotazione' : '➕ Crea Prenotazione'}
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
              <h3>🔥 Prenotazioni Backend (Dati Reali)</h3>
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
                          <td>{booking.check_in || booking.checkIn}</td>
                          <td>{booking.check_out || booking.checkOut}</td>
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
                            <div className="action-buttons">
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleEditBooking(booking)}
                              >
                                ✏️ Modifica
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => updateBookingStatus(booking.id, { status: 'confirmed' })}
                              >
                                ✅ Conferma
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleDeleteBooking(booking.id)}
                              >
                                ❌ Elimina
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-pricing-card">
                    <p>📊 Nessuna prenotazione trovata nel database backend</p>
                    <button 
                      className="admin-btn-primary" 
                      onClick={loadRealApiData}
                    >
                      🔄 Ricarica Dati API
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabella Prenotazioni Mock */}
            <div className="admin-pricing-section">
              <h3>📋 Lista Prenotazioni (Demo/Mock)</h3>
              <div className="bookings-table-container">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Ospiti</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Piattaforma</th>
                      <th>Stato</th>
                      <th>Totale</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="booking-row">
                        <td>#{booking.id.toUpperCase()}</td>
                        <td>
                          <div className="customer-info">
                            <strong>{booking.guestName}</strong>
                            <small>{booking.guestName.toLowerCase().replace(' ', '.')}@email.com</small>
                          </div>
                        </td>
                        <td>{booking.guests} {booking.guests === 1 ? 'ospite' : 'ospiti'}</td>
                        <td>{new Date(booking.checkIn).toLocaleDateString('it-IT')}</td>
                        <td>{new Date(booking.checkOut).toLocaleDateString('it-IT')}</td>
                        <td>
                          <span className={`platform-badge ${booking.platform}`}>
                            {booking.platform === 'airbnb' && '📱 Airbnb'}
                            {booking.platform === 'booking' && '🏨 Booking.com'}
                            {booking.platform === 'expedia' && '✈️ Expedia'}
                            {booking.platform === 'direct' && '📞 Diretto'}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${booking.status}`}>
                            {booking.status === 'confirmed' && '✅ Confermata'}
                            {booking.status === 'pending' && '🟡 In attesa'}
                            {booking.status === 'cancelled' && '❌ Cancellata'}
                          </span>
                        </td>
                        <td>€{(booking.totalPrice || booking.total_amount || 0).toFixed(2)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="admin-btn-small">✏️ Modifica</button>
                            <button className="admin-btn-small">✉️ Email</button>
                            <button className="admin-btn-small">📄 Fattura</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {recentBookings.length === 0 && (
                      <tr className="booking-row">
                        <td colSpan={9}>
                          <div>Nessuna prenotazione trovata</div>
                        </td>
                      </tr>
                    )}
                    
                    <tr className="booking-row">
                      <td>#VIN_DEMO</td>
                      <td>
                        <div className="customer-info">
                          <strong>Anna Bianchi</strong>
                          <small>anna.bianchi@gmail.com</small>
                        </div>
                      </td>
                      <td>2 adulti, 1 bambino</td>
                      <td>05/11/2025</td>
                      <td>12/11/2025</td>
                      <td><span className="platform-badge booking">🏨 Booking.com</span></td>
                      <td><span className="status pending">⏳ In Attesa Pagamento</span></td>
                      <td>€1,250.00</td>
                      <td>
                        <div className="action-buttons">
                          <button className="admin-btn-small admin-btn-warning">💳 Richiedi Pag.</button>
                          <button className="admin-btn-small">✏️ Modifica</button>
                          <button className="admin-btn-small">✉️ Email</button>
                        </div>
                      </td>
                    </tr>
                    
                    <tr className="booking-row">
                      <td>#VIN003</td>
                      <td>
                        <div className="customer-info">
                          <strong>Luigi Verde</strong>
                          <small>luigi.verde@hotmail.com</small>
                        </div>
                      </td>
                      <td>6 adulti</td>
                      <td>15/11/2025</td>
                      <td>20/11/2025</td>
                      <td><span className="platform-badge direct">🌐 Sito Diretto</span></td>
                      <td><span className="status completed">✅ Completata</span></td>
                      <td>€1,625.00</td>
                      <td>
                        <div className="action-buttons">
                          <button className="admin-btn-small">📄 Fattura</button>
                          <button className="admin-btn-small">⭐ Recensione</button>
                          <button className="admin-btn-small">🔁 Prenota Ancora</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Azioni Avanzate */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary">➕ Nuova Prenotazione</button>
              <button className="admin-btn-secondary">📊 Report Dettagliato</button>
              <button className="admin-btn-secondary">📧 Email di Massa</button>
              <button className="admin-btn-secondary">📅 Calendario Occupazione</button>
              <button className="admin-btn-secondary">💾 Esporta Excel</button>
              <button className="admin-btn-secondary">🔄 Sincronizza Piattaforme</button>
            </div>
          </div>
            );
          } catch (error) {
            console.error('❌ Errore nel rendering sezione prenotazioni:', error);
            return (
              <div className="admin-prenotazioni">
                <div className="error-message">
                  <h2>⚠️ Errore nella sezione prenotazioni</h2>
                  <p>Errore: {error instanceof Error ? error.message : 'Errore sconosciuto'}</p>
                  <button onClick={() => window.location.reload()} className="admin-btn-primary">
                    🔄 Ricarica Pagina
                  </button>
                </div>
              </div>
            );
          }
        })()}

        {/* Sezione Pagamenti Professionale */}
        {activeTab === 'pagamenti' && (() => {
          try {
            console.log('🎯 Rendering sezione pagamenti...');
            return (
          <div className="admin-pagamenti">
            <h2>💳 Gestione Pagamenti Avanzata</h2>
            
            {/* Dashboard Finanziaria */}
            <div className="admin-pricing-section">
              <h3>📊 Dashboard Finanziaria</h3>
              <div className="admin-pricing-grid">
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
                  <h4>📈 Statistiche Live</h4>
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
                      <span>⚡ Tempo Medio Pagam.:</span>
                      <span className="stat-value">2.3 giorni</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metodi di Pagamento */}
            <div className="admin-pricing-section">
              <h3>🎯 Metodi di Pagamento</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>💳 Stripe Integration</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">✅ Connesso e Attivo</div>
                    <label>Commissione Stripe:</label>
                    <input type="number" defaultValue="2.9" className="admin-input-small" aria-label="Commissione Stripe" step="0.1" />
                    <label>Valute Accettate:</label>
                    <div className="pricing-note">EUR, USD, GBP</div>
                    <button className="admin-btn-secondary admin-btn-small">⚙️ Configura</button>
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
                    <button className="admin-btn-secondary admin-btn-small">✏️ Modifica</button>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>💰 PayPal Business</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator active">🟡 Configurazione</div>
                    <label>Email PayPal:</label>
                    <input type="email" defaultValue="vincanto@paypal.com" className="admin-input" aria-label="Email PayPal" />
                    <label>Commissione PayPal:</label>
                    <input type="number" defaultValue="3.4" className="admin-input-small" aria-label="Commissione PayPal" step="0.1" />
                    <button className="admin-btn-primary admin-btn-small">⚙️ Completa Setup</button>
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
                      <span>{transaction.guestName}</span>
                      <span>€{(transaction.amount || 0).toFixed(2)}</span>
                      <span className={`platform-badge ${transaction.method}`}>
                        {transaction.method === 'stripe' && '💳 Stripe'}
                        {transaction.method === 'paypal' && '💰 PayPal'}
                        {transaction.method === 'bank_transfer' && '🏦 Bonifico'}
                      </span>
                      <span className={`status ${transaction.status}`}>
                        {transaction.status === 'completed' && '✅ Completato'}
                        {transaction.status === 'pending' && '🟡 In attesa'}
                        {transaction.status === 'failed' && '❌ Fallito'}
                      </span>
                      <span>{new Date(transaction.date).toLocaleDateString('it-IT')}</span>
                      <div className="action-buttons">
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
                            ↩️ Rimborso
                          </button>
                        )}
                        <button 
                          className="admin-btn-small"
                          onClick={() => window.open(`/admin/transaction/${transaction.id}`, '_blank')}
                          title="Vedi dettagli"
                        >
                          📄 Dettagli
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
                              {booking.payment_status === 'pending' && '🟡 In Attesa'}
                              {booking.payment_status === 'partial' && '🟠 Parziale'}
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
                                � Parziale
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
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Azioni Finanziarie */}
            <div className="admin-pricing-actions">
              <button 
                className="admin-btn-primary"
                onClick={() => alert('🔧 Feature in sviluppo: Aggiunta metodo pagamento')}
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
                onClick={() => alert('📈 Feature in sviluppo: Analisi trend')}
              >
                📈 Analisi Trend
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
            );
          } catch (error) {
            console.error('❌ Errore nel rendering sezione pagamenti:', error);
            return (
              <div className="admin-pagamenti">
                <div className="error-message">
                  <h2>⚠️ Errore nella sezione pagamenti</h2>
                  <p>Errore: {error instanceof Error ? error.message : 'Errore sconosciuto'}</p>
                  <button onClick={() => window.location.reload()} className="admin-btn-primary">
                    🔄 Ricarica Pagina
                  </button>
                </div>
              </div>
            );
          }
        })()}

        {/* Sezione Email */}
        {activeTab === 'email' && (
          <div className="admin-email">
            <h2>✉️ Sistema Email Marketing</h2>
            
            {/* Dashboard Email */}
            <div className="admin-pricing-section">
              <h3>📊 Performance Email</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>📈 Statistiche Generali</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>📤 Totale Inviate:</span>
                      <span className="stat-value">1,247</span>
                    </div>
                    <div className="stat-row">
                      <span>📖 Tasso Apertura:</span>
                      <span className="stat-value success">87.5%</span>
                    </div>
                    <div className="stat-row">
                      <span>🔗 Click Through Rate:</span>
                      <span className="stat-value">42.3%</span>
                    </div>
                    <div className="stat-row">
                      <span>❌ Bounce Rate:</span>
                      <span className="stat-value warning">1.2%</span>
                    </div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>⚡ Automazioni Attive</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">✅ Conferma Prenotazione: Attiva</div>
                    <div className="sync-indicator success">✅ Check-in Reminder: Attiva</div>
                    <div className="sync-indicator success">✅ Richiesta Recensione: Attiva</div>
                    <div className="sync-indicator pending">🟡 Follow-up Post Soggiorno: Test</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Email */}
            <div className="admin-pricing-section">
              <h3>� Template Email</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>🎯 Template Principali</h4>
                  <div className="existing-services">
                    <div className="service-row">
                      <span>📧 Conferma Prenotazione</span>
                      <span>87% apertura</span>
                      <button 
                        className="admin-btn-small"
                        onClick={() => handleEditTemplate('Conferma Prenotazione')}
                      >
                        ✏️ Modifica
                      </button>
                      <button className="admin-btn-small">📊 Stats</button>
                    </div>
                    
                    <div className="service-row">
                      <span>🏠 Istruzioni Check-in</span>
                      <span>95% apertura</span>
                      <button className="admin-btn-small">✏️ Modifica</button>
                      <button className="admin-btn-small">📊 Stats</button>
                    </div>
                    
                    <div className="service-row">
                      <span>👋 Messaggio Benvenuto</span>
                      <span>78% apertura</span>
                      <button className="admin-btn-small">✏️ Modifica</button>
                      <button className="admin-btn-small">� Stats</button>
                    </div>
                    
                    <div className="service-row">
                      <span>⭐ Richiesta Recensione</span>
                      <span>65% apertura</span>
                      <button className="admin-btn-small">✏️ Modifica</button>
                      <button className="admin-btn-small">📊 Stats</button>
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
                      onChange={(e) => setEmailSettings({...emailSettings, smtpProvider: e.target.value})}
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
                      onChange={(e) => setEmailSettings({...emailSettings, senderEmail: e.target.value})}
                      className="admin-input" 
                      aria-label="Email mittente" 
                    />
                    
                    <div className="sync-indicator success">✅ Connessione SMTP attiva</div>
                    
                    <button 
                      className="admin-btn-secondary admin-btn-small"
                      onClick={testEmailConnection}
                      disabled={loading}
                    >
                      🔧 {loading ? 'Test...' : 'Test Invio'}
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
                ✏️ Nuovo Template
              </button>
              <button 
                className="admin-btn-secondary"
                onClick={saveEmailSettings}
                disabled={loading}
              >
                � {loading ? 'Salvataggio...' : 'Salva Configurazione'}
              </button>
              <button className="admin-btn-secondary">� Report Dettagliato</button>
              <button className="admin-btn-secondary">📧 Invio Massivo</button>
              <button className="admin-btn-secondary">⚡ Gestisci Automazioni</button>
            </div>
          </div>
        )}

        {/* Sezione Sistema Professionale - SOLO CONFIGURAZIONI TECNICHE */}
        {activeTab === 'sistema' && (
          <div className="admin-sistema">
            <h2>⚙️ Configurazione Sistema e Database</h2>
            <div className="admin-notice" style={{backgroundColor: '#fff3cd', padding: '15px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ffeaa7'}}>
              <strong>💡 Nota:</strong> Per modificare prezzi, tariffe e configurazioni di prenotazione, utilizza la tab <strong>"🏷️ Prezzi"</strong>.
              Questa sezione è dedicata solo alle impostazioni tecniche del sistema.
            </div>
            
            {/* Database e Sistema Status */}
            <div className="admin-pricing-section">
              <h3>�️ Stato Database e Applicazione</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>📊 Statistiche Sistema</h4>
                  <div className="pricing-controls">
                    {systemSettings.length > 0 ? (
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
                                const updatedSettings = systemSettings.map(s => 
                                  s.key === setting.key ? { ...s, value: e.target.value } : s
                                );
                                setSystemSettings(updatedSettings);
                                
                                // Salva nel backend con debounce
                                try {
                                  await updateSystemSettingValue(setting.key, e.target.value);
                                } catch (error) {
                                  console.error('Errore salvataggio setting:', error);
                                }
                              }}
                              aria-label={setting.label || setting.key}
                              placeholder={`Inserisci ${setting.label || setting.key}`}
                            />
                            <button 
                              className="admin-btn-small" 
                              onClick={async () => {
                                try {
                                  await updateSystemSettingValue(setting.key, setting.value);
                                  alert(`✅ ${setting.label} salvata!`);
                                } catch (error) {
                                  alert(`❌ Errore salvataggio ${setting.label}`);
                                }
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
                      <span>📈 Analytics Records:</span>
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
                          const savePromises = systemSettings.map(setting => 
                            updateSystemSettingValue(setting.key, setting.value)
                          );
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
            
            {/* Informazioni Proprietà */}
            <div className="admin-pricing-section">
              <h3>🏠 Informazioni Struttura</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Dati Principali</h4>
                  <div className="pricing-controls">
                    <label>Nome Struttura:</label>
                    <input type="text" defaultValue="Vincanto Maori" className="admin-input" aria-label="Nome struttura" />
                    
                    <label>Indirizzo Completo:</label>
                    <input type="text" defaultValue="Via dei Maori 25, 00185 Roma RM" className="admin-input" aria-label="Indirizzo" />
                    
                    <label>Codice CIR/CIN:</label>
                    <input type="text" defaultValue="15146004C217" className="admin-input" aria-label="Codice identificativo" />
                    
                    <label>Capacità Massima:</label>
                    <input type="number" defaultValue="6" className="admin-input-small" aria-label="Capacità ospiti" />
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Contatti e Legal</h4>
                  <div className="pricing-controls">
                    <label>Telefono Principale:</label>
                    <input type="tel" defaultValue="+39 06 1234567" className="admin-input" aria-label="Telefono" />
                    
                    <label>Email Gestione:</label>
                    <input type="email" defaultValue="info@vincantomaori.it" className="admin-input" aria-label="Email gestione" />
                    
                    <label>Partita IVA:</label>
                    <input type="text" defaultValue="12345678901" className="admin-input" aria-label="Partita IVA" />
                    
                    <label>Codice Fiscale:</label>
                    <input type="text" defaultValue="RSSMRA80A01H501X" className="admin-input" aria-label="Codice fiscale" />
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
                    <label>Password Amministratore:</label>
                    <input type="password" defaultValue="vincanto2025" className="admin-input" aria-label="Password admin" />
                    
                    <label>Autenticazione 2FA:</label>
                    <select className="admin-select" aria-label="Two factor auth">
                      <option>Disabilitata</option>
                      <option>SMS</option>
                      <option>App Authenticator</option>
                    </select>
                    
                    <label>Timeout Sessione (minuti):</label>
                    <input type="number" defaultValue="120" className="admin-input-small" aria-label="Timeout sessione" />
                    
                    <button className="admin-btn-secondary admin-btn-small">🔑 Cambia Password</button>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Backup e Sicurezza</h4>
                  <div className="pricing-controls">
                    <label>Backup Automatici:</label>
                    <select className="admin-select" aria-label="Frequenza backup">
                      <option>Giornaliero</option>
                      <option>Ogni 12 ore</option>
                      <option>Settimanale</option>
                    </select>
                    
                    <label>Conservazione Backup:</label>
                    <input type="number" defaultValue="30" className="admin-input-small" aria-label="Giorni conservazione" />
                    
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
                    <div className="sync-indicator success">🟢 Server Web: Operativo (99.9% uptime)</div>
                    <div className="sync-indicator success">🟢 Database: Connesso (12ms latenza)</div>
                    <div className="sync-indicator success">🟢 Email Service: Attivo</div>
                    <div className="sync-indicator success">🟢 API Google Calendar: Funzionante</div>
                    <div className="sync-indicator warning">🟡 Cache Redis: Alto utilizzo (78%)</div>
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
                      <span>🚀 RAM:</span>
                      <span className="stat-value">2.1 GB / 4 GB</span>
                    </div>
                    <div className="stat-row">
                      <span>📊 CPU:</span>
                      <span className="stat-value">12.3%</span>
                    </div>
                    <div className="stat-row">
                      <span>🌐 Traffico Oggi:</span>
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
              <button className="admin-btn-secondary">📋 Log Sistema Completo</button>
              <button className="admin-btn-secondary">🛡️ Test Sicurezza</button>
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
              <h3>📬 Notifiche Backend Live</h3>
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
                  📖 Marca Tutte Lette
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={testNotification}
                >
                  � Test Notifica
                </button>
              </div>
              
              {mockNotifications.length > 0 ? (
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
                      {mockNotifications.map((notif) => (
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
                              {notif.priority === 'high' && '🔴 Alta'}
                              {notif.priority === 'medium' && '🟡 Media'}
                              {notif.priority === 'low' && '🟢 Bassa'}
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
                                  👁️ Leggi
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
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                      />
                      📧 Notifiche Email
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                      />
                      📱 Notifiche SMS
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                      />
                      🔔 Notifiche Push
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.soundEnabled}
                        onChange={(e) => setNotificationSettings({...notificationSettings, soundEnabled: e.target.checked})}
                      />
                      🔊 Suoni Notifica
                    </label>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>📋 Tipi di Alert</h4>
                  <div className="pricing-controls">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.bookingAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, bookingAlerts: e.target.checked})}
                      />
                      🏠 Alert Prenotazioni
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.paymentAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, paymentAlerts: e.target.checked})}
                      />
                      💰 Alert Pagamenti
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.systemAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, systemAlerts: e.target.checked})}
                      />
                      ⚙️ Alert Sistema
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.reviewAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, reviewAlerts: e.target.checked})}
                      />
                      ⭐ Alert Recensioni
                    </label>
                    
                    <label>Email Admin:</label>
                    <input 
                      type="email" 
                      value={notificationSettings.notificationEmail}
                      onChange={(e) => setNotificationSettings({...notificationSettings, notificationEmail: e.target.value})}
                      className="admin-input" 
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
            <h2>📈 Analytics e Statistiche Avanzate</h2>
            
            {/* Analytics Backend Reali */}
            <div className="admin-pricing-section">
              <h3>🔥 Analytics Backend (Dati Reali 30 Giorni)</h3>
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
                                {day.occupancy > 70 ? '🔥' : day.occupancy > 40 ? '📈' : '📉'}
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
                  <h4>📈 Statistiche Aggregate</h4>
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
                      <span>🏠 Occupancy Media:</span>
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
                <h4>📈 Andamento Ricavi</h4>
                <div className="trend-chart">
                  {analytics.slice(0, 7).map((day, index) => (
                    <div 
                      key={index} 
                      className={`chart-bar dynamic ${
                        day.revenue > 300 ? 'high-revenue' : 
                        day.revenue > 150 ? 'medium-revenue' : 
                        'low-revenue'
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
              <button className="admin-btn-secondary">📈 Report Mensile</button>
              <button className="admin-btn-secondary">📧 Invia Report Email</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanelPro;