// Email sending wrapper with retry logic and logging
import nodemailer from 'nodemailer';
import { logEmail, updateEmailLog } from './emailLogger.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000; // 2 seconds base delay

// Create transporter (reuse connection)
let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      pool: true, // Use connection pooling
      maxConnections: 5
    });
  }
  return transporter;
}

// Sleep utility for retry delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Send email with retry logic
export async function sendEmailWithRetry({ to, subject, html, templateName = 'unknown', metadata = {} }) {
  if (!process.env.SMTP_HOST) {
    console.warn('⚠️ SMTP non configurato, skip invio email');
    return { success: false, error: 'SMTP not configured' };
  }

  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: 'Transporter initialization failed' };
  }

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Vincanto Maori'}" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html
  };

  let logId = null;
  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // First attempt: log as 'pending'
      if (attempt === 0) {
        logId = await logEmail({
          recipient: to,
          subject,
          templateName,
          status: 'pending',
          metadata
        });
      }

      // Attempt to send
      await transport.sendMail(mailOptions);

      // Success: update log
      if (logId) {
        await updateEmailLog(logId, { status: 'sent', retryCount: attempt });
      }

      console.log(`✅ Email inviata con successo a ${to} (tentativi: ${attempt})`);
      return { success: true, attempts: attempt + 1 };

    } catch (error) {
      lastError = error;
      console.error(`⚠️ Tentativo ${attempt + 1}/${MAX_RETRIES + 1} fallito per ${to}:`, error.message);

      // If transient error and retries remain, wait and retry
      if (attempt < MAX_RETRIES && isTransientError(error)) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
        console.log(`⏳ Retry in ${delay}ms...`);
        await sleep(delay);
        continue;
      }

      // Final failure: log error
      if (logId) {
        await updateEmailLog(logId, {
          status: 'failed',
          errorMessage: error.message,
          retryCount: attempt
        });
      }
      break;
    }
  }

  console.error(`❌ Email fallita dopo ${MAX_RETRIES + 1} tentativi a ${to}`);
  return { success: false, error: lastError?.message || 'Unknown error', attempts: MAX_RETRIES + 1 };
}

// Determine if error is transient (worth retrying)
function isTransientError(error) {
  const transientCodes = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];
  const transientMessages = ['timeout', 'connection', 'temporary'];
  
  if (error.code && transientCodes.includes(error.code)) return true;
  if (error.message) {
    const msg = error.message.toLowerCase();
    return transientMessages.some(keyword => msg.includes(keyword));
  }
  return false;
}

// Send to multiple recipients (admin copy helper)
export async function sendEmailWithAdminCopy({ to, subject, html, templateName, metadata = {} }) {
  const results = [];
  
  // Send to primary recipient
  const primaryResult = await sendEmailWithRetry({ to, subject, html, templateName, metadata });
  results.push({ recipient: to, ...primaryResult });

  // Send admin copy if configured
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM;
  if (adminEmail && adminEmail !== to) {
    const adminSubject = `[ADMIN COPY] ${subject}`;
    const adminResult = await sendEmailWithRetry({
      to: adminEmail,
      subject: adminSubject,
      html,
      templateName,
      metadata: { ...metadata, isAdminCopy: true }
    });
    results.push({ recipient: adminEmail, ...adminResult });
  }

  return results;
}
