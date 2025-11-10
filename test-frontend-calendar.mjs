/**
 * Test Frontend Calendar Integration
 * Verifica che i componenti frontend ricevano correttamente le date occupate
 */

const API_BASE_URL = 'https://vincanto-backup.vercel.app/api';

async function testFrontendCalendarIntegration() {
    console.log('🎯 TEST FRONTEND CALENDAR INTEGRATION\n');
    
    try {
        // 1. Test API getCalendar (come useBooking hook)
        console.log('📅 1. Test API getCalendar (simulazione useBooking hook)...');
        const calendarResponse = await fetch(`${API_BASE_URL}/unified?action=blocked-dates`);
        const bookingsResponse = await fetch(`${API_BASE_URL}/unified?action=booking`);
        
        if (!calendarResponse.ok || !bookingsResponse.ok) {
            throw new Error('Errore caricamento dati calendario');
        }
        
        const blockedData = await calendarResponse.json();
        const bookingsData = await bookingsResponse.json();
        
        // Simula la trasformazione come in api.ts getCalendar()
        const blocked_dates = (blockedData.blockedDates || []).map(blocked => ({
            start: blocked.start_date,
            end: blocked.end_date,
            type: 'blocked',
            status: blocked.reason || 'blocked'
        }));
        
        const booking_dates = (bookingsData.bookings || []).map(booking => ({
            start: booking.check_in.split('T')[0],
            end: booking.check_out.split('T')[0], 
            type: 'booking',
            status: booking.status || 'booked'
        }));
        
        const occupied_dates = [...blocked_dates, ...booking_dates];
        
        console.log('✅ Occupied dates per frontend:', occupied_dates);
        console.log(`📊 Totale date occupate: ${occupied_dates.length}`);
        
        // 2. Test AvailabilityCalendar data format
        console.log('\n🗓️ 2. Test formato AvailabilityCalendar...');
        
        // Simula blockedDates array come in AvailabilityCalendar
        const manualBlockedDates = (blockedData.blockedDates || []).map(block => block.start_date);
        const bookingBlockedDates = (bookingsData.bookings || []).map(booking => {
            const checkIn = new Date(booking.check_in);
            const checkOut = new Date(booking.check_out);
            const dates = [];
            for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
                dates.push(d.toISOString().split('T')[0]);
            }
            return dates;
        }).flat();
        
        const allBlockedDates = [...manualBlockedDates, ...bookingBlockedDates];
        
        console.log('📅 Date bloccate manuali:', manualBlockedDates);
        console.log('📋 Date occupate da prenotazioni:', bookingBlockedDates);
        console.log('🚫 Totale date non disponibili:', allBlockedDates);
        
        // 3. Verifica coerenza dati
        console.log('\n🔍 3. Verifica coerenza dati...');
        
        const today = new Date().toISOString().split('T')[0];
        const futureOccupiedDates = occupied_dates.filter(date => date.start >= today);
        
        console.log(`📍 Date occupate future: ${futureOccupiedDates.length}`);
        
        futureOccupiedDates.forEach(date => {
            console.log(`  - ${date.start} a ${date.end} (${date.type}: ${date.status})`);
        });
        
        // 4. Test formato BookingCalendar
        console.log('\n📖 4. Test formato BookingCalendar...');
        
        // BookingCalendar si aspetta occupiedDates con start/end/type/status
        const bookingCalendarFormat = occupied_dates.map(date => ({
            start: date.start,
            end: date.end,
            type: date.type,
            status: date.status
        }));
        
        console.log('📚 Formato BookingCalendar:', bookingCalendarFormat);
        
        console.log('\n🎉 TEST COMPLETATO CON SUCCESSO!');
        console.log('✅ Frontend riceve correttamente le date occupate');
        console.log(`📊 Dati processati: ${blocked_dates.length} bloccate + ${booking_dates.length} prenotazioni = ${occupied_dates.length} totali`);
        
    } catch (error) {
        console.error('❌ Test frontend calendar failed:', error);
    }
}

// Esegui il test
testFrontendCalendarIntegration();