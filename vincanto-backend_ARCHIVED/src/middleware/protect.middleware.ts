import { Request, Response, NextFunction } from 'express';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('x-api-key');

  // 1. Controlla se la chiave è presente
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'Accesso non autorizzato: chiave API mancante.' });
  }

  // 2. Controlla se la chiave è corretta
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ success: false, message: 'Accesso negato: chiave API non valida.' });
  }

  // 3. Se la chiave è valida, procedi alla rotta richiesta
  next();
};

export default protect;