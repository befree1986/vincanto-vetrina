const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Il file .env si trova nella cartella 'vincanto', due livelli sopra 'src'
const envPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: envPath });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

module.exports = pool;

