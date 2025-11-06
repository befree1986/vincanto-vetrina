// ESEMPIO: Flusso Registrazione per Casa Vacanza Vincanto

// Scenario: Marco vuole prenotare Vincanto per Pasqua 2025

## FASE 1: PRIMA VISITA (Nuovo Cliente)
**Marco naviga su vincantomaiori.it:**
1. Controlla disponibilità 15-22 Aprile 2025
2. Vede prezzo €1.200 (7 notti)  
3. Clicca "Prenota Ora"
4. **RICHIESTA REGISTRAZIONE:**

```javascript
// Modale Registrazione
<RegistrationModal>
  <h2>Crea il tuo account Vincanto</h2>
  <p>Per completare la prenotazione, crea un account sicuro</p>
  
  <form>
    <input type="text" placeholder="Nome" required />
    <input type="text" placeholder="Cognome" required />
    <input type="email" placeholder="Email" required />
    <input type="password" placeholder="Password" required />
    <input type="tel" placeholder="Telefono" required />
    
    <button>Crea Account e Prenota</button>
  </form>
  
  <div>
    <p>Oppure accedi con:</p>
    <GoogleLoginButton />
    <FacebookLoginButton />
  </div>
  
  <p>Hai già un account? <LoginLink /></p>
</RegistrationModal>
```

## FASE 2: ACCOUNT CREATO
**Marco completa registrazione:**
- **Email conferma** inviata automaticamente
- **Redirect** a pagina checkout con dati pre-compilati
- **Profilo creato** con ID unico

## FASE 3: AREA RISERVATA
**Marco accede a "Il Mio Account":**

### Dashboard Personale:
```javascript
// Componente Dashboard Cliente
<UserDashboard user={marco}>
  
  {/* Prenotazioni Attive */}
  <section>
    <h3>Le Mie Prenotazioni</h3>
    <BookingCard>
      📅 15-22 Aprile 2025
      🏠 Vincanto Maiori  
      💰 €1.200 - Confermata
      📄 <DownloadInvoice />
      📧 <ContactHost />
    </BookingCard>
  </section>
  
  {/* Prenotazioni Passate */}
  <section>
    <h3>Soggiorni Precedenti</h3>
    <p>Prima volta a Vincanto! 🎉</p>
    <p>Lascia una recensione dopo il soggiorno</p>
  </section>
  
  {/* Azioni Rapide */}
  <section>
    <h3>Azioni Rapide</h3>
    <QuickActions>
      <button>📅 Nuova Prenotazione</button>
      <button>💰 Storico Pagamenti</button>  
      <button>📄 Le Mie Fatture</button>
      <button>⚙️ Impostazioni Account</button>
    </QuickActions>
  </section>
  
  {/* Offerte Personalizzate */}
  <section>
    <h3>Solo per Te</h3>
    <OfferCard>
      🎁 Sconto 10% per prenotazione entro Natale
      🌟 Cliente fedele - Upgrade gratuito camera vista mare
    </OfferCard>
  </section>
  
</UserDashboard>
```

## FASE 4: PRENOTAZIONI FUTURE
**Marco torna per estate 2025:**
1. **Login automatico** (sessione salvata)
2. **Dati pre-compilati** (nome, email, telefono)
3. **Pagamento rapido** (carta salvata con Stripe)
4. **Conferma immediata** (cliente verificato)

## BENEFICI BUSINESS PER VINCANTO

### Dati Clienti Strutturati:
```sql
-- Database Clienti Vincanto
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100), 
  phone VARCHAR(20),
  nationality VARCHAR(50),
  registration_date TIMESTAMP,
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  loyalty_tier VARCHAR(20) DEFAULT 'bronze'
);

-- Storico Prenotazioni
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  check_in DATE,
  check_out DATE,
  total_amount DECIMAL(10,2),
  status VARCHAR(20),
  booking_date TIMESTAMP
);
```

### Analytics Avanzate:
- **Clienti ricorrenti:** 35% repeat rate
- **Valore medio cliente:** €850 per prenotazione
- **Stagionalità preferenze:** Primavera 40%, Estate 45%
- **Lead time medio:** 45 giorni anticipo prenotazione