# 🏡 Vincanto Maori - Vacation Rental Websitevincanto.


Una moderna piattaforma web per la gestione di affitti brevi, costruita con React, TypeScript e un sistema di prenotazione avanzato.

## ✨ Caratteristiche

- 🎨 **Design Moderno**: Interfaccia responsive e user-friendly
- 🌍 **Multilingue**: Supporto per IT, EN, DE, FR
- 📅 **Sistema Prenotazioni**: Sistema di prenotazione integrato con calendario
- 💰 **Gestione Prezzi**: Calcolo dinamico prezzi e servizi extra
- 🎯 **SEO Optimized**: Ottimizzazione completa per motori di ricerca
- 📱 **Responsive**: Perfettamente adattabile a tutti i dispositivi
- 🌙 **Dark Mode**: Supporto per tema scuro/chiaro
- 🍪 **GDPR Compliant**: Gestione cookie conforme al GDPR

## 🚀 Tecnologie Utilizzate

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + CSS Modules
- **Routing**: React Router v7
- **Internazionalizzazione**: i18next
- **Icons**: Lucide React
- **SEO**: React Helmet
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Deploy**: Vercel

## 📦 Installazione

1. Clona il repository
```bash
git clone https://github.com/your-username/vincanto-maori.git
cd vincanto-maori
```

2. Installa le dipendenze
```bash
npm install
```

3. Configura le variabili d'ambiente
```bash
cp .env.example .env
# Modifica .env con le tue configurazioni
```

4. Avvia il server di sviluppo
```bash
npm run dev
```

## 🔧 Configurazione

### Variabili d'Ambiente

```env
# Database
DATABASE_URL=your_database_connection_string

# Admin Panel
VITE_ADMIN_PASSWORD=your_secure_password

# Calendar Integration
GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_google_client_secret
```

### Configurazione Database

Il sistema utilizza PostgreSQL per la persistenza dei dati. Assicurati di avere un database configurato e di aggiornare la stringa di connessione nell'ambiente.

## 🎯 Scripts Disponibili

- `npm run dev` - Avvia server di sviluppo
- `npm run build` - Build per produzione
- `npm run preview` - Preview del build
- `npm run lint` - Linting del codice

## 📁 Struttura Progetto

```
src/
├── components/         # Componenti riutilizzabili
├── pages/             # Pagine principali
├── sections/          # Sezioni della homepage
├── hooks/             # Custom React hooks
├── services/          # Servizi API
├── utils/             # Utilità e helper
├── styles/            # Stili CSS
├── locales/           # File di traduzione
└── data/              # Dati statici
```

## 🌍 Deploy

Il progetto è configurato per il deploy automatico su Vercel:

1. Push su branch `master`
2. Deploy automatico su Vercel
3. URL live: [vincanto-maori.vercel.app](https://vincanto-maori.vercel.app)

## 📧 Supporto

Per domande o supporto, contatta: info@vincantomaori.it

## 📄 Licenza

Tutti i diritti riservati - Vincanto Maori © 2025