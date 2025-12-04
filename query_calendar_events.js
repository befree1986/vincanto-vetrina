import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkCalendarEvents() {
  try {
    console.log('\n📊 === CALENDAR_EVENTS DATABASE CHECK ===\n');
    
    // Conta totale
    const countResult = await pool.query('SELECT COUNT(*) FROM calendar_events');
    console.log(`📈 Total events in calendar_events: ${countResult.rows[0].count}`);
    
    // Conta per source
    const sourceResult = await pool.query(`
      SELECT calendar_source, COUNT(*) as count 
      FROM calendar_events 
      GROUP BY calendar_source
    `);
    console.log('\n📅 Events by source:');
    sourceResult.rows.forEach(row => {
      console.log(`  ${row.calendar_source}: ${row.count}`);
    });
    
    // Mostra primi 5 eventi
    const sampleResult = await pool.query(`
      SELECT id, calendar_source, summary, start_date, end_date, created_at
      FROM calendar_events
      ORDER BY created_at DESC
      LIMIT 10
    `);
    console.log('\n🔍 Ultimi 10 eventi inseriti:');
    sampleResult.rows.forEach(row => {
      console.log(`  [${row.calendar_source}] "${row.summary}" - ${row.start_date} to ${row.end_date} (created: ${new Date(row.created_at).toLocaleString('it-IT')})`);
    });
    
    // Mostra quanti sono blocchi
    const blockedCount = await pool.query(`
      SELECT COUNT(*) FROM calendar_events 
      WHERE LOWER(summary) LIKE '%not available%' 
         OR LOWER(summary) LIKE '%blocked%'
         OR LOWER(summary) LIKE '%closed%'
    `);
    console.log(`\n⛔ Possible blocked/unavailable events: ${blockedCount.rows[0].count}`);
    
    // Mostra senza filtro
    const futureResult = await pool.query(`
      SELECT COUNT(*) FROM calendar_events 
      WHERE start_date >= CURRENT_DATE
    `);
    console.log(`📆 Future events (from today): ${futureResult.rows[0].count}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCalendarEvents();
