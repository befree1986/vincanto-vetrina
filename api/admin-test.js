// Test API per debug

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;
    
    // Debug environment
    const debug = {
      action: action,
      databaseUrl: !!process.env.DATABASE_URL,
      databaseLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
      nodeEnv: process.env.NODE_ENV,
      method: req.method
    };

    console.log('Debug info:', debug);

    return res.status(200).json({
      success: true,
      debug: debug,
      message: 'Test API working'
    });

  } catch (error) {
    console.error('API Test Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};