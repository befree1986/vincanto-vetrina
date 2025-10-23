const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Costanti per il calcolo prezzi
const PRICING_CONFIG = {
  CLEANING_FEE: 30,
  TOURIST_TAX_RATE: 2.00,
  PARKING_RATE: 20, // Aggiornato da 15€ a 20€
  DEPOSIT_PERCENTAGE: 0.30,
  MIN_NIGHTS: 2,
  PRICE_PER_GUEST: {
    first_two: 75,
    additional: 30
  }
};

// Funzione di calcolo prezzi
function calculateBookingCosts(bookingData) {
  const { 
    check_in_date, 
    check_out_date, 
    num_adults, 
    num_children = 0, 
    children_ages = [], 
    parking_option = 'none' 
  } = bookingData;

  const checkinDate = new Date(check_in_date);
  const checkoutDate = new Date(check_out_date);
  
  if (checkoutDate <= checkinDate) {
    throw new Error("Data di checkout deve essere successiva al checkin");
  }

  const oneDay = 1000 * 60 * 60 * 24;
  const nights = Math.round(Math.abs((checkoutDate.getTime() - checkinDate.getTime()) / oneDay));
  
  if (nights < PRICING_CONFIG.MIN_NIGHTS) {
    throw new Error(`Il soggiorno minimo è di ${PRICING_CONFIG.MIN_NIGHTS} notti`);
  }

  // Calcolo ospiti paganti (bambini 0-3 anni gratis)
  let payingChildren = 0;
  children_ages.forEach(age => {
    if (age > 3) payingChildren++;
  });

  const totalPayingGuests = num_adults + payingChildren;
  
  // Calcolo prezzo base
  let costPerNight = 0;
  if (totalPayingGuests >= 1) {
    costPerNight += Math.min(totalPayingGuests, 2) * PRICING_CONFIG.PRICE_PER_GUEST.first_two;
  }
  if (totalPayingGuests >= 3) {
    costPerNight += (totalPayingGuests - 2) * PRICING_CONFIG.PRICE_PER_GUEST.additional;
  }
  
  const base_price = costPerNight * nights;
  
  // Calcolo parcheggio
  const parking_cost = parking_option === 'private' ? PRICING_CONFIG.PARKING_RATE * nights : 0;
  
  // Calcolo tassa di soggiorno (solo over 14)
  let taxableGuests = num_adults;
  children_ages.forEach(age => {
    if (age >= 14) taxableGuests++;
  });
  const tourist_tax = taxableGuests * PRICING_CONFIG.TOURIST_TAX_RATE * nights;
  
  // Totali
  const cleaning_fee = PRICING_CONFIG.CLEANING_FEE;
  const total_amount = base_price + cleaning_fee + parking_cost + tourist_tax;
  const deposit_amount = total_amount * PRICING_CONFIG.DEPOSIT_PERCENTAGE;

  return {
    nights,
    base_price,
    parking_cost,
    cleaning_fee,
    tourist_tax,
    total_amount,
    deposit_amount,
    totalPayingGuests,
    taxableGuests
  };
}

// Endpoint per ottenere un preventivo
app.post('/api/booking/quote', async (req, res) => {
  try {
    console.log('📊 Richiesta preventivo:', req.body);
    
    const costs = calculateBookingCosts(req.body);
    
    const response = {
      success: true,
      costs,
      quote_valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    console.log('✅ Preventivo calcolato:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Errore calcolo preventivo:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Endpoint per creare una prenotazione
app.post('/api/booking/create', async (req, res) => {
  try {
    console.log('📝 Creazione prenotazione:', req.body);
    
    const costs = calculateBookingCosts(req.body);
    
    // Simula salvataggio nel database
    const bookingId = `VIN${Date.now()}`;
    
    const booking = {
      id: bookingId,
      ...req.body,
      costs,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    
    console.log('✅ Prenotazione creata:', booking);
    
    res.json({
      success: true,
      booking,
      message: 'Prenotazione creata con successo'
    });
    
  } catch (error) {
    console.error('❌ Errore creazione prenotazione:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Endpoint per health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    pricing: {
      parking_rate: PRICING_CONFIG.PARKING_RATE,
      cleaning_fee: PRICING_CONFIG.CLEANING_FEE,
      min_nights: PRICING_CONFIG.MIN_NIGHTS
    }
  });
});

// Database simulato per i calendari esterni
let externalCalendars = [];
let calendarIdCounter = 1;

// Endpoint per ottenere tutti i calendari esterni
app.get('/api/calendars', (req, res) => {
  console.log('📅 Richiesta calendari esterni');
  res.json({
    success: true,
    data: externalCalendars,
    count: externalCalendars.length
  });
});

// Endpoint per aggiungere un calendario esterno
app.post('/api/calendars', async (req, res) => {
  try {
    console.log('➕ Aggiunta calendario esterno:', req.body);
    
    const { name, platform, ical_url, owner_email } = req.body;
    
    // Validazione input
    if (!name || !platform || !ical_url) {
      return res.status(400).json({
        success: false,
        error: 'Nome, piattaforma e URL iCal sono obbligatori'
      });
    }
    
    // Validazione URL iCal
    if (!ical_url.includes('.ics') && !ical_url.includes('ical')) {
      return res.status(400).json({
        success: false,
        error: 'URL iCal non valido. Deve contenere .ics o ical'
      });
    }
    
    const newCalendar = {
      id: calendarIdCounter++,
      name,
      platform,
      ical_url,
      owner_email: owner_email || '',
      is_active: true,
      last_sync: null,
      last_sync_error: null,
      created_at: new Date().toISOString()
    };
    
    externalCalendars.push(newCalendar);
    
    console.log('✅ Calendario aggiunto:', newCalendar);
    res.json({
      success: true,
      data: newCalendar,
      message: 'Calendario aggiunto con successo'
    });
    
  } catch (error) {
    console.error('❌ Errore aggiunta calendario:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Endpoint per eliminare un calendario
app.delete('/api/calendars/:id', (req, res) => {
  try {
    const calendarId = parseInt(req.params.id);
    const index = externalCalendars.findIndex(cal => cal.id === calendarId);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Calendario non trovato'
      });
    }
    
    const removedCalendar = externalCalendars.splice(index, 1)[0];
    
    console.log('🗑️ Calendario rimosso:', removedCalendar);
    res.json({
      success: true,
      message: 'Calendario rimosso con successo'
    });
    
  } catch (error) {
    console.error('❌ Errore rimozione calendario:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Endpoint per attivare/disattivare un calendario
app.patch('/api/calendars/:id/toggle', (req, res) => {
  try {
    const calendarId = parseInt(req.params.id);
    const calendar = externalCalendars.find(cal => cal.id === calendarId);
    
    if (!calendar) {
      return res.status(404).json({
        success: false,
        error: 'Calendario non trovato'
      });
    }
    
    calendar.is_active = !calendar.is_active;
    
    console.log(`🔄 Calendario ${calendar.is_active ? 'attivato' : 'disattivato'}:`, calendar);
    res.json({
      success: true,
      data: calendar,
      message: `Calendario ${calendar.is_active ? 'attivato' : 'disattivato'} con successo`
    });
    
  } catch (error) {
    console.error('❌ Errore toggle calendario:', error);
    res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  }
});

// Endpoint per sincronizzare i calendari
app.post('/api/calendars/sync', async (req, res) => {
  try {
    console.log('🔄 Avvio sincronizzazione calendari');
    
    const syncResults = [];
    
    for (const calendar of externalCalendars) {
      if (!calendar.is_active) {
        continue;
      }
      
      try {
        // Simula il download dell'iCal
        console.log(`📥 Sincronizzazione ${calendar.platform}: ${calendar.name}`);
        
        // In una vera implementazione, qui faresti:
        // const icalData = await fetch(calendar.ical_url);
        // const events = parseICalData(icalData);
        
        calendar.last_sync = new Date().toISOString();
        calendar.last_sync_error = null;
        
        syncResults.push({
          calendar_id: calendar.id,
          platform: calendar.platform,
          status: 'success',
          events_imported: Math.floor(Math.random() * 10) + 1
        });
        
      } catch (error) {
        calendar.last_sync_error = error.message;
        syncResults.push({
          calendar_id: calendar.id,
          platform: calendar.platform,
          status: 'error',
          error: error.message
        });
      }
    }
    
    console.log('✅ Sincronizzazione completata:', syncResults);
    res.json({
      success: true,
      results: syncResults,
      message: 'Sincronizzazione completata'
    });
    
  } catch (error) {
    console.error('❌ Errore sincronizzazione:', error);
    res.status(500).json({
      success: false,
      error: 'Errore durante la sincronizzazione'
    });
  }
});

// Endpoint per ottenere statistiche di sincronizzazione
app.get('/api/calendars/sync-stats', (req, res) => {
  try {
    const platformStats = {};
    
    externalCalendars.forEach(calendar => {
      if (!platformStats[calendar.platform]) {
        platformStats[calendar.platform] = {
          platform: calendar.platform,
          calendar_count: 0,
          booking_count: 0,
          last_sync: null,
          error_count: 0
        };
      }
      
      platformStats[calendar.platform].calendar_count++;
      
      if (calendar.last_sync_error) {
        platformStats[calendar.platform].error_count++;
      }
      
      if (calendar.last_sync && (!platformStats[calendar.platform].last_sync || 
          calendar.last_sync > platformStats[calendar.platform].last_sync)) {
        platformStats[calendar.platform].last_sync = calendar.last_sync;
      }
      
      // Simula conteggio prenotazioni
      platformStats[calendar.platform].booking_count += Math.floor(Math.random() * 5);
    });
    
    res.json({
      success: true,
      data: Object.values(platformStats)
    });
    
  } catch (error) {
    console.error('❌ Errore statistiche:', error);
    res.status(500).json({
      success: false,
      error: 'Errore caricamento statistiche'
    });
  }
});

app.post('/api/contact-request', async (req, res) => {
  const { name, email, phone, guests, checkin, checkout, message } = req.body;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"${name}" <${email}>`,
    replyTo: email,
    to: process.env.MAIL_TO,
    subject: `Richiesta da ${name} — Vincanto`,
    html: `
      <h3>Nuova richiesta dal sito:</h3>
      <p><strong>Nome:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Telefono:</strong> ${phone}</p>
      <p><strong>Ospiti:</strong> ${guests}</p>
      <p><strong>Arrivo:</strong> ${checkin}</p>
      <p><strong>Partenza:</strong> ${checkout}</p>
      <p><strong>Messaggio:</strong><br/> ${message}</p>
    `,
  };

  try {
    console.log('📥 Dati form ricevuti:', req.body);
    console.log(`📨 Email in arrivo da ${name} <${email}>`);

    await transporter.sendMail(mailOptions);

    console.log('✅ Email inviata con successo!');
    res.status(200).json({ success: true, message: 'Email inviata con successo!' });
  } catch (error) {
    console.error('❌ Errore invio email:', error);
    res.status(500).json({ success: false, message: 'Errore invio email' });
  }
});

// Forza l'ascolto su IPv4 per evitare conflitti IPv6
app.listen(3001, '127.0.0.1', () => {
  console.log('✅ Backend avviato su http://127.0.0.1:3001');
  console.log('🔗 Ascoltando su IPv4 (127.0.0.1)');
});