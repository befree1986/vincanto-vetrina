/**
 * Database Configuration
 * Configurazione Sequelize per SQLite database
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Configurazione database
const DB_CONFIG = {
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
const sequelize = new Sequelize(DB_CONFIG);

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