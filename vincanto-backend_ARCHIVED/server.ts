  import express, { Request, Response, NextFunction } from 'express';
  import cors from 'cors';
  import mongoose from 'mongoose';
  import dotenv from 'dotenv';
  import path from 'path';

  // Importa le rotte e i middleware usando gli alias del tsconfig.json
  import bookingRoutes from '@routes/booking.routes'; // Rotte per il form pubblico
  import adminRoutes from '@routes/admin.routes';   // Rotte per il pannello admin
  import errorHandler from '@middleware/error.middleware';

  // --- 1. CONFIGURAZIONE INIZIALE ---
  // Carica le variabili d'ambiente dal file .env nella root del backend
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

  const app = express();
  const PORT = process.env.PORT || 3001;

  // --- 2. MIDDLEWARE ---

  // Configurazione CORS Specifica e Corretta
  // Diciamo al backend di accettare richieste *solo* dai nostri frontend.
  const whitelist = ['http://localhost:5173','http://localhost:5174',  'http://localhost:3001']; // 5173 per admin, 3001 per il sito pubblico
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // Permetti richieste dalla whitelist e richieste senza 'origin' (es. Postman, test server-to-server)
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Non permesso da CORS'));
      }
    },
    credentials: true, // Permette l'invio di cookie/headers di autorizzazione
  };

  [{
    "resource": "/c:/Users/g_mar/Documents/lavoro/vincanto/vincanto-admin-frontend/Index.css",
    "owner": "_generated_diagnostic_collection_name_#0",
    "code": "unknownAtRules",
    "severity": 4,
    "message": "Unknown at rule @tailwind",
    "source": "css",
    "startLineNumber": 3,
    "startColumn": 1,
    "endLineNumber": 3,
    "endColumn": 10
  }]

  // Middleware per leggere il corpo delle richieste in formato JSON
  app.use(cors(corsOptions));
  app.use(express.json());

  // --- DEBUG E CONFIGURAZIONE NODEMAILER ---
  console.log('--- Variabili Ambiente Email ---');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL); // Email per le notifiche
  console.log('--- Fine Variabili Ambiente ---');


  // --- 3. CONNESSIONE A MONGODB ---
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('ERRORE: La variabile d\'ambiente MONGODB_URI non è definita nel file .env');
    process.exit(1);
  }

  mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connesso a MongoDB'))
    .catch(err => console.error('Errore di connessione a MongoDB:', err));

  // --- 4. ROUTING ---
  app.use('/api/bookings', bookingRoutes); // Endpoint per le nuove prenotazioni
  app.use('/api/admin', adminRoutes);

  // --- 5. GESTIONE ERRORI ---
  app.use(errorHandler);

  // --- 6. AVVIO DEL SERVER ---
  app.listen(PORT, () => {
    console.log(`🚀 Server backend in ascolto sulla porta ${PORT}`);
    console.log('✅ CORS è configurato per permettere richieste da:', whitelist.join(', '));
  });
