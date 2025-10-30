/**
 * Production Logging System per Vincanto
 * Sistema di logging strutturato per produzione
 */

const fs = require('fs');
const path = require('path');

class ProductionLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatLogEntry(level, message, metadata = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      process: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }) + '\n';
  }

  writeToFile(filename, entry) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, entry);
  }

  info(message, metadata = {}) {
    const entry = this.formatLogEntry('INFO', message, metadata);
    console.log(`ℹ️  ${message}`, metadata);
    this.writeToFile('app.log', entry);
  }

  warn(message, metadata = {}) {
    const entry = this.formatLogEntry('WARN', message, metadata);
    console.warn(`⚠️  ${message}`, metadata);
    this.writeToFile('app.log', entry);
  }

  error(message, error = null, metadata = {}) {
    const errorMetadata = {
      ...metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };
    
    const entry = this.formatLogEntry('ERROR', message, errorMetadata);
    console.error(`❌ ${message}`, errorMetadata);
    this.writeToFile('error.log', entry);
    this.writeToFile('app.log', entry);
  }

  security(message, metadata = {}) {
    const entry = this.formatLogEntry('SECURITY', message, metadata);
    console.warn(`🚨 SECURITY: ${message}`, metadata);
    this.writeToFile('security.log', entry);
    this.writeToFile('app.log', entry);
  }

  apiRequest(req, res, responseTime) {
    const metadata = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0
    };

    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${responseTime}ms`;
    
    const entry = this.formatLogEntry(level, message, metadata);
    
    if (level === 'WARN') {
      console.warn(`⚠️  ${message}`);
    } else {
      console.log(`🌐 ${message}`);
    }
    
    this.writeToFile('access.log', entry);
  }

  performance(operation, duration, metadata = {}) {
    const message = `${operation} completed in ${duration}ms`;
    const perfMetadata = {
      ...metadata,
      operation,
      duration,
      performance: true
    };

    const entry = this.formatLogEntry('PERF', message, perfMetadata);
    
    if (duration > 1000) { // Log slow operations
      console.warn(`🐌 SLOW: ${message}`, perfMetadata);
      this.writeToFile('slow.log', entry);
    }
    
    this.writeToFile('performance.log', entry);
  }

  // Log rotazione automatica (da chiamare daily)
  rotateLogsIfNeeded() {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const logFiles = ['app.log', 'error.log', 'security.log', 'access.log'];
    
    logFiles.forEach(file => {
      const filePath = path.join(this.logDir, file);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        
        if (stats.size > maxSize) {
          const backupPath = path.join(this.logDir, `${file}.${Date.now()}.backup`);
          fs.renameSync(filePath, backupPath);
          this.info(`Log rotated: ${file} -> ${path.basename(backupPath)}`);
          
          // Mantieni solo gli ultimi 5 backup
          this.cleanupOldBackups(file);
        }
      }
    });
  }

  cleanupOldBackups(baseFileName) {
    const files = fs.readdirSync(this.logDir)
      .filter(file => file.startsWith(`${baseFileName}.`) && file.endsWith('.backup'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(this.logDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    // Rimuovi i backup più vecchi (mantieni solo i primi 5)
    files.slice(5).forEach(file => {
      fs.unlinkSync(path.join(this.logDir, file.name));
      this.info(`Old backup removed: ${file.name}`);
    });
  }
}

// Middleware per logging automatico delle richieste
const requestLogger = (logger) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      logger.apiRequest(req, res, responseTime);
    });
    
    next();
  };
};

// Singleton instance
const logger = new ProductionLogger();

// Auto-rotation ogni 24 ore
setInterval(() => {
  logger.rotateLogsIfNeeded();
}, 24 * 60 * 60 * 1000);

module.exports = {
  logger,
  requestLogger
};