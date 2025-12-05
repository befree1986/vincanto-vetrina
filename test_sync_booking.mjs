import pg from 'pg';
import 'dotenv/config';
import { RealCalendarSync } from './api/calendar-real-sync.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testSyncNow() {
  try {
    console.log('\n🚀 === TEST SINCRONIZZAZIONE MANUALE ===\n');
    
    // Conta prima
    const before = await pool.query('SELECT COUNT(*) FROM calendar_events WHERE calendar_source = \'booking\'');
    console.log(`📊 Eventi Booking PRIMA: ${before.rows[0].count}`);
    
    // Esegui sync
    const sync = new RealCalendarSync();
    
    // Testa il fetch Booking
    console.log('\n🏛️ Sincronizzando Booking.com...');
    const bookingCalendar = sync.calendars.find(c => c.id === 'booking');
    
    if (!bookingCalendar) {
      console.error('❌ Booking non configurato!');
      process.exit(1);
    }
    
    try {
      const response = await fetch(bookingCalendar.url, {
        headers: {
          'User-Agent': 'Vincanto Test Sync/1.0'
        },
        timeout: 10000
      });
      
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status);
        process.exit(1);
      }
      
      const icalData = await response.text();
      console.log(`✅ iCal Data ricevuti: ${icalData.length} bytes`);
      
      const events = sync.parseICalData(icalData);
      console.log(`✅ Eventi parsati: ${events.length}`);
      
      events.forEach(e => {
        console.log(`  ✓ "${e.summary}" (${e.start} to ${e.end})`);
      });
      
      // Salva nel DB
      if (events.length > 0) {
        console.log(`\n💾 Salvando ${events.length} eventi nel database...`);
        const saved = await sync.saveEventsToDatabase(events, 'booking');
        console.log(`✅ Salvati: ${saved} eventi`);
      }
      
    } catch (err) {
      console.error('❌ Errore durante sync:', err.message);
      process.exit(1);
    }
    
    // Conta dopo
    const after = await pool.query('SELECT COUNT(*) FROM calendar_events WHERE calendar_source = \'booking\'');
    console.log(`\n📊 Eventi Booking DOPO: ${after.rows[0].count}`);
    
    if (after.rows[0].count > before.rows[0].count) {
      console.log(`\n✅ SYNC RIUSCITO! Aggiunti ${after.rows[0].count - before.rows[0].count} eventi`);
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testSyncNow();
