/**
 * Test Database Auto-Initialization System
 * Testa la creazione automatica delle tabelle del database
 */

const API_BASE_URL = 'https://vincanto-backup.vercel.app/api';

async function testDatabaseInitialization() {
    console.log('🧪 TEST DATABASE AUTO-INITIALIZATION\n');
    
    try {
        console.log('📋 1. Checking current database status...');
        const statusResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'database-status' })
        });
        
        if (!statusResponse.ok) {
            throw new Error(`Status check failed: ${statusResponse.status}`);
        }
        
        const statusResult = await statusResponse.json();
        console.log('Current database status:', statusResult);
        
        console.log('\n🚀 2. Initializing database tables...');
        const initResponse = await fetch(`${API_BASE_URL}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'init-database' })
        });
        
        if (!initResponse.ok) {
            throw new Error(`Database init failed: ${initResponse.status}`);
        }
        
        const initResult = await initResponse.json();
        console.log('Database initialization result:', initResult);
        
        console.log('\n✅ 3. Verifying table creation...');
        const verifyResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'database-status' })
        });
        
        if (!verifyResponse.ok) {
            throw new Error(`Verification failed: ${verifyResponse.status}`);
        }
        
        const verifyResult = await verifyResponse.json();
        console.log('Post-initialization database status:', verifyResult);
        
        // Analisi dei risultati
        console.log('\n📊 ANALYSIS:');
        if (verifyResult.success) {
            const { tables } = verifyResult;
            console.log(`✅ Tables found: ${tables.map(t => t.table_name).join(', ')}`);
            
            const bookingsTable = tables.find(t => t.table_name === 'bookings');
            const blockedDatesTable = tables.find(t => t.table_name === 'blocked_dates');
            
            if (bookingsTable) {
                console.log(`✅ Bookings table: ${bookingsTable.row_count} rows`);
            } else {
                console.log('❌ Bookings table missing');
            }
            
            if (blockedDatesTable) {
                console.log(`✅ Blocked dates table: ${blockedDatesTable.row_count} rows`);
            } else {
                console.log('❌ Blocked dates table missing');
            }
            
            const allTablesPresent = bookingsTable && blockedDatesTable;
            console.log(`\n🎯 Database initialization: ${allTablesPresent ? 'SUCCESS' : 'INCOMPLETE'}`);
            
            if (allTablesPresent) {
                console.log('🚀 SISTEMA AL 100% - PRODUCTION READY!');
            }
            
        } else {
            console.log('❌ Database status check failed');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
    
    return true;
}

// Esegui il test
testDatabaseInitialization()
    .then((success) => {
        if (success) {
            console.log('\n🎉 Database auto-initialization test completed!');
        } else {
            console.log('\n💥 Database auto-initialization test failed!');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });