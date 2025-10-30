/**
 * iCal Service - Gestione parsing e generazione file iCalendar
 * Vincanto Admin System - Professional Calendar Management
 */

const ical = require('ical');
const moment = require('moment-timezone');

class ICalService {
  constructor() {
    this.timezone = 'Europe/Rome';
  }

  /**
   * Parsa dati iCal da stringa
   */
  parseICalData(icalString) {
    try {
      const parsedData = ical.parseICS(icalString);
      const events = [];

      for (const key in parsedData) {
        const event = parsedData[key];
        
        if (event.type === 'VEVENT') {
          events.push({
            uid: event.uid,
            summary: event.summary || '',
            description: event.description || '',
            start: moment(event.start).tz(this.timezone).toDate(),
            end: moment(event.end).tz(this.timezone).toDate(),
            created: event.created ? moment(event.created).toDate() : new Date(),
            lastModified: event.lastmodified ? moment(event.lastmodified).toDate() : new Date(),
            location: event.location || '',
            organizer: event.organizer || '',
            status: event.status || 'CONFIRMED',
            categories: event.categories || [],
            raw: event
          });
        }
      }

      console.log(`✅ Parsed ${events.length} eventi da iCal`);
      return events;
    } catch (error) {
      console.error('❌ Errore parsing iCal:', error.message);
      throw new Error(`Errore parsing iCal: ${error.message}`);
    }
  }

  /**
   * Genera feed iCal dalle prenotazioni
   */
  generateICalFeed(bookings, calendarName = 'Vincanto Maori Calendar') {
    let icalContent = this.getICalHeader(calendarName);

    for (const booking of bookings) {
      icalContent += this.generateEventFromBooking(booking);
    }

    icalContent += 'END:VCALENDAR\r\n';
    return icalContent;
  }

  /**
   * Header del file iCal
   */
  getICalHeader(calendarName) {
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Vincanto//Vincanto Calendar System//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarName}
X-WR-TIMEZONE:Europe/Rome
X-WR-CALDESC:Calendario prenotazioni Vincanto Maori
`;
  }

  /**
   * Genera evento iCal da prenotazione
   */
  generateEventFromBooking(booking) {
    const checkIn = moment.tz(booking.check_in + ' 15:00', this.timezone);
    const checkOut = moment.tz(booking.check_out + ' 11:00', this.timezone);
    const now = moment().tz(this.timezone);
    
    // UID unico per l'evento
    const uid = `booking-${booking.id}@vincanto.com`;
    
    // Determina il tipo di evento in base alla piattaforma
    const platformEmoji = this.getPlatformEmoji(booking.platform);
    const statusColor = this.getStatusColor(booking.status);
    
    return `BEGIN:VEVENT
UID:${uid}
DTSTART:${checkIn.format('YYYYMMDD[T]HHmmss')}
DTEND:${checkOut.format('YYYYMMDD[T]HHmmss')}
DTSTAMP:${now.format('YYYYMMDD[T]HHmmss[Z]')}
CREATED:${moment(booking.created_at).tz(this.timezone).format('YYYYMMDD[T]HHmmss[Z]')}
LAST-MODIFIED:${moment(booking.updated_at || booking.created_at).tz(this.timezone).format('YYYYMMDD[T]HHmmss[Z]')}
SUMMARY:${platformEmoji} ${booking.customer_name} (${booking.guests} ospiti)
DESCRIPTION:🏡 Vincanto Maori - Prenotazione\\n\\n` +
`👤 Cliente: ${booking.customer_name}\\n` +
`📧 Email: ${booking.customer_email || 'N/A'}\\n` +
`🛏️ Ospiti: ${booking.guests}\\n` +
`💰 Totale: €${booking.total_amount || 'N/A'}\\n` +
`🌐 Piattaforma: ${booking.platform}\\n` +
`📋 Stato: ${booking.status}\\n` +
`🆔 ID Prenotazione: ${booking.id}\\n\\n` +
`Check-in: ${checkIn.format('DD/MM/YYYY HH:mm')}\\n` +
`Check-out: ${checkOut.format('DD/MM/YYYY HH:mm')}\\n\\n` +
`Generato automaticamente dal sistema Vincanto
LOCATION:Via del Mare 123\\, Maori\\, Italia
STATUS:${booking.status.toUpperCase()}
CLASS:PRIVATE
CATEGORIES:${booking.platform},prenotazione,vincanto
X-VINCANTO-BOOKING-ID:${booking.id}
X-VINCANTO-PLATFORM:${booking.platform}
X-VINCANTO-GUESTS:${booking.guests}
X-VINCANTO-AMOUNT:${booking.total_amount || 0}
END:VEVENT
`;
  }

  /**
   * Ottiene emoji per piattaforma
   */
  getPlatformEmoji(platform) {
    const emojis = {
      'airbnb': '🏠',
      'booking_com': '🌍',
      'vrbo': '🏖️',
      'holidu': '🏖️',
      'expedia': '✈️',
      'direct': '📞',
      'google_calendar': '📅',
      'other': '📋'
    };
    return emojis[platform] || '📋';
  }

  /**
   * Ottiene colore per stato
   */
  getStatusColor(status) {
    const colors = {
      'pending': '#FFA500',
      'confirmed': '#28A745',
      'cancelled': '#DC3545',
      'completed': '#6C757D'
    };
    return colors[status] || '#6C757D';
  }

  /**
   * Valida formato iCal
   */
  validateICalFormat(icalString) {
    const errors = [];
    
    if (!icalString.includes('BEGIN:VCALENDAR')) {
      errors.push('Header VCALENDAR mancante');
    }
    
    if (!icalString.includes('END:VCALENDAR')) {
      errors.push('Footer VCALENDAR mancante');
    }
    
    if (!icalString.includes('VERSION:2.0')) {
      errors.push('Versione iCal non specificata o non supportata');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Converte timezone per compatibilità
   */
  convertTimezone(dateTime, fromTz = 'UTC', toTz = 'Europe/Rome') {
    return moment.tz(dateTime, fromTz).tz(toTz);
  }

  /**
   * Genera URL iCal per sottoscrizione
   */
  generateSubscriptionUrl(baseUrl, calendarId, secretKey) {
    return `${baseUrl}/api/calendar/ical/${calendarId}?key=${secretKey}`;
  }

  /**
   * Filtra eventi per periodo
   */
  filterEventsByDateRange(events, startDate, endDate) {
    const start = moment(startDate);
    const end = moment(endDate);
    
    return events.filter(event => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      
      return eventStart.isBefore(end) && eventEnd.isAfter(start);
    });
  }

  /**
   * Rileva conflitti tra eventi
   */
  detectConflicts(events) {
    const conflicts = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];
        
        const start1 = moment(event1.start);
        const end1 = moment(event1.end);
        const start2 = moment(event2.start);
        const end2 = moment(event2.end);
        
        // Controlla sovrapposizione
        if (start1.isBefore(end2) && start2.isBefore(end1)) {
          conflicts.push({
            event1: event1,
            event2: event2,
            overlapStart: moment.max(start1, start2).toDate(),
            overlapEnd: moment.min(end1, end2).toDate()
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Genera statistiche eventi
   */
  generateEventStatistics(events) {
    const stats = {
      totalEvents: events.length,
      upcomingEvents: 0,
      pastEvents: 0,
      platforms: {},
      monthlyDistribution: {},
      averageDuration: 0
    };

    const now = moment();
    let totalDuration = 0;

    for (const event of events) {
      const start = moment(event.start);
      const end = moment(event.end);
      const duration = end.diff(start, 'days');
      
      totalDuration += duration;
      
      // Conta eventi futuri/passati
      if (start.isAfter(now)) {
        stats.upcomingEvents++;
      } else {
        stats.pastEvents++;
      }
      
      // Distribuzione per mese
      const monthKey = start.format('YYYY-MM');
      stats.monthlyDistribution[monthKey] = (stats.monthlyDistribution[monthKey] || 0) + 1;
      
      // Estrai piattaforma dalla descrizione o titolo
      const platform = this.extractPlatformFromEvent(event);
      stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
    }
    
    stats.averageDuration = events.length > 0 ? Math.round(totalDuration / events.length * 10) / 10 : 0;
    
    return stats;
  }

  /**
   * Estrae piattaforma da evento
   */
  extractPlatformFromEvent(event) {
    const text = (event.summary + ' ' + event.description).toLowerCase();
    
    if (text.includes('airbnb')) return 'airbnb';
    if (text.includes('booking')) return 'booking_com';
    if (text.includes('vrbo')) return 'vrbo';
    if (text.includes('holidu')) return 'holidu';
    if (text.includes('expedia')) return 'expedia';
    if (text.includes('direct')) return 'direct';
    
    return 'other';
  }

  /**
   * Cleanup e formattazione iCal
   */
  cleanupICalString(icalString) {
    return icalString
      .replace(/\r\n|\n|\r/g, '\r\n') // Normalizza line endings
      .replace(/(.{75})/g, '$1\r\n ') // Fold long lines
      .replace(/\r\n $/, ''); // Rimuovi ultimo fold se vuoto
  }
}

module.exports = ICalService;