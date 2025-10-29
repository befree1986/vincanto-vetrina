/**
 * Database Configuration
 * Configurazione Sequelize per PostgreSQL (Neon) + SQLite fallback
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Configurazione database - PostgreSQL primary, SQLite fallback
const DB_CONFIG = process.env.DATABASE_URL ? {
  // 🟢 PostgreSQL (Production/Development con Neon)
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development' ? false : false, // Disabilita per performance
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  pool: {
    max: 3,        // Ridotto per free tier
    min: 1,        // Almeno 1 connessione
    acquire: 60000, // Timeout più lungo (60s)
    idle: 30000,   // Idle più lungo
    evict: 60000   // Keep alive
  }
} : {
  // 🟡 SQLite (Fallback locale)
  dialect: 'sqlite',
  storage: path.join(__dirname, '../data/vincanto.db'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Inizializza Sequelize
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, DB_CONFIG)
  : new Sequelize(DB_CONFIG);

// Test connessione database
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

// Sincronizza database (crea tabelle se non esistono)
async function syncDatabase(force = false) {
  try {
    console.log('🔄 Synchronizing database...');
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    return false;
  }
}

// Chiudi connessione database
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
  closeConnection,
  DB_CONFIG
};