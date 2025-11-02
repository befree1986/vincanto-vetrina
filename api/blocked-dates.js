import { Pool } from 'pg';

// Configurazione database
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} catch (poolError) {
  console.error('Pool creation error:', poolError);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;

  try {
    // Connessione al database
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database non disponibile' });
    }

    client = await pool.connect();

    if (req.method === 'POST') {
      // Blocca nuove date
      const { 
        startDate, 
        endDate, 
        reason = 'Data bloccata manualmente',
        type = 'blocked' 
      } = req.body;

      if (!startDate) {
        return res.status(400).json({
          success: false,
          error: 'Data di inizio richiesta'
        });
      }

      // Se endDate non specificata, usa startDate (singolo giorno)
      const finalEndDate = endDate || startDate;

      // Valida le date
      const start = new Date(startDate);
      const end = new Date(finalEndDate);

      if (start > end) {
        return res.status(400).json({
          success: false,
          error: 'Data di fine deve essere successiva o uguale alla data di inizio'
        });
      }

      // Genera tutte le date nel range
      const dates = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        dates.push(new Date(currentDate).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('🚫 Blocco date:', { startDate, endDate: finalEndDate, dates, reason });

      // Inserisce ogni data come evento bloccato
      const insertPromises = dates.map(async (date) => {
        try {
          const result = await client.query(`
            INSERT INTO admin_calendar_events (
              event_date, event_title, event_type, created_at, updated_at
            )
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT (event_date, event_type) 
            DO UPDATE SET 
              event_title = $2,
              updated_at = NOW()
            RETURNING id
          `, [date, reason, type]);
          
          return { date, id: result.rows[0].id };
        } catch (insertError) {
          console.error('Errore inserimento data:', insertError);
          throw insertError;
        }
      });

      const results = await Promise.all(insertPromises);

      console.log('✅ Date bloccate inserite:', results);

      return res.status(200).json({
        success: true,
        message: `${dates.length} date bloccate con successo`,
        blocked_dates: results,
        count: dates.length
      });
    }

    if (req.method === 'GET') {
      // Ottieni tutte le date bloccate
      const result = await client.query(`
        SELECT 
          id,
          event_date::date as blocked_date,
          event_title as reason,
          event_type as type,
          created_at
        FROM admin_calendar_events 
        WHERE event_type = 'blocked'
        ORDER BY event_date ASC
      `);

      const blockedDates = result.rows.map(row => ({
        id: row.id,
        date: row.blocked_date.toISOString().split('T')[0],
        reason: row.reason || 'Data bloccata',
        type: row.type,
        created_at: row.created_at
      }));

      console.log('📅 Caricate', blockedDates.length, 'date bloccate');

      return res.status(200).json({
        success: true,
        blocked_dates: blockedDates,
        count: blockedDates.length
      });
    }

    if (req.method === 'DELETE') {
      // Rimuovi data bloccata
      const { id, date } = req.body;

      if (id) {
        // Rimuovi per ID
        const result = await client.query(`
          DELETE FROM admin_calendar_events 
          WHERE id = $1 AND event_type = 'blocked'
          RETURNING event_date
        `, [id]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Data bloccata non trovata'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Data sbloccata con successo',
          date: result.rows[0].event_date.toISOString().split('T')[0]
        });
      } else if (date) {
        // Rimuovi per data
        const result = await client.query(`
          DELETE FROM admin_calendar_events 
          WHERE event_date::date = $1::date AND event_type = 'blocked'
          RETURNING id
        `, [date]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Data bloccata non trovata'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Data sbloccata con successo',
          removed_count: result.rows.length
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'ID o data richiesti per la rimozione'
        });
      }
    }

    return res.status(405).json({ success: false, error: 'Metodo non supportato' });

  } catch (error) {
    console.error('❌ Errore API blocked-dates:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}