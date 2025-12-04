import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkBookingEvents() {
  try {
    console.log('\n📊 === BOOKING CALENDAR EVENTS CHECK ===\n');
    
    // Conta totale per sorgente
    const sourceCount = await pool.query(`
      SELECT calendar_source, COUNT(*) as count 
      FROM calendar_events 
      GROUP BY calendar_source
      ORDER BY calendar_source
    `);
    
    console.log('📈 Eventi per sorgente:');
    sourceCount.rows.forEach(row => {
      console.log(`  ${row.calendar_source}: ${row.count}`);
    });
    
    // Mostra TUTTI gli eventi Booking
    const bookingEvents = await pool.query(`
      SELECT id, summary, start_date, end_date, created_at
      FROM calendar_events 
      WHERE calendar_source = 'booking'
      ORDER BY created_at DESC
    `);
    
    console.log(`\n🏛️ BOOKING EVENTS (${bookingEvents.rows.length} totali):`);
    if (bookingEvents.rows.length === 0) {
      console.log('  ❌ NESSUN EVENTO BOOKING TROVATO!');
    } else {
      bookingEvents.rows.forEach(row => {
        console.log(`  "${row.summary}" - ${row.start_date} (created: ${new Date(row.created_at).toLocaleString('it-IT')})`);
      });
    }
    
    // Mostra tutti gli Airbnb per confronto
    const airbnbCount = await pool.query(`
      SELECT COUNT(*) as count FROM calendar_events WHERE calendar_source = 'airbnb'
    `);
    console.log(`\n🏠 AIRBNB EVENTS: ${airbnbCount.rows[0].count}`);
    
    // Verifica tabella
    const tableCheck = await pool.query(`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calendar_events');
    `);
    console.log(`\n✅ Tabella calendar_events esiste: ${tableCheck.rows[0].exists}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBookingEvents();
