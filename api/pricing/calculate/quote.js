// API endpoint per calcolo preventivi Vincanto
export default async function handler(req, res) {
  console.log('💰 API Quote chiamata:', req.method, req.query);

  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { checkIn, checkOut, guests = 2 } = req.query;

      if (!checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: 'Date di check-in e check-out sono richieste'
        });
      }

      // Calcola i giorni di soggiorno
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      if (nights <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le date non sono valide'
        });
      }

      // Configurazione prezzi
      const config = {
        basePrice: 85,
        cleaningFee: 40,
        weekendSurcharge: 20,
        weeklyDiscount: 15,
        monthlyDiscount: 25,
        additionalGuestPrice: 25,
        maxGuests: 8,
        taxRate: 3 // €3 per persona per notte
      };

      // Calcolo prezzo base
      let totalPrice = config.basePrice * nights;

      // Ospiti aggiuntivi (oltre 2)
      const additionalGuests = Math.max(0, parseInt(guests) - 2);
      const additionalGuestsCost = additionalGuests * config.additionalGuestPrice * nights;
      totalPrice += additionalGuestsCost;

      // Supplemento weekend (venerdì e sabato)
      let weekendNights = 0;
      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) { // Venerdì o Sabato
          weekendNights++;
        }
      }
      const weekendSurcharge = (config.basePrice * config.weekendSurcharge / 100) * weekendNights;
      totalPrice += weekendSurcharge;

      // Sconti per durata
      let discount = 0;
      if (nights >= 30) {
        discount = totalPrice * (config.monthlyDiscount / 100);
      } else if (nights >= 7) {
        discount = totalPrice * (config.weeklyDiscount / 100);
      }
      totalPrice -= discount;

      // Pulizia finale
      totalPrice += config.cleaningFee;

      // Tassa di soggiorno
      const touristTax = config.taxRate * parseInt(guests) * nights;
      totalPrice += touristTax;

      const breakdown = {
        basePrice: config.basePrice * nights,
        additionalGuests: additionalGuestsCost,
        weekendSurcharge: weekendSurcharge,
        discount: -discount,
        cleaningFee: config.cleaningFee,
        touristTax: touristTax,
        total: Math.round(totalPrice * 100) / 100
      };

      const quote = {
        checkIn,
        checkOut,
        nights,
        guests: parseInt(guests),
        weekendNights,
        breakdown,
        totalPrice: breakdown.total,
        currency: 'EUR',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        calculatedAt: new Date().toISOString()
      };

      console.log('✅ Preventivo calcolato:', quote);
      
      return res.status(200).json({
        success: true,
        data: quote,
        message: 'Preventivo calcolato con successo'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Metodo non supportato'
    });

  } catch (error) {
    console.error('❌ Errore calcolo preventivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore nel calcolo del preventivo',
      error: error.message
    });
  }
}