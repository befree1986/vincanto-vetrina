/**
 * Routes per la gestione delle configurazioni di prezzo
 * Endpoint REST per salvare, leggere e aggiornare i prezzi con database
 */

const express = require('express');
const { PricingConfig } = require('../models');
const router = express.Router();

// GET /api/pricing - Ottieni tutte le configurazioni prezzi attive
router.get('/', async (req, res) => {
  try {
    const configs = await PricingConfig.getActiveConfigs();
    
    res.json({
      success: true,
      data: configs,
      count: configs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pricing configs:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle configurazioni prezzi',
      error: error.message
    });
  }
});

// GET /api/pricing/:id - Ottieni una configurazione specifica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await PricingConfig.findByPk(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configurazione con ID '${id}' non trovata`
      });
    }
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pricing config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della configurazione',
      error: error.message
    });
  }
});

// POST /api/pricing - Crea una nuova configurazione di prezzo
router.post('/', async (req, res) => {
  try {
    const configData = req.body;
    
    // Validazione dati richiesti
    if (!configData.name || !configData.base_price_per_night || !configData.config_type) {
      return res.status(400).json({
        success: false,
        message: 'Campi richiesti: name, base_price_per_night, config_type'
      });
    }
    
    if (!configData.valid_from || !configData.valid_to) {
      return res.status(400).json({
        success: false,
        message: 'Campi richiesti: valid_from, valid_to'
      });
    }
    
    const config = await PricingConfig.create(configData);
    
    res.status(201).json({
      success: true,
      message: 'Configurazione creata con successo',
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating pricing config:', error);
    res.status(400).json({
      success: false,
      message: 'Errore nella creazione della configurazione',
      error: error.message
    });
  }
});

// PUT /api/pricing/:id - Aggiorna una configurazione esistente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const config = await PricingConfig.findByPk(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configurazione con ID '${id}' non trovata`
      });
    }
    
    await config.update(updateData);
    
    res.json({
      success: true,
      message: 'Configurazione aggiornata con successo',
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating pricing config:', error);
    res.status(400).json({
      success: false,
      message: 'Errore nell\'aggiornamento della configurazione',
      error: error.message
    });
  }
});

// DELETE /api/pricing/:id - Elimina una configurazione
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const config = await PricingConfig.findByPk(id);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configurazione con ID '${id}' non trovata`
      });
    }
    
    // Soft delete - disattiva invece di eliminare
    await config.update({ is_active: false });
    
    res.json({
      success: true,
      message: 'Configurazione eliminata con successo',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting pricing config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della configurazione',
      error: error.message
    });
  }
});

// POST /api/pricing/update - Aggiorna configurazione globale prezzi
router.post('/update', async (req, res) => {
  try {
    console.log('🎯 Update pricing config ricevuto:', req.body);
    
    const { 
      basePrice, 
      cleaningFee, 
      weekendSurcharge,
      monthlyDiscount,
      weeklyDiscount,
      minStay,
      maxStay,
      advanceBookingDiscount,
      lastMinuteDiscount 
    } = req.body;
    
    // Crea o aggiorna configurazione master
    const [config, created] = await PricingConfig.findOrCreate({
      where: { config_name: 'master_pricing' },
      defaults: {
        config_name: 'master_pricing',
        base_price_per_night: basePrice || 100,
        cleaning_fee: cleaningFee || 50,
        weekend_surcharge_percentage: weekendSurcharge || 20,
        monthly_discount_percentage: monthlyDiscount || 15,
        weekly_discount_percentage: weeklyDiscount || 10,
        minimum_stay_nights: minStay || 2,
        maximum_stay_nights: maxStay || 14,
        advance_booking_discount_percentage: advanceBookingDiscount || 0,
        last_minute_discount_percentage: lastMinuteDiscount || 0,
        is_active: true
      }
    });
    
    if (!created) {
      // Aggiorna configurazione esistente
      await config.update({
        base_price_per_night: basePrice || config.base_price_per_night,
        cleaning_fee: cleaningFee || config.cleaning_fee,
        weekend_surcharge_percentage: weekendSurcharge || config.weekend_surcharge_percentage,
        monthly_discount_percentage: monthlyDiscount || config.monthly_discount_percentage,
        weekly_discount_percentage: weeklyDiscount || config.weekly_discount_percentage,
        minimum_stay_nights: minStay || config.minimum_stay_nights,
        maximum_stay_nights: maxStay || config.maximum_stay_nights,
        advance_booking_discount_percentage: advanceBookingDiscount || config.advance_booking_discount_percentage,
        last_minute_discount_percentage: lastMinuteDiscount || config.last_minute_discount_percentage
      });
    }
    
    res.json({
      success: true,
      message: 'Configurazione prezzi aggiornata con successo',
      data: config,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Errore update pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della configurazione prezzi',
      error: error.message
    });
  }
});

// POST /api/pricing/calculate - Calcola preventivo per una prenotazione
router.post('/calculate', async (req, res) => {
  try {
    const { 
      checkIn, 
      checkOut, 
      guests = 2,
      bookingDate 
    } = req.body;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Parametri richiesti: checkIn, checkOut'
      });
    }
    
    const checkinDate = new Date(checkIn);
    const checkoutDate = new Date(checkOut);
    const booking = bookingDate ? new Date(bookingDate) : new Date();
    
    // Validazione date
    if (checkinDate >= checkoutDate) {
      return res.status(400).json({
        success: false,
        message: 'La data di check-out deve essere successiva al check-in'
      });
    }
    
    if (checkinDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La data di check-in non può essere nel passato'
      });
    }
    
    // Trova la migliore configurazione di prezzo
    const bestRate = await PricingConfig.findBestRate(checkinDate, checkoutDate, guests, booking);
    
    if (!bestRate) {
      return res.status(404).json({
        success: false,
        message: 'Nessuna configurazione di prezzo disponibile per le date selezionate'
      });
    }
    
    const { config, pricing } = bestRate;
    
    res.json({
      success: true,
      data: {
        pricing: pricing,
        config_used: {
          id: config.id,
          name: config.name,
          config_type: config.config_type
        },
        booking_details: {
          check_in: checkIn,
          check_out: checkOut,
          guests: guests,
          nights: pricing.nights
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel calcolo del prezzo',
      error: error.message
    });
  }
});

// GET /api/pricing/calculate/quote - Ottieni preventivo senza salvare
router.get('/calculate/quote', async (req, res) => {
  try {
    const { checkIn, checkOut, guests = 2, bookingDate } = req.query;
    
    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Parametri richiesti: checkIn, checkOut'
      });
    }
    
    const checkinDate = new Date(checkIn);
    const checkoutDate = new Date(checkOut);
    const booking = bookingDate ? new Date(bookingDate) : new Date();
    const guestsNumber = parseInt(guests);
    
    // Validazione date
    if (checkinDate >= checkoutDate) {
      return res.status(400).json({
        success: false,
        message: 'La data di check-out deve essere successiva al check-in'
      });
    }
    
    if (checkinDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'La data di check-in non può essere nel passato'
      });
    }
    
    // Trova la migliore configurazione di prezzo
    const bestRate = await PricingConfig.findBestRate(checkinDate, checkoutDate, guestsNumber, booking);
    
    if (!bestRate) {
      return res.status(404).json({
        success: false,
        message: 'Nessuna configurazione di prezzo disponibile per le date selezionate'
      });
    }
    
    const { config, pricing } = bestRate;
    
    res.json({
      success: true,
      data: {
        pricing: pricing,
        config_used: {
          id: config.id,
          name: config.name,
          config_type: config.config_type
        },
        booking_details: {
          check_in: checkIn,
          check_out: checkOut,
          guests: guestsNumber,
          nights: pricing.nights
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating quote:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella generazione del preventivo',
      error: error.message
    });
  }
});

// POST /api/pricing/reset - Ripristina configurazioni di default
router.post('/reset', async (req, res) => {
  try {
    // Disattiva tutte le configurazioni esistenti
    await PricingConfig.update(
      { is_active: false },
      { where: { is_active: true } }
    );
    
    // Crea nuove configurazioni di default
    const defaultConfigs = await PricingConfig.createSeasonalRates();
    
    res.json({
      success: true,
      message: 'Configurazioni ripristinate ai valori di default',
      data: defaultConfigs,
      count: defaultConfigs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting pricing configs:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel ripristino delle configurazioni',
      error: error.message
    });
  }
});

// GET /api/pricing/types - Ottieni tutti i tipi di configurazione disponibili
router.get('/config/types', (req, res) => {
  const configTypes = [
    { value: 'base_rate', label: 'Tariffa Base' },
    { value: 'seasonal_rate', label: 'Tariffa Stagionale' },
    { value: 'length_of_stay', label: 'Soggiorno Lungo' },
    { value: 'occupancy_discount', label: 'Sconto Occupazione' },
    { value: 'last_minute', label: 'Last Minute' },
    { value: 'early_bird', label: 'Prenotazione Anticipata' },
    { value: 'weekend_surcharge', label: 'Maggiorazione Weekend' },
    { value: 'holiday_surcharge', label: 'Maggiorazione Festivi' },
    { value: 'special_event', label: 'Evento Speciale' }
  ];
  
  res.json({
    success: true,
    data: configTypes,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;