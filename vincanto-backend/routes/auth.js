/**
 * Routes per autenticazione amministratore
 * Endpoint per login, logout, verifica token e gestione sessioni
 */

const express = require('express');
const router = express.Router();
const {
  generateAdminToken,
  verifyAdminToken,
  validateAdminCredentials,
  checkLoginAttempts,
  recordFailedLogin,
  resetLoginAttempts,
  authenticateAdmin,
  validateInput,
  AUTH_CONFIG
} = require('../middleware/auth');

// Schema di validazione per login
const loginSchema = {
  username: { required: true, type: 'string', minLength: 3 },
  password: { required: true, type: 'string', minLength: 6 }
};

// POST /api/auth/login - Effettua login amministratore
router.post('/login', validateInput(loginSchema), (req, res) => {
  try {
    const { username, password, rememberMe = false } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Controllo tentativi di login
    try {
      checkLoginAttempts(clientIp);
    } catch (error) {
      return res.status(429).json({
        success: false,
        message: error.message,
        code: 'TOO_MANY_ATTEMPTS'
      });
    }
    
    // Validazione credenziali
    if (!validateAdminCredentials(username, password)) {
      recordFailedLogin(clientIp);
      return res.status(401).json({
        success: false,
        message: 'Credenziali non valide',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Reset tentativi di login dopo successo
    resetLoginAttempts(clientIp);
    
    // Genera token
    const adminData = {
      username: username,
      email: AUTH_CONFIG.ADMIN_CREDENTIALS.email
    };
    
    const token = generateAdminToken(adminData);
    
    // Informazioni sessione
    const sessionInfo = {
      loginTime: new Date().toISOString(),
      clientIp: clientIp,
      userAgent: req.get('User-Agent'),
      rememberMe: rememberMe
    };
    
    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        token: token,
        admin: {
          id: 'admin_1',
          username: username,
          email: adminData.email,
          role: 'admin',
          permissions: ['read', 'write', 'delete', 'admin']
        },
        session: sessionInfo,
        expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno durante il login',
      error: error.message
    });
  }
});

// POST /api/auth/logout - Effettua logout (invalida token)
router.post('/logout', authenticateAdmin, (req, res) => {
  try {
    // In un'implementazione reale, aggiungeresti il token a una blacklist
    // Per ora simuliamo semplicemente la risposta
    
    const logoutData = {
      username: req.admin.username,
      logoutTime: new Date().toISOString(),
      sessionDuration: 'calculated_in_production' // Calcolare durata sessione
    };
    
    res.json({
      success: true,
      message: 'Logout effettuato con successo',
      data: logoutData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore durante il logout',
      error: error.message
    });
  }
});

// GET /api/auth/verify - Verifica validità token corrente
router.get('/verify', authenticateAdmin, (req, res) => {
  try {
    const tokenData = req.admin;
    
    // Calcola tempo rimanente
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = tokenData.exp ? tokenData.exp - now : null;
    
    res.json({
      success: true,
      message: 'Token valido',
      data: {
        admin: {
          id: tokenData.id,
          username: tokenData.username,
          email: tokenData.email,
          role: tokenData.role,
          permissions: tokenData.permissions,
          loginTime: tokenData.loginTime
        },
        token: {
          valid: true,
          expiresAt: tokenData.exp ? new Date(tokenData.exp * 1000).toISOString() : null,
          timeRemaining: timeRemaining ? `${Math.floor(timeRemaining / 3600)}h ${Math.floor((timeRemaining % 3600) / 60)}m` : null,
          issuedAt: tokenData.iat ? new Date(tokenData.iat * 1000).toISOString() : null
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nella verifica del token',
      error: error.message
    });
  }
});

// POST /api/auth/refresh - Rinnova token (se vicino alla scadenza)
router.post('/refresh', authenticateAdmin, (req, res) => {
  try {
    const currentToken = req.admin;
    const now = Math.floor(Date.now() / 1000);
    
    // Verifica se il token è vicino alla scadenza (ultimi 30 minuti)
    const timeToExpiry = currentToken.exp - now;
    const refreshThreshold = 30 * 60; // 30 minuti
    
    if (timeToExpiry > refreshThreshold) {
      return res.status(400).json({
        success: false,
        message: 'Token non necessita ancora di rinnovo',
        data: {
          timeToExpiry: `${Math.floor(timeToExpiry / 60)} minuti`,
          refreshAvailableIn: `${Math.floor((timeToExpiry - refreshThreshold) / 60)} minuti`
        }
      });
    }
    
    // Genera nuovo token
    const adminData = {
      username: currentToken.username,
      email: currentToken.email
    };
    
    const newToken = generateAdminToken(adminData);
    
    res.json({
      success: true,
      message: 'Token rinnovato con successo',
      data: {
        token: newToken,
        admin: {
          id: currentToken.id,
          username: currentToken.username,
          email: currentToken.email,
          role: currentToken.role,
          permissions: currentToken.permissions
        },
        expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN,
        oldTokenExpiry: new Date(currentToken.exp * 1000).toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel rinnovo del token',
      error: error.message
    });
  }
});

// GET /api/auth/profile - Ottieni profilo amministratore
router.get('/profile', authenticateAdmin, (req, res) => {
  try {
    const admin = req.admin;
    
    // Simula statistiche attività admin
    const activityStats = {
      totalLogins: Math.floor(Math.random() * 100) + 50,
      lastLoginDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      averageSessionDuration: '2h 15m',
      totalActionsPerformed: Math.floor(Math.random() * 500) + 200,
      mostUsedFeature: 'Gestione Prenotazioni',
      securityLevel: 'Alto'
    };
    
    res.json({
      success: true,
      data: {
        profile: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          loginTime: admin.loginTime,
          accountStatus: 'active',
          twoFactorEnabled: false
        },
        activity: activityStats,
        security: {
          passwordLastChanged: '2024-10-01T00:00:00Z',
          lastPasswordChangeRequired: false,
          accountLocked: false,
          failedLoginAttempts: 0
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del profilo',
      error: error.message
    });
  }
});

// POST /api/auth/change-password - Cambia password amministratore
router.post('/change-password', authenticateAdmin, validateInput({
  currentPassword: { required: true, type: 'string', minLength: 6 },
  newPassword: { required: true, type: 'string', minLength: 8 },
  confirmPassword: { required: true, type: 'string', minLength: 8 }
}), (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Verifica password attuale
    if (!validateAdminCredentials(req.admin.username, currentPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password attuale non corretta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }
    
    // Verifica che le nuove password coincidano
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nuova password e la conferma non coincidono',
        code: 'PASSWORD_MISMATCH'
      });
    }
    
    // Verifica complessità password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'La password deve contenere almeno: una lettera minuscola, una maiuscola, un numero e un carattere speciale',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // In produzione: salvare la nuova password nel database (hash)
    // Per ora simuliamo il successo
    
    res.json({
      success: true,
      message: 'Password cambiata con successo',
      data: {
        passwordChangedAt: new Date().toISOString(),
        strengthScore: 'Alta',
        nextChangeRequired: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 giorni
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel cambio password',
      error: error.message
    });
  }
});

// GET /api/auth/sessions - Ottieni sessioni attive (simulato)
router.get('/sessions', authenticateAdmin, (req, res) => {
  try {
    // Simula sessioni attive
    const sessions = [
      {
        id: 'session_current',
        isCurrent: true,
        startTime: req.admin.loginTime,
        lastActivity: new Date().toISOString(),
        ipAddress: req.ip || 'Unknown',
        userAgent: req.get('User-Agent') || 'Unknown',
        location: 'Italy (approx)',
        device: 'Desktop Browser'
      }
    ];
    
    res.json({
      success: true,
      data: {
        activeSessions: sessions,
        totalSessions: sessions.length,
        maxAllowedSessions: 3
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle sessioni',
      error: error.message
    });
  }
});

// GET /api/auth/security-log - Log attività di sicurezza
router.get('/security-log', authenticateAdmin, (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    // Simula log di sicurezza
    const securityEvents = [
      {
        id: 'sec_001',
        type: 'login_success',
        timestamp: new Date().toISOString(),
        description: 'Login amministratore effettuato',
        ipAddress: req.ip || 'Unknown',
        severity: 'info'
      },
      {
        id: 'sec_002',
        type: 'token_refresh',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        description: 'Token JWT rinnovato',
        ipAddress: req.ip || 'Unknown',
        severity: 'info'
      }
    ];
    
    const paginatedEvents = securityEvents.slice(
      parseInt(offset), 
      parseInt(offset) + parseInt(limit)
    );
    
    res.json({
      success: true,
      data: {
        events: paginatedEvents,
        pagination: {
          total: securityEvents.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < securityEvents.length
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del log di sicurezza',
      error: error.message
    });
  }
});

module.exports = router;