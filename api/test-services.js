// Test API semplice per verificare il routing
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🧪 TEST API: Chiamata ricevuta');

  return res.status(200).json({
    success: true,
    message: 'Test API funziona correttamente',
    timestamp: new Date().toISOString()
  });
}