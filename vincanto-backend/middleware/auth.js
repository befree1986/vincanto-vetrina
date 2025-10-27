/**
 * Middleware per autenticazione amministratore
 * Gestisce autenticazione, autorizzazione e validazione sessioni admin
 */

const jwt = require('jsonwebtoken');

// Configurazione sicurezza
const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'vincanto-admin-secret-2024',
  JWT_EXPIRES_IN: '24h',
  ADMIN_CREDENTIALS: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'VincantoAdmin2024!',
    email: process.env.ADMIN_EMAIL || 'admin@vincantomaori.it'
  },
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 ore in ms
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000 // 15 minuti
};

// Storage temporaneo per tentativi di login (da sostituire con Redis/DB)
let loginAttempts = {};

/**
 * Genera JWT token per amministratore
 */
function generateAdminToken(adminData) {
  return jwt.sign(
    {
      id: 'admin_1',
      username: adminData.username,
      email: adminData.email,
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin'],
      loginTime: new Date().toISOString()
    },
    AUTH_CONFIG.JWT_SECRET,
    {
      expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN,
      issuer: 'vincanto-admin',
      audience: 'vincanto-app'
    }
  );
}

/**
 * Verifica JWT token
 */
function verifyAdminToken(token) {
  try {
    return jwt.verify(token, AUTH_CONFIG.JWT_SECRET, {
      issuer: 'vincanto-admin',
      audience: 'vincanto-app'
    });
  } catch (error) {
    throw new Error('Token non valido o scaduto');
  }
}

/**
 * Middleware di autenticazione
 */
function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token di autenticazione richiesto',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.substring(7); // Rimuove "Bearer "
    
    try {
      const decoded = verifyAdminToken(token);
      
      // Verifica se il token non è scaduto
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        return res.status(401).json({
          success: false,
          message: 'Token scaduto',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      // Aggiunge i dati admin alla request
      req.admin = decoded;
      next();
      
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token non valido',
        code: 'INVALID_TOKEN',
        error: jwtError.message
      });
    }
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore nell\'autenticazione',
      error: error.message
    });
  }
}

/**
 * Middleware per controllo permessi specifici
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Autenticazione richiesta'
      });
    }
    
    if (!req.admin.permissions || !req.admin.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permesso '${permission}' richiesto`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    next();
  };
}

/**
 * Controlla tentativi di login per prevenire brute force
 */
function checkLoginAttempts(identifier) {
  const attempts = loginAttempts[identifier];
  
  if (!attempts) return true;
  
  // Se bloccato, controlla se il lockout è scaduto
  if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
    const remainingTime = Math.ceil((attempts.lockedUntil - Date.now()) / 1000 / 60);
    throw new Error(`Account bloccato. Riprova in ${remainingTime} minuti`);
  }
  
  // Resetta se il lockout è scaduto
  if (attempts.lockedUntil && attempts.lockedUntil <= Date.now()) {
    delete loginAttempts[identifier];
    return true;
  }
  
  // Controlla numero di tentativi
  if (attempts.count >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + AUTH_CONFIG.LOCKOUT_DURATION;
    const lockoutMinutes = AUTH_CONFIG.LOCKOUT_DURATION / 1000 / 60;
    throw new Error(`Troppi tentativi di login. Account bloccato per ${lockoutMinutes} minuti`);
  }
  
  return true;
}

/**
 * Registra tentativo di login fallito
 */
function recordFailedLogin(identifier) {
  if (!loginAttempts[identifier]) {
    loginAttempts[identifier] = { count: 0, firstAttempt: Date.now() };
  }
  
  loginAttempts[identifier].count++;
  loginAttempts[identifier].lastAttempt = Date.now();
}

/**
 * Resetta tentativi di login dopo successo
 */
function resetLoginAttempts(identifier) {
  delete loginAttempts[identifier];
}

/**
 * Valida credenziali admin
 */
function validateAdminCredentials(username, password) {
  const credentials = AUTH_CONFIG.ADMIN_CREDENTIALS;
  
  return username === credentials.username && password === credentials.password;
}

/**
 * Middleware per logging attività admin
 */
function logAdminActivity(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log dell'attività (in produzione salvare su database)
    const logEntry = {
      timestamp: new Date().toISOString(),
      admin: req.admin ? req.admin.username : 'anonymous',
      method: req.method,
      path: req.path,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      success: res.statusCode < 400
    };
    
    console.log('Admin Activity:', JSON.stringify(logEntry, null, 2));
    
    // Chiama il metodo originale
    originalSend.call(this, data);
  };
  
  next();
}

/**
 * Middleware per validazione input
 */
function validateInput(schema) {
  return (req, res, next) => {
    const errors = [];
    
    // Validazione semplice basata su schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      if (rules.required && (!value || value.toString().trim() === '')) {
        errors.push(`Campo '${field}' è obbligatorio`);
        continue;
      }
      
      if (value && rules.type) {
        if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`Campo '${field}' deve essere un'email valida`);
        }
        
        if (rules.type === 'number' && isNaN(value)) {
          errors.push(`Campo '${field}' deve essere un numero`);
        }
        
        if (rules.type === 'string' && typeof value !== 'string') {
          errors.push(`Campo '${field}' deve essere una stringa`);
        }
      }
      
      if (value && rules.minLength && value.toString().length < rules.minLength) {
        errors.push(`Campo '${field}' deve essere di almeno ${rules.minLength} caratteri`);
      }
      
      if (value && rules.maxLength && value.toString().length > rules.maxLength) {
        errors.push(`Campo '${field}' non può superare ${rules.maxLength} caratteri`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Errori di validazione',
        errors: errors
      });
    }
    
    next();
  };
}

/**
 * Genera response standardizzata per errori
 */
function handleAuthError(error, req, res, next) {
  console.error('Auth Error:', error);
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token non valido',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token scaduto',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Errore interno del server',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
  });
}

module.exports = {
  // Funzioni principali
  generateAdminToken,
  verifyAdminToken,
  validateAdminCredentials,
  
  // Middleware
  authenticateAdmin,
  requirePermission,
  logAdminActivity,
  validateInput,
  handleAuthError,
  
  // Funzioni di sicurezza
  checkLoginAttempts,
  recordFailedLogin,
  resetLoginAttempts,
  
  // Configurazioni
  AUTH_CONFIG
};