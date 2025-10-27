# Vincanto Production Deployment Guide

## 🚀 Deploy Production Setup

### Prerequisites
- Node.js 18+ installato
- Database SQLite o PostgreSQL configurato
- Credenziali Google Calendar API
- Dominio e certificato SSL

### 1. Environment Variables

Crea un file `.env` nella directory `vincanto-backend/` con:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
BASE_URL=https://www.vincantomaori.it

# Database Configuration (SQLite)
DATABASE_PATH=./data/vincanto_production.db

# Per PostgreSQL (opzionale)
# DATABASE_URL=postgresql://username:password@localhost:5432/vincanto_prod
# DATABASE_TYPE=postgres

# Security
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
BCRYPT_ROUNDS=12

# CORS Configuration
CORS_ORIGIN=https://www.vincantomaori.it,https://admin.vincantomaori.it

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=10

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@vincantomaori.it
SMTP_PASS=your-app-password-here

# Google Calendar API
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=https://www.vincantomaori.it/auth/google/callback

# Payment Providers
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_MODE=live

# Monitoring & Analytics
SENTRY_DSN=https://xxxxxxxxx@sentry.io/xxxxxxx
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

### 2. Database Setup Production

```bash
# 1. Installa dipendenze
cd vincanto-backend
npm install --production

# 2. Inizializza database di produzione
NODE_ENV=production npm run db:setup

# 3. Verifica database
NODE_ENV=production npm run db:stats
```

### 3. Build Frontend

```bash
# 1. Build del frontend
npm run build

# 2. Copia file statici al backend (se serve)
cp -r dist/* vincanto-backend/public/
```

### 4. SSL e Reverse Proxy (Nginx)

Configurazione Nginx (`/etc/nginx/sites-available/vincanto`):

```nginx
server {
    listen 80;
    server_name www.vincantomaori.it vincantomaori.it;
    return 301 https://www.vincantomaori.it$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.vincantomaori.it;
    
    ssl_certificate /etc/letsencrypt/live/vincantomaori.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vincantomaori.it/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Static files
    location / {
        root /var/www/vincanto/frontend;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Admin Panel
    location /admin {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Admin IP restriction (optional)
        # allow 192.168.1.0/24;
        # deny all;
    }
}
```

### 5. Process Manager (PM2)

Installa e configura PM2:

```bash
# Installa PM2
npm install -g pm2

# Crea ecosystem file
```

Crea `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'vincanto-backend',
    script: './server-api.js',
    cwd: './vincanto-backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

Avvia con PM2:

```bash
# Avvia l'applicazione
pm2 start ecosystem.config.js

# Salva configurazione
pm2 save

# Auto-start al boot
pm2 startup
```

### 6. Monitoring e Logs

```bash
# Monitoring PM2
pm2 monit

# Logs in real-time
pm2 logs vincanto-backend

# Restart app
pm2 restart vincanto-backend

# Status
pm2 status
```

### 7. Backup Automatico

Crea script di backup (`scripts/backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/vincanto"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="./data/vincanto_production.db"

# Crea directory backup
mkdir -p $BACKUP_DIR

# Backup database
cp $DB_FILE $BACKUP_DIR/vincanto_db_$DATE.db

# Backup configurazioni
tar -czf $BACKUP_DIR/vincanto_config_$DATE.tar.gz .env ecosystem.config.js

# Rimuovi backup vecchi (> 30 giorni)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completato: $DATE"
```

Aggiungi a crontab:

```bash
# Backup giornaliero alle 2:00
0 2 * * * /path/to/vincanto/scripts/backup.sh
```

### 8. SSL Certificate (Let's Encrypt)

```bash
# Installa Certbot
sudo apt install certbot python3-certbot-nginx

# Ottieni certificato
sudo certbot --nginx -d vincantomaori.it -d www.vincantomaori.it

# Auto-renewal
sudo certbot renew --dry-run
```

### 9. Firewall Configuration

```bash
# UFW Configuration
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 10. Final Checklist

- [ ] Environment variables configurate
- [ ] Database inizializzato e popolato
- [ ] Frontend buildato e servito
- [ ] SSL certificate installato
- [ ] Nginx configurato e attivo
- [ ] PM2 configurato e app avviata
- [ ] Backup automatico configurato
- [ ] Firewall configurato
- [ ] DNS pointing al server
- [ ] Google Calendar API credenziali configurate
- [ ] Payment providers configurati (Stripe/PayPal)
- [ ] Email SMTP configurato
- [ ] Monitoring attivo

### 11. Verifica Deployment

```bash
# Health check
curl https://www.vincantomaori.it/health

# API test
curl https://www.vincantomaori.it/api

# Test pricing
curl https://www.vincantomaori.it/api/pricing

# Test frontend
curl -I https://www.vincantomaori.it/
```

### 12. Post-Deploy

1. **Cambia password admin default**:
   - Login: admin@vincantomaori.it
   - Password temporanea: VincantoAdmin2024!

2. **Configura Google Calendar**:
   - Autorizza OAuth2
   - Sync calendario principale

3. **Test prenotazioni complete**:
   - Calcolo prezzi
   - Pagamenti
   - Email notifications

4. **Monitoring setup**:
   - Sentry per error tracking
   - Google Analytics
   - Uptime monitoring

## 🔧 Troubleshooting

### Database Issues
```bash
# Reset database (CAUTION!)
NODE_ENV=production npm run db:reset

# Check database integrity
sqlite3 data/vincanto_production.db "PRAGMA integrity_check;"
```

### Performance Optimization
```bash
# Enable gzip compression
# PM2 cluster mode
# CDN for static assets
# Database indexing optimization
```

### Security Hardening
- Regular security updates
- Log monitoring
- Intrusion detection
- Rate limiting tuning
- API key rotation

---

## 📞 Support

Per supporto post-deployment:
- Documentazione tecnica: `/docs`  
- Logs: PM2 dashboard
- Database admin: `/admin/database`
- Sistema monitoring: `/admin/system`