console.log('🔄 Caricamento moduli...');
const express = require('express');
const cors = require('cors');

console.log('🔄 Creazione app Express...');
const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server funziona!', timestamp: new Date().toISOString() });
});

// Calendars endpoint semplice
app.get('/api/calendars', (req, res) => {
  res.json([]);
});

const PORT = process.env.PORT || 8080;
console.log(`🔄 Tentativo di avvio server sulla porta ${PORT}...`);

const server = app.listen(PORT, () => {
  console.log(`✅ Test server avviato su http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Errore server:', err);
});