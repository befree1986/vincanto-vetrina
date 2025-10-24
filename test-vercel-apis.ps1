# Test PowerShell per verificare APIs dopo configurazione database Vercel

Write-Host "🔄 Testando APIs con database dopo configurazione Vercel..." -ForegroundColor Cyan

Write-Host "`n📋 1. Test API Quote (dovrebbe funzionare):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://vincanto-vetrina.vercel.app/api/booking/quote" -Method POST -ContentType "application/json" -Body '{"check_in_date":"2025-11-01","check_out_date":"2025-11-04","num_adults":2,"num_children":0,"parking_option":"private"}' -UseBasicParsing
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Errore: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📅 2. Test API Availability (richiede database):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://vincanto-vetrina.vercel.app/api/booking/availability" -Method POST -ContentType "application/json" -Body '{"check_in_date":"2025-11-01","check_out_date":"2025-11-04"}' -UseBasicParsing
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Errore: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n💾 3. Test API Create (richiede database):" -ForegroundColor Yellow
$createBody = @{
    guest_name = "Test"
    guest_surname = "User"
    guest_email = "test@example.com"
    guest_phone = "+39123456789"
    check_in_date = "2025-11-01"
    check_out_date = "2025-11-04"
    num_adults = 2
    num_children = 0
    parking_option = "private"
    payment_method = "bank_transfer"
    payment_type = "deposit"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://vincanto-vetrina.vercel.app/api/booking/create" -Method POST -ContentType "application/json" -Body $createBody -UseBasicParsing
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Errore: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Test completato!" -ForegroundColor Green