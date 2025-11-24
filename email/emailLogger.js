// Email logging utility with database storage
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize email_logs table
export async function initializeEmailLogsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        template_name VARCHAR(100),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        metadata JSONB,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        retry_count INTEGER DEFAULT 0
      )
    `);
    console.log('✅ Tabella email_logs inizializzata');
  } catch (error) {
    console.error('❌ Errore inizializzazione email_logs:', error.message);
  }
}

// Log email send attempt
export async function logEmail({ recipient, subject, templateName, status, errorMessage = null, metadata = {} }) {
  try {
    const result = await pool.query(`
      INSERT INTO email_logs (recipient, subject, template_name, status, error_message, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [recipient, subject, templateName, status, errorMessage, JSON.stringify(metadata)]);
    return result.rows[0].id;
  } catch (error) {
    console.error('⚠️ Errore logging email (non-blocking):', error.message);
    return null;
  }
}

// Update log after retry
export async function updateEmailLog(logId, { status, errorMessage = null, retryCount = 0 }) {
  try {
    await pool.query(`
      UPDATE email_logs 
      SET status = $2, error_message = $3, retry_count = $4
      WHERE id = $1
    `, [logId, status, errorMessage, retryCount]);
  } catch (error) {
    console.error('⚠️ Errore aggiornamento log email:', error.message);
  }
}

// Get email statistics
export async function getEmailStats() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(retry_count) as total_retries
      FROM email_logs
    `);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Errore recupero statistiche email:', error.message);
    return { total: 0, sent: 0, failed: 0, total_retries: 0 };
  }
}
