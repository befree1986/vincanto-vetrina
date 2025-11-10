// Script per popolare il database con dati realistici
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function populateDatabase() {
  try {
    console.log('🔄 Popolando database con dati realistici...\n');
    
    // 1. Inserisci prenotazioni demo
    console.log('📅 Inserendo prenotazioni...');
    
    const bookings = [
      {
        booking_id: 'VIN001',
        check_in: '2025-11-15',
        check_out: '2025-11-18',
        guests: 2,
        adults: 2,
        children: 0,
        first_name: 'Mario',
        last_name: 'Rossi',
        email: 'mario.rossi@email.com',
        phone: '+39 320 1234567',
        total_amount: 450.00,
        deposit_amount: 135.00,
        notes: 'Arrivo in serata, richiesto late check-in',
        status: 'confirmed',
        payment_status: 'deposit_paid'
      },
      {
        booking_id: 'VIN002',
        check_in: '2025-11-20',
        check_out: '2025-11-23',
        guests: 4,
        adults: 3,
        children: 1,
        first_name: 'Laura',
        last_name: 'Bianchi',
        email: 'laura.bianchi@email.com',
        phone: '+39 347 9876543',
        total_amount: 325.00,
        deposit_amount: 97.50,
        notes: 'Famiglia con bambino, richiesto lettino',
        status: 'pending',
        payment_status: 'pending'
      },
      {
        booking_id: 'VIN003',
        check_in: '2025-11-12',
        check_out: '2025-11-14',
        guests: 6,
        adults: 4,
        children: 2,
        first_name: 'Giuseppe',
        last_name: 'Verdi',
        email: 'giuseppe.verdi@email.com',
        phone: '+39 339 5555555',
        total_amount: 280.00,
        deposit_amount: 280.00,
        notes: 'Gruppo familiare, pagamento completo',
        status: 'completed',
        payment_status: 'paid_full'
      }
    ];
    
    for (const booking of bookings) {
      await pool.query(`
        INSERT INTO bookings (
          booking_id, check_in, check_out, guests, adults, children,
          first_name, last_name, email, phone, total_amount, deposit_amount,
          notes, status, payment_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        ON CONFLICT (booking_id) DO NOTHING
      `, [
        booking.booking_id, booking.check_in, booking.check_out, booking.guests,
        booking.adults, booking.children, booking.first_name, booking.last_name,
        booking.email, booking.phone, booking.total_amount, booking.deposit_amount,
        booking.notes, booking.status, booking.payment_status
      ]);
    }
    
    // 2. Inserisci richieste contatti demo
    console.log('📞 Inserendo richieste contatti...');
    
    const contacts = [
      {
        name: 'Anna Gialli',
        email: 'anna.gialli@email.com',
        phone: '+39 366 1111111',
        message: 'Vorrei informazioni sui prezzi per una settimana in agosto',
        status: 'new'
      },
      {
        name: 'Marco Neri',
        email: 'marco.neri@email.com',
        phone: '+39 333 2222222',
        message: 'Disponibilità per Capodanno? Siamo un gruppo di 8 persone',
        status: 'replied'
      }
    ];
    
    for (const contact of contacts) {
      await pool.query(`
        INSERT INTO contact_requests (name, email, phone, message, status, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [contact.name, contact.email, contact.phone, contact.message, contact.status]);
    }
    
    // 3. Inserisci eventi calendario demo
    console.log('🗓️ Inserendo eventi calendario...');
    
    const events = [
      {
        uid: 'airbnb_001@airbnb.com',
        calendar_source: 'airbnb',
        summary: 'Prenotazione Airbnb - Famiglia Schmidt',
        description: 'Check-in 15:00, Check-out 10:00',
        start_date: '2025-11-25 15:00:00',
        end_date: '2025-11-28 10:00:00',
        location: 'Vincanto Maori'
      },
      {
        uid: 'booking_002@booking.com',
        calendar_source: 'booking_com',
        summary: 'Prenotazione Booking.com - Coppia francese',
        description: 'Richiesta colazione inclusa',
        start_date: '2025-12-01 16:00:00',
        end_date: '2025-12-03 11:00:00',
        location: 'Vincanto Maori'
      },
      {
        uid: 'maint_001@vincanto.local',
        calendar_source: 'maintenance',
        summary: 'Manutenzione programmata - Pulizia profonda',
        description: 'Controllo impianti e pulizia approfondita',
        start_date: '2025-11-30 09:00:00',
        end_date: '2025-11-30 15:00:00',
        location: 'Vincanto Maori'
      }
    ];
    
    for (const event of events) {
      await pool.query(`
        INSERT INTO calendar_events (
          uid, calendar_source, summary, description, start_date, end_date, location, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        ON CONFLICT (uid) DO NOTHING
      `, [
        event.uid, event.calendar_source, event.summary, event.description,
        event.start_date, event.end_date, event.location
      ]);
    }
    
    // 4. Aggiorna configurazioni admin
    console.log('⚙️ Aggiornando configurazioni admin...');
    
    const adminSettings = [
      { key: 'paypal_link', value: 'https://www.paypal.me/AntonioGuida320', category: 'payment' },
      { key: 'paypal_enabled', value: 'true', category: 'payment' },
      { key: 'site_name', value: 'Vincanto Maori', category: 'general' },
      { key: 'admin_email', value: 'admin@vincantomaori.it', category: 'general' },
      { key: 'max_guests', value: '8', category: 'booking' },
      { key: 'min_stay_nights', value: '2', category: 'booking' },
      { key: 'checkin_time', value: '15:00', category: 'booking' },
      { key: 'checkout_time', value: '10:00', category: 'booking' }
    ];
    
    for (const setting of adminSettings) {
      await pool.query(`
        INSERT INTO admin_settings (
          setting_key, setting_value, setting_type, category, is_public, created_at, updated_at
        ) VALUES ($1, $2, 'string', $3, false, NOW(), NOW())
        ON CONFLICT (setting_key) DO UPDATE SET 
          setting_value = EXCLUDED.setting_value,
          updated_at = NOW()
      `, [setting.key, setting.value, setting.category]);
    }
    
    console.log('\n✅ Database popolato con successo!');
    
    // Verifica inserimenti
    const bookingCount = await pool.query('SELECT COUNT(*) FROM bookings');
    const contactCount = await pool.query('SELECT COUNT(*) FROM contact_requests');
    const eventCount = await pool.query('SELECT COUNT(*) FROM calendar_events');
    const settingCount = await pool.query('SELECT COUNT(*) FROM admin_settings');
    
    console.log('\n📊 Riepilogo dati inseriti:');
    console.log(`  - Prenotazioni: ${bookingCount.rows[0].count}`);
    console.log(`  - Richieste contatti: ${contactCount.rows[0].count}`);
    console.log(`  - Eventi calendario: ${eventCount.rows[0].count}`);
    console.log(`  - Configurazioni admin: ${settingCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await pool.end();
  }
}

populateDatabase();