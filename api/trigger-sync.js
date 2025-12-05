/**
 * API Endpoint per triggerare manualmente la sincronizzazione calendari
 * GET /api/trigger-sync?token=CALENDAR_SYNC_TOKEN
 */

import { Pool } from '@neondatabase/serverless';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verifica token
  const { token } = req.query;
  if (token !== process.env.CALENDAR_SYNC_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🚀 Triggerando sincronizzazione calendario...');
    
    // Chiama l'endpoint di sync esistente
    const syncUrl = `${req.headers.host.startsWith('localhost') ? 'http://' : 'https://'}${req.headers.host}/api/calendar-real-sync`;
    
    const syncResponse = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Token': process.env.CALENDAR_SYNC_TOKEN || ''
      }
    });

    if (!syncResponse.ok) {
      throw new Error(`Sync failed: ${syncResponse.status}`);
    }

    const result = await syncResponse.json();
    
    return res.status(200).json({
      success: true,
      message: 'Sincronizzazione triggerata con successo',
      result: result
    });

  } catch (error) {
    console.error('❌ Errore trigger sync:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
