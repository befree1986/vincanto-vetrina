  // Se richiesta la selezione attuale
  if (req.method === 'GET' && req.query.selected) {
    try {
      if (fs.existsSync(SELECTED_PATH)) {
        const raw = fs.readFileSync(SELECTED_PATH, 'utf-8');
        const data = JSON.parse(raw);
        return res.status(200).json({ selected: data.selected || 'custom' });
      } else {
        return res.status(200).json({ selected: 'custom' });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Errore lettura selezione', details: err.message });
    }
  }
const SELECTED_PATH = path.resolve(process.cwd(), 'email', 'selected-template.json');

// API per gestire la selezione del template attivo
if (req.method === 'PATCH') {
  try {
    const { selected } = req.body;
    if (!selected) return res.status(400).json({ error: 'Selezione mancante' });
    fs.writeFileSync(SELECTED_PATH, JSON.stringify({ selected }), 'utf-8');
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Errore salvataggio selezione', details: err.message });
  }
}
if (req.method === 'PUT') {
  // Alias PATCH per compatibilità REST
  try {
    const { selected } = req.body;
    if (!selected) return res.status(400).json({ error: 'Selezione mancante' });
    fs.writeFileSync(SELECTED_PATH, JSON.stringify({ selected }), 'utf-8');
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Errore salvataggio selezione', details: err.message });
  }
}
// API endpoint per gestire il template email personalizzato

import fs from 'fs';
import path from 'path';
import { renderEmailTemplate } from '../email/templates/index.js';

const TEMPLATE_PATH = path.resolve(process.cwd(), 'email', 'custom-booking-template.html');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Se richiesto un template predefinito JS
    const def = req.query.default;
    if (def) {
      try {
        // Dati fittizi per anteprima
        const data = {
          firstName: 'Mario',
          lastName: 'Rossi',
          bookingId: 'ABC123',
          checkin: '2026-05-01',
          checkout: '2026-05-07',
          guests: 4,
          adults: 2,
          children: 2,
          totalAmount: 1200,
          depositAmount: 300,
          amountPaid: 300,
          paymentMethod: 'stripe',
          language: 'it',
          extraServices: [],
        };
        const html = renderEmailTemplate(def, data);
        return res.status(200).json({ html });
      } catch (err) {
        return res.status(500).json({ error: 'Errore rendering template', details: err.message });
      }
    }
    // Altrimenti template custom
    try {
      if (fs.existsSync(TEMPLATE_PATH)) {
        const html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
        return res.status(200).json({ html });
      } else {
        return res.status(200).json({ html: '' });
      }
    } catch (err) {
      return res.status(500).json({ error: 'Errore lettura template', details: err.message });
    }
  }
  if (req.method === 'POST') {
    // Salva il template
    try {
      const { html } = req.body;
      if (!html) return res.status(400).json({ error: 'HTML mancante' });
      fs.writeFileSync(TEMPLATE_PATH, html, 'utf-8');
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Errore salvataggio template', details: err.message });
    }
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Metodo ${req.method} non consentito`);
}
