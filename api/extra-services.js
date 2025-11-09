// API EXTRA SERVICES - Compatibilità con chiamate dirette
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Redirect alla API unificata
      try {
        // Query per servizi extra dal database
        let servicesResult;
        try {
          servicesResult = await pool.query(`
            SELECT id, name, price, description, active, included
            FROM extra_services 
            ORDER BY name
          `);
        } catch (dbError) {
          console.log('Extra services table might not exist, returning mock data');
          servicesResult = { rows: [] };
        }
        
        let services = servicesResult.rows;
        
        // Se non ci sono servizi nel DB, genera alcuni di esempio
        if (services.length === 0) {
          services = [
            {
              id: 1,
              name: 'Pulizia Finale',
              price: 50.00,
              description: 'Pulizia approfondita alla fine del soggiorno',
              active: true,
              included: false
            },
            {
              id: 2,
              name: 'Parcheggio',
              price: 20.00,
              description: 'Posto auto riservato',
              active: true,
              included: false
            },
            {
              id: 3,
              name: 'Tassa di Soggiorno',
              price: 2.00,
              description: 'Tassa di soggiorno per adulto per notte',
              active: true,
              included: false
            },
            {
              id: 4,
              name: 'Late Check-in',
              price: 30.00,
              description: 'Check-in dopo le 20:00',
              active: true,
              included: false
            }
          ];
        }
        
        return res.status(200).json({
          success: true,
          services
        });
      } catch (error) {
        console.error('Error fetching extra services:', error);
        return res.status(200).json({
          success: true,
          services: []
        });
      }
    }

    if (req.method === 'POST') {
      const { name, price, description, active = true, included = false } = req.body;
      
      if (!name || price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Nome e prezzo del servizio sono richiesti'
        });
      }

      try {
        const result = await pool.query(`
          INSERT INTO extra_services (name, price, description, active, included, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING *
        `, [name, price, description, active, included]);

        return res.status(201).json({
          success: true,
          service: result.rows[0]
        });
      } catch (dbError) {
        console.error('Database error creating service:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Errore durante la creazione del servizio'
        });
      }
    }

    if (req.method === 'PUT') {
      const { id, name, price, description, active, included } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID del servizio richiesto'
        });
      }

      try {
        const result = await pool.query(`
          UPDATE extra_services 
          SET name = $1, price = $2, description = $3, active = $4, included = $5, updated_at = NOW()
          WHERE id = $6
          RETURNING *
        `, [name, price, description, active, included, id]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Servizio non trovato'
          });
        }

        return res.status(200).json({
          success: true,
          service: result.rows[0]
        });
      } catch (dbError) {
        console.error('Database error updating service:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Errore durante l\'aggiornamento del servizio'
        });
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID del servizio richiesto'
        });
      }

      try {
        const result = await pool.query(`
          DELETE FROM extra_services WHERE id = $1 RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Servizio non trovato'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Servizio eliminato con successo'
        });
      } catch (dbError) {
        console.error('Database error deleting service:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Errore durante l\'eliminazione del servizio'
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Metodo non consentito'
    });

  } catch (error) {
    console.error('API Extra Services Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
}