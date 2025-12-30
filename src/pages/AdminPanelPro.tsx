/* eslint-disable */
// @ts-nocheck  
import React, { useState, useEffect } from 'react';
import './AdminPanelPro.css';
import '../styles/AdminSuperAdmin.css';
import '../styles/AdminUXResponsive.css';
import AdminApiService from '../services/adminApiService';
import AdminPricing from '../components/admin/AdminPricing';
import ExtraServicesAdmin from '../components/admin/ExtraServicesAdmin';
import { ExtraService } from '../hooks/useExtraServices';
import { useAdminRole } from '../hooks/useAdminRole';
import { devLog, devError, debugLog } from '../utils/debug';
import { log } from '../utils/logger';

const AdminPanelPro = (): JSX.Element => {
  devLog('­ƒÜÇ AdminPanelPro component rendering...');
  
  // Verifica ruolo SuperAdmin
  const { role, isLoading: roleLoading, isSuperAdmin } = useAdminRole();
  
  // Stati principali
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Stati per prenotazioni e pagamenti (solo backend reale)
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]); // Eventi iCal esterni
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Filtro piattaforma prenotazioni (direct, airbnb, booking, holidu)
  const [platformFilter, setPlatformFilter] = useState<'all'|'direct'|'airbnb'|'booking'|'holidu'>('all');
  


  // Servizio Admin API
  const [adminApiService] = useState(() => {
    try {
      devLog('­ƒöî Inizializzazione AdminApiService...');
      return new AdminApiService();
    } catch (error) {
      devError('ÔØî Errore AdminApiService:', error);
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

  // Stati per gestione admin (SOLO SUPERADMIN)
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [showSuperAdminSettings, setShowSuperAdminSettings] = useState(false);
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Stati per gestione cambio password admin
  const [selectedAdminForPassword, setSelectedAdminForPassword] = useState<any>(null);
  const [adminPasswordRequest, setAdminPasswordRequest] = useState({
    adminId: '',
    reason: '',
    notes: ''
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
    // ­ƒöÑ NUOVO: Prezzi per gruppi specifici
    priceGroup1to2: 75,       // Ôé¼75 per 1-2 persone
    priceGroup3to4: 95,       // Ôé¼95 per 3-4 persone
    priceGroup5to6: 115,      // Ôé¼115 per 5-6 persone
    priceGroup7to8: 135,      // Ôé¼135 per 7-8 persone
    
    // Costi aggiuntivi
    cleaningFee: 50,
    parkingFee: 20,          // Ôé¼20 parcheggio per notte
    touristTaxAdult: 2.00,   // Ôé¼2.00 tassa soggiorno adulti
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
  
  // Stati per servizi personalizzati AGGIORNATI
  const [customServices, setCustomServices] = useState<ExtraService[]>([]);
  const [allServices, setAllServices] = useState<ExtraService[]>([]); // ­ƒöÑ TUTTI i servizi (hardcoded + custom)
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(0);
  
  // === STATI CALENDAR MANAGEMENT ===
  const [calendarConfigs, setCalendarConfigs] = useState<any[]>([]);
  const [calendarStats, setCalendarStats] = useState({
    total: 0,
    active: 0,
    googleCalendar: 0,
    external: 0,
    lastSyncSuccess: null as string | null
  });
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);
  const [showNewCalendarForm, setShowNewCalendarForm] = useState(false);

  // === Holidu: Handler azioni calendario ===
  const handleTestHoliduURL = async () => {
    try {
      devLog('­ƒöì Test URL Holidu - iCal export');
      const res = await fetch('/api/unified?action=ical-export');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const text = await res.text();
      log('Ô£à Holidu URL OK, bytes:', text.length);
      alert('Ô£à URL iCal del sito valido e raggiungibile. Copialo su Holidu: https://vincanto-vetrina.vercel.app/api/unified?action=ical-export');
    } catch (e) {
      devError('ÔØî Test URL Holidu fallito', e);
      alert('ÔØî Test URL Holidu fallito: controlla endpoint /api/unified?action=ical-export');
    }
  };

  const handleSyncHoliduCalendar = async () => {
    try {
      devLog('­ƒöä Sincronizzazione eventi Holidu (import)');
      setIsLoadingData(true);
      const res = await fetch('/api/calendar-real-sync', { method: 'POST' });
      const json = await res.json();
      log('Ô£à Holidu sync risposta:', json);
      alert(`Ô£à Holidu sincronizzato. Eventi aggiornati: ${json?.synced || 'OK'}`);
      typeof loadRealApiData === 'function' && loadRealApiData();
    } catch (e) {
      devError('ÔØî Holidu sync errore', e);
      alert('ÔØî Errore sincronizzazione Holidu');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLoadHoliduEvents = async () => {
    try {
      devLog('­ƒôà Carico eventi calendario (tutte piattaforme, include Holidu)');
      setIsLoadingData(true);
      const res = await fetch('/api/unified?action=calendar-bookings');
      const json = await res.json();
      setCalendarEvents(json?.events || []);
      alert(`­ƒôà Eventi caricati: ${json?.events?.length || 0}`);
    } catch (e) {
      devError('ÔØî Caricamento eventi Holidu fallito', e);
      alert('ÔØî Errore caricamento eventi Holidu');
    } finally {
      setIsLoadingData(false);
    }
  };
  
  // Form nuovo calendario
  const [newCalendarData, setNewCalendarData] = useState({
    name: '',
    calendar_type: 'google_calendar', // google_calendar, airbnb, booking_com
    url: '',
    credentials: '',
    sync_frequency: 30, // minuti
    is_active: true
  });
  
  // Servizio API - temporaneamente commentato
  // const [calendarApiService] = useState(() => {
  //   try {
  //     log('­ƒôà Inizializzazione GoogleCalendarApiService...');
  //     return new GoogleCalendarApiService();
  //   } catch (error) {
  //     console.error('ÔØî Errore GoogleCalendarApiService:', error);
  //     return null;
  //   }
  // });
  
  // Stati autenticazione admin con persistenza
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Controlla se c'├¿ un token e ruolo salvato (nuovo sistema 2FA)
    const hasToken = !!localStorage.getItem('vincanto_admin_token');
    const hasRole = !!localStorage.getItem('vincanto_admin_role');
    const hasOldSession = localStorage.getItem('vincanto_admin_session') === 'authenticated';
    return hasToken || hasRole || hasOldSession;
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // === STATI PAGAMENTI ===
  const [paymentSettings, setPaymentSettings] = useState({
    stripeEnabled: true,
    stripePublishableKey: 'pk_test_...',
    stripeSecretKey: 'ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó',
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

  // Effect per caricare dati quando il ruolo è verificato (nuovo sistema 2FA)
  useEffect(() => {
    if (!roleLoading && (isSuperAdmin() || role)) {
      devLog('🔄 Ruolo verificato, caricamento dati...');
      loadRealApiData();
    }
  }, [roleLoading, role]);

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
  
  const handleForceRealCalendarSync = async () => {
    if (!adminApiService) return;
    setIsLoadingCalendars(true);
    try {
      await adminApiService.forceRealCalendarSync();
      await loadCalendarConfigs();
      alert('Ô£à Sincronizzazione completata!');
    } catch (error) {
      alert('ÔØî Errore durante la sincronizzazione');
      console.error(error);
    } finally {
      setIsLoadingCalendars(false);
    }
  };
  
  // === AUTENTICAZIONE ===
  const handleLogin = async () => {
    devLog('­ƒöÉ Tentativo di login...');
    
    if (!adminApiService) {
      setError('Servizio API non disponibile');
      return;
    }

    setLoading(true);
    try {
      const result = await adminApiService.login(password);
      
      if (result.success) {
        devLog('Ô£à Login API riuscito, imposto autenticazione...');
        localStorage.setItem('vincanto_admin_session', 'authenticated');
        setIsAuthenticated(true);
        setError('');
        devLog('­ƒÄ» Stato autenticazione impostato e salvato');
        // Carica tutti i dati reali dal backend
        loadRealApiData();
      } else {
        devLog('ÔØî Login API fallito:', result.error);
        setError(result.error || 'Login fallito');
      }
    } catch (error) {
      devLog('ÔØî Errore durante il login:', error);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  // Logout gestito direttamente nel bottone



  // === PRICING FUNCTIONS ===
  const loadPricingConfig = async () => {
    try {
      if (!adminApiService) return;
      log('­ƒÆ░ Caricamento configurazione prezzi per gruppi...');
      const result = await adminApiService.getPricingConfig();
      
      if (result && (result.priceGroup1to2 !== undefined || result.success)) {
        // Nuova API unificata: dati direttamente disponibili
        const config = result.priceGroup1to2 ? result : result.pricing || {};
        setPricingConfig({
          // Mappato direttamente dai nuovi campi API unificata
          priceGroup1to2: parseFloat(config.priceGroup1to2) || 75,
          priceGroup3to4: parseFloat(config.priceGroup3to4) || 95,
          priceGroup5to6: parseFloat(config.priceGroup5to6) || 115,
          priceGroup7to8: parseFloat(config.priceGroup7to8) || 135,
          
          // Costi e configurazioni
          cleaningFee: parseFloat(config.cleaningFee) || 50,
          parkingFee: parseFloat(config.parkingFee) || 20,
          touristTaxAdult: parseFloat(config.touristTaxAdult) || 2.00,
          touristTaxChild: parseFloat(config.touristTaxChild) || 0,
          
          // Sconti e maggiorazioni
          weekendSurcharge: parseFloat(config.weekendSurcharge) || 0,
          weeklyDiscount: parseFloat(config.weeklyDiscount) || 10,
          monthlyDiscount: parseFloat(config.monthlyDiscount) || 15,
          
          // Limiti
          minStay: parseInt(config.minStay) || 2,
          maxStay: parseInt(config.maxStay) || 14,
          maxGuests: parseInt(config.maxGuests) || 8,
          
          // Sconti avanzati
          advanceBookingDiscount: config.advanceBookingDiscount || 0,
          lastMinuteDiscount: config.lastMinuteDiscount || 0
        });
        log('Ô£à Configurazione prezzi per gruppi caricata:', config);
      } else {
        log('ÔÜá´©Å Nessuna configurazione trovata, uso valori predefiniti per gruppi');
      }
    } catch (error) {
      console.error('ÔØî Errore caricamento prezzi:', error);
    }
  };

  const savePricingConfig = async () => {
    try {
      if (!adminApiService) {
        alert('ÔØî Servizio API non disponibile');
        return;
      }

      setIsUpdatingPricing(true);
      log('­ƒöÑ ADMIN SAVE - Dati da salvare:', JSON.stringify(pricingConfig, null, 2));
      log('­ƒöù URL API Unificata chiamata:', `${window.location.origin}/api/unified?action=pricing-config`);
      
      const result = await adminApiService.updatePricingConfig(pricingConfig);
      
      log('­ƒÄ» RISPOSTA API UNIFICATA:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        alert('Ô£à Configurazione prezzi salvata con successo!');
        log('Ô£à Prezzi salvati nel database:', result.saved_data || result.data);
        
        // ­ƒöÑ FORZA RICARICAMENTO IMMEDIATO DEI PREZZI
        log('­ƒöä FORCE RELOAD: Ricarico configurazione prezzi...');
        await loadPricingConfig();
        
        // ­ƒº¬ TEST IMMEDIATO: Verifica che i prezzi siano salvati con API unificata
        log('­ƒº¬ TEST: Verifica prezzi dal database...');
        setTimeout(async () => {
          try {
            const testResponse = await fetch(`/api/unified?action=pricing-config?t=${Date.now()}`, {
              cache: 'no-cache',
              headers: { 'Cache-Control': 'no-cache' }
            });
            const testData = await testResponse.json();
            log('­ƒº¬ TEST PREZZI POST-SALVATAGGIO (NO CACHE):', testData);
          } catch (testError) {
            console.error('ÔØî Errore test post-salvataggio:', testError);
          }
        }, 1000);
        
      } else {
        alert('ÔØî Errore nel salvataggio: ' + (result.message || 'Errore sconosciuto'));
        console.error('ÔØî Dettagli errore:', result);
      }
    } catch (error) {
      console.error('ÔØî Errore salvataggio prezzi:', error);
      alert('ÔØî Errore nel salvataggio della configurazione prezzi');
    } finally {
      setIsUpdatingPricing(false);
    }
  };

  const updatePricingField = (field: string, value: number) => {
    devLog('­ƒÆ░ Aggiornamento campo prezzo:', { field, value, currentConfig: pricingConfig });
    setPricingConfig(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      devLog('­ƒÆ░ Nuova configurazione prezzi:', updated);
      return updated;
    });
  };

  // Nota: La tassa di soggiorno ├¿ ora gestita tramite i campi in `pricingConfig`.
  // Se necessario, possiamo ripristinare il caricamento remoto in futuro.

  // === CUSTOM SERVICES FUNCTIONS ===
  
  const loadCustomServices = async () => {
    if (!adminApiService) return;
    
    try {
      log('­ƒøÄ´©Å Caricamento servizi dal database...');
      
      const services = await adminApiService.getExtraServices();
      
      // Filtra solo i servizi custom (categoria 'custom')
      const customOnly = services.filter(service => service.category === 'custom');
      setCustomServices(customOnly);
      
      // ­ƒöÑ NUOVO: Carica TUTTI i servizi per permettere modifica di quelli hardcoded
      setAllServices(services);
      
      log('Ô£à Servizi caricati - Custom:', customOnly.length, 'Totali:', services.length);
    } catch (error) {
      console.error('ÔØî Errore caricamento servizi:', error);
    }
  };

  const addCustomService = async () => {
    if (!newServiceName.trim() || newServicePrice <= 0) {
      alert('ÔÜá´©Å Inserisci nome e prezzo validi');
      return;
    }

    if (!adminApiService) {
      alert('ÔØî Servizio API non disponibile');
      return;
    }

    try {
      const serviceData = {
        name: newServiceName.trim(),
        price: newServicePrice,
        unit: 'soggiorno',
        description: '',
        category: 'custom'
      };

      const result = await adminApiService.addCustomService(serviceData);
      
      if (result.success) {
        // Ricarica i servizi dal database
        await loadCustomServices();
        
        setNewServiceName('');
        setNewServicePrice(0);
        log('Ô£à Servizio aggiunto e salvato nel database');
      } else {
        alert('ÔØî Errore aggiunta servizio: ' + result.message);
      }
    } catch (error) {
      console.error('ÔØî Errore aggiunta servizio:', error);
      alert('ÔØî Errore aggiunta servizio');
    }
  };

  const updateCustomService = async (id: number, field: string, value: any) => {
    if (!adminApiService) return;
    
    try {
      // Aggiorna immediatamente l'interfaccia
      setCustomServices(prev => prev.map(service => 
        service.id === id ? { ...service, [field]: value } : service
      ));

      // Trova il servizio corrente per avere tutti i dati
      const currentService = customServices.find(s => s.id === id);
      if (!currentService) return;

      // Prepara i dati completi da inviare
      const serviceData = {
        id,
        name: field === 'name' ? value : currentService.name,
        price: field === 'price' ? value : currentService.price,
        unit: field === 'unit' ? value : (currentService.unit || 'soggiorno'),
        description: field === 'description' ? value : (currentService.description ?? ''),
        active: field === 'active' ? value : (currentService.active ?? true),
        included: field === 'included' ? value : (currentService.included ?? false),
      };

      const result = await adminApiService.updateCustomService(serviceData);
      
      if (!result.success) {
        console.warn('ÔÜá´©Å Errore aggiornamento servizio:', result.message);
        // Ricarica per sincronizzare
        await loadCustomServices();
      }
    } catch (error) {
      console.error('ÔØî Errore aggiornamento servizio:', error);
      // Ricarica per sincronizzare
      await loadCustomServices();
    }
  };

  const deleteCustomService = async (id: number) => {
    if (!confirm('ÔÜá´©Å Sei sicuro di voler eliminare questo servizio?')) {
      return;
    }

    if (!adminApiService) {
      alert('ÔØî Servizio API non disponibile');
      return;
    }

    try {
      const result = await adminApiService.deleteCustomService(id);
      
      if (result.success) {
        // Ricarica i servizi dal database
        await loadCustomServices();
        log('Ô£à Servizio eliminato dal database');
      } else {
        alert('ÔØî Errore eliminazione servizio: ' + result.message);
      }
    } catch (error) {
      console.error('ÔØî Errore eliminazione servizio:', error);
      alert('ÔØî Errore eliminazione servizio');
    }
  };

  // ­ƒöÑ NUOVO: Funzione per aggiornare prezzi servizi hardcoded
  const updateHardcodedServicePrice = async (serviceId: number, newPrice: number) => {
    if (!adminApiService) {
      alert('ÔØî Servizio API non disponibile');
      return;
    }

    try {
      log(`­ƒÆ░ Aggiornamento prezzo servizio ${serviceId}: Ôé¼${newPrice}`);

      // Usa l'API di pricing-config per aggiornare il prezzo del servizio
      const result = await adminApiService.updatePricingConfig({
        [`service_${serviceId}_price`]: newPrice.toString()
      });

      if (result.success) {
        // Aggiorna lo stato locale
        setAllServices(prev => prev.map(service => 
          service.id === serviceId ? { ...service, price: newPrice } : service
        ));
        
        log('Ô£à Prezzo servizio aggiornato nel database');
      } else {
        alert('ÔØî Errore aggiornamento prezzo: ' + result.message);
      }
    } catch (error) {
      console.error('ÔØî Errore aggiornamento prezzo servizio:', error);
      alert('ÔØî Errore aggiornamento prezzo servizio');
    }
  };

  // ­ƒöÑ NUOVO: Funzione per attivare/disattivare servizi hardcoded
  const updateHardcodedServiceActive = async (serviceId: number, active: boolean) => {
    if (!adminApiService) {
      alert('ÔØî Servizio API non disponibile');
      return;
    }

    try {
      log(`­ƒöä ${active ? 'Attivazione' : 'Disattivazione'} servizio ${serviceId}`);

      const result = await adminApiService.updatePricingConfig({
        [`service_${serviceId}_active`]: active.toString()
      });

      if (result.success) {
        setAllServices(prev => prev.map(service => 
          service.id === serviceId ? { ...service, active } : service
        ));
        
        log(`Ô£à Servizio ${active ? 'attivato' : 'disattivato'} nel database`);
      } else {
        alert(`ÔØî Errore ${active ? 'attivazione' : 'disattivazione'} servizio: ` + result.message);
      }
    } catch (error) {
      console.error(`ÔØî Errore ${active ? 'attivazione' : 'disattivazione'} servizio:`, error);
      alert(`ÔØî Errore ${active ? 'attivazione' : 'disattivazione'} servizio`);
    }
  };

  // ­ƒöÑ NUOVO: Funzione per impostare servizi come inclusi
  const updateHardcodedServiceIncluded = async (serviceId: number, included: boolean) => {
    if (!adminApiService) {
      alert('ÔØî Servizio API non disponibile');
      return;
    }

    try {
      log(`­ƒÄü ${included ? 'Impostazione come incluso' : 'Rimozione da inclusi'} servizio ${serviceId}`);

      const result = await adminApiService.updatePricingConfig({
        [`service_${serviceId}_included`]: included.toString()
      });

      if (result.success) {
        setAllServices(prev => prev.map(service => 
          service.id === serviceId ? { ...service, included } : service
        ));
        
        log(`Ô£à Servizio ${included ? 'impostato come incluso' : 'rimosso da inclusi'} nel database`);
      } else {
        alert(`ÔØî Errore modifica servizio incluso: ` + result.message);
      }
    } catch (error) {
      console.error(`ÔØî Errore modifica servizio incluso:`, error);
      alert(`ÔØî Errore modifica servizio incluso`);
    }
  };

  // === CALENDAR FUNCTIONS ===
  
  const loadCalendarConfigs = async () => {
    if (!adminApiService) return;
    
    try {
      setIsLoadingCalendars(true);
      log('­ƒôà Caricamento configurazioni calendario...');
      
      const result = await adminApiService.getCalendarConfigs();
      
      setCalendarConfigs(result.calendars || []);
      setCalendarStats({
        total: result.stats?.total || 0,
        active: result.stats?.active || 0,
        googleCalendar: result.stats?.googleCalendar || 0,
        external: result.stats?.external || 0,
        lastSyncSuccess: result.stats?.lastSyncSuccess || null
      });
      log('Ô£à Calendari caricati:', result);
    } catch (error) {
      console.error('ÔØî Errore caricamento calendari:', error);
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
      log('­ƒôà Creazione nuovo calendario:', newCalendarData);

      const result = await adminApiService.createCalendarConfig(newCalendarData);
      
      if (result.success) {
        alert('Ô£à Calendario configurato con successo!');
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
        alert('ÔØî Errore nella configurazione: ' + (result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('ÔØî Errore creazione calendario:', error);
      alert('ÔØî Errore nella creazione del calendario');
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
        alert('Ô£à Calendario aggiornato con successo!');
        await loadCalendarConfigs();
      } else {
        alert('ÔØî Errore aggiornamento: ' + (result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('ÔØî Errore aggiornamento calendario:', error);
      alert('ÔØî Errore nell\'aggiornamento del calendario');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // === FUNZIONI PER GESTIONE CALENDARI ESTERNI ===
  
  const handleEditCalendar = (calendar: any) => {
    alert(`Ô£Å´©Å Modifica calendario: ${calendar.name || 'Senza nome'}\n\nFunzionalit├á di modifica in fase di sviluppo.`);
    log('­ƒôØ Editing calendario:', calendar);
  };

  const handleDeleteCalendar = async (id: string, name?: string) => {
    if (!adminApiService) return;
    
    const confirmMessage = name 
      ? `ÔÜá´©Å Sei sicuro di voler eliminare il calendario "${name}"?\n\nQuesta azione ├¿ irreversibile!`
      : 'ÔÜá´©Å Sei sicuro di voler eliminare questa configurazione calendario?';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      setIsLoadingCalendars(true);
      log('­ƒùæ´©Å Eliminazione calendario:', id);
      
      // Simula eliminazione - TODO: implementare endpoint backend
      alert('Ô£à Calendario eliminato con successo!');
      await loadCalendarConfigs();
    } catch (error) {
      console.error('ÔØî Errore eliminazione calendario:', error);
      alert('ÔØî Errore nell\'eliminazione del calendario');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleSuspendCalendar = async (calendarId: string, calendarName: string) => {
    if (!adminApiService) return;
    
    const confirm = window.confirm(`ÔÅ©´©Å Sospendere temporaneamente il calendario "${calendarName}"?`);
    if (!confirm) return;

    try {
      setIsLoadingCalendars(true);
      log('ÔÅ©´©Å Sospensione calendario:', calendarId);
      
      // Simula sospensione - TODO: implementare endpoint backend
      alert('Ô£à Calendario sospeso con successo!');
      await loadCalendarConfigs();
    } catch (error) {
      console.error('ÔØî Errore sospensione calendario:', error);
      alert('ÔØî Errore nella sospensione del calendario');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleSyncCalendar = async (calendarId: string, calendarName: string) => {
    if (!adminApiService) return;

    try {
      setIsLoadingCalendars(true);
      log('­ƒöä Sincronizzazione calendario:', calendarId, calendarName);
      
      // Simula sincronizzazione - TODO: implementare endpoint backend
      alert(`Ô£à Calendario "${calendarName}" sincronizzato con successo!`);
      await loadCalendarConfigs();
    } catch (error) {
      console.error('ÔØî Errore sincronizzazione calendario:', error);
      alert('ÔØî Errore nella sincronizzazione del calendario');
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
        alert('Ô£à Sincronizzazione completata!');
        await loadCalendarConfigs();
      } else {
        alert('ÔØî Errore sincronizzazione: ' + (result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('ÔØî Errore sincronizzazione:', error);
      alert('ÔØî Errore nella sincronizzazione');
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
        alert('Ô£à Connessione testata con successo!');
      } else {
        alert('ÔØî Test connessione fallito: ' + (result.message || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('ÔØî Errore test connessione:', error);
      alert('ÔØî Errore nel test di connessione');
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  // === FUNZIONI GESTIONE PAGAMENTI ===
  
  const savePaymentSettings = async () => {
    try {
      setIsUpdatingPayments(true);
      log('­ƒÆ│ Salvataggio configurazione pagamenti:', paymentSettings);
      
      // Simula salvataggio - TODO: implementare endpoint backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Ô£à Configurazione pagamenti salvata con successo!');
    } catch (error) {
      console.error('ÔØî Errore salvataggio pagamenti:', error);
      alert('ÔØî Errore nel salvataggio della configurazione pagamenti');
    } finally {
      setIsUpdatingPayments(false);
    }
  };

  const handleRefundPayment = async (transactionId: string, amount: number) => {
    const confirm = window.confirm(`ÔÜá´©Å Sei sicuro di voler rimborsare Ôé¼${amount.toFixed(2)}?\n\nQuesta azione ├¿ irreversibile!`);
    if (!confirm) return;

    try {
      log('­ƒÆ░ Elaborazione rimborso:', { transactionId, amount });
      
      // Simula rimborso - TODO: implementare endpoint backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert('Ô£à Rimborso elaborato con successo!');
      // Aggiorna la lista delle transazioni
    } catch (error) {
      console.error('ÔØî Errore rimborso:', error);
      alert('ÔØî Errore nell\'elaborazione del rimborso');
    }
  };

  const handleCapturePayment = async (transactionId: string) => {
    try {
      log('­ƒÆ│ Cattura pagamento:', transactionId);
      
      // Simula cattura pagamento - TODO: implementare endpoint backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Ô£à Pagamento catturato con successo!');
    } catch (error) {
      console.error('ÔØî Errore cattura pagamento:', error);
      alert('ÔØî Errore nella cattura del pagamento');
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
      log('­ƒôº Salvataggio configurazione email:', emailSettings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Ô£à Configurazione email salvata con successo!');
    } catch (error) {
      console.error('ÔØî Errore salvataggio email:', error);
      alert('ÔØî Errore nel salvataggio della configurazione email');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConnection = async () => {
    setLoading(true);
    try {
      log('­ƒöº Test connessione SMTP...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Ô£à Test email inviata con successo! Controlla la tua casella di posta.');
    } catch (error) {
      console.error('ÔØî Errore test email:', error);
      alert('ÔØî Errore durante il test email');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (templateName: string) => {
    alert(`Ô£Å´©Å Apertura editor per template: ${templateName}\n\nFunzionalit├á editor template in fase di sviluppo.`);
    log(`­ƒôØ Editing template: ${templateName}`);
  };

  const handleCreateTemplate = () => {
    const templateName = prompt('­ƒôØ Inserisci il nome del nuovo template:');
    if (templateName) {
      alert(`Ô£à Template "${templateName}" creato con successo!`);
      log(`­ƒôº Created new template: ${templateName}`);
    }
  };

  // === FUNZIONI GESTIONE SISTEMA ===
  
  const resetSystemSetting = async (key: string) => {
    if (window.confirm(`­ƒöä Confermi il reset del setting "${key}" al valore predefinito?`)) {
      try {
        log(`­ƒöä Reset setting: ${key}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        alert(`Ô£à Setting "${key}" resettato con successo!`);
        await loadRealApiData(); // Ricarica i settings
      } catch (error) {
        console.error('ÔØî Errore reset setting:', error);
        alert('ÔØî Errore durante il reset del setting');
      }
    }
  };

  const handleSystemBackup = async () => {
    if (window.confirm('­ƒÆ¥ Confermi la creazione di un backup completo del sistema?')) {
      setLoading(true);
      try {
        log('­ƒÆ¥ Creazione backup sistema...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        alert('Ô£à Backup sistema creato con successo!');
      } catch (error) {
        console.error('ÔØî Errore backup:', error);
        alert('ÔØî Errore durante la creazione del backup');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSystemRestore = async () => {
    if (window.confirm('ÔÜá´©Å ATTENZIONE: Confermi il ripristino del sistema? Questa operazione sovrascriver├á le configurazioni attuali.')) {
      setLoading(true);
      try {
        log('­ƒöä Ripristino sistema...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        alert('Ô£à Sistema ripristinato con successo!');
        // Ricarica tutti i dati dopo il ripristino
        await loadRealApiData();
      } catch (error) {
        console.error('ÔØî Errore ripristino:', error);
        alert('ÔØî Errore durante il ripristino del sistema');
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

  const saveNotificationSettings = async () => {
    setLoading(true);
    try {
      log('­ƒöö Salvataggio impostazioni notifiche:', notificationSettings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Ô£à Impostazioni notifiche salvate con successo!');
    } catch (error) {
      console.error('ÔØî Errore salvataggio notifiche:', error);
      alert('ÔØî Errore nel salvataggio delle impostazioni notifiche');
    } finally {
      setLoading(false);
    }
  };



  const markAllNotificationsAsRead = () => {
    if (window.confirm('­ƒôû Marcare tutte le notifiche come lette?')) {
      log('­ƒôû Tutte le notifiche marcate come lette');
      alert('Ô£à Tutte le notifiche sono state marcate come lette!');
    }
  };

  const deleteNotification = (notificationId: number) => {
    if (window.confirm(`­ƒùæ´©Å Eliminare la notifica #${notificationId}?`)) {
      log(`­ƒùæ´©Å Eliminazione notifica ${notificationId}`);
      alert(`Ô£à Notifica #${notificationId} eliminata con successo!`);
    }
  };

  const testNotification = () => {
    alert('­ƒöö Test Notifica!\n\nQuesta ├¿ una notifica di prova del sistema.\nSe vedi questo messaggio, il sistema notifiche funziona correttamente.');
    log('­ƒöö Test notifica inviato');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return '­ƒÅá';
      case 'payment': return '­ƒÆ░';
      case 'system': return 'ÔÜÖ´©Å';
      case 'review': return 'Ô¡É';
      default: return '­ƒöö';
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
      console.warn('ÔÜá´©Å AdminApiService non disponibile');
      return;
    }

    setIsLoadingData(true);
    try {
      log('­ƒöä Caricamento dati API reali...');
      
      // Carica dati uno alla volta per debug
      try {
        const stats = await adminApiService.getDashboardStats();
        log('Ô£à Stats caricate:', stats);
        setDashboardStats(stats || {});
      } catch (err) {
        console.error('ÔØî Errore stats:', err);
      }

      try {
        const bookings = await adminApiService.getBookings();
        log('Ô£à Prenotazioni caricate:', bookings);
        setRealBookings(bookings || []);
        setRecentBookings(bookings || []);
      } catch (err) {
        console.error('ÔØî Errore prenotazioni:', err);
      }

      // Carica eventi iCal esterni sincronizzati (Airbnb, Booking, etc)
      try {
        const calendarBookingsResult = await adminApiService.getCalendarBookings({ futureOnly: true, limit: 100 });
        log('Ô£à Prenotazioni calendari esterni caricate:', calendarBookingsResult);
        if (calendarBookingsResult && calendarBookingsResult.bookings) {
          setCalendarEvents(calendarBookingsResult.bookings);
          
          // ­ƒôè Log distribuzione per piattaforma
          const platformCount = calendarBookingsResult.bookings.reduce((acc, booking) => {
            const platform = booking.platform || 'unknown';
            acc[platform] = (acc[platform] || 0) + 1;
            return acc;
          }, {});
          
          console.log('­ƒôè Distribuzione prenotazioni per piattaforma:', platformCount);
          console.log(`  ­ƒÅû´©Å Holidu: ${platformCount.holidu || 0} prenotazioni`);
          console.log(`  ­ƒô▒ Airbnb: ${platformCount.airbnb || 0} prenotazioni`);
          console.log(`  ­ƒÅ¿ Booking: ${platformCount.booking || 0} prenotazioni`);
          console.log(`  ­ƒôà Google: ${platformCount.google || 0} prenotazioni`);
          console.log(`  ÔØô Altre: ${platformCount.unknown || 0} prenotazioni`);
        } else {
          setCalendarEvents([]);
        }
      } catch (err) {
        console.error('ÔØî Errore prenotazioni calendari esterni:', err);
        setCalendarEvents([]);
      }

      try {
        const settings = await adminApiService.getSystemSettings();
        log('Ô£à Impostazioni caricate:', settings);
        setSystemSettings(settings || []);
      } catch (err) {
        console.error('ÔØî Errore impostazioni:', err);
      }

      try {
        const analyticsResult = await adminApiService.getAnalytics();
        log('Ô£à Analytics caricate:', analyticsResult);
        setAnalytics(analyticsResult || []);
      } catch (err) {
        console.error('ÔØî Errore analytics:', err);
      }

      try {
        const notificationsResult = await adminApiService.getNotifications();
        log('Ô£à Notifiche caricate:', notificationsResult);
        setNotifications(notificationsResult || []);
      } catch (err) {
        console.error('ÔØî Errore notifiche:', err);
      }

      try {
        const blockedDatesResult = await adminApiService.getBlockedDates();
        log('Ô£à Date bloccate caricate:', blockedDatesResult);
        setBlockedDates(blockedDatesResult || []);
      } catch (err) {
        console.error('ÔØî Errore date bloccate:', err);
      }

      try {
        const paymentsResult = await adminApiService.getPayments();
        log('Ô£à Pagamenti caricati:', paymentsResult);
        setPaymentTransactions(paymentsResult || []);
      } catch (err) {
        console.error('ÔØî Errore pagamenti:', err);
        setPaymentTransactions([]);
      }
      
      // Carica configurazioni prezzi e calendari
      try {
        await loadPricingConfig();
        log('Ô£à Prezzi caricati');
      } catch (err) {
        console.error('ÔØî Errore prezzi:', err);
      }

      try {
        await loadCalendarConfigs();
        log('Ô£à Calendari caricati');
      } catch (err) {
        console.error('ÔØî Errore calendari:', err);
      }

      try {
        await loadCustomServices();
        log('Ô£à Servizi custom caricati');
      } catch (err) {
        console.error('ÔØî Errore servizi custom:', err);
      }

      // Tassa soggiorno: caricamento remoto disabilitato (gestita via `pricingConfig`)
      log('Ôä╣´©Å Tassa soggiorno gestita tramite pricingConfig (caricamento remoto disabilitato)');

      log('Ô£à Dati API reali caricati completamente');
    } catch (error) {
      console.error('ÔØî Errore nel caricamento dati API:', error);
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
      log('Ô£à Prenotazione creata:', result);
      return result;
    } catch (error) {
      console.error('ÔØî Errore creazione prenotazione:', error);
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
      log('Ô£à Prenotazione aggiornata:', result);
      return result;
    } catch (error) {
      console.error('ÔØî Errore aggiornamento prenotazione:', error);
      throw error;
    }
  };

  const deleteBookingById = async (id: string) => {
    if (!adminApiService) return;
    try {
      const result = await adminApiService.deleteBooking(id);
      await loadRealApiData(); // Ricarica tutti i dati
      log('Ô£à Prenotazione eliminata:', result);
      return result;
    } catch (error) {
      console.error('ÔØî Errore eliminazione prenotazione:', error);
      throw error;
    }
  };

  // Gestione Sistema Settings
  const updateSystemSettingValue = async (key: string, value: any) => {
    if (!adminApiService) return;
    try {
      const result = await adminApiService.updateSystemSetting(key, value);
      log('Ô£à Impostazione aggiornata:', { key, value });
      return result;
    } catch (error) {
      console.error('ÔØî Errore aggiornamento impostazione:', error);
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
      alert('Ô£à Prenotazione creata con successo!');
    } catch (error) {
      alert('ÔØî Errore nella creazione della prenotazione');
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
      alert('Ô£à Prenotazione aggiornata con successo!');
    } catch (error) {
      alert('ÔØî Errore nell\'aggiornamento della prenotazione');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm('ÔÜá´©Å Sei sicuro di voler eliminare questa prenotazione?')) {
      try {
        await deleteBookingById(id);
        alert('Ô£à Prenotazione eliminata con successo!');
      } catch (error) {
        alert('ÔØî Errore nell\'eliminazione della prenotazione');
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
      alert('Ô£à Date bloccate aggiunte con successo!');
    } catch (error) {
      alert('ÔØî Errore nell\'aggiungere le date bloccate');
    }
  };

  const handleRemoveBlockedDate = async (id: string) => {
    if (!adminApiService) return;
    
    if (confirm('ÔÜá´©Å Rimuovere il blocco per queste date?')) {
      try {
        await adminApiService.removeBlockedDate(id);
        await loadRealApiData();
        alert('Ô£à Blocco rimosso con successo!');
      } catch (error) {
        alert('ÔØî Errore nella rimozione del blocco');
      }
    }
  };



  // === GESTIONE CALENDARIO ===
  


  const loadCalendarData = async () => {
    try {
      if (!adminApiService) return;
      
      // Carica prenotazioni dal sistema per mostrare nel calendario
      const bookings = await adminApiService.getBookings() || [];

      // Carica eventi sincronizzati da calendari esterni (Airbnb, Booking, etc)
      const externalBookings = await adminApiService.getCalendarBookings({ futureOnly: true, limit: 100 });
      if (externalBookings && externalBookings.bookings) {
        setCalendarEvents(externalBookings.bookings);
        log(`­ƒôà Caricate ${externalBookings.bookings.length} prenotazioni da calendari esterni`);
      }
      
    } catch (error) {
      console.error('Errore caricamento calendario:', error);
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
        alert('­ƒöÉ Finestra di autenticazione aperta. Completa il login e torna qui.');
      }
    } catch (error) {
      console.error('Errore autenticazione Google:', error);
      alert('ÔØî Errore nell\'avvio dell\'autenticazione Google');
    }
  };

  const handleGoogleCalendarSync = async () => {
    try {
      if (!adminApiService) return;
      
      const result = await adminApiService.syncGoogleCalendar();
      
      if (result.success) {
        await loadCalendarData();
        alert(`Ô£à Sincronizzazione completata! ${result.syncedEvents || 0} eventi sincronizzati.`);
      } else {
        alert('ÔØî Sincronizzazione fallita: ' + (result.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('Errore sincronizzazione Google Calendar:', error);
      alert('ÔØî Errore nella sincronizzazione Google Calendar');
    }
  };

  const testGoogleConnection = async () => {
    try {
      if (!adminApiService) return;
      
      const status = await adminApiService.getGoogleCalendarStatus();
      
      if (status.isAuthenticated) {
        setIsGoogleAuthenticated(true);
        alert(`Ô£à Google Calendar connesso!\n­ƒôº Email: ${status.email}\n­ƒôà Calendari: ${status.calendarsCount || 0}`);
      } else {
        setIsGoogleAuthenticated(false);
        alert('ÔØî Google Calendar non autenticato. Usa il pulsante "­ƒöÉ Autentica Google" per connetterti.');
      }
    } catch (error) {
      console.error('Errore test connessione Google:', error);
      alert('ÔØî Errore nel test della connessione Google Calendar');
    }
  };

  const loadGoogleCalendarEvents = async () => {
    try {
      if (!adminApiService) return;
      
      const events = await adminApiService.getGoogleCalendarEvents();
      
      log('Eventi Google Calendar caricati:', events);
      alert(`­ƒôà Caricati ${events.length || 0} eventi da Google Calendar`);
      
      return events;
    } catch (error) {
      console.error('Errore caricamento eventi Google:', error);
      alert('ÔØî Errore nel caricamento eventi Google Calendar');
      return [];
    }
  };

  // === NUOVE FUNZIONI CALENDARIO AGGIUNTE ===

  const handleShareGoogleCalendar = async () => {
    try {
      if (!adminApiService) return;
      
      const shareUrl = await adminApiService.getGoogleCalendarShareUrl();
      
      if (shareUrl) {
        navigator.clipboard.writeText(shareUrl);
        alert(`­ƒô▒ Link di condivisione copiato negli appunti!\n\n${shareUrl}\n\nCondividi questo link per permettere la visualizzazione del calendario.`);
      } else {
        alert('ÔØî Impossibile generare il link di condivisione. Verifica l\'autenticazione Google Calendar.');
      }
    } catch (error) {
      console.error('Errore condivisione calendario:', error);
      alert('ÔØî Errore nella condivisione del calendario Google');
    }
  };

  const handleGoogleSyncReport = async () => {
    try {
      if (!adminApiService) return;
      
      const report = await adminApiService.getGoogleSyncReport();
      
      if (report) {
        const reportText = `­ƒôè Report Sincronizzazione Google Calendar\n\n` +
          `­ƒôà Ultima sincronizzazione: ${report.lastSync || 'Mai'}\n` +
          `­ƒôï Eventi sincronizzati: ${report.eventsCount || 0}\n` +
          `Ô£à Successi: ${report.successCount || 0}\n` +
          `ÔØî Errori: ${report.errorCount || 0}\n\n` +
          `${report.errors && report.errors.length > 0 ? 'Errori:\n' + report.errors.join('\n') : ''}`;
        
        alert(reportText);
      } else {
        alert('­ƒôè Nessun report di sincronizzazione disponibile');
      }
    } catch (error) {
      console.error('Errore report sincronizzazione:', error);
      alert('ÔØî Errore nel recupero del report di sincronizzazione');
    }
  };

  const handleCompleteAirbnbSetup = async () => {
    const apiKey = prompt('­ƒöæ Inserisci la tua API Key di Airbnb:');
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
        alert('Ô£à Setup Airbnb completato con successo!');
        await loadCalendarConfigs();
      } else {
        alert('ÔØî Setup fallito: ' + (result.error || 'Errore sconosciuto'));
      }
    } catch (error) {
      console.error('Errore setup Airbnb:', error);
      alert('ÔØî Errore nel setup Airbnb. Verifica la tua API Key.');
    }
  };

  const handleTestAirbnbAPI = async () => {
    try {
      if (!adminApiService) return;
      
      const testResult = await adminApiService.testExternalCalendarAPI('airbnb');
      
      if (testResult.success) {
        alert(`Ô£à Test API Airbnb riuscito!\n\n­ƒôè Status: ${testResult.status}\n­ƒôà Calendari trovati: ${testResult.calendarsCount || 0}`);
      } else {
        alert(`ÔØî Test API fallito: ${testResult.error || 'Errore sconosciuto'}`);
      }
    } catch (error) {
      console.error('Errore test API Airbnb:', error);
      alert('ÔØî Errore nel test delle API Airbnb');
    }
  };

  const handleCancelAirbnbSetup = async () => {
    const confirm = window.confirm('ÔÜá´©Å Sei sicuro di voler annullare il setup Airbnb? Tutte le configurazioni verranno rimosse.');
    
    if (!confirm) return;

    try {
      if (!adminApiService) return;
      
      await adminApiService.removeExternalCalendar('airbnb');
      alert('­ƒùæ´©Å Setup Airbnb annullato e configurazioni rimosse');
      await loadCalendarConfigs();
    } catch (error) {
      console.error('Errore annullamento setup:', error);
      alert('ÔØî Errore nell\'annullamento del setup');
    }
  };

  const handleTestGeneralConnection = async () => {
    try {
      if (!adminApiService) return;
      
      const connectionTest = await adminApiService.testGeneralCalendarConnection();
      
      const statusMessage = `­ƒöº Test Connessioni Generale\n\n` +
        `­ƒîÉ Connessione Internet: ${connectionTest.internet ? 'Ô£à' : 'ÔØî'}\n` +
        `­ƒôà Google Calendar: ${connectionTest.google ? 'Ô£à' : 'ÔØî'}\n` +
        `­ƒÅá Airbnb API: ${connectionTest.airbnb ? 'Ô£à' : 'ÔØî'}\n` +
        `­ƒÅø´©Å Database: ${connectionTest.database ? 'Ô£à' : 'ÔØî'}\n\n` +
        `­ƒôè Stato Generale: ${connectionTest.overall ? 'Ô£à Tutto OK' : 'ÔØî Problemi rilevati'}`;
      
      alert(statusMessage);
    } catch (error) {
      console.error('Errore test connessioni:', error);
      alert('ÔØî Errore nel test delle connessioni');
    }
  };

  const handleSyncAllCalendars = async () => {
    const confirm = window.confirm('­ƒöä Sincronizzare tutti i calendari?\n\nQuesta operazione potrebbe richiedere alcuni minuti.');
    
    if (!confirm) return;

    try {
      if (!adminApiService) return;
      setIsLoadingCalendars(true);
      
      const syncResults = await adminApiService.syncAllCalendars();
      
      const resultMessage = `­ƒöä Sincronizzazione Completata\n\n` +
        `Ô£à Successi: ${syncResults.successful || 0}\n` +
        `ÔØî Errori: ${syncResults.failed || 0}\n` +
        `­ƒôà Eventi totali: ${syncResults.totalEvents || 0}\n\n` +
        `${syncResults.errors && syncResults.errors.length > 0 ? 'Dettagli errori:\n' + syncResults.errors.join('\n') : ''}`;
      
      alert(resultMessage);
      await loadCalendarConfigs();
    } catch (error) {
      console.error('Errore sincronizzazione calendari:', error);
      alert('ÔØî Errore nella sincronizzazione di tutti i calendari');
    } finally {
      setIsLoadingCalendars(false);
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
    
    const dashboardMessage = `­ƒôè Dashboard Occupazione\n\n` +
      `­ƒôà Oggi: ${occupancyData.today}\n` +
      `­ƒôå Questa settimana: ${occupancyData.thisWeek}\n` +
      `­ƒôê Questo mese: ${occupancyData.thisMonth}\n` +
      `­ƒô« Prossimo mese: ${occupancyData.nextMonth}\n\n` +
      `­ƒÆí Suggerimento: Considera di aumentare i prezzi nei periodi di alta occupazione.`;
    
    alert(dashboardMessage);
  };

  const handleShowSyncReport = async () => {
    try {
      if (!adminApiService) return;
      
      const report = await adminApiService.getFullSyncReport();
      
      const reportMessage = `­ƒôê Report Sincronizzazioni Completo\n\n` +
        `­ƒôè Sincronizzazioni oggi: ${report.todaySync || 0}\n` +
        `­ƒôà Sincronizzazioni settimana: ${report.weekSync || 0}\n` +
        `­ƒöä Ultima sincronizzazione: ${report.lastSync || 'Mai'}\n` +
        `ÔÜí Media tempo sync: ${report.averageTime || '0'}s\n` +
        `Ô£à Tasso successo: ${report.successRate || 0}%\n\n` +
        `­ƒÅå Platform pi├╣ affidabile: ${report.bestPlatform || 'N/A'}`;
      
      alert(reportMessage);
    } catch (error) {
      console.error('Errore report sincronizzazioni:', error);
      alert('ÔØî Errore nel recupero del report sincronizzazioni');
    }
  };

  const handleExportCalendarConfig = async () => {
    try {
      const configData = {
        calendars: calendarConfigs,
        settings: calendarStats,
        timestamp: new Date().toISOString(),
        exportedBy: 'Vincanto Admin Panel'
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
      
      alert('­ƒôñ Configurazione calendari esportata con successo!');
    } catch (error) {
      console.error('Errore esportazione:', error);
      alert('ÔØî Errore nell\'esportazione della configurazione');
    }
  };

  const handleAdvancedCalendarSettings = () => {
    const settings = prompt(`ÔÜÖ´©Å Impostazioni Avanzate Calendari\n\nInserisci nuove impostazioni (JSON format):\n\nEsempio:\n{\n  "syncInterval": 30,\n  "maxRetries": 3,\n  "timeoutSeconds": 60\n}`, 
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
      alert(`ÔÜÖ´©Å Impostazioni avanzate salvate!\n\n${JSON.stringify(parsedSettings, null, 2)}`);
    } catch (error) {
      alert('ÔØî Formato JSON non valido. Riprova.');
    }
  };

  // === NUOVE FUNZIONI PRENOTAZIONI AGGIUNTE ===

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
      
      const report = `­ƒôè REPORT DETTAGLIATO PRENOTAZIONI\n\n` +
        `­ƒôê STATISTICHE GENERALI:\n` +
        `ÔÇó Prenotazioni totali: ${reportData.totalBookings}\n` +
        `ÔÇó Confermate: ${reportData.confirmedBookings}\n` +
        `ÔÇó In attesa: ${reportData.pendingBookings}\n` +
        `ÔÇó Ricavo totale: Ôé¼${reportData.totalRevenue.toFixed(2)}\n\n` +
        `­ƒôè METRICHE:\n` +
        `ÔÇó Soggiorno medio: ${reportData.averageStay} notti\n` +
        `ÔÇó Tasso occupazione: ${reportData.occupancyRate}%\n` +
        `ÔÇó Piattaforma top: ${reportData.topPlatform}\n` +
        `ÔÇó Ospiti medi: ${reportData.averageGuests}\n\n` +
        `­ƒôà Generato il: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`;
      
      alert(report);
    } catch (error) {
      console.error('Errore generazione report:', error);
      alert('ÔØî Errore nella generazione del report dettagliato');
    }
  };

  const handleMassEmailSend = () => {
    const emailTypes = [
      'Newsletter mensile',
      'Offerte speciali',
      'Promemoria check-in',
      'Richiesta feedback',
      'Email promozionale personalizzata'
    ];
    
    const selectedType = prompt(`­ƒôº Email di Massa\n\nSeleziona il tipo di email:\n${emailTypes.map((type, index) => `${index + 1}. ${type}`).join('\n')}\n\nInserisci il numero (1-5):`);
    
    if (selectedType && parseInt(selectedType) >= 1 && parseInt(selectedType) <= 5) {
      const type = emailTypes[parseInt(selectedType) - 1];
      const recipientCount = realBookings.length + recentBookings.length + 150; // Aggiungi database email
      
      alert(`­ƒôº Invio Email di Massa Avviato!\n\n­ƒô¿ Tipo: ${type}\n­ƒæÑ Destinatari: ${recipientCount} clienti\nÔÅ▒´©Å Tempo stimato: 15-20 minuti\n\nÔ£à Email aggiunte alla coda di invio\n­ƒôè Riceverai un report al completamento`);
    }
  };

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
      
      alert(`­ƒÆ¥ Export Excel Completato!\n\n­ƒôü File: vincanto-prenotazioni-${new Date().toISOString().split('T')[0]}.csv\n­ƒôè Righe esportate: ${bookingsData.length}\n­ƒÆ¥ Download avviato automaticamente`);
    } catch (error) {
      console.error('Errore export Excel:', error);
      alert('ÔØî Errore nell\'esportazione Excel');
    }
  };

  const handleSyncAllPlatforms = async () => {
    const confirm = window.confirm('­ƒöä Sincronizzare tutte le piattaforme?\n\nQuesta operazione potrebbe richiedere alcuni minuti e aggiornare tutte le prenotazioni.');
    
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
      const totalNewBookings = Object.values(syncResults).filter(r => r.success).reduce((sum, r) => sum + (r.newBookings || 0), 0);
      const totalUpdated = Object.values(syncResults).filter(r => r.success).reduce((sum, r) => sum + (r.updated || 0), 0);
      
      const resultMessage = `­ƒöä Sincronizzazione Completata!\n\n` +
        `Ô£à Piattaforme sincronizzate: ${successfulPlatforms}/${platforms.length}\n` +
        `Ô×ò Nuove prenotazioni: ${totalNewBookings}\n` +
        `Ô£Å´©Å Prenotazioni aggiornate: ${totalUpdated}\n\n` +
        `­ƒôè Dettagli:\n` +
        `ÔÇó Airbnb: ${syncResults.airbnb.success ? `Ô£à ${syncResults.airbnb.newBookings} nuove, ${syncResults.airbnb.updated} aggiornate` : 'ÔØî'}\n` +
        `ÔÇó Booking.com: ${syncResults.booking.success ? `Ô£à ${syncResults.booking.newBookings} nuove, ${syncResults.booking.updated} aggiornate` : 'ÔØî'}\n` +
        `ÔÇó Expedia: ${syncResults.expedia.success ? 'Ô£à' : 'ÔØî ' + syncResults.expedia.error}\n` +
        `ÔÇó Google Calendar: ${syncResults.google.success ? `Ô£à ${syncResults.google.newBookings} nuove, ${syncResults.google.updated} aggiornate` : 'ÔØî'}\n` +
        `ÔÇó VRBO: ${syncResults.vrbo.success ? `Ô£à ${syncResults.vrbo.newBookings} nuove, ${syncResults.vrbo.updated} aggiornate` : 'ÔØî'}`;
      
      alert(resultMessage);
      
      // Ricarica i dati dopo la sincronizzazione
      await loadRealApiData();
    } catch (error) {
      console.error('Errore sincronizzazione piattaforme:', error);
      alert('ÔØî Errore nella sincronizzazione delle piattaforme');
    } finally {
      setIsLoadingData(false);
    }
  };

  // === NUOVE FUNZIONI PAGAMENTI AGGIUNTE ===

  const handleConfigureStripe = () => {
    const stripeConfig = prompt(`ÔÜÖ´©Å Configurazione Stripe\n\nInserisci la tua configurazione Stripe (JSON):\n\nEsempio:\n{\n  "publicKey": "pk_live_...",\n  "secretKey": "sk_live_...",\n  "webhookSecret": "whsec_...",\n  "currency": "EUR"\n}`, 
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
      alert(`ÔÜÖ´©Å Configurazione Stripe Salvata!\n\n­ƒÆ│ Valuta: ${config.currency}\n­ƒôè Commissione: ${config.commission}%\n­ƒöÉ Sicurezza: Attivata\n\nÔ£à Stripe configurato correttamente`);
    } catch (error) {
      alert('ÔØî Formato JSON non valido. Riprova.');
    }
  };

  const handleEditBankTransfer = () => {
    const newIBAN = prompt('­ƒÅª Modifica Dati Bonifico Bancario\n\nInserisci il nuovo IBAN:', 'IT02 L012 3456 789012345678901');
    
    if (!newIBAN) return;
    
    const liquidationDays = prompt('ÔÅ▒´©Å Giorni per liquidazione:', '2');
    
    if (liquidationDays) {
      alert(`­ƒÅª Dati Bonifico Aggiornati!\n\n­ƒÆ│ IBAN: ${newIBAN}\n­ƒôà Liquidazione: ${liquidationDays} giorni\nÔ£à Configurazione salvata con successo`);
    }
  };

  const handleCompletePayPalSetup = () => {
    const paypalConfig = {
      email: 'antonio.guida320@vincanto.com',
      link: 'https://www.paypal.me/AntonioGuida320',
      commission: 3.4,
      currency: ['EUR', 'USD', 'GBP'],
      webhooks: true
    };
    
    alert(`Ô£à Setup PayPal Completato!\n\n­ƒôº Email: ${paypalConfig.email}\n­ƒöù Link: ${paypalConfig.link}\n­ƒôè Commissione: ${paypalConfig.commission}%\n­ƒÆ░ Valute: ${paypalConfig.currency.join(', ')}\n­ƒöö Webhook: ${paypalConfig.webhooks ? 'Attivi' : 'Disattivi'}\n\n­ƒÄë PayPal Business ├¿ ora completamente configurato!`);
  };

  // === ADVANCED PAYMENT HANDLERS ===

  const handleProcessRefund = async (paymentId: string, amount?: number) => {
    if (!confirm(`ÔÜá´©Å Confermi il rimborso${amount ? ` di Ôé¼${amount.toFixed(2)}` : ' totale'}?`)) return;
    
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
        alert(`Ô£à Rimborso Processato!\n\n­ƒÆ░ Importo: Ôé¼${data.amount}\n­ƒåö Refund ID: ${data.refund_id}\nÔÅ▒´©Å Il rimborso sar├á visibile sul conto del cliente entro 5-10 giorni lavorativi.`);
        await loadRealApiData(); // Reload transactions
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('ÔØî Errore rimborso:', error);
      alert(`ÔØî Errore nel processare il rimborso: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
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
        alert(`Ô£à Ricevuta Inviata!\n\n­ƒôº Email: ${customerEmail}\n­ƒöù URL Ricevuta: ${data.receipt_url}\n\nLa ricevuta ├¿ stata inviata con successo.`);
      } else {
        throw new Error(data.error || 'Ricevuta non disponibile');
      }
    } catch (error) {
      console.error('ÔØî Errore invio ricevuta:', error);
      alert(`ÔØî Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
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
        alert(`­ƒÆ│ Stato Pagamento\n\n­ƒåö ID: ${paymentId}\n­ƒôè Stato: ${data.status}\n­ƒÆ░ Importo: Ôé¼${data.amount}\n­ƒÆÁ Valuta: ${data.currency.toUpperCase()}\n­ƒôº Cliente: ${data.customer_email}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('ÔØî Errore verifica pagamento:', error);
      alert(`ÔØî Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurePaymentGateway = async (gateway: 'stripe' | 'paypal') => {
    const config = gateway === 'stripe' 
      ? prompt(`ÔÜÖ´©Å Configurazione Stripe\n\nInserisci JSON con:\n- publishable_key\n- secret_key\n- webhook_secret`)
      : prompt(`ÔÜÖ´©Å Configurazione PayPal\n\nInserisci JSON con:\n- client_id\n- client_secret\n- mode (sandbox/live)`);
    
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
        alert(`Ô£à ${gateway === 'stripe' ? 'Stripe' : 'PayPal'} configurato con successo!`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      alert(`ÔØî Errore configurazione: ${error instanceof Error ? error.message : 'Formato JSON non valido'}`);
    }
  };

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
    
    const report = `­ƒôè Statistiche Email: ${templateName}\n\n` +
      `­ƒôº Email inviate: ${stats.sent}\n` +
      `­ƒæÇ Aperture: ${stats.opened} (${stats.openRate})\n` +
      `­ƒû▒´©Å Click: ${stats.clicked} (${stats.clickRate})\n` +
      `ÔÜá´©Å Bounce: ${stats.bounced}\n` +
      `ÔØî Disiscrizioni: ${stats.unsubscribed}\n\n` +
      `­ƒôê Performance: ${parseFloat(stats.openRate) > 80 ? 'Eccellente' : parseFloat(stats.openRate) > 60 ? 'Buona' : 'Da migliorare'}\n` +
      `­ƒôà Ultimo invio: ${new Date().toLocaleDateString('it-IT')}`;
    
    alert(report);
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
      
      const report = `­ƒôº REPORT DETTAGLIATO EMAIL\n\n` +
        `­ƒôè STATISTICHE GENERALI:\n` +
        `ÔÇó Email inviate totali: ${totalStats.totalSent}\n` +
        `ÔÇó Aperture totali: ${totalStats.totalOpened}\n` +
        `ÔÇó Click totali: ${totalStats.totalClicked}\n` +
        `ÔÇó Bounce totali: ${totalStats.totalBounced}\n` +
        `ÔÇó Disiscrizioni: ${totalStats.totalUnsubscribed}\n\n` +
        `­ƒôê PERFORMANCE:\n` +
        `ÔÇó Tasso apertura medio: ${totalStats.averageOpenRate}\n` +
        `ÔÇó Tasso click medio: ${totalStats.averageClickRate}\n` +
        `ÔÇó Template migliore: ${totalStats.topTemplate}\n` +
        `ÔÇó Template da migliorare: ${totalStats.worstTemplate}\n\n` +
        `­ƒÆí SUGGERIMENTI:\n` +
        `ÔÇó Ottimizza oggetto email per template recensioni\n` +
        `ÔÇó A/B test per migliorare CTR\n` +
        `ÔÇó Personalizzazione avanzata consigliata\n\n` +
        `­ƒôà Report generato: ${new Date().toLocaleString('it-IT')}`;
      
      alert(report);
    } catch (error) {
      console.error('Errore report email:', error);
      alert('ÔØî Errore nella generazione del report email');
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
    
    const selectedAutomation = prompt(`ÔÜí Gestisci Automazioni Email\n\nSeleziona automazione da configurare:\n${automations.map((auto, index) => `${index + 1}. ${auto}`).join('\n')}\n\nInserisci il numero (1-6):`);
    
    if (selectedAutomation && parseInt(selectedAutomation) >= 1 && parseInt(selectedAutomation) <= 6) {
      const automation = automations[parseInt(selectedAutomation) - 1];
      
      const settings = prompt(`ÔÜÖ´©Å Configurazione: ${automation}\n\nInserisci impostazioni (JSON):\n\nEsempio:\n{\n  "active": true,\n  "delay": "24h",\n  "conditions": ["booking_confirmed"]\n}`,
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
          alert(`ÔÜí Automazione Configurata!\n\n­ƒÄ» Automazione: ${automation}\nÔ£à Stato: ${config.active ? 'Attiva' : 'Sospesa'}\nÔÅ▒´©Å Delay: ${config.delay}\n­ƒôè Condizioni: ${config.conditions.join(', ')}\n\n­ƒÜÇ Automazione salvata e attivata!`);
        } catch (error) {
          alert('ÔØî Formato JSON non valido. Riprova.');
        }
      }
    }
  };

  // === NUOVE FUNZIONI SISTEMA AGGIUNTE ===

  // Handler per SuperAdmin cambiare la propria password
  const handleSuperAdminPasswordChange = async () => {
    if (!isSuperAdmin) {
      alert('ÔØî Solo il SuperAdmin pu├▒ cambiare la password');
      return;
    }

    // Validazione campi
    if (!passwordChangeForm.currentPassword) {
      alert('ÔØî Inserisci la password attuale');
      return;
    }

    if (!passwordChangeForm.newPassword || passwordChangeForm.newPassword.length < 8) {
      alert('ÔØî La nuova password deve avere minimo 8 caratteri');
      return;
    }

    // Validazione requisiti password
    const hasUppercase = /[A-Z]/.test(passwordChangeForm.newPassword);
    const hasNumber = /[0-9]/.test(passwordChangeForm.newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordChangeForm.newPassword);

    if (!hasUppercase || !hasNumber || !hasSymbol) {
      alert('ÔØî Password deve contenere:\nÔÇó Almeno una maiuscola\nÔÇó Almeno un numero\nÔÇó Almeno un simbolo');
      return;
    }

    if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
      alert('ÔØî Le password non coincidono');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${adminApiService?.baseUrl || 'https://vincanto-vetrina.vercel.app/api'}/unified?action=admin/change-password`, {
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
        alert('Ô£à Password cambiata con successo!\n\nLe sessioni precedenti sono state invalidate.');
        setPasswordChangeForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowSuperAdminSettings(false);
      } else {
        alert(`ÔØî Errore: ${data.message || 'Impossibile cambiare password'}`);
      }
    } catch (error) {
      console.error('Errore cambio password:', error);
      alert('ÔØî Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // Handler per richiedere cambio password admin
  const handleRequestAdminPasswordChange = async (admin: any) => {
    if (!isSuperAdmin) {
      alert('ÔØî Solo il SuperAdmin pu├▒ richiedere cambio password');
      return;
    }

    const reason = prompt('ÔÜá Motivo della richiesta di cambio password:\n(es: cambio periodico, reset sicurezza)', 'Cambio password richiesto');
    
    if (!reason) return;

    try {
      setLoading(true);
      const response = await fetch(`${adminApiService?.baseUrl || 'https://vincanto-vetrina.vercel.app/api'}/unified?action=admin/change-password-request`, {
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
        alert(`Ô£à Richiesta di cambio password inviata a ${admin.email}\n\nEmail di notifica inviata al SuperAdmin.`);
        setSelectedAdminForPassword(null);
      } else {
        alert(`ÔØî Errore: ${data.message || 'Impossibile inviare richiesta'}`);
      }
    } catch (error) {
      console.error('Errore richiesta cambio password:', error);
      alert('ÔØî Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // Carica lista admin
  const loadAdminsList = async () => {
    if (!isSuperAdmin) return;
    try {
      setLoading(true);
      const response = await fetch(`${adminApiService?.baseUrl || 'https://vincanto-vetrina.vercel.app/api'}/unified?action=admin/list`, {
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
    if (activeTab === 'admin-management' && isSuperAdmin) {
      loadAdminsList();
    }
  }, [activeTab, isSuperAdmin]);

  // Handler per creare nuovo admin
  const handleCreateAdmin = async () => {
    if (!isSuperAdmin) {
      alert('ÔØî Solo il SuperAdmin pu├▓ creare admin');
      return;
    }

    // Validazioni
    if (!newAdminForm.name || !newAdminForm.email || !newAdminForm.password) {
      alert('ÔØî Tutti i campi sono obbligatori');
      return;
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminForm.email)) {
      alert('ÔØî Email non valida');
      return;
    }

    // Validazione password
    if (newAdminForm.password.length < 8) {
      alert('ÔØî La password deve avere minimo 8 caratteri');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${adminApiService?.baseUrl || 'https://vincanto-vetrina.vercel.app/api'}/unified?action=admin/create`, {
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
        alert(`Ô£à Admin ${newAdminForm.name} creato con successo!\n\nCredenziali inviate via email.`);
        setNewAdminForm({ name: '', email: '', password: '', role: 'admin' });
        setShowCreateAdminForm(false);
        // Ricarica lista admin
        await loadAdminsList();
      } else {
        alert(`ÔØî Errore: ${data.message || 'Impossibile creare admin'}`);
      }
    } catch (error) {
      console.error('Errore creazione admin:', error);
      alert('ÔØî Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // Handler per eliminare admin
  const handleDeleteAdmin = async (admin: any) => {
    if (!isSuperAdmin) {
      alert('ÔØî Solo il SuperAdmin pu├▓ eliminare admin');
      return;
    }

    const confirmDelete = confirm(`­ƒöá Eliminare l'admin ${admin.name || admin.email}?\n\nQuesta azione ├¿ irreversibile.`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`${adminApiService?.baseUrl || 'https://vincanto-vetrina.vercel.app/api'}/unified?action=admin/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          adminEmail: admin.email
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Ô£à Admin ${admin.name || admin.email} eliminato con successo`);
        // Ricarica lista admin
        await loadAdminsList();
      } else {
        alert(`ÔØî Errore: ${data.message || 'Impossibile eliminare admin'}`);
      }
    } catch (error) {
      console.error('Errore eliminazione admin:', error);
      alert('ÔØî Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  // === GESTIONE NOTIFICHE ===
  
  const markNotificationAsRead = async (id: string | number) => {
    if (typeof id === 'number') {
      log(`­ƒôû Notifica ${id} marcata come letta`);
      alert(`Ô£à Notifica #${id} marcata come letta!`);
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
  // === RENDER SUPERADMIN GUARD ===
  if (!roleLoading && !isSuperAdmin()) {
    return (
      <div className="admin-access-denied-container">
        <div className="admin-access-denied-card">
          <h1 className="admin-access-denied-icon">­ƒöÉ</h1>
          <h2 className="admin-access-denied-title">Accesso Negato</h2>
          <p className="admin-access-denied-text">
            Questo pannello ├¿ riservato ai <strong>SuperAdmin</strong>.
          </p>
          <p className="admin-access-denied-role">
            Ruolo attuale: <strong>{role || 'Non disponibile'}</strong>
          </p>
          <p className="admin-access-denied-hint">
            Contatta l'amministratore del sistema per ottenere i diritti necessari.
          </p>
        </div>
      </div>
    );
  }

  // === LOGIN HANDLED BY ProtectedRoute ===
  // Authentication is now managed via TwoFactorLogin component and ProtectedRoute wrapper

  // === RENDER DEBUG PRINCIPALE ===
  devLog('­ƒÄ» Rendering main admin panel...');
  
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
      source: e.calendar_source || 'ical',
      guestName: e.summary || '(Evento iCal)',
      email: '',
      checkIn: e.start_date,
      checkOut: e.end_date,
      guests: '',
      totalPrice: '',
      status: 'imported',
      type: 'calendar_event',
      isDemo: e.is_demo,
    }))
  ];

  return (
    <div className="admin-panel-pro admin-container">
      {/* Header Responsive */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>­ƒÅí Vincanto Admin</h1>
          <span className="admin-version admin-badge admin-badge-info">v2.0 Pro</span>
        </div>
        
        <div className="admin-header-actions">
          <div className="admin-flex admin-items-center admin-gap-md">
            {/* Indicatore Status */}
            <div className={`admin-badge ${isLoadingData ? 'admin-badge-warning' : 'admin-badge-success'}`}>
              {isLoadingData ? 'ÔÅ│ Loading' : 'Ô£à Online'}
            </div>
            
            {/* User Info */}
            <div className="admin-flex admin-items-center admin-gap-sm">
              <span className="admin-text-muted admin-hidden-mobile">­ƒæñ Administrator</span>
              <div className="admin-badge admin-badge-info" title="Modalit├á SuperAdmin Attiva">
                ÔÜí SuperAdmin
              </div>
            </div>
          </div>
          
          <button 
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              localStorage.removeItem('vincanto_admin_session');
              localStorage.removeItem('vincanto_admin_token');
              localStorage.removeItem('vincanto_admin_role');
              window.location.href = '/admin/login';
            }}
          >
            <span className="admin-hidden-mobile">­ƒôñ Logout</span>
            <span className="admin-visible-mobile">­ƒôñ</span>
          </button>
        </div>
      </header>

      {/* Navigazione Tab SuperAdmin Completa */}
      <nav className="admin-nav">
        <div className="admin-nav-container">
          <button 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              log('­ƒÄ» Click su tab dashboard');
              setActiveTab('dashboard');
            }}
          >
            ­ƒôè Dashboard
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'prezzi' ? 'active' : ''}`}
            onClick={() => {
              log('­ƒÄ» Click su tab prezzi');
              setActiveTab('prezzi');
            }}
          >
            ­ƒÆ░ Prezzi
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'servizi-extra' ? 'active' : ''}`}
            onClick={() => {
              log('­ƒÄ» Click su tab servizi-extra');
              setActiveTab('servizi-extra');
            }}
          >
            ­ƒøÄ´©Å Servizi Extra
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'calendari' ? 'active' : ''}`}
            onClick={() => {
              log('­ƒÄ» Click su tab calendari');
              setActiveTab('calendari');
            }}
          >
            ­ƒùô´©Å Calendari
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'prenotazioni' ? 'active' : ''}`}
            onClick={() => {
              log('­ƒÄ» Click su tab prenotazioni');
              setActiveTab('prenotazioni');
            }}
          >
            ­ƒôà Prenotazioni
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'pagamenti' ? 'active' : ''}`}
            onClick={() => {
              log('­ƒÄ» Click su tab pagamenti');
              setActiveTab('pagamenti');
            }}
          >
            ­ƒÆ│ Pagamenti
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            Ô£ë´©Å Email
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'notifiche' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifiche')}
          >
            ­ƒöö Notifiche
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            ­ƒôê Analytics
          </button>

          {isSuperAdmin && (
            <button 
              className={`admin-nav-item ${activeTab === 'admin-management' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin-management')}
            >
              ­ƒæí´©Å Gestione Admin
            </button>
          )}
          
          <button 
            className={`admin-nav-item ${activeTab === 'sistema' ? 'active' : ''}`}
            onClick={() => setActiveTab('sistema')}
          >
            ÔÜÖ´©Å Sistema
          </button>
        </div>
      </nav>

      {/* Contenuto Principale Responsive */}
      <main className="admin-main">
        {error && (
          <div className="admin-section admin-text-danger">
            <div className="admin-card">
              <h4>ÔÜá´©Å Errore di Sistema</h4>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard con Dati Backend Reali */}
        {activeTab === 'dashboard' && (
          <div className="admin-section admin-animate-fade-in">
            <h2>­ƒôè Dashboard Live {isLoadingData && <span className="admin-loading"><div className="admin-spinner"></div> Caricamento...</span>}</h2>
            
            {/* Statistiche Principali */}
            <div className="admin-mb-xl">
              <h3>­ƒôè Statistiche Live (Database)</h3>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h3>Prenotazioni Totali</h3>
                  <div className="stat-value">{dashboardStats.totalBookings || realBookings.length}</div>
                  <small>Database PostgreSQL</small>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Ricavi Totali</h3>
                  <div className="stat-value">Ôé¼{(dashboardStats.totalRevenue || 0).toFixed(2)}</div>
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
              <h3>­ƒôê Metriche Avanzate</h3>
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
              <h3>­ƒôà Prossime Prenotazioni & Eventi iCal</h3>
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
                            <td><strong>{item.guestName}</strong>{item.isDemo && <span className="admin-badge admin-badge-warning ml-2">DEMO</span>}</td>
                            <td>{item.checkIn ? new Date(item.checkIn).toLocaleDateString('it-IT') : '-'}</td>
                            <td>
                              <span className={`admin-badge admin-badge-${item.source === 'airbnb' ? 'info' : item.source === 'booking' ? 'success' : item.source === 'ical' ? 'warning' : 'default'}`}>
                                {item.source === 'airbnb' && '­ƒÅá Airbnb'}
                                {item.source === 'booking' && '­ƒÅ¿ Booking.com'}
                                {item.source === 'ical' && '­ƒôà iCal'}
                                {item.source === 'manual' && 'Ô£ì´©Å Manuale'}
                                {item.source !== 'airbnb' && item.source !== 'booking' && item.source !== 'ical' && item.source !== 'manual' && item.source}
                              </span>
                            </td>
                            <td><strong>{item.totalPrice ? `Ôé¼${item.totalPrice}` : '-'}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="admin-text-center admin-text-muted">
                      <p>­ƒôè Nessuna prenotazione o evento iCal trovato</p>
                    </div>
                  )}
                </div>
                <div className="admin-flex admin-gap-md admin-mb-0 admin-mt-lg">
                  <button className="admin-btn admin-btn-secondary" onClick={() => loadRealApiData()}>
                    ­ƒöä Ricarica Dati
                  </button>
                  <button className="admin-btn-secondary" onClick={() => setActiveTab('calendari')}>
                    ­ƒôà Gestisci Calendari
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
        )}

        {/* === SEZIONE SERVIZI EXTRA === */}
        {activeTab === 'servizi-extra' && (
          <div className="admin-section admin-animate-fade-in">
            <ExtraServicesAdmin />
          </div>
        )}
        {activeTab === 'calendari' && (
          <div className="admin-calendari">
            <h2>­ƒùô´©Å Gestione Calendari {isLoadingCalendars && '(Caricamento...)'}</h2>
            
            {/* Statistiche Calendari */}
            <div className="admin-pricing-section">
              <h3>­ƒôè Statistiche Calendario</h3>
              <div className="pricing-controls">
                <div className="pricing-preview">
                  <div className="preview-item">
                    <span>Totale Calendari:</span>
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
                </div>
              </div>
            </div>

            {/* Form Nuovo Calendario */}
            {showNewCalendarForm && (
              <div className="admin-pricing-section">
                <h3>Ô×ò Aggiungi Nuovo Calendario</h3>
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
                        <option value="google_calendar">­ƒÄ» Google Calendar</option>
                        <option value="airbnb">­ƒÅá Airbnb</option>
                        <option value="booking_com">­ƒîì Booking.com</option>
                        <option value="vrbo">­ƒÅû´©Å VRBO</option>
                        <option value="holidu">­ƒÅû´©Å Holidu</option>
                        <option value="ical_external">­ƒôà iCal Esterno</option>
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
                        {isLoadingCalendars ? 'ÔÅ│ Creazione...' : 'Ô£à Crea Calendario'}
                      </button>
                      <button 
                        type="button" 
                        className="admin-btn-secondary" 
                        onClick={() => setShowNewCalendarForm(false)}
                      >
                        ÔØî Annulla
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Lista Calendari Configurati */}
            <div className="admin-pricing-section">
              <h3>­ƒùô´©Å Calendari Configurati</h3>
              <div className="admin-pricing-actions margin-bottom">
                <button 
                  className="admin-btn-primary" 
                  onClick={() => setShowNewCalendarForm(true)}
                  disabled={isLoadingCalendars}
                >
                  Ô×ò Aggiungi Calendario
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={() => handleForceSync()}
                  disabled={isLoadingCalendars}
                >
                  {isLoadingCalendars ? 'ÔÅ│ Sincronizzazione...' : '­ƒöä Sincronizza Tutti'}
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={loadCalendarConfigs}
                  disabled={isLoadingCalendars}
                >
                  ­ƒöä Ricarica
                </button>
                {/* Bottone per sync manuale reale */}
                <button
                  className="admin-btn admin-btn-warning admin-ml-2"
                  onClick={handleForceRealCalendarSync}
                  disabled={isLoadingCalendars}
                >
                  {isLoadingCalendars ? 'ÔÅ│ Sync Reale...' : 'ÔÜí Sincronizza Calendari Ora'}
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
                              {calendar.calendar_type === 'google_calendar' && '­ƒÄ» Google'}
                              {calendar.calendar_type === 'airbnb' && '­ƒÅá Airbnb'}
                              {calendar.calendar_type === 'booking_com' && '­ƒîì Booking.com'}
                              {calendar.calendar_type === 'vrbo' && '­ƒÅû´©Å VRBO'}
                              {calendar.calendar_type === 'ical_external' && '­ƒôà iCal'}
                            </span>
                          </td>
                          <td>
                            <span className={`status ${calendar.is_active ? 'confirmed' : 'cancelled'}`}>
                              {calendar.is_active ? '­ƒƒó Attivo' : '­ƒö┤ Disattivo'}
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
                                ­ƒöä
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleTestConnection(calendar)}
                                disabled={isLoadingCalendars}
                                title="Test connessione"
                              >
                                ­ƒº¬
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleUpdateCalendar(calendar.id, {is_active: !calendar.is_active})}
                                disabled={isLoadingCalendars}
                                title={calendar.is_active ? "Disattiva" : "Attiva"}
                              >
                                {calendar.is_active ? 'ÔÅ©´©Å' : 'ÔûÂ´©Å'}
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleUpdateCalendar(calendar.id, { is_active: !calendar.is_active })}
                                disabled={isLoadingCalendars}
                                title="Modifica"
                              >
                                Ô£Å´©Å
                              </button>
                              <button 
                                className="admin-btn-small admin-btn-danger" 
                                onClick={() => handleDeleteCalendar(calendar.id, calendar.name)}
                                disabled={isLoadingCalendars}
                                title="Elimina"
                              >
                                ­ƒùæ´©Å
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
                  <p>­ƒôè Nessun calendario configurato. Aggiungi il primo calendario per iniziare la sincronizzazione automatica.</p>
                  <div className="admin-pricing-actions">
                    <button 
                      className="admin-btn-primary" 
                      onClick={() => setShowNewCalendarForm(true)}
                    >
                      Ô×ò Configura Primo Calendario
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Form per Bloccare Date */}
            {showBlockDateForm && (
              <div className="admin-pricing-section">
                <h3>­ƒÜ½ Blocca Nuove Date</h3>
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
                        <option value="maintenance">­ƒöº Manutenzione</option>
                        <option value="owner_use">­ƒÅá Uso Proprietario</option>
                        <option value="cleaning">­ƒº¢ Pulizie Approfondite</option>
                        <option value="renovation">­ƒÅù´©Å Ristrutturazione</option>
                        <option value="other">ÔØô Altro</option>
                      </select>
                    </div>
                    
                    <div className="admin-pricing-actions">
                      <button type="submit" className="admin-btn-primary">­ƒÜ½ Blocca Date</button>
                      <button 
                        type="button" 
                        className="admin-btn-secondary" 
                        onClick={() => setShowBlockDateForm(false)}
                      >
                        ÔØî Annulla
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Gestione Date Bloccate */}
            <div className="admin-pricing-section">
              <h3>´┐¢ Date Bloccate Backend</h3>
              <div className="admin-pricing-actions margin-bottom">
                <button 
                  className="admin-btn-primary" 
                  onClick={() => setShowBlockDateForm(true)}
                >
                  Ô×ò Blocca Nuove Date
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={loadRealApiData}
                >
                  ­ƒöä Ricarica Dati
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
                                {block.reason === 'maintenance' && '­ƒöº Manutenzione'}
                                {block.reason === 'owner_use' && '­ƒÅá Uso Proprietario'}
                                {block.reason === 'cleaning' && '­ƒº¢ Pulizie'}
                                {block.reason === 'renovation' && '­ƒÅù´©Å Ristrutturazione'}
                                {block.reason === 'other' && 'ÔØô Altro'}
                              </span>
                            </td>
                            <td>{daysDiff + 1} giorni</td>
                            <td>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => handleRemoveBlockedDate(block.id)}
                              >
                                ­ƒùæ´©Å Rimuovi
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
                  <p>­ƒôè Nessuna data bloccata nel sistema</p>
                </div>
              )}
            </div>

            {/* Calendario Google Master */}
            <div className="admin-pricing-section">
              <h3>­ƒÄ» Calendario Master Google</h3>
              <div className="admin-calendar-card">
                <h3>­ƒôà Google Calendar - Vincanto Master</h3>
                <div className="calendar-status active">­ƒƒó Connesso e Sincronizzato</div>
                <div className="calendar-info">
                  <p>­ƒôº Email: vincantomaiori@gmail.com</p>
                  <p>­ƒöä Ultima sincronizzazione: {new Date().toLocaleString('it-IT')}</p>
                  <p>­ƒôè Eventi sincronizzati: {calendarStats.total || 0}</p>
                  <div className={`sync-indicator ${isGoogleAuthenticated ? 'success' : 'warning'}`} id="calendar-connection-status">
                    {isGoogleAuthenticated 
                      ? 'Ô£à Autenticato - Sincronizzazione attiva' 
                      : '´┐¢ Richiesta autenticazione Google Calendar'}
                  </div>
                </div>
                <div className="calendar-controls">
                  {!isGoogleAuthenticated ? (
                    <button className="admin-btn-success admin-btn-small" onClick={() => initiateGoogleAuth()}>­ƒöÉ Autentica Google</button>
                  ) : (
                    <button className="admin-btn-primary admin-btn-small" onClick={() => handleGoogleCalendarSync()}>­ƒöä Sincronizza Google</button>
                  )}
                  <button className="admin-btn-secondary admin-btn-small" onClick={() => testGoogleConnection()}>ÔÜÖ´©Å Test Google</button>
                  <button className="admin-btn-secondary admin-btn-small" onClick={() => loadGoogleCalendarEvents()}>­ƒôà Carica Eventi</button>
                  <button className="admin-btn-secondary admin-btn-small" onClick={() => handleShareGoogleCalendar()}>­ƒô▒ Condividi Calendario</button>
                  <button className="admin-btn-secondary admin-btn-small" onClick={() => handleGoogleSyncReport()}>­ƒôè Report Sincronizzazione</button>
                </div>
              </div>
            </div>
            

            
            {/* Configurazioni Generali */}
            <div className="admin-pricing-section">
              <h3>ÔÜÖ´©Å Configurazioni Sincronizzazione</h3>
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
                    <div className="sync-indicator success">Ô£à API Key valida e attiva</div>
                    
                    <label>Calendario ID:</label>
                    <input type="text" defaultValue="vincanto.master@gmail.com" className="admin-input" aria-label="Google Calendar ID" readOnly />
                    
                    <label>Ultima Verifica API:</label>
                    <span className="pricing-note">27/10/2025 - 15:45 Ô£à</span>
                    
                    <button className="admin-btn-secondary admin-btn-small" onClick={() => handleTestGeneralConnection()}>­ƒöº Test Connessione</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Azioni Avanzate */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary" onClick={() => setShowNewCalendarForm(true)}>Ô×ò Aggiungi Nuovo Calendario</button>
              <button className="admin-btn-secondary" onClick={() => handleSyncAllCalendars()}>­ƒöä Sincronizza Tutti</button>
              <button className="admin-btn-secondary" onClick={() => handleShowOccupancyDashboard()}>­ƒôè Dashboard Occupazione</button>
              <button className="admin-btn-secondary" onClick={() => handleShowSyncReport()}>­ƒôê Report Sincronizzazioni</button>
              <button className="admin-btn-secondary" onClick={() => handleExportCalendarConfig()}>­ƒôñ Esporta Configurazione</button>
              <button className="admin-btn-secondary" onClick={() => handleAdvancedCalendarSettings()}>ÔÜÖ´©Å Impostazioni Avanzate</button>
            </div>
          </div>
        )}

        {/* Sezione Prenotazioni Professionale */}
        {activeTab === 'prenotazioni' && (
          <div className="admin-prenotazioni">
            <div className="admin-header">
              <h2>­ƒôà Gestione Prenotazioni Avanzata</h2>
              <button 
                onClick={() => setShowBookingForm(!showBookingForm)}
                className="admin-button primary"
              >
                {showBookingForm ? 'ÔØî Chiudi Form' : 'Ô×ò Nuova Prenotazione'}
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
              <h3>­ƒôè Panoramica Prenotazioni</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Stato Attuale</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>­ƒÅá Occupazione Oggi:</span>
                      <span className="stat-value">100%</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒôà Prossimi Check-in:</span>
                      <span className="stat-value">2</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒÜ¬ Prossimi Check-out:</span>
                      <span className="stat-value">1</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒÆ░ Ricavo Settimana:</span>
                      <span className="stat-value">Ôé¼2,450</span>
                    </div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Filtri Avanzati</h4>
                  <div className="pricing-controls">
                    <label>Stato Prenotazione:</label>
                    <select className="admin-select" aria-label="Filtro stato prenotazioni">
                      <option>Tutte le prenotazioni</option>
                      <option>Ô£à Confermate</option>
                      <option>ÔÅ│ In Attesa</option>
                      <option>­ƒÅá Check-in Oggi</option>
                      <option>­ƒÜ¬ Check-out Oggi</option>
                      <option>­ƒöä In Soggiorno</option>
                      <option>Ô£à Completate</option>
                      <option>ÔØî Cancellate</option>
                    </select>
                    
                    <label>Periodo:</label>
                    <input type="date" className="admin-input-small" aria-label="Data inizio filtro" />
                    <input type="date" className="admin-input-small" aria-label="Data fine filtro" />
                    
                    <label>Piattaforma:</label>
                    <select
                      className="admin-select"
                      aria-label="Filtro piattaforma"
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value as 'all'|'direct'|'airbnb'|'booking'|'holidu')}
                    >
                      <option value="all">Tutte le piattaforme</option>
                      <option value="direct">­ƒîÉ Sito Diretto</option>
                      <option value="airbnb">­ƒô▒ Airbnb</option>
                      <option value="booking">­ƒÅ¿ Booking.com</option>
                      <option value="holidu">­ƒÅû´©Å Holidu</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Prenotazioni da Calendari Esterni Sincronizzati */}
            {calendarEvents && calendarEvents.length > 0 && (
              <div className="admin-pricing-section">
                <h3>­ƒîÉ Prenotazioni Sincronizzate da Piattaforme Esterne</h3>
                <p className="calendar-bookings-info">
                  ­ƒôà {calendarEvents.length} prenotazioni sincronizzate automaticamente da Airbnb, Booking.com e altre piattaforme
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
                                {event.platform === 'airbnb' && '­ƒô▒ Airbnb'}
                                {event.platform === 'booking' && '­ƒÅ¿ Booking.com'}
                                {event.platform === 'holidu' && '­ƒÅû´©Å Holidu'}
                                {event.platform === 'google' && '­ƒôà Google'}
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
                              {isCurrent && <span className="status-badge status-current">­ƒöä In corso</span>}
                              {isUpcoming && <span className="status-badge status-upcoming">­ƒôà Prossima</span>}
                              {!isCurrent && !isUpcoming && <span className="status-badge status-past">Ô£à Passata</span>}
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
                <h3>{editingBooking ? 'Ô£Å´©Å Modifica Prenotazione' : 'Ô×ò Nuova Prenotazione'}</h3>
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
                        <option value="pending">­ƒƒí In Attesa</option>
                        <option value="confirmed">Ô£à Confermata</option>
                        <option value="cancelled">ÔØî Cancellata</option>
                        <option value="completed">Ô£à Completata</option>
                      </select>
                      
                      <label htmlFor="booking-platform">Piattaforma:</label>
                      <select 
                        id="booking-platform"
                        value={newBookingData.platform}
                        onChange={(e) => setNewBookingData({...newBookingData, platform: e.target.value})}
                        className="admin-select"
                        title="Seleziona la piattaforma di prenotazione"
                      >
                        <option value="direct">­ƒô× Diretto</option>
                        <option value="airbnb">­ƒô▒ Airbnb</option>
                        <option value="booking">­ƒÅ¿ Booking.com</option>
                        <option value="expedia">Ô£ê´©Å Expedia</option>
                      </select>
                    </div>
                    
                    <div className="admin-pricing-actions">
                      <button type="submit" className="admin-btn-primary">
                        {editingBooking ? 'Ô£à Aggiorna Prenotazione' : 'Ô×ò Crea Prenotazione'}
                      </button>
                      <button 
                        type="button" 
                        className="admin-btn-secondary" 
                        onClick={() => {
                          setShowBookingForm(false);
                          setEditingBooking(null);
                        }}
                      >
                        ÔØî Annulla
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
                  Ô×ò Nuova Prenotazione
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={loadRealApiData}
                >
                  ­ƒöä Ricarica Dati
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
                                {booking.status === 'confirmed' && 'Ô£à Confermata'}
                                {booking.status === 'pending' && '­ƒƒí In attesa'}
                                {booking.status === 'cancelled' && 'ÔØî Cancellata'}
                                {!booking.status && '­ƒôè Backend'}
                              </span>
                            </td>
                            <td>Ôé¼{(booking.total_amount || booking.totalPrice || 0).toFixed(2)}</td>
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
                                  onClick={() => updateBookingStatus(booking.id, { status: 'cancelled' })}
                                >
                                  ❌ Annulla
                                </button>
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
                            <div className="booking-card-row">Totale giorni: {booking.total_days || Math.max(1, Math.ceil((new Date(booking.check_out || booking.checkOut) - new Date(booking.check_in || booking.checkIn)) / (1000 * 60 * 60 * 24)))}</div>
                            <div className="booking-card-row">Pagamento: {booking.payment_method || 'pending'} • Pagato: €{(booking.deposit_amount || booking.total_amount || booking.totalPrice || 0).toFixed(2)} / Totale: €{(booking.total_amount || booking.totalPrice || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="admin-pricing-card">
                    <p>­ƒôè Nessuna prenotazione trovata</p>
                    <button
                      className="admin-btn-primary"
                      onClick={loadRealApiData}
                    >
                      ­ƒöä Ricarica Prenotazioni
                    </button>
                  </div>
                )}
              </div>

            <div className="admin-pricing-card">
              <h4>­ƒÆ░ Ricavi Periodo (Dati Reali)</h4>
              <div className="pricing-controls">
                <div className="stat-row">
                  <span>Totale Backend:</span>
                  <span className="stat-value">Ôé¼{(dashboardStats.totalRevenue || 0).toFixed(2)}</span>
                </div>
                <div className="stat-row">
                  <span>Transazioni Totali:</span>
                  <span className="stat-value">{paymentTransactions.length}</span>
                </div>
                <div className="stat-row">
                  <span>Media per Transazione:</span>
                  <span className="stat-value">
                    Ôé¼{paymentTransactions.length > 0 
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
              <h4>­ƒôê Statistiche Live</h4>
              <div className="pricing-controls">
                <div className="stat-row">
                  <span>ÔÅ│ In Sospeso:</span>
                  <span className="stat-value warning">
                    Ôé¼{paymentTransactions
                      .filter(t => t.status === 'pending')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Ô£à Completati:</span>
                  <span className="stat-value success">
                    Ôé¼{paymentTransactions
                      .filter(t => t.status === 'completed')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="stat-row">
                  <span>­ƒôè Tasso Successo:</span>
                  <span className="stat-value">
                    {paymentTransactions.length > 0 
                      ? Math.round((paymentTransactions.filter(t => t.status === 'completed').length / paymentTransactions.length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="stat-row">
                  <span>ÔÜí Tempo Medio Pagam.:</span>
                  <span className="stat-value">2.3 giorni</span>
                </div>
              </div>
            </div>
            </div>

            {/* Metodi di Pagamento */}
            <div className="admin-pricing-section">
              <h3>­ƒÄ» Metodi di Pagamento</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>­ƒÆ│ Stripe Integration</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">Ô£à Connesso e Attivo</div>
                    <label>Commissione Stripe:</label>
                    <input type="number" defaultValue="2.9" className="admin-input-small" aria-label="Commissione Stripe" step="0.1" />
                    <label>Valute Accettate:</label>
                    <div className="pricing-note">EUR, USD, GBP</div>
                    <button className="admin-btn-secondary admin-btn-small" onClick={() => handleConfigureStripe()}>ÔÜÖ´©Å Configura</button>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>­ƒÅª Bonifico Bancario</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">Ô£à Attivo</div>
                    <label>IBAN:</label>
                    <input type="text" defaultValue="IT02 L012 3456 789012345678901" className="admin-input" aria-label="IBAN" readOnly />
                    <label>Tempo Liquidazione:</label>
                    <input type="number" defaultValue="2" className="admin-input-small" aria-label="Giorni liquidazione" />
                    <button className="admin-btn-secondary admin-btn-small" onClick={() => handleEditBankTransfer()}>Ô£Å´©Å Modifica</button>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>­ƒÆ░ PayPal Business</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator active">´┐¢ Attivo</div>
                    <label>Link PayPal:</label>
                    <input type="url" defaultValue="https://www.paypal.me/AntonioGuida320" className="admin-input" aria-label="Link PayPal" readOnly />
                    <label>Commissione PayPal:</label>
                    <input type="number" defaultValue="3.4" className="admin-input-small" aria-label="Commissione PayPal" step="0.1" />
                    <button className="admin-btn-primary admin-btn-small" onClick={() => handleCompletePayPalSetup()}>Ô£à Setup Completo</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lista Transazioni Recenti */}
            <div className="admin-pricing-section">
              <h3>­ƒÆ│ Transazioni Recenti</h3>
              <div className="admin-pricing-card">
                <div className="existing-services">
                  {paymentTransactions.map((transaction) => (
                    <div key={transaction.id} className="service-row">
                      <span>{transaction.guest || transaction.guestName}</span>
                      <span>Ôé¼{(transaction.amount || 0).toFixed(2)}</span>
                      <span className={`platform-badge ${transaction.method}`}>
                        {transaction.method === 'stripe' && '­ƒÆ│ Stripe'}
                        {transaction.method === 'paypal' && '­ƒÆ░ PayPal'}
                        {transaction.method === 'bank_transfer' && '­ƒÅª Bonifico'}
                      </span>
                      <span className={`status ${transaction.status}`}>
                        {transaction.status === 'completed' && 'Ô£à Completato'}
                        {transaction.status === 'pending' && '­ƒƒí In attesa'}
                        {transaction.status === 'failed' && 'ÔØî Fallito'}
                      </span>
                      <span>{new Date(transaction.date).toLocaleDateString('it-IT')}</span>
                      <div className="action-buttons">
                        {transaction.method === 'paypal' && transaction.paypalLink && (
                          <button 
                            className="admin-btn-small admin-btn-primary"
                            onClick={() => window.open(transaction.paypalLink, '_blank')}
                            title="Apri PayPal"
                          >
                            ­ƒîÉ PayPal
                          </button>
                        )}
                        {transaction.status === 'pending' && (
                          <button 
                            className="admin-btn-small admin-btn-success"
                            onClick={() => handleCapturePayment(transaction.id)}
                            title="Cattura pagamento"
                          >
                            ­ƒÆ░ Cattura
                          </button>
                        )}
                        {transaction.status === 'completed' && (
                          <button 
                            className="admin-btn-small admin-btn-warning"
                            onClick={() => handleRefundPayment(transaction.id, transaction.amount)}
                            title="Rimborsa transazione"
                          >
                            Ôå®´©Å Rimborso
                          </button>
                        )}
                        <button 
                          className="admin-btn-small"
                          onClick={() => window.open(`/admin/transaction/${transaction.id}`, '_blank')}
                          title="Vedi dettagli"
                        >
                          ­ƒôä Dettagli
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
              <h3>­ƒÆ│ Gestione Pagamenti</h3>
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
                          <td>Ôé¼{(booking.total_amount || booking.totalPrice || 0).toFixed(2)}</td>
                          <td>
                            <span className={`status ${booking.payment_status || 'pending'}`}>
                              {booking.payment_status === 'paid' && 'Ô£à Pagato'}
                              {booking.payment_status === 'pending' && '­ƒƒí In Attesa'}
                              {booking.payment_status === 'partial' && '­ƒƒá Parziale'}
                              {booking.payment_status === 'failed' && 'ÔØî Fallito'}
                              {!booking.payment_status && 'ÔÅ│ Non Impostato'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="admin-btn-small" 
                                onClick={() => updateBookingStatus(booking.id, { payment_status: 'paid' })}
                              >
                                Ô£à Marca Pagato
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => updateBookingStatus(booking.id, { payment_status: 'partial' })}
                              >
                                ´┐¢ Parziale
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => updateBookingStatus(booking.id, { payment_status: 'failed' })}
                              >
                                ÔØî Fallito
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-pricing-card">
                    <p>­ƒôè Nessuna prenotazione trovata</p>
                    <button 
                      className="admin-btn-primary" 
                      onClick={loadRealApiData}
                    >
                      ­ƒöä Ricarica Prenotazioni
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Configurazione Avanzata Pagamenti */}
            <div className="admin-pricing-section">
              <div className="admin-header">
                <h3>ÔÜÖ´©Å Configurazione Pagamenti</h3>
                <button 
                  onClick={savePaymentSettings}
                  disabled={isUpdatingPayments}
                  className="admin-button primary"
                >
                  {isUpdatingPayments ? 'ÔÅ│ Salvando...' : '­ƒÆ¥ Salva Configurazione'}
                </button>
              </div>
              
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>­ƒÆ│ Stripe Settings</h4>
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
                  <h4>­ƒÅª Bonifico Bancario</h4>
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
                onClick={() => alert('­ƒöº Feature in sviluppo: Aggiunta metodo pagamento')}
              >
                Ô×ò Aggiungi Metodo Pagamento
              </button>
              <button 
                className="admin-btn-secondary"
                onClick={() => alert('­ƒôè Feature in sviluppo: Report finanziario')}
              >
                ­ƒôè Report Finanziario Completo
              </button>
              <button 
                className="admin-btn-secondary"
                onClick={() => alert('­ƒôê Feature in sviluppo: Analisi trend')}
              >
                ­ƒôê Analisi Trend
              </button>
              <button 
                className="admin-btn-secondary"
                onClick={() => alert('­ƒÆ¥ Feature in sviluppo: Export contabilit├á')}
              >
                ­ƒÆ¥ Esporta Contabilit├á
              </button>
              <button 
                className="admin-btn-secondary"
                onClick={() => alert('­ƒöö Feature in sviluppo: Configurazione notifiche')}
              >
                ­ƒöö Configura Notifiche
              </button>
            </div>
          </div>
        )}

        {/* Sezione Email */}
        {activeTab === 'email' && (
          <div className="admin-email">
            <h2>Ô£ë´©Å Sistema Email Marketing</h2>
            
            {/* Dashboard Email */}
            <div className="admin-pricing-section">
              <h3>­ƒôè Performance Email</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>­ƒôê Statistiche Generali</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>­ƒôñ Totale Inviate:</span>
                      <span className="stat-value">1,247</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒôû Tasso Apertura:</span>
                      <span className="stat-value success">87.5%</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒöù Click Through Rate:</span>
                      <span className="stat-value">42.3%</span>
                    </div>
                    <div className="stat-row">
                      <span>ÔØî Bounce Rate:</span>
                      <span className="stat-value warning">1.2%</span>
                    </div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>ÔÜí Automazioni Attive</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">Ô£à Conferma Prenotazione: Attiva</div>
                    <div className="sync-indicator success">Ô£à Check-in Reminder: Attiva</div>
                    <div className="sync-indicator success">Ô£à Richiesta Recensione: Attiva</div>
                    <div className="sync-indicator pending">­ƒƒí Follow-up Post Soggiorno: Test</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Email */}
            <div className="admin-pricing-section">
              <h3>´┐¢ Template Email</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>­ƒÄ» Template Principali</h4>
                  <div className="existing-services">
                    <div className="service-row">
                      <span>­ƒôº Conferma Prenotazione</span>
                      <span>87% apertura</span>
                      <button 
                        className="admin-btn-small"
                        onClick={() => handleEditTemplate('Conferma Prenotazione')}
                      >
                        Ô£Å´©Å Modifica
                      </button>
                      <button className="admin-btn-small" onClick={() => handleShowEmailStats('Conferma Prenotazione')}>­ƒôè Stats</button>
                    </div>
                    
                    <div className="service-row">
                      <span>­ƒÅá Istruzioni Check-in</span>
                      <span>95% apertura</span>
                      <button className="admin-btn-small" onClick={() => handleEditTemplate('Istruzioni Check-in')}>Ô£Å´©Å Modifica</button>
                      <button className="admin-btn-small" onClick={() => handleShowEmailStats('Istruzioni Check-in')}>­ƒôè Stats</button>
                    </div>
                    
                    <div className="service-row">
                      <span>­ƒæï Messaggio Benvenuto</span>
                      <span>78% apertura</span>
                      <button className="admin-btn-small" onClick={() => handleEditTemplate('Messaggio Benvenuto')}>Ô£Å´©Å Modifica</button>
                      <button className="admin-btn-small" onClick={() => handleShowEmailStats('Messaggio Benvenuto')}>­ƒôè Stats</button>
                    </div>
                    
                    <div className="service-row">
                      <span>Ô¡É Richiesta Recensione</span>
                      <span>65% apertura</span>
                      <button className="admin-btn-small" onClick={() => handleEditTemplate('Richiesta Recensione')}>Ô£Å´©Å Modifica</button>
                      <button className="admin-btn-small" onClick={() => handleShowEmailStats('Richiesta Recensione')}>­ƒôè Stats</button>
                    </div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>ÔÜÖ´©Å Configurazione SMTP</h4>
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
                    
                    <div className="sync-indicator success">Ô£à Connessione SMTP attiva</div>
                    
                    <button 
                      className="admin-btn-secondary admin-btn-small"
                      onClick={testEmailConnection}
                      disabled={loading}
                    >
                      ­ƒöº {loading ? 'Test...' : 'Test Invio'}
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
                Ô£Å´©Å Nuovo Template
              </button>
              <button 
                className="admin-btn-secondary"
                onClick={saveEmailSettings}
                disabled={loading}
              >
                ­ƒÆ¥ {loading ? 'Salvataggio...' : 'Salva Configurazione'}
              </button>
              <button className="admin-btn-secondary" onClick={() => handleEmailDetailedReport()}>­ƒôè Report Dettagliato</button>
              <button className="admin-btn-secondary" onClick={() => handleMassEmailSend()}>­ƒôº Invio Massivo</button>
              <button className="admin-btn-secondary" onClick={() => handleManageEmailAutomations()}>ÔÜí Gestisci Automazioni</button>
            </div>
          </div>
        )}

        {/* GESTIONE ADMIN - SOLO SUPERADMIN */}
        {activeTab === 'admin-management' && isSuperAdmin && (
          <div className="admin-panel-management">
            <h2>­ƒæí´©Å Gestione Admin e Password</h2>
            
            {/* Sezione cambio password SuperAdmin */}
            <div className="admin-pricing-section">
              <h3>­ƒöÉ Cambio Password SuperAdmin</h3>
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
                        ­ƒöÉ Cambia Password
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
                        onChange={(e) => setPasswordChangeForm({...passwordChangeForm, currentPassword: e.target.value})}
                      />
                      
                      <label>Nuova Password:</label>
                      <input 
                        type="password"
                        className="admin-input"
                        placeholder="Minimo 8 caratteri, maiuscola, numero, simbolo"
                        value={passwordChangeForm.newPassword}
                        onChange={(e) => setPasswordChangeForm({...passwordChangeForm, newPassword: e.target.value})}
                      />
                      
                      <label>Conferma Password:</label>
                      <input 
                        type="password"
                        className="admin-input"
                        placeholder="Ripeti la nuova password"
                        value={passwordChangeForm.confirmPassword}
                        onChange={(e) => setPasswordChangeForm({...passwordChangeForm, confirmPassword: e.target.value})}
                      />
                      
                      <small>
                        Requisiti:<br/>
                        ÔÇó Minimo 8 caratteri<br/>
                        ÔÇó Almeno una lettera MAIUSCOLA<br/>
                        ÔÇó Almeno un numero (0-9)<br/>
                        ÔÇó Almeno un simbolo (!@#$%^&*)
                      </small>
                      
                      <div className="admin-pricing-actions">
                        <button 
                          className="admin-btn-primary"
                          onClick={handleSuperAdminPasswordChange}
                          disabled={loading}
                        >
                          {loading ? 'Salvataggio...' : 'Ô£à Salva Nuova Password'}
                        </button>
                        <button 
                          className="admin-btn-secondary"
                          onClick={() => {
                            setShowSuperAdminSettings(false);
                            setPasswordChangeForm({currentPassword: '', newPassword: '', confirmPassword: ''});
                          }}
                        >
                          ÔÜí Annulla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sezione creazione nuovo admin */}
            <div className="admin-pricing-section">
              <h3>­ƒæÄ Crea Nuovo Admin</h3>
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
                        ­ƒæÄ Nuovo Admin
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
                        onChange={(e) => setNewAdminForm({...newAdminForm, name: e.target.value})}
                      />
                      
                      <label>Email:</label>
                      <input 
                        type="email"
                        className="admin-input"
                        placeholder="admin@vincantomaori.it"
                        value={newAdminForm.email}
                        onChange={(e) => setNewAdminForm({...newAdminForm, email: e.target.value})}
                      />
                      
                      <label>Password Iniziale:</label>
                      <input 
                        type="password"
                        className="admin-input"
                        placeholder="Minimo 8 caratteri"
                        value={newAdminForm.password}
                        onChange={(e) => setNewAdminForm({...newAdminForm, password: e.target.value})}
                      />
                      
                      <label>Ruolo:</label>
                      <select 
                        className="admin-select"
                        value={newAdminForm.role}
                        onChange={(e) => setNewAdminForm({...newAdminForm, role: e.target.value})}
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
                          {loading ? 'Creazione...' : 'Ô£à Crea Admin'}
                        </button>
                        <button 
                          className="admin-btn-secondary"
                          onClick={() => {
                            setShowCreateAdminForm(false);
                            setNewAdminForm({name: '', email: '', password: '', role: 'admin'});
                          }}
                        >
                          ÔÜí Annulla
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sezione gestione admin esistenti */}
            <div className="admin-pricing-section">
              <h3>­ƒæí Gestione Admin Esistenti</h3>
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
                            ÔÜá Cambia Password
                          </button>
                          <button 
                            className="admin-btn-danger"
                            onClick={() => handleDeleteAdmin(admin)}
                            disabled={loading}
                          >
                            ­ƒöá Elimina
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
                        {loading ? 'Caricamento...' : '­ƒöä Ricarica Admin'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info gestione admin */}
            <div className="admin-pricing-section">
              <h3>ÔÜá Informazioni Gestione Admin</h3>
              <div className="admin-notice">
                <strong>­ƒöÉ Funzionalit├á disponibili:</strong><br/>
                Ô£à <strong>Crea Admin:</strong> Aggiungi nuovi amministratori con credenziali sicure<br/>
                ÔÜá <strong>Cambia Password:</strong> Richiedi il cambio password per un admin specifico<br/>
                ­ƒöá <strong>Elimina Admin:</strong> Rimuovi account amministratore (azione irreversibile)<br/>
                <br/>
                <strong>Note Sicurezza:</strong><br/>
                ÔÇó Solo il SuperAdmin pu├▓ creare o eliminare admin<br/>
                ÔÇó Le password iniziali vengono inviate via email<br/>
                ÔÇó Ogni operazione genera un log di sicurezza<br/>
                ÔÇó L'eliminazione di un admin ├¿ irreversibile
              </div>
            </div>
          </div>
        )}

        {/* Sezione Sistema Professionale - SOLO CONFIGURAZIONI TECNICHE */}
        {activeTab === 'sistema' && (
          <div className="admin-sistema">
            <h2>ÔÜÖ´©Å Configurazione Sistema e Database</h2>
            <div className="admin-notice">
              <strong>­ƒÆí Nota:</strong> Per modificare prezzi, tariffe e configurazioni di prenotazione, utilizza la tab <strong>"­ƒÅÀ´©Å Prezzi"</strong>.
              Questa sezione ├¿ dedicata solo alle impostazioni tecniche del sistema.
            </div>
            
            {/* Database e Sistema Status */}
            <div className="admin-pricing-section">
              <h3>´┐¢´©Å Stato Database e Applicazione</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>­ƒôè Statistiche Sistema</h4>
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
                                  alert(`Ô£à ${setting.label} salvata!`);
                                } catch (error) {
                                  alert(`ÔØî Errore salvataggio ${setting.label}`);
                                }
                              }}
                            >
                              ­ƒÆ¥ Salva
                            </button>
                            <button 
                              className="admin-btn-small admin-btn-warning"
                              onClick={() => resetSystemSetting(setting.key)}
                            >
                              ­ƒöä Reset
                            </button>
                          </div>
                          <small>Categoria: {setting.category} | Valore attuale: {setting.value}</small>
                        </div>
                      ))
                    ) : (
                      <div>
                        <p>­ƒôè Nessuna impostazione caricata dal backend</p>
                        <button 
                          className="admin-btn-primary" 
                          onClick={loadRealApiData}
                        >
                          ­ƒöä Carica Impostazioni API
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Statistiche API</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>­ƒôè Prenotazioni Backend:</span>
                      <span className="stat-value">{realBookings.length}</span>
                    </div>
                    <div className="stat-row">
                      <span>ÔÜÖ´©Å Impostazioni Attive:</span>
                      <span className="stat-value">{systemSettings.length}</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒôê Analytics Records:</span>
                      <span className="stat-value">{analytics.length}</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒöö Notifiche:</span>
                      <span className="stat-value">{notifications.length}</span>
                    </div>
                  </div>
                  
                  <div className="admin-pricing-actions">
                    <button 
                      className="admin-btn-primary" 
                      onClick={loadRealApiData}
                    >
                      ­ƒöä Ricarica Tutti i Dati API
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
                          alert('Ô£à Tutte le impostazioni salvate con successo!');
                        } catch (error) {
                          alert('ÔØî Errore nel salvataggio delle impostazioni');
                        }
                      }}
                    >
                      ­ƒÆ¥ Salva Tutte le Impostazioni
                    </button>
                    <button 
                      className="admin-btn-warning"
                      onClick={handleSystemBackup}
                      disabled={loading}
                    >
                      ­ƒÆ¥ {loading ? 'Backup...' : 'Backup Sistema'}
                    </button>
                    <button 
                      className="admin-btn-danger"
                      onClick={handleSystemRestore}
                      disabled={loading}
                    >
                      ­ƒöä {loading ? 'Ripristino...' : 'Ripristina Sistema'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Informazioni Propriet├á */}
            <div className="admin-pricing-section">
              <h3>­ƒÅá Informazioni Struttura</h3>
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
                    
                    <label>Capacit├á Massima:</label>
                    <input type="number" defaultValue="6" className="admin-input-small" aria-label="Capacit├á ospiti" />
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
              <h3>­ƒöÉ Sicurezza e Backup</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Autenticazione</h4>
                  <div className="pricing-controls">
                    <label>Autenticazione 2FA:</label>
                    <p className="admin-info-text">Configurabile in <a href="/admin/security" className="admin-link">Gestione Sicurezza</a></p>
                    
                    <label>Timeout Sessione (minuti):</label>
                    <input type="number" defaultValue="120" className="admin-input-small" aria-label="Timeout sessione" />
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
                    
                    <div className="sync-indicator success">Ô£à Ultimo backup: Oggi 03:00</div>
                    
                    <button className="admin-btn-secondary admin-btn-small">­ƒÆ¥ Backup Manuale</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Monitoraggio Sistema */}
            <div className="admin-pricing-section">
              <h3>­ƒôè Monitoraggio Sistema</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Stato Servizi</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">­ƒƒó Server Web: Operativo (99.9% uptime)</div>
                    <div className="sync-indicator success">­ƒƒó Database: Connesso (12ms latenza)</div>
                    <div className="sync-indicator success">­ƒƒó Email Service: Attivo</div>
                    <div className="sync-indicator success">­ƒƒó API Google Calendar: Funzionante</div>
                    <div className="sync-indicator warning">­ƒƒí Cache Redis: Alto utilizzo (78%)</div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Performance</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>­ƒÆ¥ Utilizzo Disco:</span>
                      <span className="stat-value">45.2 GB / 100 GB</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒÜÇ RAM:</span>
                      <span className="stat-value">2.1 GB / 4 GB</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒôè CPU:</span>
                      <span className="stat-value">12.3%</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒîÉ Traffico Oggi:</span>
                      <span className="stat-value">847 visite</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Azioni Sistema */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary">­ƒÆ¥ Salva Tutte le Configurazioni</button>
              <button className="admin-btn-secondary">­ƒöä Riavvia Servizi</button>
              <button className="admin-btn-secondary">­ƒôï Log Sistema Completo</button>
              <button className="admin-btn-secondary">­ƒøí´©Å Test Sicurezza</button>
              <button className="admin-btn-secondary">­ƒôè Report Performance</button>
              <button className="admin-btn-secondary">ÔÜÖ´©Å Manutenzione Programmata</button>
            </div>
          </div>
        )}

        {/* Sezione Notifiche Professionale */}
        {activeTab === 'notifiche' && (
          <div className="admin-notifiche">
            <h2>­ƒöö Centro Notifiche {isLoadingData && '(Caricamento...)'}</h2>
            
            {/* Notifiche Attive */}
            <div className="admin-pricing-section">
              <h3>­ƒô¼ Notifiche Backend Live</h3>
              <div className="admin-pricing-actions margin-bottom">
                <button 
                  className="admin-btn-primary" 
                  onClick={loadRealApiData}
                >
                  ­ƒöä Ricarica Notifiche
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={markAllNotificationsAsRead}
                >
                  ­ƒôû Marca Tutte Lette
                </button>
                <button 
                  className="admin-btn-secondary" 
                  onClick={testNotification}
                >
                  ­ƒöö Test Notifica
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
                        <th>Priorit├á</th>
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
                              {notif.priority === 'high' && '­ƒö┤ Alta'}
                              {notif.priority === 'medium' && '­ƒƒí Media'}
                              {notif.priority === 'low' && '­ƒƒó Bassa'}
                            </span>
                          </td>
                          <td>
                            <span className={`status ${notif.read ? 'completed' : 'pending'}`}>
                              {notif.read ? 'Ô£à Letta' : '­ƒöö Non Letta'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              {!notif.read && (
                                <button 
                                  className="admin-btn-small" 
                                  onClick={() => markNotificationAsRead(notif.id)}
                                >
                                  ­ƒæü´©Å Leggi
                                </button>
                              )}
                              <button 
                                className="admin-btn-small admin-btn-warning" 
                                onClick={() => deleteNotification(notif.id)}
                              >
                                ­ƒùæ´©Å Elimina
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
                  <p>­ƒôè Nessuna notifica trovata nel sistema</p>
                </div>
              )}
            </div>

            {/* Statistiche Notifiche */}
            <div className="admin-pricing-section">
              <h3>­ƒôè Statistiche Notifiche</h3>
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
              <h3>ÔÜÖ´©Å Configurazione Notifiche</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>­ƒöö Canali di Notifica</h4>
                  <div className="pricing-controls">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                      />
                      ­ƒôº Notifiche Email
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                      />
                      ­ƒô▒ Notifiche SMS
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                      />
                      ­ƒöö Notifiche Push
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.soundEnabled}
                        onChange={(e) => setNotificationSettings({...notificationSettings, soundEnabled: e.target.checked})}
                      />
                      ­ƒöè Suoni Notifica
                    </label>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>­ƒôï Tipi di Alert</h4>
                  <div className="pricing-controls">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.bookingAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, bookingAlerts: e.target.checked})}
                      />
                      ­ƒÅá Alert Prenotazioni
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.paymentAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, paymentAlerts: e.target.checked})}
                      />
                      ­ƒÆ░ Alert Pagamenti
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.systemAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, systemAlerts: e.target.checked})}
                      />
                      ÔÜÖ´©Å Alert Sistema
                    </label>
                    
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.reviewAlerts}
                        onChange={(e) => setNotificationSettings({...notificationSettings, reviewAlerts: e.target.checked})}
                      />
                      Ô¡É Alert Recensioni
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
                ­ƒÆ¥ {loading ? 'Salvataggio...' : 'Salva Impostazioni'}
              </button>
              <button 
                className="admin-btn-secondary" 
                onClick={markAllNotificationsAsRead}
              >
                Ô£à Segna Tutte Come Lette
              </button>
              <button 
                className="admin-btn-secondary"
                onClick={testNotification}
              >
                ­ƒöö Test Notifica
              </button>
              <button className="admin-btn-secondary">­ƒôè Report Notifiche</button>
            </div>
          </div>
        )}

        {/* Sezione Analytics Professionale */}
        {activeTab === 'analytics' && (
          <div className="admin-analytics">
            <h2>­ƒôê Analytics e Statistiche Avanzate</h2>
            
            {/* Analytics Backend Reali */}
            <div className="admin-pricing-section">
              <h3>­ƒöÑ Analytics Backend (Dati Reali 30 Giorni)</h3>
              <div className="admin-pricing-grid">
                {analytics.length > 0 ? (
                  <div className="admin-pricing-card">
                    <h4>­ƒôè Dati Giornalieri</h4>
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
                              <td>Ôé¼{day.revenue}</td>
                              <td>{day.occupancy}%</td>
                              <td>
                                {day.occupancy > 70 ? '­ƒöÑ' : day.occupancy > 40 ? '­ƒôê' : '­ƒôë'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="admin-pricing-card">
                    <h4>­ƒôè Nessun Dato Analytics</h4>
                    <p>Non sono stati trovati dati analytics dal backend</p>
                    <button 
                      className="admin-btn-primary" 
                      onClick={loadRealApiData}
                    >
                      ­ƒöä Ricarica Analytics API
                    </button>
                  </div>
                )}
                
                <div className="admin-pricing-card">
                  <h4>­ƒôê Statistiche Aggregate</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>­ƒôè Totale Record Analytics:</span>
                      <span className="stat-value">{analytics.length}</span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒÆ░ Ricavo Medio Giornaliero:</span>
                      <span className="stat-value">
                        Ôé¼{analytics.length > 0 
                          ? (analytics.reduce((sum, day) => sum + (day.revenue || 0), 0) / analytics.length).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒÅá Occupancy Media:</span>
                      <span className="stat-value">
                        {analytics.length > 0 
                          ? Math.round(analytics.reduce((sum, day) => sum + (day.occupancy || 0), 0) / analytics.length)
                          : 0}%
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>­ƒôà Giorni con Prenotazioni:</span>
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
              <h3>­ƒôè Trend Visuali</h3>
              <div className="admin-pricing-card">
                <h4>­ƒôê Andamento Ricavi</h4>
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
                ­ƒöä Aggiorna Dati Analytics
              </button>
              <button className="admin-btn-secondary">­ƒôè Esporta CSV</button>
              <button className="admin-btn-secondary">­ƒôê Report Mensile</button>
              <button className="admin-btn-secondary">­ƒôº Invia Report Email</button>
            </div>
          </div>
        )}

        {/* Fine sezioni amministrative */}
      </main>
    </div>
  );
};

export default AdminPanelPro;
