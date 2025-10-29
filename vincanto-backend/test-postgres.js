/**
 * Test PostgreSQL Connection - Debug Version
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('🔍 Testing PostgreSQL Connection...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not found in .env file');
    process.exit(1);
}

// Connection con timeout breve per debug
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 10000, // 10 secondi timeout
    },
    pool: {
        max: 2,
        min: 0,
        acquire: 10000,
        idle: 5000
    },
    logging: console.log // Debug SQL queries
});

async function testConnection() {
    try {
        console.log('⏳ Attempting connection...');
        
        // Test connessione con timeout
        const startTime = Date.now();
        await sequelize.authenticate();
        const endTime = Date.now();
        
        console.log(`✅ PostgreSQL connection successful! (${endTime - startTime}ms)`);
        
        // Test query semplice
        const result = await sequelize.query('SELECT version();');
        console.log('📊 PostgreSQL Version:', result[0][0].version);
        
        return true;
    } catch (error) {
        console.log('❌ PostgreSQL connection failed:');
        console.log('Error Type:', error.name);
        console.log('Error Message:', error.message);
        console.log('Error Code:', error.code);
        
        if (error.parent) {
            console.log('Parent Error:', error.parent.message);
        }
        
        return false;
    } finally {
        try {
            await sequelize.close();
            console.log('🔒 Connection closed');
        } catch (closeError) {
            console.log('⚠️ Error closing connection:', closeError.message);
        }
    }
}

// Esegui test con timeout
const testTimeout = setTimeout(() => {
    console.log('⏰ Test timeout reached (15 seconds)');
    process.exit(1);
}, 15000);

testConnection()
    .then(success => {
        clearTimeout(testTimeout);
        if (success) {
            console.log('🎉 Test completed successfully!');
            process.exit(0);
        } else {
            console.log('💥 Test failed');
            process.exit(1);
        }
    })
    .catch(error => {
        clearTimeout(testTimeout);
        console.log('💥 Unexpected error:', error);
        process.exit(1);
    });