const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // Controlliamo se il token è nell'header 'Authorization' e inizia con 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Estraiamo il token dall'header (es. "Bearer eyJhbGci...")
      token = req.headers.authorization.split(' ')[1];

      // Verifichiamo il token usando la nostra chiave segreta
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Aggiungiamo i dati dell'utente decodificati all'oggetto della richiesta
      // In questo modo, le rotte successive potranno sapere chi è l'utente autenticato
      req.user = decoded;

      // Passiamo al prossimo middleware o alla rotta
      next();
    } catch (error) {
      console.error('Errore di autenticazione token:', error.message);
      res.status(401).json({ message: 'Token non valido, autorizzazione negata.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Nessun token, autorizzazione negata.' });
  }
};

module.exports = { protect };
