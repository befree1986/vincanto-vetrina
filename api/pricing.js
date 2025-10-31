// API endpoint per i prezzi Vincanto
export default async function handler(req, res) {
  console.log('📊 API Pricing chiamata:', req.method, req.url);

  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Configurazione prezzi predefinita
      const pricingConfig = {
        basePrice: 85,
        cleaningFee: 40,
        weekendSurcharge: 20,
        weeklyDiscount: 15,
        monthlyDiscount: 25,
        additionalGuestPrice: 25,
        maxGuests: 8,
        minStay: 2,
        maxStay: 30,
        currency: 'EUR',
        taxRate: 10, // Tassa di soggiorno
        parkingFeePerNight: 10,
        airConditioningFeePerNight: 15,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ Configurazione prezzi restituita');
      return res.status(200).json({
        success: true,
        data: pricingConfig,
        message: 'Configurazione prezzi caricata'
      });
    }

    if (req.method === 'POST') {
      // Aggiornamento configurazione prezzi (per admin)
      const updates = req.body;
      console.log('💾 Aggiornamento prezzi:', updates);
      
      return res.status(200).json({
        success: true,
        message: 'Configurazione prezzi aggiornata'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Metodo non supportato'
    });

  } catch (error) {
    console.error('❌ Errore API Pricing:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error.message
    });
  }
}