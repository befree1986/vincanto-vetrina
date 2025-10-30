/**
 * Production Deployment Checklist & Validator
 * Sistema automatico di verifica pre-deploy
 */

const fs = require('fs');
const path = require('path');

class ProductionValidator {
  constructor() {
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  // Verifica configurazione environment
  validateEnvironment() {
    const requiredVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET', 
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'CORS_ORIGIN'
    ];

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        this.errors.push(`❌ Missing environment variable: ${varName}`);
      } else if (varName === 'JWT_SECRET' && process.env[varName].length < 32) {
        this.errors.push(`❌ JWT_SECRET must be at least 32 characters`);
      }
    });

    // Verifica valori di default non sicuri
    const dangerousDefaults = [
      { var: 'ADMIN_PASSWORD', dangerous: ['admin', 'password', '123456', 'vincanto2025'] },
      { var: 'JWT_SECRET', dangerous: ['your-super-secret', 'jwt-secret', 'changeme'] }
    ];

    dangerousDefaults.forEach(({ var: varName, dangerous }) => {
      const value = process.env[varName];
      if (value && dangerous.some(def => value.includes(def))) {
        this.errors.push(`❌ ${varName} contains default/unsafe value`);
      }
    });

    // Verifica NODE_ENV
    if (process.env.NODE_ENV !== 'production') {
      this.warnings.push(`⚠️  NODE_ENV is not 'production' (current: ${process.env.NODE_ENV})`);
    }
  }

  // Verifica sicurezza database
  validateDatabase() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      if (dbUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
        this.warnings.push(`⚠️  Using localhost database in production`);
      }
      
      if (!dbUrl.includes('ssl') && !dbUrl.includes('localhost')) {
        this.warnings.push(`⚠️  Database connection may not use SSL`);
      }
    }
  }

  // Verifica configurazione HTTPS e CORS
  validateSecurity() {
    const corsOrigin = process.env.CORS_ORIGIN;
    if (corsOrigin) {
      if (corsOrigin.includes('http://') && process.env.NODE_ENV === 'production') {
        this.errors.push(`❌ CORS_ORIGIN contains HTTP in production (should be HTTPS)`);
      }
      
      if (corsOrigin === '*') {
        this.errors.push(`❌ CORS_ORIGIN is wildcard (*) - security risk`);
      }
    }
  }

  // Verifica dipendenze
  validateDependencies() {
    const packagePath = path.join(__dirname, '../package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath));
      
      // Verifica dipendenze di sicurezza critiche
      const requiredSecurityDeps = ['helmet', 'express-rate-limit', 'bcrypt'];
      requiredSecurityDeps.forEach(dep => {
        if (!pkg.dependencies[dep] && !pkg.devDependencies[dep]) {
          this.errors.push(`❌ Missing security dependency: ${dep}`);
        }
      });
      
      // Verifica versioni Node.js
      if (pkg.engines && pkg.engines.node) {
        const nodeVersion = process.version;
        this.checks.push(`✅ Node.js version: ${nodeVersion}`);
      }
    }
  }

  // Verifica configurazione file
  validateFiles() {
    const criticalFiles = [
      { path: '../models/index.js', name: 'Database models' },
      { path: '../middleware/auth.js', name: 'Authentication middleware' },
      { path: '../routes', name: 'API routes directory' }
    ];

    criticalFiles.forEach(({ path: filePath, name }) => {
      const fullPath = path.join(__dirname, filePath);
      if (!fs.existsSync(fullPath)) {
        this.errors.push(`❌ Missing critical file: ${name} (${filePath})`);
      } else {
        this.checks.push(`✅ ${name} exists`);
      }
    });
  }

  // Verifica porte e configurazione server
  validateServer() {
    const port = process.env.PORT || 3000;
    
    if (port < 1024 && process.getuid && process.getuid() !== 0) {
      this.warnings.push(`⚠️  Port ${port} requires root privileges`);
    }
    
    this.checks.push(`✅ Server port configured: ${port}`);
  }

  // Verifica configurazione email
  validateEmail() {
    const emailConfig = {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    };

    if (emailConfig.host === 'smtp.gmail.com' && emailConfig.pass) {
      if (emailConfig.pass.length < 16) {
        this.warnings.push(`⚠️  Gmail SMTP password seems short - use App Password`);
      }
    }

    if (emailConfig.user && !emailConfig.user.includes('@')) {
      this.errors.push(`❌ SMTP_USER should be a valid email address`);
    }
  }

  // Esegui tutte le verifiche
  runAllChecks() {
    console.log('🔍 Running production deployment checks...\n');
    
    this.validateEnvironment();
    this.validateDatabase();
    this.validateSecurity();
    this.validateDependencies();
    this.validateFiles();
    this.validateServer();
    this.validateEmail();

    // Report finale
    this.generateReport();
  }

  generateReport() {
    console.log('=' .repeat(60));
    console.log('🎯 VINCANTO PRODUCTION DEPLOYMENT REPORT');
    console.log('=' .repeat(60));

    if (this.checks.length > 0) {
      console.log('\n✅ PASSED CHECKS:');
      this.checks.forEach(check => console.log(`   ${check}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   ${warning}`));
    }

    if (this.errors.length > 0) {
      console.log('\n❌ CRITICAL ERRORS:');
      this.errors.forEach(error => console.log(`   ${error}`));
      console.log('\n🚨 DEPLOYMENT BLOCKED - Fix errors before deploying!');
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('\n⚠️  DEPLOYMENT READY WITH WARNINGS');
      console.log('Consider addressing warnings for optimal security.');
    } else {
      console.log('\n🎉 PRODUCTION READY - All checks passed!');
    }

    console.log('=' .repeat(60));
  }
}

// Auto-run se chiamato direttamente
if (require.main === module) {
  const validator = new ProductionValidator();
  validator.runAllChecks();
}

module.exports = ProductionValidator;