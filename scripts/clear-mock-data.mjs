// Script per cancellare solo i dati mock dal database
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Cancella solo i dati mock dalle tabelle mantenendo la struttura
 */
async function clearMockData() {
  try {
    console.log('🗑️ Pulizia dati mock dal database...');
    
    // 1. Cancella prenotazioni demo (con booking_id specifici o status demo)
    const bookingResult = await pool.query(`
      DELETE FROM bookings 
      WHERE booking_id IN ('VIN001', 'VIN002', 'VIN003') 
         OR first_name IN ('Mario', 'Anna', 'Giuseppe')
         OR email LIKE '%@email.com'
      RETURNING booking_id
    `);
    
    console.log(`✅ Cancellate ${bookingResult.rowCount} prenotazioni mock`);
    if (bookingResult.rows.length > 0) {
      console.log('📋 IDs cancellati:', bookingResult.rows.map(r => r.booking_id));
    }
    
    // 2. Cancella richieste contatti demo
    const contactResult = await pool.query(`
      DELETE FROM contact_requests 
      WHERE email LIKE '%@email.com'
         OR name IN ('Anna Gialli', 'Marco Neri', 'Silvia Bianchi')
      RETURNING name
    `);
    
    console.log(`✅ Cancellate ${contactResult.rowCount} richieste contatti mock`);
    
    // 3. Mostra stato finale
    const finalBookings = await pool.query('SELECT COUNT(*) as count FROM bookings');
    const finalContacts = await pool.query('SELECT COUNT(*) as count FROM contact_requests WHERE contact_requests.id IS NOT NULL');
    
    console.log('\n📊 STATO FINALE DATABASE:');
    console.log(`   📅 Prenotazioni rimanenti: ${finalBookings.rows[0].count}`);
    console.log(`   📞 Contatti rimanenti: ${finalContacts.rows[0]?.count || 0}`);
    
    // 4. Lista le prenotazioni rimaste per controllo
    if (finalBookings.rows[0].count > 0) {
      const remainingBookings = await pool.query(`
        SELECT booking_id, first_name, last_name, email, check_in, status 
        FROM bookings 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      console.log('\n📋 Prenotazioni rimaste (ultime 5):');
      remainingBookings.rows.forEach(booking => {
        console.log(`   • ${booking.booking_id}: ${booking.first_name} ${booking.last_name} (${booking.email}) - ${booking.check_in} [${booking.status}]`);
      });
    }
    
    console.log('\n🎉 Pulizia dati mock completata!');
    
  } catch (error) {
    console.error('❌ Errore pulizia dati mock:', error);
  } finally {
    await pool.end();
  }
}

// Esegui pulizia
clearMockData();