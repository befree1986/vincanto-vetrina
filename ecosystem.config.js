/**
 * PM2 Ecosystem Configuration
 * Configurazione per il deployment di produzione con PM2
 */

module.exports = {
  apps: [{
    name: 'vincanto-backend',
    script: './server-api.js',
    cwd: './vincanto-backend',
    
    // Modalità cluster per performance
    instances: 'max', // Usa tutti i CPU disponibili
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_PATH: './data/vincanto_development.db'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_PATH: './data/vincanto_production.db'
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3001,
      DATABASE_PATH: './data/vincanto_staging.db'
    },
    
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Monitoring
    watch: false, // No watch in production
    ignore_watch: [
      'node_modules',
      'logs',
      'data'
    ],
    
    // Performance
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Restart policy
    restart_delay: 4000,
    max_restarts: 5,
    min_uptime: '10s',
    
    // Health monitoring
    health_check_grace_period: 10000,
    health_check_fatal_exceptions: true,
    
    // Auto-restart on errors
    autorestart: true,
    
    // Graceful shutdown
    kill_timeout: 5000
  }],
  
  deploy: {
    production: {
      user: 'www-data',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/befree1986/vincanto-vetrina.git',
      path: '/var/www/vincanto',
      'pre-deploy-local': '',
      'post-deploy': 'cd vincanto-backend && npm install --production && npm run db:setup && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'post-setup': 'ls -la',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'www-data',
      host: 'your-staging-server-ip',
      ref: 'origin/develop',
      repo: 'https://github.com/befree1986/vincanto-vetrina.git',
      path: '/var/www/vincanto-staging',
      'post-deploy': 'cd vincanto-backend && npm install && npm run db:setup && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};