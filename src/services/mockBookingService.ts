/**
 * Mock Booking Service
 * Fornisce dati simulati per testare l'admin panel quando Google Calendar non è disponibile
 */

import { CalendarEvent } from './googleCalendarService';

class MockBookingService {
  
  /**
   * Genera eventi fittizi per testare l'interfaccia
   */
  static generateMockEvents(): CalendarEvent[] {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return [
      {
        id: 'mock_001',
        title: 'Marco Rossi (4 ospiti)',
        start: new Date(thisYear, thisMonth, 15).toISOString(),
        end: new Date(thisYear, thisMonth, 18).toISOString(),
        description: 'Prenotazione da Airbnb\nOspiti: 4\nTotale: €420\nFamiglia con bambini',
        location: 'Vincanto Maori, Via dei Maori 25, Roma',
        source: 'airbnb',
        guestCount: 4,
        totalPrice: 420,
        status: 'confirmed'
      },
      {
        id: 'mock_002',
        title: 'Sarah Johnson (2 ospiti)',
        start: new Date(thisYear, thisMonth, 22).toISOString(),
        end: new Date(thisYear, thisMonth, 25).toISOString(),
        description: 'Prenotazione da Booking.com\nOspiti: 2\nTotale: €270\nCoppia inglese',
        location: 'Vincanto Maori, Via dei Maori 25, Roma',
        source: 'booking',
        guestCount: 2,
        totalPrice: 270,
        status: 'confirmed'
      },
      {
        id: 'mock_003',
        title: 'Luigi Bianchi (3 ospiti)',
        start: new Date(thisYear, thisMonth + 1, 5).toISOString(),
        end: new Date(thisYear, thisMonth + 1, 8).toISOString(),
        description: 'Prenotazione diretta\nOspiti: 3\nTotale: €315\nPrenotazione telefonica',
        location: 'Vincanto Maori, Via dei Maori 25, Roma',
        source: 'direct',
        guestCount: 3,
        totalPrice: 315,
        status: 'confirmed'
      },
      {
        id: 'mock_004',
        title: 'Anna Schmidt (2 ospiti)',
        start: new Date(thisYear, thisMonth + 1, 12).toISOString(),
        end: new Date(thisYear, thisMonth + 1, 16).toISOString(),
        description: 'Prenotazione da Expedia\nOspiti: 2\nTotale: €360\nCoppia tedesca',
        location: 'Vincanto Maori, Via dei Maori 25, Roma',
        source: 'expedia',
        guestCount: 2,
        totalPrice: 360,
        status: 'confirmed'
      },
      {
        id: 'mock_005',
        title: 'Francesco Verdi (5 ospiti)',
        start: new Date(thisYear, thisMonth, 28).toISOString(),
        end: new Date(thisYear, thisMonth + 1, 2).toISOString(),
        description: 'Prenotazione da Airbnb\nOspiti: 5\nTotale: €525\nGruppo di amici',
        location: 'Vincanto Maori, Via dei Maori 25, Roma',
        source: 'airbnb',
        guestCount: 5,
        totalPrice: 525,
        status: 'confirmed'
      },
      {
        id: 'mock_006',
        title: 'Elena Neri (1 ospite)',
        start: new Date(thisYear, thisMonth - 1, 10).toISOString(),
        end: new Date(thisYear, thisMonth - 1, 13).toISOString(),
        description: 'Prenotazione diretta\nOspiti: 1\nTotale: €135\nViaggio di lavoro',
        location: 'Vincanto Maori, Via dei Maori 25, Roma',
        source: 'direct',
        guestCount: 1,
        totalPrice: 135,
        status: 'confirmed'
      }
    ];
  }

  /**
   * Calcola statistiche basate sui dati mock
   */
  static getMockStats() {
    const events = this.generateMockEvents();
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const thisMonthEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= thisMonthStart && eventDate < nextMonthStart;
    });

    const nextMonthEvents = events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= nextMonthStart && eventDate <= nextMonthEnd;
    });

    const revenueThisMonth = thisMonthEvents.reduce((sum, event) => sum + event.totalPrice, 0);
    
    // Calcola tasso di occupazione (giorni occupati / giorni totali del mese)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const occupiedDays = thisMonthEvents.reduce((sum, event) => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return {
      totalBookings: events.length,
      thisMonth: thisMonthEvents.length,
      nextMonth: nextMonthEvents.length,
      occupancyRate: Math.round((occupiedDays / daysInMonth) * 100),
      revenueThisMonth
    };
  }

  /**
   * Genera dati di prenotazioni recenti per la sezione prenotazioni
   */
  static getRecentBookings() {
    return [
      {
        id: 'recent_001',
        guestName: 'Marco Rossi',
        checkIn: '2024-01-15',
        checkOut: '2024-01-18',
        guests: 4,
        platform: 'airbnb',
        status: 'confirmed',
        totalPrice: 420,
        createdAt: '2024-01-10T10:30:00Z'
      },
      {
        id: 'recent_002',
        guestName: 'Sarah Johnson',
        checkIn: '2024-01-22',
        checkOut: '2024-01-25',
        guests: 2,
        platform: 'booking',
        status: 'confirmed',
        totalPrice: 270,
        createdAt: '2024-01-12T15:45:00Z'
      },
      {
        id: 'recent_003',
        guestName: 'Luigi Bianchi',
        checkIn: '2024-02-05',
        checkOut: '2024-02-08',
        guests: 3,
        platform: 'direct',
        status: 'pending',
        totalPrice: 315,
        createdAt: '2024-01-14T09:20:00Z'
      },
      {
        id: 'recent_004',
        guestName: 'Anna Schmidt',
        checkIn: '2024-02-12',
        checkOut: '2024-02-16',
        guests: 2,
        platform: 'expedia',
        status: 'confirmed',
        totalPrice: 360,
        createdAt: '2024-01-16T14:15:00Z'
      },
      {
        id: 'recent_005',
        guestName: 'Francesco Verdi',
        checkIn: '2024-01-28',
        checkOut: '2024-02-02',
        guests: 5,
        platform: 'airbnb',
        status: 'confirmed',
        totalPrice: 525,
        createdAt: '2024-01-18T11:00:00Z'
      }
    ];
  }

  /**
   * Genera transazioni per la sezione pagamenti
   */
  static getPaymentTransactions() {
    return [
      {
        id: 'pay_001',
        bookingId: 'recent_001',
        guestName: 'Marco Rossi',
        amount: 420,
        method: 'stripe',
        status: 'completed',
        date: '2024-01-10T10:30:00Z',
        transactionId: 'pi_1234567890'
      },
      {
        id: 'pay_002',
        bookingId: 'recent_002',
        guestName: 'Sarah Johnson',
        amount: 270,
        method: 'paypal',
        status: 'completed',
        date: '2024-01-12T15:45:00Z',
        transactionId: 'txn_0987654321'
      },
      {
        id: 'pay_003',
        bookingId: 'recent_003',
        guestName: 'Luigi Bianchi',
        amount: 315,
        method: 'bank_transfer',
        status: 'pending',
        date: '2024-01-14T09:20:00Z',
        transactionId: 'wire_1122334455'
      },
      {
        id: 'pay_004',
        bookingId: 'recent_004',
        guestName: 'Anna Schmidt',
        amount: 360,
        method: 'stripe',
        status: 'completed',
        date: '2024-01-16T14:15:00Z',
        transactionId: 'pi_5544332211'
      },
      {
        id: 'pay_005',
        bookingId: 'recent_005',
        guestName: 'Francesco Verdi',
        amount: 525,
        method: 'paypal',
        status: 'completed',
        date: '2024-01-18T11:00:00Z',
        transactionId: 'txn_9988776655'
      }
    ];
  }
}

export default MockBookingService;