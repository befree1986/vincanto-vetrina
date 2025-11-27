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
  // Check if platform column exists
  let hasPlatformColumn = false;
  try {
    const columns = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'platform'
    `;
    hasPlatformColumn = columns.length > 0;
  } catch (e) {
    console.log('Platform column check failed:', e.message);
  }

  // Get bookings for the date
  let bookings;
  if (hasPlatformColumn) {
    bookings = await sql`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG((check_out::date - check_in::date)), 0) as avg_stay,
        COUNT(CASE WHEN platform = 'airbnb' THEN 1 END) as airbnb_count,
        COUNT(CASE WHEN platform = 'booking' THEN 1 END) as booking_count,
        COUNT(CASE WHEN platform = 'holidu' THEN 1 END) as holidu_count,
        COUNT(CASE WHEN platform = 'direct' THEN 1 END) as direct_count,
        COALESCE(SUM(CASE WHEN platform = 'airbnb' THEN total_amount ELSE 0 END), 0) as airbnb_revenue,
        COALESCE(SUM(CASE WHEN platform = 'booking' THEN total_amount ELSE 0 END), 0) as booking_revenue,
        COALESCE(SUM(CASE WHEN platform = 'holidu' THEN total_amount ELSE 0 END), 0) as holidu_revenue,
        COALESCE(SUM(CASE WHEN platform = 'direct' THEN total_amount ELSE 0 END), 0) as direct_revenue
      FROM bookings
      WHERE check_in::date <= ${date}::date AND check_out::date > ${date}::date
        AND (status IS NULL OR status NOT IN ('cancelled'))
    `;
  } else {
    // Fallback without platform column
    bookings = await sql`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG((check_out::date - check_in::date)), 0) as avg_stay,
        0 as airbnb_count,
        0 as booking_count,
        0 as holidu_count,
        0 as direct_count,
        0 as airbnb_revenue,
        0 as booking_revenue,
        0 as holidu_revenue,
        0 as direct_revenue
      FROM bookings
      WHERE check_in::date <= ${date}::date AND check_out::date > ${date}::date
        AND (status IS NULL OR status NOT IN ('cancelled'))
    `;
  }

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
  const daysInt = parseInt(days);

  const summary = await sql`
    SELECT 
      COALESCE(SUM(bookings_count), 0) as total_bookings,
      COALESCE(SUM(revenue), 0) as total_revenue,
      COALESCE(AVG(occupancy_rate), 0) as avg_occupancy,
      COALESCE(AVG(avg_stay_duration), 0) as avg_stay,
      COALESCE(SUM(platform_airbnb_count), 0) as total_airbnb,
      COALESCE(SUM(platform_booking_count), 0) as total_booking,
      COALESCE(SUM(platform_holidu_count), 0) as total_holidu,
      COALESCE(SUM(platform_direct_count), 0) as total_direct,
      COALESCE(SUM(revenue_airbnb), 0) as revenue_airbnb,
      COALESCE(SUM(revenue_booking), 0) as revenue_booking,
      COALESCE(SUM(revenue_holidu), 0) as revenue_holidu,
      COALESCE(SUM(revenue_direct), 0) as revenue_direct
    FROM analytics
    WHERE date >= CURRENT_DATE - ${daysInt}::integer
  `;

  return res.status(200).json(summary[0] || {});
}
