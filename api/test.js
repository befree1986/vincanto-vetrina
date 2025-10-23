// Vercel serverless function per test
export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ 
        message: '🎉 API funziona con Vercel serverless!', 
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
    });
}