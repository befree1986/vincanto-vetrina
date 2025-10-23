const http = require('http');

console.log('🔄 Creazione server HTTP...');

const server = http.createServer((req, res) => {
  console.log(`📥 Richiesta ricevuta: ${req.method} ${req.url}`);
  
  // Aggiungi headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'Server funziona!', 
      timestamp: new Date().toISOString() 
    }));
  } else if (req.url === '/api/calendars') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([]));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 8080;
console.log(`🔄 Tentativo di avvio server sulla porta ${PORT}...`);

server.listen(PORT, () => {
  console.log(`✅ Server HTTP avviato su http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Errore server:', err);
});

server.on('listening', () => {
  console.log('🎯 Server in ascolto confermato');
});