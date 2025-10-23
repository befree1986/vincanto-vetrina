const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Inserisci la password da hashare: ', (password) => {
  if (!password) {
    console.error('La password non può essere vuota.');
    rl.close();
    return;
  }

  const saltRounds = 12; // Un buon valore per la sicurezza
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error('Errore durante l\'hashing della password:', err);
      rl.close();
      return;
    }
    console.log('\n--- HASH GENERATO ---');
    console.log('Copia e incolla questo hash nel tuo comando SQL INSERT.');
    console.log('Hash:', hash);
    console.log('---------------------\n');
    rl.close();
  });
});

