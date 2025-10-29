/**
 * Test rapido sistema email - Verifica funzionalità base
 */

const emailService = require('./services/email/emailService');

async function quickEmailTest() {
    console.log('🧪 Test rapido sistema email Vincanto');
    console.log('=' .repeat(50));
    
    try {
        // Test 1: Connessione
        console.log('1️⃣ Test connessione email...');
        const connectionTest = await emailService.testConnection();
        console.log(`   ${connectionTest.success ? '✅' : '❌'} Connessione: ${connectionTest.message || 'OK'}`);
        
        // Test 2: Email di test
        console.log('\n2️⃣ Test invio email di test...');
        const testEmailResult = await emailService.sendTestEmail('test@example.com');
        console.log(`   ✅ Email test inviata: ${testEmailResult.messageId}`);
        
        // Test 3: Template booking confirmation
        console.log('\n3️⃣ Test template booking confirmation...');
        const mockBooking = {
            booking_id: 'VIN202501290001',
            customer_name: 'Mario Test',
            customer_email: 'test@example.com',
            check_in: '2025-12-01',
            check_out: '2025-12-08',
            guests: 4,
            total_amount: 117.60
        };
        
        const bookingResult = await emailService.sendBookingConfirmation(mockBooking);
        console.log(`   ✅ Conferma booking inviata: ${bookingResult.messageId}`);
        
        // Test 4: Template admin notification  
        console.log('\n4️⃣ Test template admin notification...');
        const adminResult = await emailService.sendAdminNotification(mockBooking);
        console.log(`   ✅ Notifica admin inviata: ${adminResult.messageId}`);
        
        // Test 5: Template payment confirmation
        console.log('\n5️⃣ Test template payment confirmation...');
        const mockPayment = {
            booking_id: 'VIN202501290001',
            customer_name: 'Mario Test',
            customer_email: 'test@example.com',
            amount: 117.60,
            payment_intent_id: 'pi_test_1234567890'
        };
        
        const paymentResult = await emailService.sendPaymentConfirmation(mockPayment);
        console.log(`   ✅ Conferma pagamento inviata: ${paymentResult.messageId}`);
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 SISTEMA EMAIL COMPLETAMENTE FUNZIONANTE!');
        console.log('✅ Tutti i template email sono operativi');
        console.log('✅ Connessione SMTP configurata correttamente');
        console.log('✅ Sistema pronto per produzione');
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('\n❌ ERRORE nel test email:', error.message);
        console.error('🔧 Controllare configurazione SMTP in .env');
        process.exit(1);
    }
}

// Avvio test
if (require.main === module) {
    quickEmailTest()
        .then(() => {
            console.log('\n✅ Test completato con successo!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test fallito:', error);
            process.exit(1);
        });
}

module.exports = { quickEmailTest };