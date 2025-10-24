// API Quote Semplificata - Compatibile con frontend esistente
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metodo non consentito' });
  }

  try {
    const { checkIn, checkOut, guests, includeParking } = req.body;

    if (!checkIn || !checkOut || !guests) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parametri richiesti: checkIn, checkOut, guests' 
      });
    }

    // Validazione date
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const today = new Date();
    
    if (startDate <= today) {
      return res.status(400).json({ 
        success: false, 
        error: 'Data di check-in non può essere nel passato' 
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Data di check-out deve essere successiva al check-in' 
      });
    }

    // Calcolo notti
    const diffTime = Math.abs(endDate - startDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Minimo 2 notti richieste' 
      });
    }

    // Prezzi configurati (allineati al database)
    const basePrice = 80.00;           // €80 per notte per adulto
    const additionalGuestPrice = 20.00; // €20 per ospite aggiuntivo per notte  
    const cleaningFee = 50.00;         // €50 pulizia finale
    const parkingFeePerNight = 10.00;  // €10 parcheggio per notte
    const touristTaxPerPersonPerNight = 2.00; // €2 tassa soggiorno per persona per notte
    const depositPercentage = 0.30;    // 30% acconto

    // Calcolo totale
    const baseCost = nights * basePrice; // Prezzo base per primo adulto
    const additionalGuestsCost = Math.max(0, guests - 1) * nights * additionalGuestPrice;
    const parkingCost = includeParking ? nights * parkingFeePerNight : 0;
    const touristTax = guests * nights * touristTaxPerPersonPerNight;
    
    const subtotal = baseCost + additionalGuestsCost + cleaningFee + parkingCost;
    const totalAmount = subtotal + touristTax;
    const depositAmount = Math.round(totalAmount * depositPercentage * 100) / 100;

    const costs = {
      nights,
      guests,
      basePrice: baseCost + additionalGuestsCost,
      parkingCost,
      cleaningFee,
      touristTax,
      subtotal,
      totalAmount,
      depositAmount,
      depositPercentage,
      currency: 'EUR',
      breakdown: {
        pricePerNight: basePrice,
        additionalGuestPricePerNight: additionalGuestPrice,
        parkingPerNight: parkingFeePerNight,
        touristTaxPerPersonPerNight: touristTaxPerPersonPerNight,
        cleaningFeeTotal: cleaningFee
      }
    };

    return res.status(200).json({ success: true, costs });

  } catch (error) {
    console.error('Errore calcolo quote:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore interno del server' 
    });
  }
}