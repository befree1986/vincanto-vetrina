import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const client = new pg.Client({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

await client.connect();

// Controlla struttura tabella bookings
const result = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'bookings' 
    ORDER BY ordinal_position
`);

console.log('Struttura tabella bookings:'); 
result.rows.forEach(row => {
    console.log(`  ${row.column_name}: ${row.data_type}`);
});

await client.end();