#!/bin/bash
# Test script per verificare che il database sia configurato su Vercel

echo "🔄 Testando APIs con database dopo configurazione Vercel..."

echo "📋 1. Test API Quote (dovrebbe funzionare):"
curl -X POST "https://vincanto-vetrina.vercel.app/api/booking/quote" \
  -H "Content-Type: application/json" \
  -d '{"check_in_date":"2025-11-01","check_out_date":"2025-11-04","num_adults":2,"num_children":0,"parking_option":"private"}'

echo -e "\n\n📅 2. Test API Availability (dovrebbe funzionare dopo config DB):"
curl -X POST "https://vincanto-vetrina.vercel.app/api/booking/availability" \
  -H "Content-Type: application/json" \
  -d '{"check_in_date":"2025-11-01","check_out_date":"2025-11-04"}'

echo -e "\n\n💾 3. Test API Create Booking (dovrebbe funzionare dopo config DB):"
curl -X POST "https://vincanto-vetrina.vercel.app/api/booking/create" \
  -H "Content-Type: application/json" \
  -d '{
    "guest_name": "Test",
    "guest_surname": "User", 
    "guest_email": "test@example.com",
    "guest_phone": "+39123456789",
    "check_in_date": "2025-11-01",
    "check_out_date": "2025-11-04", 
    "num_adults": 2,
    "num_children": 0,
    "parking_option": "private",
    "payment_method": "bank_transfer",
    "payment_type": "deposit"
  }'

echo -e "\n\n✅ Test completato!"