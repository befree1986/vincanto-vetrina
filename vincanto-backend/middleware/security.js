/**
 * Security Middleware per Vincanto
 * Validazione input, sanitizzazione e security checks
 */

const validator = require('validator');
const rateLimit = require('express-rate-limit');

// Sanitizza input per prevenire XSS
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitizza body
    if (req.body) {
      for (let key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = validator.escape(req.body[key].trim());
        }
      }
    }

    // Sanitizza query params
    if (req.query) {
      for (let key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = validator.escape(req.query[key].trim());
        }
      }
    }

    next();
  } catch (error) {
    console.error('❌ Errore sanitizzazione input:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid input format',
      code: 'INVALID_INPUT'
    });
  }
};

// Validazione email
const validateEmail = (email) => {
  return validator.isEmail(email) && email.length <= 255;
};

// Validazione password sicura
const validatePassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });
};

// Validazione date per booking
const validateBookingDates = (checkIn, checkOut) => {
  try {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    
    // Check-in deve essere futuro
    if (checkInDate < today) {
      return { valid: false, message: 'Check-in deve essere futuro' };
    }
    
    // Check-out deve essere dopo check-in
    if (checkOutDate <= checkInDate) {
      return { valid: false, message: 'Check-out deve essere dopo check-in' };
    }
    
    // Massimo 90 giorni di anticipo
    const maxAdvance = new Date();
    maxAdvance.setDate(maxAdvance.getDate() + 365);
    if (checkInDate > maxAdvance) {
      return { valid: false, message: 'Prenotazione troppo in anticipo' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, message: 'Formato date non valido' };
  }
};

// Rate limiter per IP specifici (admin)
const createIPLimiter = (max, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => req.ip,
    handler: (req, res) => {
      console.warn(`🚫 Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });
};

// Middleware per logging richieste sospette
const logSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /admin.*\/\.\./, // Path traversal
    /script|javascript|eval/i, // XSS attempts
    /union.*select|drop.*table/i, // SQL injection
    /<script|<iframe|javascript:/i // XSS patterns
  ];

  const fullUrl = req.originalUrl;
  const userAgent = req.get('User-Agent') || '';
  
  for (let pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(JSON.stringify(req.body)) || pattern.test(userAgent)) {
      console.warn(`🚨 SUSPICIOUS ACTIVITY DETECTED:`, {
        ip: req.ip,
        url: fullUrl,
        method: req.method,
        userAgent: userAgent.substring(0, 200),
        body: req.body ? JSON.stringify(req.body).substring(0, 500) : null,
        timestamp: new Date().toISOString()
      });
      
      // Log to file in production
      if (process.env.NODE_ENV === 'production') {
        // TODO: Implement file logging or external service
      }
    }
  }
  
  next();
};

// Middleware per headers di sicurezza extra
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cache control per API
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
  
  next();
};

module.exports = {
  sanitizeInput,
  validateEmail,
  validatePassword,
  validateBookingDates,
  createIPLimiter,
  logSuspiciousActivity,
  securityHeaders
};