# 🔍 Debugging "Pagina Bianca" dopo PRENOTA

## Problema Riportato
Quando si clicca sul pulsante **PRENOTA** nel calendario, la pagina diventa bianca.

## 🎯 Cause Probabili

### 1. **Errore React Non Gestito**
La pagina bianca è tipicamente causata da:
- Un componente che solleva un'eccezione JavaScript
- Mancata gestione errori in `ErrorBoundary`
- Props `undefined` passate a componenti figli

### 2. **Problemi di Routing**
- Navigazione a route inesistente
- Hash routing non configurato
- Conflitto tra React Router e hash routing manuale

### 3. **API Call Fallita**
- Chiamata API che fallisce senza try-catch
- Promise rejection non gestita
- CORS error che blocca il flusso

## 🔧 Come Debuggare

### Step 1: Apri Console del Browser
1. Vai su: http://localhost:5173
2. Premi **F12** (o **Ctrl+Shift+I**)
3. Vai al tab **Console**
4. Clicca su PRENOTA
5. **GUARDA GLI ERRORI ROSSI** nella console

### Step 2: Controlla Network Tab
1. Nel DevTools, vai al tab **Network**
2. Clicca su PRENOTA
3. Cerca richieste **FAILED** (in rosso)
4. Verifica se ci sono errori 404, 500, CORS

### Step 3: Testa il Flow Step-by-Step

#### Test A: Modal si apre?
```typescript
// Vai alla sezione Booking
// Click su "Prenota ora"
// La modale dovrebbe aprirsi con il calendario
// ✅ Se si apre → OK
// ❌ Se pagina bianca → Errore in BookingModal o BookingSystem
```

#### Test B: Calendario funziona?
```typescript
// Nella modale aperta:
// Seleziona data Check-in
// Seleziona data Check-out
// ✅ Se funziona → OK
// ❌ Se errore → Problema in BookingCalendar
```

#### Test C: Form dettagli?
```typescript
// Dopo selezione date:
// Compila nome, email, telefono
// Click "Continua"
// ✅ Se va avanti → OK
// ❌ Se pagina bianca → Errore in validazione form
```

#### Test D: Pagamento?
```typescript
// Nella schermata pagamento:
// Scegli metodo (Stripe/PayPal/Bonifico)
// ✅ Se mostra opzioni → OK
// ❌ Se pagina bianca → Errore in StripePayment/PayPalPayment
```

## 🛠️ Fix Comuni

### Fix 1: Aggiungi Error Boundary

Crea `src/components/ErrorBoundary.tsx`:
```typescript
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔴 ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee', border: '2px solid red' }}>
          <h2>❌ Errore nel Sistema di Prenotazione</h2>
          <pre>{this.state.error?.message}</pre>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Riprova
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Poi wrappa BookingSystem:
```typescript
// In BookingModal.tsx
import ErrorBoundary from './ErrorBoundary';

// ...
<div className="booking-modal-content">
  <ErrorBoundary>
    <BookingSystem />
  </ErrorBoundary>
</div>
```

### Fix 2: Aggiungi Logging Dettagliato

In `BookingSystem.tsx`, aggiungi console.log:
```typescript
const BookingSystem = () => {
  console.log('🚀 BookingSystem mounted');
  
  // ... nel render
  console.log('📊 Rendering with state:', {
    currentStep,
    selectedDates,
    formData
  });
  
  return (
    // ...
  );
};
```

### Fix 3: Controlla API Endpoints

Verifica che tutte le API rispondano:
```bash
# Test pricing API
curl "http://localhost:5173/api/pricing?checkIn=2025-12-01&checkOut=2025-12-05&guests=2"

# Test booking API
curl "http://localhost:5173/api/booking" -X POST -H "Content-Type: application/json"
```

## 📋 Checklist Completa

- [ ] Aperta Console Browser (F12)
- [ ] Verificato errori rossi nella Console
- [ ] Controllato Network tab per 404/500 errors
- [ ] Testato apertura modale
- [ ] Testato selezione date calendario
- [ ] Testato compilazione form
- [ ] Verificato API endpoints attivi
- [ ] Aggiunto ErrorBoundary
- [ ] Aggiunto logging dettagliato

## 🆘 Se il Problema Persiste

**Inviami screenshot di:**
1. Console Browser con errori (F12 → Console)
2. Network tab con requests fallite (F12 → Network)
3. Esattamente quando appare la pagina bianca (dopo quale click)

**Oppure copia-incolla qui:**
```
// Copia tutti gli errori rossi dalla console
```

## 🔗 Link Utili

- Dev Server: http://localhost:5173
- Admin Panel: http://localhost:5173/#/admin
- React DevTools: Installa estensione Chrome/Firefox
