import bcrypt from 'bcrypt';
import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pkg;

// Test credentials
const testUsers = [
  {
    email: 'superadmin@vincanto.it',
    password: 'Vincanto@2025',
    role: 'superadmin'
  },
  {
    email: 'admin@vincanto.it',
    password: 'Admin@2025',
    role: 'admin'
  }
];

async function seedAdminUsers() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL non trovata nel file .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✓ Connesso al database Neon');

    for (const user of testUsers) {
      // Hash password con bcrypt
      const passwordHash = await bcrypt.hash(user.password, 10);

      // Insert user
      const query = `
        INSERT INTO admin_users (email, password_hash, role, two_factor_enabled)
        VALUES ($1, $2, $3, false)
        ON CONFLICT (email) DO UPDATE
        SET password_hash = $2, role = $3, updated_at = NOW()
        RETURNING id, email, role, created_at;
      `;

      const result = await client.query(query, [user.email, passwordHash, user.role]);
      const insertedUser = result.rows[0];

      console.log(`\n✓ Utente creato:`);
      console.log(`  Email:    ${insertedUser.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Ruolo:    ${insertedUser.role}`);
      console.log(`  Creato:   ${insertedUser.created_at}`);
    }

    console.log('\n✅ Utenti di test creati con successo!\n');
    console.log('📝 Credenziali per il testing:');
    console.log('─'.repeat(50));
    testUsers.forEach(user => {
      console.log(`${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Ruolo:    ${user.role}\n`);
    });

  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedAdminUsers();
