/**
 * Calendar Sync Scheduler
 * Automazione per la sincronizzazione periodica dei calendari esterni
 */

import cron from 'node-cron';
import CalendarSyncService from '../services/calendarSync.js';

class CalendarScheduler {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Inizializza lo scheduler
   */
  init() {
    if (this.isInitialized) {
      console.log('📅 Calendar scheduler già inizializzato');
      return;
    }

    console.log('📅 Inizializzazione Calendar Scheduler...');

    // Sincronizzazione ogni 2 ore (alle 00:00, 02:00, 04:00, etc.)
    this.scheduleSync('main-sync', '0 */2 * * *', async () => {
      console.log('🔄 Avvio sincronizzazione automatica calendari...');
      await this.performAutoSync();
    });

    // Sincronizzazione notturna completa (alle 03:00)
    this.scheduleSync('nightly-sync', '0 3 * * *', async () => {
      console.log('🌙 Avvio sincronizzazione notturna completa...');
      await this.performNightlySync();
    });

    // Pulizia dati obsoleti (ogni domenica alle 04:00)
    this.scheduleSync('cleanup', '0 4 * * 0', async () => {
      console.log('🧹 Avvio pulizia dati obsoleti...');
      await this.performCleanup();
    });

    this.isInitialized = true;
    console.log('✅ Calendar Scheduler inizializzato con successo');
  }

  /**
   * Pianifica un job
   */
  scheduleSync(name, cronExpression, task) {
    if (this.jobs.has(name)) {
      console.log(`⏰ Job '${name}' già esistente, aggiornamento...`);
      this.jobs.get(name).stop();
    }

    const job = cron.schedule(cronExpression, task, {
      scheduled: true,
      timezone: 'Europe/Rome'
    });

    this.jobs.set(name, job);
    console.log(`⏰ Job '${name}' pianificato: ${cronExpression}`);
  }

  /**
   * Sincronizzazione automatica standard
   */
  async performAutoSync() {
    try {
      const startTime = Date.now();
      const results = await CalendarSyncService.syncAllCalendars();
      
      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;
      const duration = Date.now() - startTime;

      console.log(`✅ Sincronizzazione automatica completata in ${duration}ms`);
      console.log(`   📊 Calendari sincronizzati: ${successCount}/${results.length}`);
      
      if (errorCount > 0) {
        console.warn(`   ⚠️  Errori: ${errorCount}`);
        this.logSyncErrors(results.filter(r => !r.success));
      }

      // Notifica se ci sono troppi errori
      if (errorCount > successCount) {
        await this.handleSyncFailures(results);
      }

    } catch (error) {
      console.error('❌ Errore durante sincronizzazione automatica:', error);
    }
  }

  /**
   * Sincronizzazione notturna completa
   */
  async performNightlySync() {
    try {
      console.log('🌙 Inizio sincronizzazione notturna completa...');
      
      // 1. Sincronizza tutti i calendari
      await this.performAutoSync();
      
      // 2. Verifica consistenza dati
      await this.verifyDataConsistency();
      
      // 3. Genera report giornaliero
      await this.generateDailyReport();
      
      console.log('✅ Sincronizzazione notturna completata');

    } catch (error) {
      console.error('❌ Errore durante sincronizzazione notturna:', error);
    }
  }

  /**
   * Pulizia dati obsoleti
   */
  async performCleanup() {
    try {
      console.log('🧹 Inizio pulizia dati obsoleti...');
      
      // Rimuovi prenotazioni esterne terminate da più di 30 giorni
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const { pool } = await import('../config/database.js');
      
      const result = await pool.query(`
        DELETE FROM external_bookings 
        WHERE end_date < $1 
        AND status IN ('completed', 'cancelled')
      `, [cutoffDate]);
      
      console.log(`🗑️  Rimossi ${result.rowCount} record obsoleti`);
      
      // Pulisci log di errore vecchi
      await pool.query(`
        UPDATE external_calendars 
        SET last_sync_error = NULL 
        WHERE last_sync > NOW() - INTERVAL '7 days'
        AND last_sync_error IS NOT NULL
      `);
      
      console.log('✅ Pulizia completata');

    } catch (error) {
      console.error('❌ Errore durante pulizia:', error);
    }
  }

  /**
   * Verifica consistenza dati
   */
  async verifyDataConsistency() {
    try {
      const { pool } = await import('../config/database.js');
      
      // Verifica sovrapposizioni tra prenotazioni interne ed esterne
      const conflicts = await pool.query(`
        SELECT 
          b.id as booking_id,
          eb.id as external_booking_id,
          b.start_date as booking_start,
          b.end_date as booking_end,
          eb.start_date as external_start,
          eb.end_date as external_end
        FROM bookings b
        CROSS JOIN external_bookings eb
        WHERE b.status IN ('confirmed', 'pending', 'checked_in')
        AND eb.status != 'cancelled'
        AND (
          (b.start_date <= eb.start_date AND b.end_date > eb.start_date) OR
          (b.start_date < eb.end_date AND b.end_date >= eb.end_date) OR
          (b.start_date >= eb.start_date AND b.end_date <= eb.end_date)
        )
      `);
      
      if (conflicts.rows.length > 0) {
        console.warn(`⚠️  Trovati ${conflicts.rows.length} conflitti di prenotazione!`);
        // Qui potresti inviare una notifica email agli amministratori
      }
      
    } catch (error) {
      console.error('❌ Errore verifica consistenza:', error);
    }
  }

  /**
   * Genera report giornaliero
   */
  async generateDailyReport() {
    try {
      const stats = await CalendarSyncService.getSyncStats();
      const today = new Date().toISOString().split('T')[0];
      
      console.log(`📊 Report sincronizzazione ${today}:`);
      stats.forEach(stat => {
        console.log(`   ${stat.platform}: ${stat.calendar_count} calendari, ${stat.booking_count} prenotazioni`);
        if (stat.error_count > 0) {
          console.warn(`     ⚠️  ${stat.error_count} errori`);
        }
      });
      
    } catch (error) {
      console.error('❌ Errore generazione report:', error);
    }
  }

  /**
   * Log errori di sincronizzazione
   */
  logSyncErrors(failedResults) {
    failedResults.forEach(result => {
      console.error(`   ❌ ${result.calendar}: ${result.error}`);
    });
  }

  /**
   * Gestione fallimenti massivi
   */
  async handleSyncFailures(results) {
    const errorCount = results.filter(r => !r.success).length;
    const totalCount = results.length;
    
    if (errorCount >= totalCount * 0.7) { // Più del 70% di errori
      console.error('🚨 ALLARME: Fallimento massivo sincronizzazione calendari!');
      // Qui potresti implementare notifiche email/SMS di emergenza
    }
  }

  /**
   * Forza sincronizzazione immediata
   */
  async forceSyncNow() {
    console.log('🔄 Sincronizzazione forzata in corso...');
    await this.performAutoSync();
  }

  /**
   * Ferma tutti i job
   */
  stopAll() {
    console.log('⏹️  Fermando tutti i job pianificati...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`   ⏹️  Job '${name}' fermato`);
    });
    this.jobs.clear();
    this.isInitialized = false;
  }

  /**
   * Stato dei job
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }

  /**
   * Sincronizzazione manuale di un calendario specifico
   */
  async syncSpecificCalendar(calendarId) {
    console.log(`🔄 Sincronizzazione manuale calendario ${calendarId}...`);
    try {
      const result = await CalendarSyncService.syncCalendar(calendarId);
      console.log(`✅ Sincronizzazione manuale completata: ${result.success ? 'successo' : 'fallito'}`);
      return result;
    } catch (error) {
      console.error(`❌ Errore sincronizzazione manuale:`, error);
      throw error;
    }
  }
}

// Esporta istanza singleton
export const calendarScheduler = new CalendarScheduler();

export default CalendarScheduler;