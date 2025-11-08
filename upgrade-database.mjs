/**
 * Script per eseguire upgrade database
 */

const API_BASE_URL = 'https://vincanto-backup.vercel.app/api';

async function upgradeDatabase() {
    console.log('🔧 UPGRADE DATABASE - Aggiornamento struttura tabelle\n');
    
    try {
        console.log('📋 Avvio upgrade database...');
        const upgradeResponse = await fetch(`${API_BASE_URL}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'upgrade-database' })
        });
        
        if (!upgradeResponse.ok) {
            throw new Error(`Upgrade failed: ${upgradeResponse.status}`);
        }
        
        const upgradeResult = await upgradeResponse.json();
        console.log('Risultato upgrade:', upgradeResult);
        
        if (upgradeResult.success) {
            console.log('✅ Database upgrade completato con successo!');
            console.log(`Upgrades eseguiti: ${upgradeResult.upgrades.join(', ')}`);
            
            if (upgradeResult.currentStructure) {
                console.log('\n📊 Struttura attuale tabella blocked_dates:');
                upgradeResult.currentStructure.forEach(col => {
                    console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
                });
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Upgrade database fallito:', error.message);
        return false;
    }
}

upgradeDatabase()
    .then((success) => {
        if (success) {
            console.log('\n🎉 Upgrade database completato!');
        } else {
            console.log('\n💥 Upgrade database fallito!');
            process.exit(1);
        }
    });