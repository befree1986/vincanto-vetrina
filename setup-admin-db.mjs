import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: './server/.env' });

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupAdminDatabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔗 Connessione al database Neon...');
        await client.connect();
        console.log('✅ Connesso al database Neon');

        // Leggi lo schema admin
        const adminSchema = fs.readFileSync(path.join(__dirname, 'database/admin-schema.sql'), 'utf8');
        
        console.log('📊 Esecuzione schema admin completo...');
        await client.query(adminSchema);
        console.log('✅ Schema admin applicato con successo!');

        // Verifica tabelle create
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'admin_%'
            ORDER BY table_name;
        `;
        
        const result = await client.query(tablesQuery);
        console.log('\n📋 Tabelle admin create:');
        result.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name}`);
        });

        // Test inserimento configurazioni
        console.log('\n⚙️ Test configurazioni...');
        const settingsTest = await client.query(
            'SELECT setting_key, setting_value FROM admin_settings LIMIT 5'
        );
        console.log('✅ Configurazioni caricate:', settingsTest.rowCount);

        console.log('\n🎉 Setup database admin completato!');
        console.log('🔥 Il pannello admin ora può accedere a tutte le funzionalità reali!');

    } catch (error) {
        console.error('❌ Errore setup database:', error);
        throw error;
    } finally {
        await client.end();
    }
}

// Esegui setup
setupAdminDatabase()
    .then(() => {
        console.log('\n🚀 DATABASE ADMIN PRONTO PER LA PRODUZIONE!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Setup fallito:', error);
        process.exit(1);
    });