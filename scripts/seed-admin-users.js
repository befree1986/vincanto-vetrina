import bcrypt from 'bcrypt';
import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pkg;

// Utenti amministratori reali
const adminUsers = [
  {
    email: 'g.marino787@gmail.com',
    password: 'Noki@1986!',
    role: 'superadmin'
  },
  {
    email: 'g.marino787@gmail.com',
    password: 'Noki@1986!',
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

    for (const user of adminUsers) {
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

    console.log('\n✅ Utenti amministratori creati con successo!\n');
    console.log('📝 Credenziali:');
    console.log('─'.repeat(50));
    adminUsers.forEach(user => {
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
