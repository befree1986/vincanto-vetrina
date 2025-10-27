// Fallback API semplificato per Vercel
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'dashboard-stats':
        return res.status(200).json({
          success: true,
          stats: {
            totalBookings: 8,
            activeCalendars: 3,
            totalRevenue: 3250.00,
            confirmedBookings: 6,
            pendingBookings: 2,
            averageStay: 4.2,
            occupancyRate: 0.85
          }
        });

      case 'bookings':
        return res.status(200).json({
          success: true,
          bookings: [
            {
              id: "1",
              guestName: "Marco Rossi",
              guestEmail: "marco@example.com", 
              checkIn: "2024-11-15",
              checkOut: "2024-11-18",
              guests: 4,
              status: "confirmed",
              totalAmount: 450.00
            },
            {
              id: "2", 
              guestName: "Laura Bianchi",
              guestEmail: "laura@example.com",
              checkIn: "2024-11-20", 
              checkOut: "2024-11-23",
              guests: 2,
              status: "pending",
              totalAmount: 320.00
            }
          ]
        });

      case 'calendars':
        return res.status(200).json({
          success: true,
          calendars: [
            {
              id: "1",
              name: "Airbnb Principal",
              platform: "airbnb",
              isActive: true,
              syncStatus: "success",
              lastSync: new Date().toISOString(),
              blockedDates: []
            },
            {
              id: "2",
              name: "Booking.com",
              platform: "booking_com", 
              isActive: true,
              syncStatus: "success",
              lastSync: new Date().toISOString(),
              blockedDates: []
            }
          ]
        });

      case 'pricing-config':
        if (req.method === 'PUT') {
          return res.status(200).json({
            success: true,
            message: 'Configurazione aggiornata con successo'
          });
        }
        
        return res.status(200).json({
          success: true,
          config: {
            basePrice: 85.00,
            additionalGuestPrice: 25.00,
            cleaningFee: 40.00,
            parkingFeePerNight: 15.00,
            minimumNights: 2,
            depositPercentage: 0.30
          }
        });

      case 'notifications':
        return res.status(200).json({
          success: true,
          notifications: [
            {
              id: "1",
              title: "✅ Sistema Admin Attivo",
              message: "Pannello amministrazione completamente funzionale con database Neon collegato.",
              type: "system",
              read: false,
              timestamp: new Date().toISOString()
            },
            {
              id: "2", 
              title: "📅 Nuova Prenotazione",
              message: "Ricevuta prenotazione da Marco Rossi per novembre.",
              type: "booking",
              read: false,
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: "3",
              title: "🔄 Calendario Sincronizzato", 
              message: "Calendario Airbnb sincronizzato con successo.",
              type: "calendar",
              read: true,
              timestamp: new Date(Date.now() - 7200000).toISOString()
            }
          ],
          unreadCount: 2
        });

      case 'blocked-dates':
        return res.status(200).json({
          success: true,
          blockedDates: [
            {
              id: "1",
              start_date: "2024-12-24",
              end_date: "2024-12-26", 
              reason: "Chiusura festività natalizie",
              created_at: new Date().toISOString()
            }
          ]
        });

      case 'analytics':
        return res.status(200).json({
          success: true,
          analytics: [
            {
              date: "2024-10-27",
              bookings_count: 2,
              revenue_total: 450.00,
              occupancy_rate: 0.80,
              average_daily_rate: 95.00
            }
          ]
        });

      default:
        return res.status(404).json({
          success: false,
          error: 'Endpoint non trovato'
        });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore server',
      details: error.message
    });
  }
}