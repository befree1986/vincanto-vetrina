/**
 * Vercel Function - Admin System Settings
 * Migrazione da Express localhost a Vercel serverless
 */

import { SystemSettings } from '../../vincanto-backend/models/index.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const settings = await SystemSettings.findAll({
        order: [['category', 'ASC'], ['setting_key', 'ASC']]
      });

      res.status(200).json({
        success: true,
        settings
      });

    } catch (error) {
      console.error('❌ Errore recupero settings:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        settings: []
      });
    }

  } else if (req.method === 'PUT') {
    try {
      const { settings } = req.body;
      
      // Aggiorna ogni setting
      const updates = await Promise.all(
        settings.map(setting => 
          SystemSettings.update(
            { 
              setting_value: setting.value
              // Rimosso last_updated_by per evitare errore UUID
            },
            { 
              where: { setting_key: setting.key } 
            }
          )
        )
      );
      
      res.status(200).json({
        success: true,
        message: `${settings.length} impostazioni aggiornate`,
        updated: updates.reduce((acc, [count]) => acc + count, 0)
      });

    } catch (error) {
      console.error('❌ Errore aggiornamento settings:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }

  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}