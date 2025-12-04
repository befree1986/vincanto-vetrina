import 'dotenv/config';

const BOOKING_ICAL_URL = process.env.BOOKING_ICAL_URL;

console.log('\n🏛️ === TEST BOOKING ICAL ===\n');
console.log('📋 BOOKING_ICAL_URL:', BOOKING_ICAL_URL);

if (!BOOKING_ICAL_URL) {
  console.error('\n❌ ERRORE: BOOKING_ICAL_URL non configurato!');
  process.exit(1);
}

try {
  console.log('\n📡 Fetching Booking iCal...\n');
  
  const response = await fetch(BOOKING_ICAL_URL, {
    headers: {
      'User-Agent': 'Vincanto-Test/1.0'
    },
    timeout: 10000
  });

  console.log('🔗 HTTP Status:', response.status, response.statusText);
  
  if (!response.ok) {
    console.error('❌ Errore HTTP:', response.status);
    process.exit(1);
  }

  const data = await response.text();
  
  console.log('📦 iCal Data Length:', data.length, 'bytes');
  console.log('\n📄 Preview (primi 500 caratteri):');
  console.log('---');
  console.log(data.substring(0, 500));
  console.log('---\n');

  // Conta VEVENT
  const veventMatches = data.match(/BEGIN:VEVENT/g) || [];
  console.log('📊 VEVENT Count:', veventMatches.length);

  if (veventMatches.length === 0) {
    console.warn('⚠️  Nessun evento trovato in Booking iCal!');
  } else {
    // Estrai i summary
    console.log('\n📋 Summaries trovati:');
    const regex = /SUMMARY:([^\n\r]+)/g;
    let match;
    let count = 0;
    
    while ((match = regex.exec(data)) && count < 15) {
      console.log(`  - ${match[1]}`);
      count++;
    }
    if (veventMatches.length > 15) {
      console.log(`  ... e ${veventMatches.length - 15} altri`);
    }
  }

  console.log('\n✅ Test completato\n');

} catch (error) {
  console.error('❌ Errore durante il fetch:', error.message);
  process.exit(1);
}
