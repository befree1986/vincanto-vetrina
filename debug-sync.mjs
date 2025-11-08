/**
 * Debug test per vedere l'errore esatto della sincronizzazione
 */

const API_BASE_URL = 'https://vincanto-backup.vercel.app/api';

async function debugSync() {
    try {
        console.log('🔍 Debug sincronizzazione calendari...');
        
        const response = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync-calendars' })
        });
        
        const text = await response.text();
        console.log('Raw response:', text);
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.log('Non è JSON, probabilmente HTML error page');
            return;
        }
        
        console.log('Parsed response:', data);
        
        if (!data.success) {
            console.log('❌ Errore:', data.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugSync();