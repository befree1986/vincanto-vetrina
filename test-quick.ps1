# Test rapido post-configurazione Vercel
Write-Host "🔄 Test veloce APIs post-configurazione..." -ForegroundColor Cyan

# Test API che non usa DB (dovrebbe sempre funzionare)
Write-Host "`n1. API Quote (senza DB):" -ForegroundColor Yellow
try {
    $quoteResponse = Invoke-WebRequest -Uri "https://vincanto-vetrina.vercel.app/api/booking/quote" -Method POST -ContentType "application/json" -Body '{"check_in_date":"2025-11-01","check_out_date":"2025-11-04","num_adults":2}' -UseBasicParsing
    Write-Host "✅ Quote: OK ($($quoteResponse.StatusCode))" -ForegroundColor Green
} catch { Write-Host "❌ Quote: $($_.Exception.Message)" -ForegroundColor Red }

# Test API che usa DB (dovrebbe funzionare dopo config)
Write-Host "`n2. API Availability (con DB):" -ForegroundColor Yellow
try {
    $availResponse = Invoke-WebRequest -Uri "https://vincanto-vetrina.vercel.app/api/booking/availability" -Method POST -ContentType "application/json" -Body '{"check_in_date":"2025-11-01","check_out_date":"2025-11-04"}' -UseBasicParsing
    Write-Host "✅ Availability: OK ($($availResponse.StatusCode))" -ForegroundColor Green
    Write-Host $availResponse.Content
} catch { Write-Host "❌ Availability: $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "`n📊 RISULTATO:" -ForegroundColor Cyan
Write-Host "- Se Quote OK + Availability OK = Database configurato ✅" -ForegroundColor Green
Write-Host "- Se Quote OK + Availability errore = Database non ancora attivo ⏳" -ForegroundColor Yellow