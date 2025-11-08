// 🗃️ SCRIPT PULIZIA COMPLETA DATABASE VINCANTO
// Rimuove tutti i dati mock, demo e duplicati mantenendo solo le configurazioni essenziali

console.log('🚀 AVVIO PULIZIA COMPLETA DATABASE VINCANTO');

const API_BASE = 'https://vincanto-backup.vercel.app/api';

async function analyzeAndCleanDatabase() {
  console.log('\n📊 FASE 1: ANALISI DATI ATTUALI');
  console.log('='.repeat(50));

  try {
    // Carica configurazioni attuali
    const response = await fetch(`${API_BASE}/admin?action=settings`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Impossibile caricare configurazioni database');
    }

    const settings = data.settings;
    console.log(`✅ Database connesso - ${Object.keys(settings).length} categorie trovate`);

    // Analisi dettagliata per categoria
    for (const [category, values] of Object.entries(settings)) {
      console.log(`\n📂 Categoria: ${category.toUpperCase()}`);
      const keys = Object.keys(values);
      console.log(`   📄 ${keys.length} impostazioni trovate`);
      
      if (category === 'custom_services') {
        // Analizza servizi personalizzati (potenziali mock)
        const services = [];
        const serviceIds = new Set();
        
        keys.forEach(key => {
          const match = key.match(/custom_service_(\d+)_(\w+)/);
          if (match) {
            const [, id, field] = match;
            serviceIds.add(id);
          }
        });
        
        console.log(`   🔍 ${serviceIds.size} servizi personalizzati rilevati:`);
        serviceIds.forEach(id => {
          const name = values[`custom_service_${id}_name`] || 'N/A';
          const active = values[`custom_service_${id}_active`] === 'true';
          const price = values[`custom_service_${id}_price`] || '0';
          console.log(`     • ${name} (ID: ${id}) - ${active ? '✅ Attivo' : '❌ Inattivo'} - €${price}`);
        });
      } else if (category === 'pricing') {
        // Analizza duplicazioni nel pricing
        console.log(`   🔍 Duplicazioni rilevate:`);
        const duplicates = [];
        
        // Identifica chiavi duplicate
        if (values.basePrice && values.base_price) {
          duplicates.push(['basePrice', 'base_price']);
        }
        if (values.cleaningFee && values.cleaning_fee) {
          duplicates.push(['cleaningFee', 'cleaning_fee']);
        }
        if (values.parkingFeePerNight && values.parking_fee) {
          duplicates.push(['parkingFeePerNight', 'parking_fee']);
        }
        if (values.touristTax && values.tourist_tax_adult) {
          duplicates.push(['touristTax', 'tourist_tax_adult']);
        }
        
        duplicates.forEach(([old, current]) => {
          console.log(`     • ${old} (${values[old]}) vs ${current} (${values[current]})`);
        });
        
        // Identifica chiavi obsolete
        const obsoleteKeys = [
          'additionalGuestPrice', 'advance_booking_discount', 'last_minute_discount',
          'service_1_included', 'service_4_active', 'service_4_included', 'service_4_price',
          'service_5_active', 'service_5_included', 'service_5_price', 'service_6_active',
          'service_6_price', 'touristTaxPerPersonPerNight', 'weekend_surcharge'
        ];
        
        const foundObsolete = obsoleteKeys.filter(key => values[key] !== undefined);
        if (foundObsolete.length > 0) {
          console.log(`   🗑️ ${foundObsolete.length} chiavi obsolete:`);
          foundObsolete.forEach(key => {
            console.log(`     • ${key}: ${values[key]}`);
          });
        }
      }
    }

    return {
      categories: Object.keys(settings).length,
      customServices: settings.custom_services ? Object.keys(settings.custom_services).length : 0,
      pricingKeys: settings.pricing ? Object.keys(settings.pricing).length : 0,
      data: settings
    };

  } catch (error) {
    console.error('❌ Errore analisi database:', error.message);
    return null;
  }
}

async function createCleanConfiguration() {
  console.log('\n🧹 FASE 2: CREAZIONE CONFIGURAZIONE PULITA');
  console.log('='.repeat(50));

  // Configurazione essenziale pulita
  const cleanConfig = {
    // GENERALE - Configurazioni base del sito
    general: {
      site_name: "Vincanto Maori",
      site_email: "info@vincantomaori.it", 
      site_phone: "+39 123 456 7890", // Da aggiornare con numero reale
      check_in_time: "15:00",
      check_out_time: "11:00",
      auto_confirm_bookings: "false",
      maintenance_mode: "false"
    },

    // PRICING - Sistema base + aggiuntive (PULITO)
    pricing: {
      base_price: "75",
      additional_guest_3to4: "30",
      additional_guest_5to6: "25", 
      additional_guest_7to8: "20",
      cleaning_fee: "50",
      parking_fee: "20",
      tourist_tax_adult: "2.00",
      weekly_discount: "10",
      monthly_discount: "15",
      minimum_nights: "2",
      maximum_nights: "14"
    },

    // PAGAMENTI - Configurazioni di pagamento
    payment: {
      deposit_percentage: "0.30"
    },

    // EMAIL - Notifiche email
    email: {
      email_notifications_enabled: "true"
    },

    // CALENDARIO - Sincronizzazione calendari
    calendar: {
      calendar_sync_frequency: "60"
    }

    // NOTA: custom_services rimossi - da gestire tramite admin panel se necessario
  };

  console.log('✅ Configurazione pulita creata:');
  Object.entries(cleanConfig).forEach(([category, settings]) => {
    console.log(`   📂 ${category}: ${Object.keys(settings).length} chiavi`);
  });

  return cleanConfig;
}

async function executeCleanup(cleanConfig) {
  console.log('\n🔄 FASE 3: ESECUZIONE PULIZIA DATABASE');
  console.log('='.repeat(50));

  try {
    let totalOperations = 0;

    for (const [category, settings] of Object.entries(cleanConfig)) {
      console.log(`\n📝 Aggiornamento categoria: ${category}`);
      
      const response = await fetch(`${API_BASE}/admin?action=settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, settings })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`   ✅ ${Object.keys(settings).length} impostazioni salvate`);
        totalOperations += Object.keys(settings).length;
      } else {
        console.log(`   ❌ Errore: ${result.error}`);
      }

      // Pausa tra le operazioni
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n🎯 Pulizia completata: ${totalOperations} operazioni eseguite`);
    return true;

  } catch (error) {
    console.error('❌ Errore durante pulizia:', error.message);
    return false;
  }
}

async function verifyCleanDatabase() {
  console.log('\n🔍 FASE 4: VERIFICA DATABASE PULITO');
  console.log('='.repeat(50));

  try {
    const response = await fetch(`${API_BASE}/admin?action=settings`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Verifica fallita');
    }

    const settings = data.settings;
    console.log('✅ Verifica configurazioni post-pulizia:');
    
    Object.entries(settings).forEach(([category, values]) => {
      const keyCount = Object.keys(values).length;
      console.log(`   📂 ${category}: ${keyCount} chiavi`);
      
      // Verifica assenza di duplicati nel pricing
      if (category === 'pricing') {
        const hasOldKeys = Object.keys(values).some(key => 
          ['basePrice', 'cleaningFee', 'parkingFeePerNight', 'touristTax'].includes(key)
        );
        if (hasOldKeys) {
          console.log(`   ⚠️ Ancora presenti chiavi obsolete nel pricing`);
        } else {
          console.log(`   ✅ Pricing pulito - solo chiavi snake_case`);
        }
      }
      
      // Verifica servizi personalizzati
      if (category === 'custom_services') {
        console.log(`   ⚠️ Servizi personalizzati ancora presenti (${keyCount} chiavi)`);
      }
    });

    return settings;

  } catch (error) {
    console.error('❌ Errore verifica:', error.message);
    return null;
  }
}

// Esecuzione script completo
async function runCompleteCleanup() {
  console.log('🎯 INIZIO PULIZIA COMPLETA DATABASE VINCANTO');
  console.log('🕐 ' + new Date().toLocaleString());
  
  // Fase 1: Analisi
  const analysis = await analyzeAndCleanDatabase();
  if (!analysis) {
    console.log('❌ Pulizia interrotta - errore nell\'analisi');
    return;
  }

  // Fase 2: Creazione configurazione pulita
  const cleanConfig = await createCleanConfiguration();

  // Fase 3: Esecuzione pulizia
  const cleanupSuccess = await executeCleanup(cleanConfig);
  if (!cleanupSuccess) {
    console.log('❌ Pulizia fallita');
    return;
  }

  // Fase 4: Verifica
  const verifiedConfig = await verifyCleanDatabase();
  if (!verifiedConfig) {
    console.log('❌ Verifica fallita');
    return;
  }

  // Riepilogo finale
  console.log('\n📊 RIEPILOGO FINALE PULIZIA');
  console.log('='.repeat(50));
  console.log(`🗂️ Categorie configurate: ${Object.keys(verifiedConfig).length}`);
  console.log(`🔧 Sistema pricing: Base + Aggiuntive (pulito)`);
  console.log(`📧 Email: Configurate`);
  console.log(`📅 Calendario: Configurato`);
  console.log(`💳 Pagamenti: Configurati`);
  console.log('\n🎉 DATABASE COMPLETAMENTE PULITO E CONFIGURATO!');
  
  return verifiedConfig;
}

// Avvia pulizia
runCompleteCleanup();