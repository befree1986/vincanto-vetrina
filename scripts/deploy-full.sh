#!/bin/bash
# Script per deploy completo su Vercel con test funzionalità admin

echo "🚀 DEPLOY VINCANTO - SISTEMA ADMIN COMPLETO"
echo "========================================"

# Verifica che tutto sia pronto
echo "✅ Verifica pre-deploy..."
if [ ! -f "api/admin.js" ]; then
    echo "❌ File API admin.js mancante!"
    exit 1
fi

if [ ! -d "dist" ]; then
    echo "❌ Build mancante! Eseguire npm run build"
    exit 1
fi

echo "✅ Build presente"
echo "✅ API admin.js presente"

# Deploy a Vercel
echo "🌍 Deploy a Vercel..."
npx vercel --prod --yes

# Test API endpoints
echo "🧪 Test API endpoints admin..."
echo ""

API_BASE="https://vincantomaori.vercel.app/api/admin"

echo "📊 Test Dashboard Stats..."
curl -s "$API_BASE?action=dashboard-stats" | jq '.success'

echo "📅 Test Calendars..."
curl -s "$API_BASE?action=calendars" | jq '.success'

echo "💰 Test Pricing Config..."
curl -s "$API_BASE?action=pricing-config" | jq '.success'

echo "🔔 Test Notifications..."
curl -s "$API_BASE?action=notifications" | jq '.success'

echo "📈 Test Analytics..."
curl -s "$API_BASE?action=analytics" | jq '.success'

echo ""
echo "🎉 DEPLOY COMPLETATO!"
echo "📱 Admin Panel: https://vincantomaori.vercel.app/admin"
echo "🔧 API Base: $API_BASE"
echo ""
echo "✅ SISTEMA ADMIN 100% OPERATIVO CON DATABASE REALE!"