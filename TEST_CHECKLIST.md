# 🧪 Test Checklist - Admin Panel

## ✅ Pre-requisiti
- [ ] Database schema deployed (run `complete-admin-schema.sql`)
- [ ] Vercel env variables configured (SMTP, Stripe)
- [ ] Latest code deployed to Vercel

## 📋 Test Sequence

### 1️⃣ Database Verification (2 min)
```sql
-- Run in Neon SQL Editor
\i database/verify-schema.sql
```

**Expected:**
- ✅ 4 tables exist: payment_transactions, notifications, email_logs, analytics
- ✅ 12 indexes created
- ✅ 4 triggers active
- ✅ 3 functions defined

---

### 2️⃣ Payment System Testing (5 min)

#### Via Admin Panel UI:
1. Go to **https://vincanto-vetrina.vercel.app/admin**
2. Navigate to **Pagamenti** tab
3. Test actions:
   - Click "⚙️ Configura Stripe" → Enter test config
   - Click "💳 Verifica Stato" on any payment
   - Click "📧 Invia Ricevuta" to test receipt sending

#### Via API:
```bash
# Test 1: Get transactions
curl "https://vincanto-vetrina.vercel.app/api/payments?action=get-transactions&limit=5"

# Test 2: Verify payment status (use real payment_id)
curl "https://vincanto-vetrina.vercel.app/api/payments?action=verify-status&payment_id=pi_test_123"
```

**Expected:**
- ✅ Transactions list loads
- ✅ Status verification returns data
- ✅ No 500 errors

---

### 3️⃣ Email System Testing (5 min)

#### Via Admin Panel UI:
1. Go to **Email** tab
2. Click "🔧 Test Invio" → Should show connection status
3. Test template email:
   - Click "✏️ Modifica" on "Conferma Prenotazione"
   - Send test email to your address

#### Via API:
```bash
# Test SMTP connection
curl "https://vincanto-vetrina.vercel.app/api/emails?action=test"

# Send template email
curl -X POST "https://vincanto-vetrina.vercel.app/api/emails?action=send-template" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "template": "booking_confirmation",
    "variables": {
      "customer_name": "Test User",
      "check_in": "2025-12-01",
      "check_out": "2025-12-05",
      "guests": "2",
      "total_amount": "450.00"
    }
  }'
```

**Expected:**
- ✅ SMTP test passes (or shows clear error)
- ✅ Template renders correctly
- ✅ Email received (check spam if not in inbox)

---

### 4️⃣ Analytics System Testing (3 min)

#### Via Admin Panel UI:
1. Go to **Analytics** tab
2. Check:
   - Dashboard shows metrics
   - Trend graphs render
   - Platform breakdown displayed

#### Via API:
```bash
# Get today's analytics
TODAY=$(date +%Y-%m-%d)
curl "https://vincanto-vetrina.vercel.app/api/analytics?action=get-daily&date=$TODAY"

# Aggregate today (creates/updates analytics)
curl -X POST "https://vincanto-vetrina.vercel.app/api/analytics?action=aggregate-today"

# Get 30-day summary
curl "https://vincanto-vetrina.vercel.app/api/analytics?action=get-summary&days=30"

# Export CSV
curl "https://vincanto-vetrina.vercel.app/api/analytics?action=export-csv&start_date=2025-11-01&end_date=2025-11-30" -o analytics.csv
```

**Expected:**
- ✅ Analytics data returned (may be zeros if no bookings)
- ✅ Aggregation completes successfully
- ✅ CSV export downloads

---

### 5️⃣ Notifications Testing (2 min)

#### Via Admin Panel UI:
1. Go to **Notifiche** tab
2. Check:
   - Notifications list loads
   - Filter by type works
   - Mark as read works

#### Via Database:
```sql
-- Check notifications table
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;

-- Test trigger by creating a test booking
INSERT INTO bookings (
  customer_name, customer_email, 
  check_in, check_out, 
  guests, total_amount, status
) VALUES (
  'Test User', 'test@example.com',
  CURRENT_DATE + 7, CURRENT_DATE + 10,
  2, 300.00, 'confirmed'
);

-- Verify notification was created
SELECT * FROM notifications WHERE type = 'booking' ORDER BY created_at DESC LIMIT 1;
```

**Expected:**
- ✅ Notification auto-created when booking inserted
- ✅ Notification appears in admin panel
- ✅ Badge shows unread count

---

### 6️⃣ Holidu Integration Testing (3 min)

#### Via Admin Panel UI:
1. Go to **Calendari** tab
2. Scroll to "Holidu Calendar" card
3. Test buttons:
   - **🔍 Test URL**: Should validate iCal endpoint
   - **🔄 Sync Holidu**: Should trigger sync
   - **📅 Carica Eventi**: Should load Holidu events

#### Via Admin Panel → Prenotazioni:
1. Check platform filter dropdown
2. Select "🏖️ Holidu"
3. Verify Holidu bookings show up with badge

**Expected:**
- ✅ Test URL returns success
- ✅ Sync completes without errors
- ✅ Holidu events appear in table with badge
- ✅ Platform filter works

---

### 7️⃣ End-to-End Booking Flow (5 min)

```sql
-- 1. Create a test booking
INSERT INTO bookings (
  customer_name, customer_email,
  check_in, check_out,
  guests, total_amount, 
  status, platform
) VALUES (
  'E2E Test', 'e2e@test.com',
  '2025-12-15', '2025-12-20',
  4, 575.00,
  'confirmed', 'direct'
) RETURNING id;

-- Note the returned ID (e.g., 123)

-- 2. Create a payment for that booking
INSERT INTO payment_transactions (
  booking_id, amount, currency,
  status, payment_method,
  customer_email, customer_name
) VALUES (
  123, 575.00, 'EUR',
  'succeeded', 'stripe',
  'e2e@test.com', 'E2E Test'
);

-- 3. Verify notifications were created
SELECT 
  type, title, message, created_at
FROM notifications
WHERE related_booking_id = 123
ORDER BY created_at;
```

**Expected:**
- ✅ 2 notifications created (booking + payment)
- ✅ Booking appears in Prenotazioni tab
- ✅ Payment appears in Pagamenti tab
- ✅ Analytics updated automatically

---

## 🚨 Troubleshooting

### Database errors?
```sql
-- Check if bookings table exists (required for foreign keys)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'bookings'
);
```

### SMTP errors?
- Verify SMTP_PASS is App Password (not regular password)
- Check 2FA enabled on Gmail
- Try SendGrid as alternative

### Stripe errors?
- Use test keys (sk_test_xxx)
- Verify keys are set in Vercel env
- Check Stripe Dashboard logs

### No data showing?
```sql
-- Create sample analytics data
INSERT INTO analytics (
  date, bookings_count, revenue,
  occupancy_rate, platform_direct_count,
  revenue_direct
) VALUES (
  CURRENT_DATE, 3, 850.00,
  100, 3, 850.00
);
```

---

## ✅ Success Criteria

All tests passing:
- [x] Database schema deployed
- [x] Payment APIs responding
- [x] Emails sending successfully
- [x] Analytics aggregating data
- [x] Notifications auto-creating
- [x] Holidu integration working
- [x] Admin panel UI functional

**System Status: 🟢 PRODUCTION READY**

---

## 📝 Post-Testing

After successful tests:
1. Remove test bookings/payments if desired
2. Configure real Stripe keys for production
3. Set up real SMTP for production emails
4. Monitor Vercel logs for any issues
5. Set up alerts for failed payments/emails

**Next**: Configure production credentials and go live! 🚀
