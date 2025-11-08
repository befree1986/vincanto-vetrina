// API UNIFICATA ADMIN - Gestisce tutte le operazioni amministrative
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

  // Ottieni action da query params o body
  let { action } = req.query;
  if (req.method === 'POST' && req.body && req.body.action) {
    action = req.body.action;
  }
  
  try {
    switch (action) {
      case 'login':
        // POST /api/admin-unified?action=login
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const { password } = req.body;
        const correctPassword = 'vincanto2025';

        if (password === correctPassword) {
          return res.status(200).json({
            success: true,
            message: 'Login effettuato con successo',
            token: 'admin-token-vincanto'
          });
        } else {
          return res.status(401).json({
            success: false,
            error: 'Password non corretta'
          });
        }

      case 'settings':
        // GET /api/admin-unified?action=settings - Carica tutte le impostazioni
        // POST /api/admin-unified?action=settings - Salva impostazioni
        
        if (req.method === 'GET') {
          const result = await pool.query('SELECT * FROM admin_settings ORDER BY category, setting_key');
          
          const settings = {};
          result.rows.forEach(row => {
            if (!settings[row.category]) {
              settings[row.category] = {};
            }
            settings[row.category][row.setting_key] = row.setting_value;
          });

          return res.status(200).json({
            success: true,
            settings: settings
          });
        }
        
        if (req.method === 'POST') {
          const { category, settings: newSettings } = req.body;
          
          if (!category || !newSettings) {
            return res.status(400).json({
              success: false,
              error: 'Categoria e impostazioni richieste'
            });
          }

          // Salva le impostazioni
          for (const [key, value] of Object.entries(newSettings)) {
            // Prima elimina l'eventuale record esistente
            await pool.query(`
              DELETE FROM admin_settings 
              WHERE category = $1 AND setting_key = $2
            `, [category, key]);
            
            // Poi inserisce il nuovo record
            await pool.query(`
              INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, updated_at)
              VALUES ($1, $2, $3, 'string', NOW())
            `, [category, key, value]);
          }

          return res.status(200).json({
            success: true,
            message: `Impostazioni ${category} salvate con successo`
          });
        }

        return res.status(405).json({ success: false, error: 'Metodo non consentito' });

      case 'update-pricing':
        // POST /api/admin-unified?action=update-pricing
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const { basePrice, additionalGuest3to4, additionalGuest5to6, additionalGuest7to8, cleaningFee, parkingFee, touristTaxAdult } = req.body;
        
        const pricingUpdates = {
          base_price: basePrice,
          additional_guest_3to4: additionalGuest3to4,
          additional_guest_5to6: additionalGuest5to6,
          additional_guest_7to8: additionalGuest7to8,
          cleaning_fee: cleaningFee,
          parking_fee: parkingFee,
          tourist_tax_adult: touristTaxAdult
        };

        for (const [key, value] of Object.entries(pricingUpdates)) {
          if (value !== undefined) {
            // Prima elimina l'eventuale record esistente
            await pool.query(`
              DELETE FROM admin_settings 
              WHERE category = 'pricing' AND setting_key = $1
            `, [key]);
            
            // Poi inserisce il nuovo record
            await pool.query(`
              INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, updated_at)
              VALUES ('pricing', $1, $2, 'string', NOW())
            `, [key, value]);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Prezzi aggiornati con successo'
        });

      case 'reset-pricing':
        // POST /api/admin-unified?action=reset-pricing
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const defaultPricing = {
          base_price: 75,
          additional_guest_3to4: 30,
          additional_guest_5to6: 25,
          additional_guest_7to8: 20,
          cleaning_fee: 50,
          parking_fee: 20,
          tourist_tax_adult: 2.00,
          weekly_discount: 10,
          monthly_discount: 15
        };

        for (const [key, value] of Object.entries(defaultPricing)) {
          // Prima elimina l'eventuale record esistente
          await pool.query(`
            DELETE FROM admin_settings 
            WHERE category = 'pricing' AND setting_key = $1
          `, [key]);
          
          // Poi inserisce il nuovo record
          await pool.query(`
            INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, updated_at)
            VALUES ('pricing', $1, $2, 'number', NOW())
          `, [key, value]);
        }

        return res.status(200).json({
          success: true,
          message: 'Prezzi ripristinati ai valori predefiniti'
        });

      case 'cleanup-database':
        // POST /api/admin-unified?action=cleanup-database
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        // Backup dei dati esistenti
        const backupResult = await pool.query('SELECT * FROM admin_settings WHERE category = \'pricing\'');
        
        // Rimuovi chiavi obsolete
        const obsoleteKeys = [
          'price_group_1to2', 'price_group_3to4', 'price_group_5to6', 'price_group_7to8',
          'additional_guest_price', 'base_price_old'
        ];
        
        for (const key of obsoleteKeys) {
          await pool.query('DELETE FROM admin_settings WHERE category = \'pricing\' AND setting_key = $1', [key]);
        }

        // Assicura che esistano le nuove chiavi
        const requiredSettings = {
          base_price: 75,
          additional_guest_3to4: 30,
          additional_guest_5to6: 25,
          additional_guest_7to8: 20,
          cleaning_fee: 50,
          parking_fee: 20,
          tourist_tax_adult: 2.00
        };

        for (const [key, defaultValue] of Object.entries(requiredSettings)) {
          // Controlla se esiste già
          const existingResult = await pool.query(`
            SELECT setting_value FROM admin_settings 
            WHERE category = 'pricing' AND setting_key = $1
          `, [key]);
          
          // Se non esiste, inseriscilo
          if (existingResult.rows.length === 0) {
            await pool.query(`
              INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, updated_at)
              VALUES ('pricing', $1, $2, 'number', NOW())
            `, [key, defaultValue]);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Database pulito e aggiornato',
          backup: backupResult.rows
        });

      case 'complete-cleanup':
        // POST /api/admin?action=complete-cleanup - Pulizia completa database
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        console.log('🧹 Avvio pulizia completa database...');
        
        // 1. Elimina completamente tutte le categorie esistenti
        await pool.query('DELETE FROM admin_settings');
        console.log('🗑️ Database svuotato completamente');

        // 2. Inserisce configurazione pulita essenziale
        const cleanSettings = {
          general: {
            site_name: "Vincanto Maori",
            site_email: "info@vincantomaori.it", 
            site_phone: "+39 123 456 7890",
            check_in_time: "15:00",
            check_out_time: "11:00",
            auto_confirm_bookings: "false",
            maintenance_mode: "false"
          },
          pricing: {
            base_price: "75",
            additional_guest_3to4: "30",
            additional_guest_5to6: "25", 
            additional_guest_7to8: "20",
            cleaning_fee: "50",
            parking_fee: "20",
            tourist_tax_adult: "2.00",
            weekly_discount: "10",
            monthly_discount: "15",
            minimum_nights: "2",
            maximum_nights: "14"
          },
          payment: {
            deposit_percentage: "0.30"
          },
          email: {
            email_notifications_enabled: "true"
          },
          calendar: {
            calendar_sync_frequency: "60"
          }
        };

        let totalInserted = 0;
        for (const [category, settings] of Object.entries(cleanSettings)) {
          for (const [key, value] of Object.entries(settings)) {
            await pool.query(`
              INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, updated_at)
              VALUES ($1, $2, $3, 'string', NOW())
            `, [category, key, value]);
            totalInserted++;
          }
        }

        console.log(`✅ ${totalInserted} impostazioni pulite inserite`);

        return res.status(200).json({
          success: true,
          message: `Database completamente pulito - ${totalInserted} impostazioni essenziali configurate`,
          inserted: totalInserted,
          categories: Object.keys(cleanSettings)
        });

      case 'init-database':
        // POST /api/admin?action=init-database - Inizializza struttura database
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        console.log('🏗️ Avvio inizializzazione struttura database...');
        
        try {
          // Crea tabella bookings
          await pool.query(`
            CREATE TABLE IF NOT EXISTS bookings (
              id SERIAL PRIMARY KEY,
              booking_id VARCHAR(50) UNIQUE NOT NULL,
              check_in DATE NOT NULL,
              check_out DATE NOT NULL,
              guests INTEGER NOT NULL,
              adults INTEGER,
              children INTEGER DEFAULT 0,
              first_name VARCHAR(100),
              last_name VARCHAR(100),
              email VARCHAR(255),
              phone VARCHAR(50),
              total_amount DECIMAL(10,2),
              deposit_amount DECIMAL(10,2),
              notes TEXT,
              status VARCHAR(50) DEFAULT 'pending',
              payment_status VARCHAR(50) DEFAULT 'pending',
              created_at TIMESTAMP DEFAULT NOW(),
              updated_at TIMESTAMP DEFAULT NOW()
            )
          `);

          // Crea tabella blocked_dates
          await pool.query(`
            CREATE TABLE IF NOT EXISTS blocked_dates (
              id SERIAL PRIMARY KEY,
              date_blocked DATE NOT NULL UNIQUE,
              reason VARCHAR(255),
              booking_id VARCHAR(50),
              created_at TIMESTAMP DEFAULT NOW()
            )
          `);

          // Crea indici per performance
          await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out)
          `);
          await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(date_blocked)
          `);
          await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)
          `);

          // Verifica tabelle create
          const tablesCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('bookings', 'blocked_dates', 'admin_settings')
          `);

          console.log('✅ Struttura database inizializzata');

          return res.status(200).json({
            success: true,
            message: 'Database inizializzato con successo',
            tablesCreated: ['bookings', 'blocked_dates'],
            indicesCreated: ['idx_bookings_dates', 'idx_blocked_dates_date', 'idx_bookings_status'],
            existingTables: tablesCheck.rows.map(row => row.table_name)
          });

        } catch (dbError) {
          console.error('❌ Errore inizializzazione database:', dbError);
          return res.status(500).json({
            success: false,
            error: 'Errore durante inizializzazione database',
            message: dbError.message
          });
        }

      case 'extra-services':
        // GET /api/admin-unified?action=extra-services - Lista servizi
        // POST /api/admin-unified?action=extra-services - Crea/aggiorna servizio
        // DELETE /api/admin-unified?action=extra-services&id=X - Elimina servizio
        
        if (req.method === 'GET') {
          const result = await pool.query('SELECT * FROM admin_settings WHERE category = \'services\' ORDER BY setting_key');
          
          const services = result.rows.map(row => ({
            id: row.setting_key,
            name: row.setting_key,
            price: parseFloat(row.setting_value) || 0,
            active: true
          }));

          return res.status(200).json({
            success: true,
            services: services
          });
        }
        
        if (req.method === 'POST') {
          const { serviceName, servicePrice } = req.body;
          
          if (!serviceName || servicePrice === undefined) {
            return res.status(400).json({
              success: false,
              error: 'Nome servizio e prezzo richiesti'
            });
          }

          await pool.query(`
            INSERT INTO admin_settings (category, setting_key, setting_value, updated_at)
            VALUES ('services', $1, $2, NOW())
            ON CONFLICT (category, setting_key)
            DO UPDATE SET 
              setting_value = $2,
              updated_at = NOW()
          `, [serviceName, servicePrice]);

          return res.status(200).json({
            success: true,
            message: 'Servizio salvato con successo'
          });
        }
        
        if (req.method === 'DELETE') {
          const { id } = req.query;
          
          if (!id) {
            return res.status(400).json({
              success: false,
              error: 'ID servizio richiesto'
            });
          }

          await pool.query('DELETE FROM admin_settings WHERE category = \'services\' AND setting_key = $1', [id]);

          return res.status(200).json({
            success: true,
            message: 'Servizio eliminato con successo'
          });
        }

        return res.status(405).json({ success: false, error: 'Metodo non consentito' });

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Azione non riconosciuta. Usa: login, settings, update-pricing, reset-pricing, cleanup-database, complete-cleanup, init-database, extra-services' 
        });
    }
  } catch (error) {
    console.error('❌ Errore API Admin Unificata:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}