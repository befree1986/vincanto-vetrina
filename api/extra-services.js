// API per caricare servizi extra configurati nel pannello admin
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🛎️ EXTRA SERVICES: Caricamento servizi extra dal database...');
    
    // Per ora usiamo servizi hardcoded finché non implementiamo il database
    // TODO: Implementare caricamento dal database admin_settings o nuova tabella admin_services
    const extraServices = [
      { 
        id: 1, 
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
        id: 2, 
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
        id: 3, 
        name: 'Animali domestici', 
        price: 25, 
        unit: 'soggiorno',
        description: 'Benvenuti i tuoi amici a quattro zampe',
        category: 'animali',
        available: true
      },
      { 
        id: 4, 
        name: 'Set biancheria extra', 
        price: 20, 
        unit: 'soggiorno',
        description: 'Set aggiuntivo di lenzuola e asciugamani',
        category: 'comfort',
        available: true
      },
      { 
        id: 5, 
        name: 'Late check-out (fino alle 14:00)', 
        price: 35, 
        unit: 'soggiorno',
        description: 'Parti con più calma, check-out posticipato',
        category: 'comodita',
        available: true
      }
    ];

    // Carica prezzi dinamici dal database se disponibili
    try {
      const result = await pool.query(`
        SELECT setting_key, setting_value
        FROM admin_settings 
        WHERE category = 'services' OR setting_key LIKE '%_service_%'
      `);
      
      if (result.rows.length > 0) {
        console.log('📊 SERVIZI DAL DATABASE:', result.rows.length, 'configurazioni trovate');
        
        // Aggiorna prezzi dai database se disponibili
        result.rows.forEach(row => {
          const serviceId = row.setting_key.match(/service_(\d+)_price/);
          if (serviceId) {
            const service = extraServices.find(s => s.id === parseInt(serviceId[1]));
            if (service) {
              service.price = parseFloat(row.setting_value) || service.price;
            }
          }
        });
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