#!/usr/bin/env node
/**
 * Fix: Disattiva il parcheggio tramite API
 */

const API_URL = 'https://vincanto-vetrina.vercel.app/api/unified';

async function disableParkingService() {
  console.log('🔧 DISATTIVAZIONE SERVIZIO PARCHEGGIO\n');

  try {
    // Trova il servizio parcheggio
    const getResponse = await fetch(`${API_URL}?action=extra-services`);
    const getData = await getResponse.json();
    
    const parkingService = getData.services.find(s => 
      s.category === 'parcheggio' || 
      s.name.toLowerCase().includes('parcheggio') ||
      s.name.toLowerCase().includes('parking')
    );

    if (!parkingService) {
      console.log('✅ Nessun servizio parcheggio attivo trovato');
      process.exit(0);
    }

    console.log('📋 Servizio parcheggio trovato:');
    console.log(`   ID: ${parkingService.id} | ${parkingService.name}`);
    console.log(`   Prezzo: €${parkingService.price}/${parkingService.unit}`);
    console.log(`   Attivo: ${parkingService.active ? 'SÌ' : 'NO'}`);

    if (!parkingService.active) {
      console.log('\n✅ Il servizio è già disattivato');
      process.exit(0);
    }

    console.log('\n⚠️ PROBLEMA:');
    console.log('   Il parcheggio viene calcolato DUE VOLTE:');
    console.log('   1. Nel quote API (includeParking parameter) ← CORRETTO');
    console.log('   2. Nei servizi extra se selezionato ← DUPLICATO');
    console.log('\n💡 SOLUZIONE:');
    console.log('   Disattivare il servizio parcheggio dai servizi extra.');
    console.log('   Il parcheggio resterà disponibile tramite quote API.\n');

    // Disattiva il servizio tramite API PUT
    const updateResponse = await fetch(`${API_URL}?action=extra-services&id=${parkingService.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...parkingService,
        active: false
      })
    });

    const updateData = await updateResponse.json();
    
    if (!updateData.success) {
      throw new Error(updateData.error || 'Errore aggiornamento servizio');
    }

    console.log('✅ SERVIZIO DISATTIVATO:');
    console.log(`   ✓ ${parkingService.name} (ID: ${parkingService.id})`);
    console.log('\n✅ FIX COMPLETATO');
    console.log('   Il parcheggio ora è disponibile SOLO tramite il quote API');
    console.log('   e verrà calcolato correttamente × notti.\n');

  } catch (error) {
    console.error('❌ ERRORE:', error.message);
    process.exit(1);
  }
}

disableParkingService();
