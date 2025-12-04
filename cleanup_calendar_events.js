import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanupBlockedEvents() {
  try {
    console.log('\n🧹 === PULIZIA CALENDAR_EVENTS ===\n');
    
    // Query per identificare blocchi da eliminare
    const selectQuery = `
      SELECT id, calendar_source, summary, start_date, end_date
      FROM calendar_events
      WHERE LOWER(summary) LIKE '%not available%' 
         OR LOWER(summary) LIKE '%closed%'
         OR LOWER(summary) LIKE '%blocked%'
      ORDER BY calendar_source, start_date
    `;
    
    const beforeDelete = await pool.query(selectQuery);
    console.log(`⛔ Trovati ${beforeDelete.rows.length} eventi da eliminare:\n`);
    beforeDelete.rows.forEach(row => {
      console.log(`  [${row.calendar_source}] "${row.summary}" - ${row.start_date}`);
    });
    
    // ELIMINA gli eventi bloccati
    const deleteQuery = `
      DELETE FROM calendar_events
      WHERE LOWER(summary) LIKE '%not available%' 
         OR LOWER(summary) LIKE '%closed%'
         OR LOWER(summary) LIKE '%blocked%'
    `;
    
    const deleteResult = await pool.query(deleteQuery);
    console.log(`\n✅ Eliminati ${deleteResult.rowCount} eventi bloccati dal database\n`);
    
    // Verifica dopo eliminar
    const countAfter = await pool.query(`
      SELECT calendar_source, COUNT(*) as count 
      FROM calendar_events 
      GROUP BY calendar_source
    `);
    
    console.log('📅 Events remaining by source after cleanup:');
    countAfter.rows.forEach(row => {
      console.log(`  ${row.calendar_source}: ${row.count}`);
    });
    
    const totalAfter = await pool.query('SELECT COUNT(*) FROM calendar_events');
    console.log(`\n📈 Total events after cleanup: ${totalAfter.rows[0].count}`);
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupBlockedEvents();
