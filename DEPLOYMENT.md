# Vincanto - Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon)
- Stripe account (production keys)
- PayPal business account
- Gmail app password
- Vercel account

### 1. Environment Configuration

#### Frontend (.env.production)
```bash
VITE_API_URL=https://your-domain.vercel.app/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

#### Backend (server/.env.production)
```bash
DATABASE_URL=your_neon_postgresql_url
STRIPE_SECRET_KEY=sk_live_your_stripe_secret
PAYPAL_CLIENT_SECRET=your_paypal_secret
SMTP_PASS=your_gmail_app_password
```

### 2. Database Setup

Run the database initialization:
```bash
cd server
node scripts/init-db.js
```

### 3. Build and Deploy

#### Local Build
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### 4. Post-Deployment Configuration

#### Webhook Endpoints
- **Stripe**: `https://your-domain.vercel.app/api/payment/stripe/webhook`
- **PayPal**: `https://your-domain.vercel.app/api/payment/paypal/webhook`

#### Calendar Sync
1. Access admin panel: `https://your-domain.vercel.app/admin`
2. Add external calendars (Booking.com iCal URLs)
3. Configure automatic sync (runs every 2 hours)

### 5. Testing Checklist

- [ ] Frontend loads correctly
- [ ] Booking form works
- [ ] Stripe payments process
- [ ] PayPal payments process
- [ ] Email confirmations send
- [ ] Calendar sync functions
- [ ] Admin panel accessible

### 6. Monitoring

#### Server Health
- Health check: `https://your-domain.vercel.app/api/health`
- Calendar stats: `https://your-domain.vercel.app/api/calendars/sync-stats`

#### Logs
- Vercel function logs
- Stripe dashboard
- PayPal dashboard

### 7. Security Notes

- All API endpoints use HTTPS
- Rate limiting enabled (100 requests/15 minutes)
- CORS configured for production domain
- Input validation on all forms
- SQL injection protection
- XSS protection headers

### 8. Backup Strategy

- Database: Neon automatic backups
- Code: Git repository
- Environment vars: Secure documentation

## 🔧 Development

### Local Development
```bash
# Frontend
npm run dev

# Backend
cd server
npm run dev
```

### Database Migrations
```bash
cd server
node scripts/migrate.js
```

## 📞 Support

For issues with deployment or configuration, check:
1. Vercel function logs
2. Browser console errors
3. Network tab for API calls
4. Database connection status