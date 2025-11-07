// API endpoint per i prezzi Vincanto - SISTEMA GRUPPI COMPLETAMENTE NUOVO
import { Pool } from 'pg';

/**
 * Funzione per calcolare il prezzo per persona in base al numero di ospiti (sistema per persona)
 * @param {number} guests - Numero di ospiti
 * @param {Object} config - Configurazione prezzi
 * @returns {number} - Prezzo per persona per notte
 */
function calculateGroupPrice(guests, config) {
  if (guests <= 2) return config.priceGroup1to2 || 75;
  if (guests <= 4) return config.priceGroup3to4 || 95;
  if (guests <= 6) return config.priceGroup5to6 || 115;
  if (guests <= 8) return config.priceGroup7to8 || 135;
  
  // Per più di 8 ospiti, usa il prezzo del gruppo 7-8 + sovrapprezzo
  return (config.priceGroup7to8 || 135) + ((guests - 8) * 20);
}

/**
 * Calcola il costo totale del soggiorno
 * @param {Object} params - Parametri del soggiorno
 * @returns {Object} - Dettaglio del calcolo
 */
function calculateStayTotal(params, config) {
  const { guests, nights, includeParking = false, children = 0 } = params;
  
  const pricePerPerson = calculateGroupPrice(guests, config);
  const basePrice = pricePerPerson * guests; // PREZZO TOTALE = prezzo_per_persona × numero_ospiti
  const subtotal = basePrice * nights;
  const cleaningFee = config.cleaningFee || 50;
  const parkingFee = includeParking ? (config.parkingFee || 20) * nights : 0;
  
  // Tassa di soggiorno (solo adulti)
  const adults = Math.max(1, guests - children);
  const touristTax = adults * (config.touristTaxAdult || 2.00) * Math.min(nights, 7); // Max 7 notti
  
  const total = subtotal + cleaningFee + parkingFee + touristTax;
  
  return {
    basePrice,
    subtotal,
    cleaningFee,
    parkingFee,
    touristTax,
    total,
    breakdown: {
      pricePerNight: basePrice,
      pricePerPersonPerNight: pricePerPerson, // AGGIUNTO: prezzo per persona
      nights,
      guests,
      adults,
      children
    }
  };
}

export default async function handler(req, res) {
  console.log('🔥 API Pricing Groups chiamata:', req.method, req.url);

  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;

  try {
    if (req.method === 'GET') {
      // 🔥 CARICA CONFIGURAZIONE PREZZI PER GRUPPI DAL DATABASE
      let pricingConfig = {
        // Sistema gruppi
        priceGroup1to2: 75,
        priceGroup3to4: 95,
        priceGroup5to6: 115,
        priceGroup7to8: 135,
        
        // Costi aggiuntivi
        cleaningFee: 50,
        parkingFee: 20,
        touristTaxAdult: 2.00,
        touristTaxChild: 0,
        
        // Sconti
        weekendSurcharge: 0,
        weeklyDiscount: 10,
        monthlyDiscount: 15,
        
        // Limiti
        minStay: 2,
        maxStay: 14,
        maxGuests: 8,
        
        // Meta
        currency: 'EUR',
        lastUpdated: new Date().toISOString()
      };

      try {
        const pool = new Pool({
          connectionString: process.env.POSTGRES_URL
        });
        client = await pool.connect();
        
        console.log('🔄 Caricamento configurazione prezzi gruppi dal database...');
        const result = await client.query(`
          SELECT setting_key, setting_value
          FROM admin_settings 
          WHERE category = 'pricing'
        `);
        
        console.log('📊 Impostazioni pricing dal database:', result.rows.length);
        
        if (result.rows.length > 0) {
          const settings = {};
          result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
            console.log(`🔧 Setting: ${row.setting_key} = ${row.setting_value}`);
          });
          
          // 🔥 NUOVO: Aggiorna config con valori gruppi dal database
          pricingConfig = {
            ...pricingConfig,
            // Prezzi per gruppi (con fallback ai valori legacy)
            priceGroup1to2: parseFloat(settings.price_group_1to2) || parseFloat(settings.base_price) || 75,
            priceGroup3to4: parseFloat(settings.price_group_3to4) || 95,
            priceGroup5to6: parseFloat(settings.price_group_5to6) || 115,
            priceGroup7to8: parseFloat(settings.price_group_7to8) || 135,
            
            // Altri costi
            cleaningFee: parseFloat(settings.cleaning_fee) || 50,
            parkingFee: parseFloat(settings.parking_fee) || 20,
            touristTaxAdult: parseFloat(settings.tourist_tax_adult) || 2.00,
            touristTaxChild: parseFloat(settings.tourist_tax_child) || 0,
            
            // Sconti
            weekendSurcharge: parseFloat(settings.weekend_surcharge) || 0,
            weeklyDiscount: parseFloat(settings.weekly_discount) || 10,
            monthlyDiscount: parseFloat(settings.monthly_discount) || 15,
            
            // Limiti
            minStay: parseInt(settings.min_stay) || 2,
            maxStay: parseInt(settings.max_stay) || 14,
            maxGuests: parseInt(settings.max_guests) || 8,
            
            lastUpdated: new Date().toISOString()
          };
          
          console.log('✅ Configurazione prezzi gruppi caricata dal database');
        } else {
          console.log('⚠️ Nessuna configurazione nel database, uso valori predefiniti gruppi');
        }
      } catch (dbError) {
        console.error('❌ Errore caricamento prezzi gruppi dal database:', dbError);
        console.log('🔄 Usando configurazione prezzi gruppi predefinita');
      }

      // Se viene richiesto un calcolo specifico
      const { guests, nights, includeParking, children } = req.query;
      if (guests && nights) {
        const calculation = calculateStayTotal({
          guests: parseInt(guests),
          nights: parseInt(nights),
          includeParking: includeParking === 'true',
          children: parseInt(children) || 0
        }, pricingConfig);
        
        console.log(`💰 Calcolo soggiorno: ${guests} ospiti x ${nights} notti = €${calculation.total}`);
        
        return res.status(200).json({
          success: true,
          data: {
            ...pricingConfig,
            calculation
          },
          message: `Calcolo completato: €${calculation.total} totale`
        });
      }

      // Se viene richiesto solo il prezzo per un numero di ospiti
      if (guests) {
        const guestCount = parseInt(guests);
        const pricePerNight = calculateGroupPrice(guestCount, pricingConfig);
        
        console.log(`💰 Prezzo per ${guestCount} ospiti: €${pricePerNight}/notte`);
        
        return res.status(200).json({
          success: true,
          data: {
            ...pricingConfig,
            calculatedPrice: pricePerNight,
            guests: guestCount,
            priceBreakdown: {
              basePrice: pricePerNight,
              cleaningFee: pricingConfig.cleaningFee,
              parkingFee: pricingConfig.parkingFee,
              touristTaxAdult: pricingConfig.touristTaxAdult
            }
          },
          message: `Prezzo per ${guestCount} ospiti: €${pricePerNight}/notte`
        });
      }

      console.log('✅ Configurazione prezzi gruppi completa');
      return res.status(200).json({
        success: true,
        data: pricingConfig,
        message: 'Configurazione prezzi gruppi caricata',
        system: 'groups',
        version: '2.0'
      });
    }

    if (req.method === 'POST') {
      // Calcolo prezzi on-demand
      const { guests, nights, includeParking, children } = req.body;
      
      if (!guests || !nights) {
        return res.status(400).json({
          success: false,
          message: 'Parametri mancanti: guests e nights sono obbligatori'
        });
      }

      // Carica configurazione prezzi dal database
      const pool = new Pool({
        connectionString: process.env.POSTGRES_URL
      });
      client = await pool.connect();
      
      const result = await client.query(`
        SELECT setting_key, setting_value
        FROM admin_settings 
        WHERE category = 'pricing'
      `);
      
      const settings = {};
      result.rows.forEach(row => {
        settings[row.setting_key] = row.setting_value;
      });
      
      const pricingConfig = {
        priceGroup1to2: parseFloat(settings.price_group_1to2) || 75,
        priceGroup3to4: parseFloat(settings.price_group_3to4) || 95,
        priceGroup5to6: parseFloat(settings.price_group_5to6) || 115,
        priceGroup7to8: parseFloat(settings.price_group_7to8) || 135,
        cleaningFee: parseFloat(settings.cleaning_fee) || 50,
        parkingFee: parseFloat(settings.parking_fee) || 20,
        touristTaxAdult: parseFloat(settings.tourist_tax_adult) || 2.00,
        touristTaxChild: parseFloat(settings.tourist_tax_child) || 0
      };
      
      const calculation = calculateStayTotal({
        guests: parseInt(guests),
        nights: parseInt(nights),
        includeParking: includeParking || false,
        children: parseInt(children) || 0
      }, pricingConfig);
      
      return res.status(200).json({
        success: true,
        data: calculation,
        message: 'Calcolo prezzi completato'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Metodo non supportato'
    });

  } catch (error) {
    console.error('❌ Errore API Pricing Groups:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error.message
    });
  } finally {
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('❌ Errore chiusura connessione database:', releaseError);
      }
    }
  }
}