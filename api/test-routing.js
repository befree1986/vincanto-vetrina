export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: 'Routing test endpoint working',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}