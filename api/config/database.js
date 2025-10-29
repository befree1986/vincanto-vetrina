/**
 * Database Configuration per Vercel Functions
 * Configurazione PostgreSQL per ambiente serverless
 */

import { Sequelize } from 'sequelize';

// Configurazione database per Vercel
let sequelize;

if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  // Configurazione per Vercel/Produzione
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false, // Disabilita logging in produzione
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Configurazione per sviluppo locale
  sequelize = new Sequelize({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'vincanto',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
}

// Test connessione
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    return false;
  }
};

export { sequelize, testConnection };