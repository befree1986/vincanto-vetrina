// API CALENDAR SYNC STATUS - Endpoint legacy
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      stats: {
        total: 3,
        active: 2,
        syncing: 0,
        errors: 0,
        lastSyncSuccess: new Date().toISOString(),
        totalEvents: Math.floor(Math.random() * 15) + 5,
        googleCalendar: 1,
        external: 2
      },
      calendars: [
        {
          id: 1,
          name: 'Google Calendar Main',
          type: 'google_calendar',
          status: 'active',
          lastSync: new Date().toISOString(),
          eventsCount: 5
        },
        {
          id: 2, 
          name: 'Airbnb Calendar',
          type: 'airbnb',
          status: 'active',
          lastSync: new Date().toISOString(),
          eventsCount: 3
        },
        {
          id: 3,
          name: 'Booking.com Calendar', 
          type: 'booking_com',
          status: 'active',
          lastSync: new Date().toISOString(),
          eventsCount: 4
        }
      ]
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Metodo non consentito'
  });
}