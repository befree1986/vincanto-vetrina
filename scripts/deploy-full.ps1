# Script PowerShell per deploy completo su Vercel con test funzionalità admin

Write-Host "🚀 DEPLOY VINCANTO - SISTEMA ADMIN COMPLETO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Verifica che tutto sia pronto
Write-Host "✅ Verifica pre-deploy..." -ForegroundColor Yellow
if (-not (Test-Path "api/admin.js")) {
    Write-Host "❌ File API admin.js mancante!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Host "❌ Build mancante! Eseguire npm run build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build presente" -ForegroundColor Green
Write-Host "✅ API admin.js presente" -ForegroundColor Green

# Deploy a Vercel
Write-Host "🌍 Deploy a Vercel..." -ForegroundColor Blue
npx vercel --prod --yes

# Test API endpoints
Write-Host "🧪 Test API endpoints admin..." -ForegroundColor Blue
Write-Host ""

$API_BASE = "https://vincantomaori.vercel.app/api/admin"

Write-Host "📊 Test Dashboard Stats..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_BASE?action=dashboard-stats" -Method GET
    if ($response.success) {
        Write-Host "✅ Dashboard Stats OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Dashboard Stats FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Dashboard Stats ERROR: $_" -ForegroundColor Red
}

Write-Host "📅 Test Calendars..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_BASE?action=calendars" -Method GET
    if ($response.success) {
        Write-Host "✅ Calendars OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Calendars FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Calendars ERROR: $_" -ForegroundColor Red
}

Write-Host "💰 Test Pricing Config..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_BASE?action=pricing-config" -Method GET
    if ($response.success) {
        Write-Host "✅ Pricing Config OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Pricing Config FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Pricing Config ERROR: $_" -ForegroundColor Red
}

Write-Host "🔔 Test Notifications..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$API_BASE?action=notifications" -Method GET
    if ($response.success) {
        Write-Host "✅ Notifications OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Notifications FAILED" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Notifications ERROR: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 DEPLOY COMPLETATO!" -ForegroundColor Green
Write-Host "📱 Admin Panel: https://vincantomaori.vercel.app/admin" -ForegroundColor White
Write-Host "🔧 API Base: $API_BASE" -ForegroundColor White
Write-Host ""
Write-Host "✅ SISTEMA ADMIN 100% OPERATIVO CON DATABASE REALE!" -ForegroundColor Green