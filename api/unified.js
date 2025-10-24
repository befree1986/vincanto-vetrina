// API Unificata Vincanto - Tutte le funzionalità in un singolo endpoint
// Riduce il numero di serverless functions per rispettare il limite Vercel Hobby (12)

import cors from 'cors';

// Configurazione CORS
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

// === SISTEMA PREZZI ===
const systemConfig = {
  basePrice: 80.00,           // €80 per notte per adulto
  additionalGuestPrice: 20.00, // €20 per ospite aggiuntivo per notte  
  cleaningFee: 50.00,         // €50 pulizia finale
  parkingFeePerNight: 10.00,  // €10 parcheggio per notte
  touristTaxPerPersonPerNight: 2.00, // €2 tassa soggiorno per persona per notte
  minimumNights: 2,           // 2 notti minime
  depositPercentage: 0.30,    // 30% acconto
  currency: 'EUR'
};

// === UTILITÀ ===
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date) && date > new Date();
}

function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateQuote(checkIn, checkOut, guests, includeParking = false) {
  if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
    throw new Error('Date non valide o nel passato');
  }

  const nights = calculateNights(checkIn, checkOut);
  
  if (nights < systemConfig.minimumNights) {
    throw new Error(`Minimo ${systemConfig.minimumNights} notti richieste`);
  }

  // Calcolo prezzi
  const basePrice = nights * systemConfig.basePrice; // Prezzo base per primo adulto
  const additionalGuestsPrice = Math.max(0, guests - 1) * nights * systemConfig.additionalGuestPrice;
  const parkingCost = includeParking ? nights * systemConfig.parkingFeePerNight : 0;
  const touristTax = guests * nights * systemConfig.touristTaxPerPersonPerNight;
  
  const subtotal = basePrice + additionalGuestsPrice + systemConfig.cleaningFee + parkingCost;
  const totalAmount = subtotal + touristTax;
  const depositAmount = totalAmount * systemConfig.depositPercentage;

  return {
    nights,
    guests,
    basePrice: basePrice + additionalGuestsPrice,
    parkingCost,
    cleaningFee: systemConfig.cleaningFee,
    touristTax,
    subtotal,
    totalAmount,
    depositAmount: Math.round(depositAmount * 100) / 100,
    depositPercentage: systemConfig.depositPercentage,
    currency: systemConfig.currency,
    breakdown: {
      pricePerNight: systemConfig.basePrice,
      additionalGuestPricePerNight: systemConfig.additionalGuestPrice,
      parkingPerNight: systemConfig.parkingFeePerNight,
      touristTaxPerPersonPerNight: systemConfig.touristTaxPerPersonPerNight,
      cleaningFeeTotal: systemConfig.cleaningFee
    }
  };
}

// === HANDLER PRINCIPALE ===
export default async function handler(req, res) {
  // Gestione CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Headers CORS per tutte le risposte
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { action } = req.query;

  try {
    switch (action) {
      // === BOOKING QUOTE ===
      case 'quote':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const { checkIn, checkOut, guests, includeParking } = req.body;

        if (!checkIn || !checkOut || !guests) {
          return res.status(400).json({ 
            success: false, 
            error: 'Parametri richiesti: checkIn, checkOut, guests' 
          });
        }

        const quote = calculateQuote(checkIn, checkOut, parseInt(guests), includeParking);
        return res.status(200).json({ success: true, costs: quote });

      // === HEALTH CHECK ===
      case 'health':
        return res.status(200).json({ 
          success: true, 
          status: 'API Unificata Vincanto Online',
          timestamp: new Date().toISOString(),
          version: '2.0'
        });

      // === DISPONIBILITÀ ===
      case 'availability':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const { checkIn: availCheckIn, checkOut: availCheckOut } = req.body;
        
        if (!availCheckIn || !availCheckOut) {
          return res.status(400).json({ 
            success: false, 
            error: 'Parametri richiesti: checkIn, checkOut' 
          });
        }

        // Simulazione disponibilità - TODO: collegare al database quando stabile
        const isAvailable = new Date(availCheckIn) > new Date();
        
        return res.status(200).json({
          success: true,
          available: isAvailable,
          message: isAvailable ? 'Date disponibili' : 'Date non disponibili'
        });

      // === CONTACT FORM ===
      case 'contact':
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
          return res.status(400).json({ 
            success: false, 
            error: 'Parametri richiesti: name, email, message' 
          });
        }

        // Simulazione invio email - TODO: implementare nodemailer
        console.log('Contact form:', { name, email, message });
        
        return res.status(200).json({
          success: true,
          message: 'Messaggio ricevuto correttamente'
        });

      // === ADMIN CONFIG ===
      case 'admin-config':
        if (req.method === 'GET') {
          return res.status(200).json({
            success: true,
            config: systemConfig
          });
        } else if (req.method === 'POST') {
          // TODO: Aggiornare configurazione nel database
          return res.status(200).json({
            success: true,
            message: 'Configurazione aggiornata'
          });
        }
        break;

      // === ADMIN BOOKINGS ===
      case 'admin-bookings':
        if (req.method === 'GET') {
          // Mock bookings - TODO: sostituire con database
          const mockBookings = [
            {
              id: '1',
              guestName: 'Mario Rossi',
              checkIn: '2025-03-01',
              checkOut: '2025-03-04',
              status: 'confirmed',
              totalAmount: 542,
              created: new Date().toISOString()
            }
          ];
          
          return res.status(200).json({
            success: true,
            bookings: mockBookings
          });
        }
        break;

      // === DEFAULT ===
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Azione non riconosciuta',
          availableActions: [
            'quote', 'health', 'availability', 'contact', 
            'admin-config', 'admin-bookings'
          ]
        });
    }
  } catch (error) {
    console.error('Errore API Unificata:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Errore interno del server' 
    });
  }
}