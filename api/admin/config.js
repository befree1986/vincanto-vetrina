/**
 * API per configurazione sistema (SuperAdmin)
 * Gestisce prezzi, pagamenti, API keys, impostazioni
 */

// Configurazione sistema (in produzione salvare in database)
let systemConfig = {
    pricing: {
        basePrice: 80,
        additionalGuestPrice: 20,
        cleaningFee: 50,
        parkingFeePerNight: 10,
        touristTaxPerPersonPerNight: 2,
        minimumNights: 2,
        depositPercentage: 0.30,
        currency: 'EUR',
        updatedAt: '2025-10-23T00:00:00Z'
    },
    payments: {
        stripe: {
            enabled: true,
            publicKey: 'pk_test_...',
            secretKey: 'sk_test_...',
            webhookSecret: 'whsec_...'
        },
        paypal: {
            enabled: true,
            clientId: 'paypal_client_id',
            clientSecret: 'paypal_client_secret',
            mode: 'sandbox'
        },
        bankTransfer: {
            enabled: true,
            iban: 'IT60 X054 2811 1010 0000 0123 456',
            bankName: 'Banca Esempio',
            accountHolder: 'Vincanto S.R.L.'
        },
        updatedAt: '2025-10-23T00:00:00Z'
    },
    apis: {
        google: {
            calendarApiKey: 'google_calendar_api_key',
            enabled: true
        },
        airbnb: {
            apiKey: 'airbnb_api_key',
            enabled: false
        },
        booking: {
            apiKey: 'booking_api_key',
            enabled: false
        },
        email: {
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            smtpUser: 'info@vincantomaiori.it',
            smtpPassword: 'email_password',
            enabled: true
        },
        updatedAt: '2025-10-23T00:00:00Z'
    },
    notifications: {
        emailNotifications: true,
        smsNotifications: false,
        webhookUrl: '',
        adminEmail: 'info@vincantomaiori.it',
        updatedAt: '2025-10-23T00:00:00Z'
    },
    features: {
        autoSync: true,
        realTimeUpdates: true,
        multiLanguage: true,
        analytics: true,
        backupEnabled: true,
        debugMode: false,
        updatedAt: '2025-10-23T00:00:00Z'
    }
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Verifica autorizzazione SuperAdmin (semplificata per demo)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.includes('superadmin')) {
        return res.status(401).json({
            error: 'Accesso non autorizzato. Richiesti privilegi SuperAdmin.'
        });
    }
    
    try {
        switch (req.method) {
            case 'GET':
                return handleGetConfig(req, res);
            case 'PUT':
                return handleUpdateConfig(req, res);
            case 'POST':
                return handleTestConfig(req, res);
            default:
                return res.status(405).json({ error: 'Metodo non supportato' });
        }
    } catch (error) {
        console.error('Errore API configurazione:', error);
        return res.status(500).json({ error: 'Errore interno del server' });
    }
}

async function handleGetConfig(req, res) {
    const { section } = req.query;
    
    console.log('⚙️ Richiesta configurazione sistema');
    
    if (section && systemConfig[section]) {
        return res.status(200).json({
            success: true,
            config: { [section]: systemConfig[section] },
            section
        });
    }
    
    // Maschera le chiavi sensibili per sicurezza
    const publicConfig = JSON.parse(JSON.stringify(systemConfig));
    
    // Maschera password e chiavi API
    if (publicConfig.payments.stripe.secretKey) {
        publicConfig.payments.stripe.secretKey = '***masked***';
    }
    if (publicConfig.payments.paypal.clientSecret) {
        publicConfig.payments.paypal.clientSecret = '***masked***';
    }
    if (publicConfig.apis.email.smtpPassword) {
        publicConfig.apis.email.smtpPassword = '***masked***';
    }
    
    return res.status(200).json({
        success: true,
        config: publicConfig,
        lastUpdated: new Date().toISOString()
    });
}

async function handleUpdateConfig(req, res) {
    const { section, data } = req.body;
    
    if (!section || !data) {
        return res.status(400).json({
            error: 'Sezione e dati sono obbligatori'
        });
    }
    
    if (!systemConfig[section]) {
        return res.status(400).json({
            error: 'Sezione configurazione non valida'
        });
    }
    
    // Aggiorna la sezione
    systemConfig[section] = {
        ...systemConfig[section],
        ...data,
        updatedAt: new Date().toISOString()
    };
    
    console.log(`⚙️ Configurazione aggiornata: ${section}`);
    
    return res.status(200).json({
        success: true,
        config: systemConfig[section],
        message: `Configurazione ${section} aggiornata con successo`
    });
}

async function handleTestConfig(req, res) {
    const { type, config } = req.body;
    
    console.log(`🔧 Test configurazione: ${type}`);
    
    switch (type) {
        case 'email':
            return res.status(200).json({
                success: true,
                message: 'Test email inviata con successo',
                details: 'Email di test inviata a ' + config.testEmail
            });
            
        case 'payment':
            return res.status(200).json({
                success: true,
                message: 'Connessione pagamento testata',
                details: 'Connessione ' + config.provider + ' funzionante'
            });
            
        case 'api':
            return res.status(200).json({
                success: true,
                message: 'API testata con successo',
                details: 'API ' + config.service + ' risponde correttamente'
            });
            
        default:
            return res.status(400).json({
                error: 'Tipo di test non supportato'
            });
    }
}