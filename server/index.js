import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pg from 'pg';

// Import routes
import bookingRoutes from './routes/booking.js';
import availabilityRoutes from './routes/availability.js';
import paymentRoutes from './routes/payment.js';
import adminRoutes from './routes/admin.js';
import calendarRoutes from './routes/calendars.js';

// Import services
import { startCalendarSync } from './services/calendarSync.js';
import { calendarScheduler } from './services/calendarScheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const { Pool } = pg;
export const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Test database connection
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Errore connessione database:', err.message);
        console.log('⚠️ Server continuerà senza database - alcune funzioni potrebbero non funzionare');
    } else {
        console.log('🔗 Database connesso:', res.rows[0].now);
    }
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Troppe richieste da questo IP, riprova più tardi.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
        process.env.PRODUCTION_URL,
        'http://localhost:5173',
        'https://www.vincantomaori.it'
    ].filter(Boolean),
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Test endpoint for debugging Vercel
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API funziona!', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
    });
});

// Direct test endpoint
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server Express funziona!', 
        path: req.path,
        method: req.method
    });
});

// API Routes
app.use('/api/booking', bookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/calendars', calendarRoutes);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint non trovato',
        path: req.originalUrl 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Errore server:', err);
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON malformato' });
    }
    
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' 
            ? 'Errore interno del server' 
            : err.message 
    });
});

// Per l'ambiente di sviluppo locale
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server Vincanto avviato su porta ${PORT}`);
        console.log(`📍 Ambiente: ${process.env.NODE_ENV}`);
        
        // Start calendar synchronization
        if (process.env.NODE_ENV !== 'test') {
            startCalendarSync();
            
            // Initialize calendar scheduler
            setTimeout(() => {
                calendarScheduler.init();
            }, 5000); // Wait 5 seconds for server to be fully ready
        }
    });
}

// Per Vercel serverless
export default app;