/**
 * Vincanto Backend Server - API REST completa
 * Server Express con endpoint per amministrazione, prenotazioni, pagamenti e calendari
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Import database
const { initializeDatabase } = require('./models');

// Import middleware e routes
const { logAdminActivity, handleAuthError } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const pricingRoutes = require('./routes/pricing');
const calendarRoutes = require('./routes/calendars');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const stripeRoutes = require('./routes/stripe'); // 💳 Integrazione Stripe completa
const emailRoutes = require('./routes/email'); // 📧 Sistema email professionale
const calendarSyncRoutes = require('./routes/calendar-sync'); // 📅 Calendar sync anti-overbooking
const adminRoutes = require('./routes/admin'); // 🎛️ Admin panel unificato
const setupRoutes = require('./routes/setup'); // 🎯 Setup iniziale produzione

const app = express();

// Configurazione security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // limite di 100 richieste per finestra per IP
  message: {
    success: false,
    message: 'Troppe richieste da questo IP, riprova più tardi',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting più severo per autenticazione
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 10, // limite di 10 tentativi di login per finestra per IP
  message: {
    success: false,
    message: 'Troppi tentativi di login, riprova più tardi',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

// Middleware base
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'https://www.vincantomaori.it'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy per ottenere IP reali dietro reverse proxy
app.set('trust proxy', 1);

// Middleware di logging per tutte le richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Vincanto Backend API - Online',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API Info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Vincanto REST API v2.0',
    documentation: {
      auth: 'Authentication and authorization endpoints',
      pricing: 'Pricing configuration and calculation endpoints',
      calendars: 'Calendar management and Google Calendar integration',
      bookings: 'Booking management and CRUD operations',
      payments: 'Payment processing and financial reporting',
      admin: 'Admin panel dashboard and management endpoints',
      stripe: 'Stripe payment integration and webhooks',
      email: 'Professional email system and notifications',
      'calendar-sync': 'External calendar sync and anti-overbooking protection'
    },
    endpoints: {
      auth: '/api/auth/*',
      pricing: '/api/pricing/*',
      calendars: '/api/calendars/*',
      bookings: '/api/bookings/*',
      payments: '/api/payments/*',
      admin: '/api/admin/*',
      stripe: '/api/stripe/*',
      email: '/api/email/*',
      'calendar-sync': '/api/calendar-sync/*'
    },
    features: [
      'JWT Authentication',
      'Rate Limiting',
      'Input Validation',
      'Error Handling',
      'Activity Logging',
      'Security Headers',
      'CORS Support'
    ],
    timestamp: new Date().toISOString()
  });
});

// Applicazione rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', limiter);

// Routes API
app.use('/api/auth', logAdminActivity, authRoutes);
app.use('/api/pricing', logAdminActivity, pricingRoutes);
app.use('/api/calendars', logAdminActivity, calendarRoutes);
app.use('/api/bookings', logAdminActivity, bookingRoutes);
app.use('/api/payments', logAdminActivity, paymentRoutes);
app.use('/api/stripe', stripeRoutes); // 💳 Stripe API routes (no auth per webhook)
app.use('/api/email', logAdminActivity, emailRoutes); // 📧 Sistema email professionale
app.use('/api/calendar-sync', logAdminActivity, calendarSyncRoutes); // 📅 Calendar sync anti-overbooking
app.use('/api/admin', logAdminActivity, adminRoutes); // 🎛️ Admin panel unificato
app.use('/api/admin', setupRoutes); // 🎯 Setup iniziale produzione (no auth per setup)

// Endpoint legacy per compatibilità (da deprecare)
app.post('/api/contact', (req, res) => {
  console.log('Legacy contact endpoint called - Consider migrating to new structure');
  res.json({
    success: true,
    message: 'Endpoint legacy - Considera migrazione alla nuova struttura API',
    deprecated: true
  });
});

// Gestione 404 per route API non trovate
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint API non trovato',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      auth: '/api/auth/*',
      pricing: '/api/pricing/*',
      calendars: '/api/calendars/*',
      bookings: '/api/bookings/*',
      payments: '/api/payments/*',
      admin: '/api/admin/*',
      stripe: '/api/stripe/*'
    }
  });
});

// Middleware di gestione errori
app.use(handleAuthError);

// Gestione errori generali
app.use((error, req, res, next) => {
  console.error('Unhandled Error:', error);
  
  // Errori di validazione JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON non valido nel body della richiesta',
      code: 'INVALID_JSON'
    });
  }
  
  // Altri errori
  res.status(500).json({
    success: false,
    message: 'Errore interno del server',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
  });
});

// Gestione 404 per tutte le altre route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trovata',
    path: req.path,
    suggestion: 'Controlla la documentazione API su /api'
  });
});

// Configurazione porta
const PORT = process.env.PORT || 3000;

// Funzione di avvio server con inizializzazione database
const startServer = async () => {
  try {
    // Inizializza database
    console.log('\n🗄️ Inizializzazione database...');
    await initializeDatabase();
    console.log('✅ Database inizializzato con successo');
    
    // Avvia server
    const server = app.listen(PORT, () => {
      console.log('\n🚀 Vincanto Backend Server avviato con successo!');
      console.log(`📡 Server in ascolto sulla porta: ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Avviato il: ${new Date().toISOString()}`);
      console.log('\n📋 Endpoint disponibili:');
      console.log('   • GET  /health           - Health check');
      console.log('   • GET  /api              - API documentation');
      console.log('   • POST /api/auth/login   - Admin login');
      console.log('   • GET  /api/pricing      - Pricing configs');
      console.log('   • GET  /api/calendars    - Calendar management');
      console.log('   • GET  /api/bookings     - Booking management');
      console.log('   • GET  /api/payments     - Payment processing');
      console.log('\n🔒 Sicurezza attiva:');
      console.log('   • Rate limiting abilitato');
      console.log('   • Security headers configurati');
      console.log('   • CORS configurato');
      console.log('   • Input validation attiva');
      console.log('   • Activity logging attivo');
      console.log('\n✅ Server pronto per ricevere richieste!\n');
    });
    
    return server;
  } catch (error) {
    console.error('❌ Errore durante l\'avvio del server:', error);
    process.exit(1);
  }
};

// Avvia il server
const server = startServer();

// Gestione graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 ${signal} ricevuto, shutdown graceful in corso...`);
  
  const serverInstance = await server;
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('✅ Server chiuso correttamente');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestione errori non catturati
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;