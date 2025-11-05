// API per caricare servizi extra configurati nel pannello admin
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🔄 POST: Aggiungi nuovo servizio custom
  if (req.method === 'POST') {
    try {
      const { name, price, unit, description, category } = req.body;
      
      if (!name || !price) {
        return res.status(400).json({
          success: false,
          error: 'Nome e prezzo sono obbligatori'
        });
      }

      console.log('➕ AGGIUNTA SERVIZIO:', { name, price, unit, description, category });

      // Genera un ID univoco per il nuovo servizio
      const serviceId = Date.now();
      
      // Salva nel database usando la tabella admin_settings
      await pool.query(`
        INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description, created_at, updated_at)
        VALUES 
          ($1, $2, 'string', 'custom_services', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ($4, $5, 'number', 'custom_services', $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ($7, $8, 'string', 'custom_services', $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          ($10, $11, 'string', 'custom_services', $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        `custom_service_${serviceId}_name`, name, `Nome servizio personalizzato ${serviceId}`,
        `custom_service_${serviceId}_price`, price.toString(), `Prezzo servizio personalizzato ${serviceId}`,
        `custom_service_${serviceId}_unit`, unit || 'soggiorno', `Unità servizio personalizzato ${serviceId}`,
        `custom_service_${serviceId}_description`, description || '', `Descrizione servizio personalizzato ${serviceId}`
      ]);

      console.log('✅ SERVIZIO SALVATO NEL DATABASE:', serviceId);

      return res.status(200).json({
        success: true,
        service: { id: serviceId, name, price, unit: unit || 'soggiorno', description: description || '', category: category || 'custom' },
        message: 'Servizio aggiunto con successo'
      });

    } catch (error) {
      console.error('❌ Errore aggiunta servizio:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server',
        details: error.message
      });
    }
  }

  // 🔄 PUT: Aggiorna servizio esistente
  if (req.method === 'PUT') {
    try {
      const { id, name, price, unit, description } = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID servizio obbligatorio'
        });
      }

      console.log('🔄 AGGIORNAMENTO SERVIZIO:', { id, name, price, unit, description });

      // Aggiorna nel database
      const updates = [];
      if (name !== undefined) {
        await pool.query(`
          INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description, created_at, updated_at)
          VALUES ($1, $2, 'string', 'custom_services', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (setting_key) DO UPDATE SET 
            setting_value = EXCLUDED.setting_value,
            updated_at = CURRENT_TIMESTAMP
        `, [`custom_service_${id}_name`, name, `Nome servizio personalizzato ${id}`]);
        updates.push('name');
      }

      if (price !== undefined) {
        await pool.query(`
          INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description, created_at, updated_at)
          VALUES ($1, $2, 'number', 'custom_services', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (setting_key) DO UPDATE SET 
            setting_value = EXCLUDED.setting_value,
            updated_at = CURRENT_TIMESTAMP
        `, [`custom_service_${id}_price`, price.toString(), `Prezzo servizio personalizzato ${id}`]);
        updates.push('price');
      }

      if (unit !== undefined) {
        await pool.query(`
          INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description, created_at, updated_at)
          VALUES ($1, $2, 'string', 'custom_services', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (setting_key) DO UPDATE SET 
            setting_value = EXCLUDED.setting_value,
            updated_at = CURRENT_TIMESTAMP
        `, [`custom_service_${id}_unit`, unit, `Unità servizio personalizzato ${id}`]);
        updates.push('unit');
      }

      if (description !== undefined) {
        await pool.query(`
          INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description, created_at, updated_at)
          VALUES ($1, $2, 'string', 'custom_services', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (setting_key) DO UPDATE SET 
            setting_value = EXCLUDED.setting_value,
            updated_at = CURRENT_TIMESTAMP
        `, [`custom_service_${id}_description`, description, `Descrizione servizio personalizzato ${id}`]);
        updates.push('description');
      }

      console.log('✅ SERVIZIO AGGIORNATO:', updates);

      return res.status(200).json({
        success: true,
        updated: updates,
        message: 'Servizio aggiornato con successo'
      });

    } catch (error) {
      console.error('❌ Errore aggiornamento servizio:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server',
        details: error.message
      });
    }
  }

  // 🗑️ DELETE: Elimina servizio custom
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID servizio obbligatorio'
        });
      }

      console.log('🗑️ ELIMINAZIONE SERVIZIO:', id);

      // Elimina tutti i record del servizio dal database
      await pool.query(`
        DELETE FROM admin_settings 
        WHERE setting_key LIKE $1 AND category = 'custom_services'
      `, [`custom_service_${id}_%`]);

      console.log('✅ SERVIZIO ELIMINATO DAL DATABASE:', id);

      return res.status(200).json({
        success: true,
        message: 'Servizio eliminato con successo'
      });

    } catch (error) {
      console.error('❌ Errore eliminazione servizio:', error);
      return res.status(500).json({
        success: false,
        error: 'Errore interno del server',
        details: error.message
      });
    }
  }

  // 📋 GET: Carica tutti i servizi (hardcoded + custom)
  try {
    console.log('🛎️ EXTRA SERVICES: Caricamento servizi extra dal database...');
    
    // Per ora usiamo servizi hardcoded finché non implementiamo il database
    // TODO: Implementare caricamento dal database admin_settings o nuova tabella admin_services
    const extraServices = [
      { 
        id: 1, 
        name: 'Parcheggio privato custodito', 
        price: 20, 
        unit: 'notte',
        description: 'Posto auto riservato e sorvegliato nel nostro parcheggio privato',
        category: 'parcheggio',
        available: true,
        isParking: true // Flag speciale per identificare il parcheggio
      },
      { 
        id: 2, 
        name: 'Culla per bambini (0-3 anni)', 
        price: 30, 
        unit: 'soggiorno',
        description: 'Culla sicura e confortevole per i più piccoli',
        category: 'bambini',
        available: true,
        minAge: 0,
        maxAge: 3
      },
      { 
        id: 3, 
        name: 'Seggiolone', 
        price: 15, 
        unit: 'soggiorno',
        description: 'Seggiolone per pasti in sicurezza',
        category: 'bambini', 
        available: true,
        minAge: 0,
        maxAge: 6
      },
      { 
        id: 4, 
        name: 'Animali domestici', 
        price: 25, 
        unit: 'soggiorno',
        description: 'Benvenuti i tuoi amici a quattro zampe',
        category: 'animali',
        available: true
      },
      { 
        id: 5, 
        name: 'Set biancheria extra', 
        price: 20, 
        unit: 'soggiorno',
        description: 'Set aggiuntivo di lenzuola e asciugamani',
        category: 'comfort',
        available: true
      },
      { 
        id: 6, 
        name: 'Late check-out (fino alle 14:00)', 
        price: 35, 
        unit: 'soggiorno',
        description: 'Parti con più calma, check-out posticipato',
        category: 'comodita',
        available: true
      }
    ];

    // Carica servizi custom e prezzi dinamici dal database
    try {
      const result = await pool.query(`
        SELECT setting_key, setting_value
        FROM admin_settings 
        WHERE category = 'services' OR category = 'custom_services' OR setting_key LIKE '%_service_%'
      `);
      
      if (result.rows.length > 0) {
        console.log('📊 SERVIZI DAL DATABASE:', result.rows.length, 'configurazioni trovate');
        
        // 1. Aggiorna prezzi dei servizi hardcoded
        result.rows.forEach(row => {
          const serviceId = row.setting_key.match(/service_(\d+)_price/);
          if (serviceId) {
            const service = extraServices.find(s => s.id === parseInt(serviceId[1]));
            if (service) {
              service.price = parseFloat(row.setting_value) || service.price;
            }
          }
        });

        // 2. Carica servizi custom dal database
        const customServices = {};
        result.rows.forEach(row => {
          const customServiceMatch = row.setting_key.match(/custom_service_(\d+)_(.+)/);
          if (customServiceMatch) {
            const serviceId = parseInt(customServiceMatch[1]);
            const field = customServiceMatch[2];
            
            if (!customServices[serviceId]) {
              customServices[serviceId] = { id: serviceId };
            }
            
            if (field === 'price') {
              customServices[serviceId][field] = parseFloat(row.setting_value) || 0;
            } else {
              customServices[serviceId][field] = row.setting_value || '';
            }
          }
        });

        // Aggiungi servizi custom completi alla lista
        Object.values(customServices).forEach(service => {
          if (service.name && service.price) {
            extraServices.push({
              ...service,
              category: 'custom',
              available: true,
              unit: service.unit || 'soggiorno',
              description: service.description || ''
            });
          }
        });

        console.log('✅ SERVIZI CUSTOM CARICATI:', Object.keys(customServices).length);
      }
    } catch (dbError) {
      console.warn('⚠️ SERVIZI: Database non disponibile, uso valori predefiniti', dbError.message);
    }
    
    console.log('✅ SERVIZI CARICATI:', extraServices.length, 'servizi disponibili');
    
    return res.status(200).json({
      success: true,
      services: extraServices,
      message: 'Servizi extra caricati con successo'
    });
    
  } catch (error) {
    console.error('❌ Errore caricamento servizi extra:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
}