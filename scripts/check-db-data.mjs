// Script per vedere i dati reali nel database
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkDatabaseData() {
  try {
    console.log('🔄 Verificando dati nelle tabelle...\n');
    
    // Controlla bookings
    console.log('📅 BOOKINGS:');
    const bookings = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5');
    console.log(`  Totale: ${bookings.rowCount} prenotazioni`);
    bookings.rows.forEach(booking => {
      console.log(`  - ${booking.customer_name}: ${booking.check_in} → ${booking.check_out} (€${booking.total_amount})`);
    });
    
    console.log('\n💳 ADMIN SETTINGS:');
    const settings = await pool.query('SELECT * FROM admin_settings');
    console.log(`  Totale: ${settings.rowCount} configurazioni`);
    settings.rows.forEach(setting => {
      console.log(`  - ${setting.key}: ${setting.value}`);
    });
    
    console.log('\n📞 CONTACT REQUESTS:');
    const contacts = await pool.query('SELECT * FROM contact_requests ORDER BY created_at DESC LIMIT 3');
    console.log(`  Totale: ${contacts.rowCount} richieste`);
    contacts.rows.forEach(contact => {
      console.log(`  - ${contact.name}: ${contact.email} (${contact.created_at?.toLocaleDateString()})`);
    });
    
    console.log('\n🗓️ CALENDAR EVENTS:');
    const events = await pool.query('SELECT * FROM calendar_events ORDER BY start_date DESC LIMIT 3');
    console.log(`  Totale: ${events.rowCount} eventi`);
    events.rows.forEach(event => {
      console.log(`  - ${event.title}: ${event.start_date} → ${event.end_date}`);
    });
    
    console.log('\n💰 PRICING CONFIG:');
    const pricing = await pool.query('SELECT * FROM pricing_config');
    console.log(`  Totale: ${pricing.rowCount} configurazioni prezzi`);
    pricing.rows.forEach(price => {
      console.log(`  - ${price.key}: ${price.value}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseData();