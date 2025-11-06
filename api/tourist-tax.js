// 🏛️ TASSA SOGGIORNO API - Gestione Completa
// Gestisce calcolo, configurazione e tracking tassa soggiorno

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  
  console.log('🏛️ Tassa Soggiorno API - Action:', action);

  try {
    // === OTTIENI CONFIGURAZIONE TASSA SOGGIORNO ===
    if (action === 'get-config' || !action) {
      const config = await sql`
        SELECT * FROM tourist_tax_config 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      if (config.length === 0) {
        // Configurazione default per Maiori (Costiera Amalfitana)
        const defaultConfig = {
          amount_per_person_per_night: 2.50,
          max_nights: 7,
          children_age_limit: 12,
          children_exempt: true,
          season_high_rate: 3.00,
          season_high_start: '2025-06-01',
          season_high_end: '2025-09-30',
          municipality: 'Maiori',
          region: 'Campania',
          enabled: true,
          last_updated: new Date().toISOString()
        };

        return res.status(200).json({
          success: true,
          config: defaultConfig,
          message: 'Configurazione default tassa soggiorno Maiori'
        });
      }

      return res.status(200).json({
        success: true,
        config: config[0],
        message: 'Configurazione tassa soggiorno caricata'
      });
    }

    // === CALCOLA TASSA SOGGIORNO ===
    if (action === 'calculate') {
      const { guests, nights, check_in_date, adults, children } = req.body || req.query;
      
      // Ottieni configurazione attuale
      const config = await sql`
        SELECT * FROM tourist_tax_config 
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      let taxConfig = config[0] || {
        amount_per_person_per_night: 2.50,
        max_nights: 7,
        children_age_limit: 12,
        children_exempt: true,
        season_high_rate: 3.00,
        season_high_start: '2025-06-01',
        season_high_end: '2025-09-30'
      };

      // Determina se è alta stagione
      const checkInDate = new Date(check_in_date);
      const seasonStart = new Date(taxConfig.season_high_start);
      const seasonEnd = new Date(taxConfig.season_high_end);
      const isHighSeason = checkInDate >= seasonStart && checkInDate <= seasonEnd;

      // Calcola tassa
      const ratePerNight = isHighSeason ? 
        (taxConfig.season_high_rate || taxConfig.amount_per_person_per_night) : 
        taxConfig.amount_per_person_per_night;

      const adultsCount = parseInt(adults) || parseInt(guests) || 1;
      const childrenCount = parseInt(children) || 0;
      const nightsCount = Math.min(parseInt(nights), taxConfig.max_nights || 7);

      // Calcolo: solo adulti pagano se children_exempt = true
      const payingGuests = taxConfig.children_exempt ? adultsCount : (adultsCount + childrenCount);
      const totalTax = payingGuests * ratePerNight * nightsCount;

      return res.status(200).json({
        success: true,
        calculation: {
          total_amount: totalTax,
          rate_per_night: ratePerNight,
          paying_guests: payingGuests,
          nights_charged: nightsCount,
          is_high_season: isHighSeason,
          breakdown: {
            adults: adultsCount,
            children: childrenCount,
            children_exempt: taxConfig.children_exempt
          }
        },
        config_used: taxConfig
      });
    }

    // === AGGIORNA CONFIGURAZIONE ===
    if (action === 'update-config' && req.method === 'POST') {
      const configData = req.body;
      
      const updated = await sql`
        INSERT INTO tourist_tax_config ${sql(configData)}
        ON CONFLICT (municipality) DO UPDATE SET
          amount_per_person_per_night = ${configData.amount_per_person_per_night},
          max_nights = ${configData.max_nights},
          season_high_rate = ${configData.season_high_rate},
          season_high_start = ${configData.season_high_start},
          season_high_end = ${configData.season_high_end},
          children_exempt = ${configData.children_exempt},
          enabled = ${configData.enabled},
          updated_at = NOW()
        RETURNING *
      `;

      return res.status(200).json({
        success: true,
        config: updated[0],
        message: 'Configurazione tassa soggiorno aggiornata'
      });
    }

    // === STORICO TASSE PAGATE ===
    if (action === 'history') {
      const history = await sql`
        SELECT 
          bt.booking_id,
          bt.tourist_tax_amount,
          bt.guests_charged,
          bt.nights_charged,
          bt.calculated_at,
          b.guest_name,
          b.check_in_date,
          b.check_out_date
        FROM booking_tourist_tax bt
        LEFT JOIN bookings b ON bt.booking_id = b.id
        ORDER BY bt.calculated_at DESC
        LIMIT 50
      `;

      return res.status(200).json({
        success: true,
        history,
        message: `${history.length} record tassa soggiorno trovati`
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Azione non valida',
      available_actions: ['get-config', 'calculate', 'update-config', 'history']
    });

  } catch (error) {
    console.error('❌ Tourist Tax API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno server',
      message: error.message
    });
  }
}