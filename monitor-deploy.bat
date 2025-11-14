@echo off
echo.
echo ============================================
echo   MONITORAGGIO DEPLOY VERCEL
echo ============================================
echo.
echo Apro il browser su Vercel Deployments...
echo.
start https://vercel.com/befree1986/vincanto-vetrina/deployments
echo.
echo Controlla lo stato del deployment:
echo   - "Building" (in corso)
echo   - "Ready" (completato)
echo.
echo Dopo che e' "Ready", premi un tasto per testare...
pause
echo.
echo Apro pagina di test booking...
start https://vincanto-vetrina.vercel.app/test-booking.html
echo.
echo Compila il form e invia una prenotazione.
echo Se funziona, vedrai "Prenotazione creata con successo!"
echo.
pause
