import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function removeVRBO() {
  try {
    console.log('\n🗑️ === RIMOZIONE VRBO DAL DATABASE ===\n');
    
    // Conta eventi VRBO prima
    const beforeCount = await pool.query(`
      SELECT COUNT(*) FROM calendar_events WHERE calendar_source = 'vrbo'
    `);
    console.log(`⛔ Trovati ${beforeCount.rows[0].count} eventi VRBO da eliminare\n`);
    
    // Mostra alcuni esempi
    const examples = await pool.query(`
      SELECT id, summary, start_date, end_date
      FROM calendar_events 
      WHERE calendar_source = 'vrbo'
      LIMIT 5
    `);
    
    if (examples.rows.length > 0) {
      console.log('🔍 Esempi di eventi VRBO:');
      examples.rows.forEach(row => {
        console.log(`  - "${row.summary}" (${row.start_date} to ${row.end_date})`);
      });
      console.log('');
    }
    
    // ELIMINA tutti gli eventi VRBO
    const deleteResult = await pool.query(`
      DELETE FROM calendar_events WHERE calendar_source = 'vrbo'
    `);
    
    console.log(`✅ Eliminati ${deleteResult.rowCount} eventi VRBO\n`);
    
    // Verifica dopo
    const afterCount = await pool.query('SELECT COUNT(*) FROM calendar_events');
    const bySource = await pool.query(`
      SELECT calendar_source, COUNT(*) as count 
      FROM calendar_events 
      GROUP BY calendar_source
    `);
    
    console.log('📈 Stato finale del database:');
    bySource.rows.forEach(row => {
      console.log(`  ${row.calendar_source}: ${row.count} eventi`);
    });
    console.log(`  TOTALE: ${afterCount.rows[0].count} eventi\n`);
    
    await pool.end();
    console.log('✅ VRBO rimosso dal database con successo!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

removeVRBO();
