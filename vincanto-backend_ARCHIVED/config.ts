import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Controlla se una variabile d'ambiente è definita, altrimenti lancia un errore.
 * Questo ferma l'avvio del server se la configurazione è incompleta.
 */
function getEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variabile d'ambiente mancante: ${name}. Controlla il file .env nella cartella backend.`);
    }
    return value;
}

export const config = {
    port: process.env.PORT || 3001,
    mongoUri: getEnv('MONGO_URI'),
    email: {
        host: getEnv('EMAIL_HOST'),
        port: parseInt(getEnv('EMAIL_PORT'), 10),
        secure: getEnv('EMAIL_SECURE') === 'true',
        user: getEnv('EMAIL_USER'),
        pass: getEnv('EMAIL_PASS'),
    },
    adminEmail: getEnv('ADMIN_EMAIL'),
};