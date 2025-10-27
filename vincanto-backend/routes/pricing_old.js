/**
 * Routes per la gestione delle configurazioni di prezzo
 * Endpoint REST per salvare, leggere e aggiornare i prezzi
 */

const express = require('express');
const { PricingConfig } = require('../models');
const router = express.Router();

// GET /api/pricing - Ottieni tutte le configurazioni prezzi
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

// PUT /api/pricing/:section - Aggiorna una sezione specifica
router.put('/:section', (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;
    
    if (!pricingConfigs[section]) {
      return res.status(404).json({
        success: false,
        message: `Sezione '${section}' non trovata`
      });
    }
    
    // Validazione dei dati in base alla sezione
    if (section === 'seasonalPrices') {
      const requiredSeasons = ['alta', 'media', 'bassa'];
      for (const season of requiredSeasons) {
        if (!updateData[season] || typeof updateData[season].basePrice !== 'number') {
          return res.status(400).json({
            success: false,
            message: `Prezzo base richiesto per stagione '${season}'`
          });
        }
      }
    }
    
    // Aggiorna la configurazione
    pricingConfigs[section] = { ...pricingConfigs[section], ...updateData };
    
    res.json({
      success: true,
      message: `Configurazione '${section}' aggiornata con successo`,
      data: pricingConfigs[section],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Errore nell\'aggiornamento della configurazione',
      error: error.message
    });
  }
});

// POST /api/pricing/calculate - Calcola preventivo in base ai prezzi configurati
router.post('/calculate', (req, res) => {
  try {
    const { 
      checkIn, 
      checkOut, 
      guests, 
      children = [], 
      parking = false,
      season = 'media' 
    } = req.body;
    
    if (!checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        message: 'Parametri richiesti: checkIn, checkOut, guests'
      });
    }
    
    const checkinDate = new Date(checkIn);
    const checkoutDate = new Date(checkOut);
    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    
    if (nights < pricingConfigs.extraCosts.minimumNights) {
      return res.status(400).json({
        success: false,
        message: `Soggiorno minimo: ${pricingConfigs.extraCosts.minimumNights} notti`
      });
    }
    
    // Calcola prezzo base
    const seasonPrices = pricingConfigs.seasonalPrices[season] || pricingConfigs.seasonalPrices.media;
    let basePrice = seasonPrices.basePrice * nights;
    
    // Calcola costi extra ospiti
    let guestsCost = 0;
    if (guests > 2) {
      guestsCost = (guests - 2) * pricingConfigs.guestPricing.additionalGuest * nights;
    }
    
    // Calcola bambini paganti
    let childrenCost = 0;
    if (children.length > 0) {
      const payingChildren = children.filter(age => age > pricingConfigs.guestPricing.freeChildAge).length;
      childrenCost = payingChildren * pricingConfigs.guestPricing.additionalGuest * nights;
    }
    
    // Costi fissi
    const cleaningFee = pricingConfigs.extraCosts.cleaningFee;
    const parkingCost = parking ? pricingConfigs.extraCosts.parkingFee * nights : 0;
    const touristTax = (guests + children.length) * pricingConfigs.extraCosts.touristTax * nights;
    
    // Totale prima degli sconti
    const subtotal = basePrice + guestsCost + childrenCost + cleaningFee + parkingCost + touristTax;
    
    // Calcola sconti
    let discount = 0;
    if (nights >= 7 && nights < 30) {
      discount = subtotal * (pricingConfigs.discounts.weeklyDiscount / 100);
    } else if (nights >= 30) {
      discount = subtotal * (pricingConfigs.discounts.monthlyDiscount / 100);
    }
    
    const total = subtotal - discount;
    const deposit = total * (pricingConfigs.extraCosts.depositPercentage / 100);
    
    res.json({
      success: true,
      data: {
        breakdown: {
          basePrice: basePrice,
          guestsCost: guestsCost,
          childrenCost: childrenCost,
          cleaningFee: cleaningFee,
          parkingCost: parkingCost,
          touristTax: touristTax,
          subtotal: subtotal,
          discount: discount,
          total: total,
          deposit: deposit,
          balance: total - deposit
        },
        details: {
          nights: nights,
          season: season,
          guests: guests,
          children: children.length,
          parking: parking
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel calcolo del preventivo',
      error: error.message
    });
  }
});

// POST /api/pricing/reset - Ripristina configurazioni di default
router.post('/reset', (req, res) => {
  try {
    pricingConfigs = {
      seasonalPrices: {
        alta: { minPrice: 120, maxPrice: 200, basePrice: 150 },
        media: { minPrice: 90, basePrice: 120, maxPrice: 150 },
        bassa: { minPrice: 75, basePrice: 90, maxPrice: 120 }
      },
      extraCosts: {
        cleaningFee: 30,
        touristTax: 2.00,
        parkingFee: 20,
        depositPercentage: 30,
        minimumNights: 2
      },
      guestPricing: {
        firstTwoGuests: 75,
        additionalGuest: 30,
        childrenFree: true,
        freeChildAge: 3
      },
      discounts: {
        weeklyDiscount: 10,
        monthlyDiscount: 20,
        earlyBookingDiscount: 5,
        lastMinuteDiscount: 15
      }
    };
    
    res.json({
      success: true,
      message: 'Configurazioni ripristinate ai valori di default',
      data: pricingConfigs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel ripristino delle configurazioni',
      error: error.message
    });
  }
});

module.exports = router;