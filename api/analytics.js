import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'get-daily':
        return await getDailyAnalytics(req, res);
      case 'get-range':
        return await getAnalyticsRange(req, res);
      case 'aggregate-today':
        return await aggregateToday(req, res);
      case 'aggregate-date':
        return await aggregateDate(req, res);
      case 'export-csv':
        return await exportCSV(req, res);
      case 'get-summary':
        return await getSummary(req, res);
      default:
        return res.status(400).json({ error: 'Azione non valida' });
    }
  } catch (error) {
    console.error('❌ Errore API analytics:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getDailyAnalytics(req, res) {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const [analytics] = await sql`
    SELECT * FROM analytics WHERE date = ${targetDate}
  `;

  if (!analytics) {
    // If no data exists, aggregate it now
    await aggregateDateData(targetDate);
    const [newAnalytics] = await sql`
      SELECT * FROM analytics WHERE date = ${targetDate}
    `;
    return res.status(200).json(newAnalytics || {});
  }

  return res.status(200).json(analytics);
}

async function getAnalyticsRange(req, res) {
  const { start_date, end_date, limit = 30 } = req.query;

  let query;
  if (start_date && end_date) {
    query = sql`
      SELECT * FROM analytics 
      WHERE date BETWEEN ${start_date} AND ${end_date}
      ORDER BY date DESC
    `;
  } else {
    query = sql`
      SELECT * FROM analytics 
      ORDER BY date DESC 
      LIMIT ${parseInt(limit)}
    `;
  }

  const analytics = await query;
  return res.status(200).json({ analytics });
}

async function aggregateToday(req, res) {
  const today = new Date().toISOString().split('T')[0];
  await aggregateDateData(today);
  
  const [analytics] = await sql`
    SELECT * FROM analytics WHERE date = ${today}
  `;

  return res.status(200).json({ 
    success: true, 
    date: today, 
    analytics 
  });
}

async function aggregateDate(req, res) {
  const { date } = req.body;
  await aggregateDateData(date);
  
  const [analytics] = await sql`
    SELECT * FROM analytics WHERE date = ${date}
  `;

  return res.status(200).json({ 
    success: true, 
    date, 
    analytics 
  });
}

async function aggregateDateData(date) {
  // Get bookings for the date
  const bookings = await sql`
    SELECT 
      COUNT(*) as total_bookings,
      SUM(total_amount) as total_revenue,
      AVG(EXTRACT(EPOCH FROM (check_out - check_in))/86400) as avg_stay,
      COUNT(CASE WHEN platform = 'airbnb' THEN 1 END) as airbnb_count,
      COUNT(CASE WHEN platform = 'booking' THEN 1 END) as booking_count,
      COUNT(CASE WHEN platform = 'holidu' THEN 1 END) as holidu_count,
      COUNT(CASE WHEN platform = 'direct' THEN 1 END) as direct_count,
      SUM(CASE WHEN platform = 'airbnb' THEN total_amount ELSE 0 END) as airbnb_revenue,
      SUM(CASE WHEN platform = 'booking' THEN total_amount ELSE 0 END) as booking_revenue,
      SUM(CASE WHEN platform = 'holidu' THEN total_amount ELSE 0 END) as holidu_revenue,
      SUM(CASE WHEN platform = 'direct' THEN total_amount ELSE 0 END) as direct_revenue
    FROM bookings
    WHERE check_in <= ${date} AND check_out > ${date}
      AND status NOT IN ('cancelled')
  `;

  const booking = bookings[0] || {};

  // Calculate occupancy rate (assuming 1 property)
  const occupancy_rate = booking.total_bookings > 0 ? 100 : 0;

  // Upsert analytics data
  await sql`
    INSERT INTO analytics (
      date, 
      bookings_count, 
      revenue, 
      occupancy_rate,
      avg_stay_duration,
      platform_airbnb_count,
      platform_booking_count,
      platform_holidu_count,
      platform_direct_count,
      revenue_airbnb,
      revenue_booking,
      revenue_holidu,
      revenue_direct
    ) VALUES (
      ${date},
      ${booking.total_bookings || 0},
      ${booking.total_revenue || 0},
      ${occupancy_rate},
      ${booking.avg_stay || 0},
      ${booking.airbnb_count || 0},
      ${booking.booking_count || 0},
      ${booking.holidu_count || 0},
      ${booking.direct_count || 0},
      ${booking.airbnb_revenue || 0},
      ${booking.booking_revenue || 0},
      ${booking.holidu_revenue || 0},
      ${booking.direct_revenue || 0}
    )
    ON CONFLICT (date) DO UPDATE SET
      bookings_count = EXCLUDED.bookings_count,
      revenue = EXCLUDED.revenue,
      occupancy_rate = EXCLUDED.occupancy_rate,
      avg_stay_duration = EXCLUDED.avg_stay_duration,
      platform_airbnb_count = EXCLUDED.platform_airbnb_count,
      platform_booking_count = EXCLUDED.platform_booking_count,
      platform_holidu_count = EXCLUDED.platform_holidu_count,
      platform_direct_count = EXCLUDED.platform_direct_count,
      revenue_airbnb = EXCLUDED.revenue_airbnb,
      revenue_booking = EXCLUDED.revenue_booking,
      revenue_holidu = EXCLUDED.revenue_holidu,
      revenue_direct = EXCLUDED.revenue_direct,
      updated_at = CURRENT_TIMESTAMP
  `;
}

async function exportCSV(req, res) {
  const { start_date, end_date } = req.query;

  const analytics = await sql`
    SELECT * FROM analytics 
    WHERE date BETWEEN ${start_date} AND ${end_date}
    ORDER BY date DESC
  `;

  // Generate CSV
  const headers = [
    'Data', 'Prenotazioni', 'Ricavi', 'Occupancy %', 'Durata Media',
    'Airbnb', 'Booking', 'Holidu', 'Dirette',
    'Rev Airbnb', 'Rev Booking', 'Rev Holidu', 'Rev Dirette'
  ];

  const rows = analytics.map(a => [
    a.date,
    a.bookings_count,
    a.revenue,
    a.occupancy_rate,
    a.avg_stay_duration,
    a.platform_airbnb_count,
    a.platform_booking_count,
    a.platform_holidu_count,
    a.platform_direct_count,
    a.revenue_airbnb,
    a.revenue_booking,
    a.revenue_holidu,
    a.revenue_direct
  ]);

  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=analytics_${start_date}_${end_date}.csv`);
  res.status(200).send(csv);
}

async function getSummary(req, res) {
  const { days = 30 } = req.query;

  const summary = await sql`
    SELECT 
      SUM(bookings_count) as total_bookings,
      SUM(revenue) as total_revenue,
      AVG(occupancy_rate) as avg_occupancy,
      AVG(avg_stay_duration) as avg_stay,
      SUM(platform_airbnb_count) as total_airbnb,
      SUM(platform_booking_count) as total_booking,
      SUM(platform_holidu_count) as total_holidu,
      SUM(platform_direct_count) as total_direct,
      SUM(revenue_airbnb) as revenue_airbnb,
      SUM(revenue_booking) as revenue_booking,
      SUM(revenue_holidu) as revenue_holidu,
      SUM(revenue_direct) as revenue_direct
    FROM analytics
    WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
  `;

  return res.status(200).json(summary[0] || {});
}
