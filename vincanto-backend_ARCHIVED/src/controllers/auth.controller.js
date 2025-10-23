const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Controllore per il login dell'amministratore
 * @route   POST /api/auth/login
 */
const login = async (req, res) => {
  const { username, password } = req.body;

  // Validazione di base
  if (!username || !password) {
    return res.status(400).json({ message: "Username e password sono obbligatori." });
  }

  try {
    // 1. Trova l'utente nel database
    const userQuery = 'SELECT * FROM Admins WHERE username = $1';
    const { rows } = await pool.query(userQuery, [username]);

    if (rows.length === 0) {
      // Messaggio generico per non dare indizi a potenziali malintenzionati
      return res.status(401).json({ message: "Credenziali non valide." });
    }

    const admin = rows[0];

    // 2. Confronta la password fornita con l'hash salvato nel database
    const isPasswordCorrect = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Credenziali non valide." }); // Messaggio generico
    }

    // 3. Se le credenziali sono corrette, crea il payload per il token JWT
    const payload = {
      id: admin.id,
      username: admin.username,
    };

    // 4. Firma il token con la tua chiave segreta
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Il token scadrà tra 1 ora
    );

    // 5. Invia il token al client
    res.status(200).json({
      message: "Login effettuato con successo!",
      token: token
    });

  } catch (error) {
    console.error("Errore durante il login:", error);
    res.status(500).json({ message: "Errore del server durante il login." });
  }
};

module.exports = {
  login,
};