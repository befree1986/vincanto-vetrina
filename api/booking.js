// API UNIFICATA BOOKING - Gestisce tutte le operazioni di prenotazione
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  
  try {
    switch (action) {
      case 'availability':
        // GET /api/booking-unified?action=availability&checkIn=X&checkOut=Y
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const { checkIn, checkOut } = req.query;
        
        if (!checkIn || !checkOut) {
          return res.status(400).json({
            success: false,
            error: 'Date checkIn e checkOut richieste'
          });
        }

        // Verifica disponibilità nel database
        const availability = await pool.query(`
          SELECT * FROM blocked_dates 
          WHERE date_blocked BETWEEN $1 AND $2
        `, [checkIn, checkOut]);

        const isAvailable = availability.rows.length === 0;

        return res.status(200).json({
          success: true,
          available: isAvailable,
          checkIn,
          checkOut,
          blockedDates: availability.rows.map(row => row.date_blocked)
        });

      case 'blocked-dates':
        // GET /api/booking-unified?action=blocked-dates - Lista date bloccate
        // POST /api/booking-unified?action=blocked-dates - Aggiungi date bloccate
        // DELETE /api/booking-unified?action=blocked-dates&date=X - Rimuovi data bloccata
        
        if (req.method === 'GET') {
          const result = await pool.query('SELECT * FROM blocked_dates ORDER BY date_blocked');
          
          return res.status(200).json({
            success: true,
            blockedDates: result.rows
          });
        }
        
        if (req.method === 'POST') {
          const { dates, reason } = req.body;
          
          if (!dates || !Array.isArray(dates)) {
            return res.status(400).json({
              success: false,
              error: 'Array di date richiesto'
            });
          }

          for (const date of dates) {
            await pool.query(`
              INSERT INTO blocked_dates (date_blocked, reason, created_at)
              VALUES ($1, $2, NOW())
              ON CONFLICT (date_blocked) DO NOTHING
            `, [date, reason || 'Bloccato da admin']);
          }

          return res.status(200).json({
            success: true,
            message: `${dates.length} date bloccate con successo`
          });
        }
        
        if (req.method === 'DELETE') {
          const { date } = req.query;
          
          if (!date) {
            return res.status(400).json({
              success: false,
              error: 'Data da sbloccare richiesta'
            });
          }

          await pool.query('DELETE FROM blocked_dates WHERE date_blocked = $1', [date]);

          return res.status(200).json({
            success: true,
            message: 'Data sbloccata con successo'
          });
        }

        return res.status(405).json({ success: false, error: 'Metodo non consentito' });

      case 'create':
        // POST /api/booking-unified?action=create - Crea nuova prenotazione
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const {
          checkIn: bookingCheckIn,
          checkOut: bookingCheckOut,
          guests,
          adults,
          children,
          firstName,
          lastName,
          email,
          phone,
          totalAmount,
          depositAmount,
          notes
        } = req.body;

        if (!bookingCheckIn || !bookingCheckOut || !guests || !firstName || !lastName || !email) {
          return res.status(400).json({
            success: false,
            error: 'Campi obbligatori: checkIn, checkOut, guests, firstName, lastName, email'
          });
        }

        // Verifica disponibilità
        const availabilityCheck = await pool.query(`
          SELECT * FROM blocked_dates 
          WHERE date_blocked BETWEEN $1 AND $2
        `, [bookingCheckIn, bookingCheckOut]);

        if (availabilityCheck.rows.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Date non disponibili'
          });
        }

        // Crea prenotazione
        const newBookingId = `VIN${Date.now()}`;
        
        await pool.query(`
          INSERT INTO bookings (
            booking_id, check_in, check_out, guests, adults, children,
            first_name, last_name, email, phone, total_amount, deposit_amount,
            notes, status, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', NOW()
          )
        `, [
          newBookingId, bookingCheckIn, bookingCheckOut, guests, adults || guests, children || 0,
          firstName, lastName, email, phone, totalAmount, depositAmount, notes
        ]);

        // Blocca le date
        const startDate = new Date(bookingCheckIn);
        const endDate = new Date(bookingCheckOut);
        
        for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          await pool.query(`
            INSERT INTO blocked_dates (date_blocked, reason, booking_id, created_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (date_blocked) DO NOTHING
          `, [dateStr, `Prenotazione ${newBookingId}`, newBookingId]);
        }

        return res.status(200).json({
          success: true,
          message: 'Prenotazione creata con successo',
          bookingId: newBookingId
        });

      case 'list':
        // GET /api/booking-unified?action=list - Lista tutte le prenotazioni
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const bookings = await pool.query(`
          SELECT * FROM bookings 
          ORDER BY created_at DESC
        `);

        return res.status(200).json({
          success: true,
          bookings: bookings.rows
        });

      case 'update-status':
        // POST /api/booking-unified?action=update-status
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const { bookingId: updateBookingId, status } = req.body;
        
        if (!updateBookingId || !status) {
          return res.status(400).json({
            success: false,
            error: 'ID prenotazione e status richiesti'
          });
        }

        await pool.query(`
          UPDATE bookings 
          SET status = $1, updated_at = NOW()
          WHERE booking_id = $2
        `, [status, updateBookingId]);

        return res.status(200).json({
          success: true,
          message: 'Status prenotazione aggiornato'
        });

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Azione non riconosciuta. Usa: availability, blocked-dates, create, list, update-status' 
        });
    }
  } catch (error) {
    console.error('❌ Errore API Booking Unificata:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}