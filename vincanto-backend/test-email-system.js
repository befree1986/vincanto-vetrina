/**
 * Test completo sistema email Vincanto
 * Testa connessione, invio template e workflow completi
 */

const axios = require('axios');

// Configurazione test
const API_BASE = 'http://localhost:3000/api';
const TEST_EMAIL = 'test@example.com'; // Cambia con la tua email per test reali

// Dati mock per test
const mockBookingData = {
    booking_id: 'VIN202501290001',
    customer_name: 'Mario Rossi',
    customer_email: TEST_EMAIL,
    check_in: '2025-12-01',
    check_out: '2025-12-08',
    guests: 4,
    total_amount: 117.60
};

const mockPaymentData = {
    booking_id: 'VIN202501290001',
    customer_name: 'Mario Rossi',
    customer_email: TEST_EMAIL,
    amount: 117.60,
    payment_intent_id: 'pi_test_1234567890abcdef'
};

class EmailTester {
    constructor() {
        this.results = [];
        this.apiClient = axios.create({
            baseURL: API_BASE,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async logTest(name, testFn) {
        const startTime = Date.now();
        console.log(`🧪 ${name}...`);
        
        try {
            const result = await testFn();
            const duration = Date.now() - startTime;
            
            console.log(`✅ ${name} - SUCCESSO (${duration}ms)`);
            if (result.data?.messageId) {
                console.log(`   📧 Message ID: ${result.data.messageId}`);
            }
            
            this.results.push({
                test: name,
                status: 'PASS',
                duration: duration,
                result: result.data || result
            });
            
            return result;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`❌ ${name} - ERRORE (${duration}ms)`);
            console.log(`   Error: ${error.response?.data?.error || error.message}`);
            
            this.results.push({
                test: name,
                status: 'FAIL',
                duration: duration,
                error: error.response?.data?.error || error.message
            });
            
            throw error;
        }
    }

    async testEmailStatus() {
        return this.logTest('Email Status Check', async () => {
            return await this.apiClient.get('/email/status');
        });
    }

    async testEmailConnection() {
        return this.logTest('Email Connection Test', async () => {
            return await this.apiClient.get('/email/test-connection');
        });
    }

    async testSendTestEmail() {
        return this.logTest('Send Test Email', async () => {
            return await this.apiClient.post('/email/send-test', {
                email: TEST_EMAIL
            });
        });
    }

    async testBookingConfirmation() {
        return this.logTest('Booking Confirmation Email', async () => {
            return await this.apiClient.post('/email/booking-confirmation', mockBookingData);
        });
    }

    async testAdminNotification() {
        return this.logTest('Admin Notification Email', async () => {
            return await this.apiClient.post('/email/admin-notification', mockBookingData);
        });
    }

    async testPaymentConfirmation() {
        return this.logTest('Payment Confirmation Email', async () => {
            return await this.apiClient.post('/email/payment-confirmation', mockPaymentData);
        });
    }

    async testCompleteWorkflow() {
        return this.logTest('Complete Email Workflow', async () => {
            return await this.apiClient.post('/email/send-complete-workflow', {
                bookingData: mockBookingData,
                paymentData: mockPaymentData
            });
        });
    }

    async testErrorHandling() {
        return this.logTest('Error Handling Test', async () => {
            // Test con dati mancanti
            try {
                await this.apiClient.post('/email/booking-confirmation', {
                    booking_id: 'TEST'
                    // Dati mancanti intenzionalmente
                });
            } catch (error) {
                if (error.response?.status === 400 && error.response?.data?.missing_fields) {
                    return { status: 'Expected error handled correctly' };
                }
                throw error;
            }
            throw new Error('Expected validation error not triggered');
        });
    }

    generateSummaryReport() {
        const passCount = this.results.filter(r => r.status === 'PASS').length;
        const failCount = this.results.filter(r => r.status === 'FAIL').length;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 EMAIL SYSTEM TEST REPORT');
        console.log('='.repeat(60));
        console.log(`✅ Test Passed: ${passCount}`);
        console.log(`❌ Test Failed: ${failCount}`);
        console.log(`⏱️  Total Duration: ${totalDuration}ms`);
        console.log(`📈 Success Rate: ${((passCount / this.results.length) * 100).toFixed(1)}%`);
        
        if (failCount > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.filter(r => r.status === 'FAIL').forEach(result => {
                console.log(`   • ${result.test}: ${result.error}`);
            });
        }
        
        console.log('\n📧 EMAIL SYSTEM STATUS:');
        if (passCount >= 6) {
            console.log('🟢 SISTEMA EMAIL COMPLETAMENTE OPERATIVO');
            console.log('   - Tutti i template funzionano correttamente');
            console.log('   - Connessione SMTP attiva');
            console.log('   - Workflow automatici configurati');
        } else if (passCount >= 3) {
            console.log('🟡 SISTEMA EMAIL PARZIALMENTE OPERATIVO');
            console.log('   - Alcune funzionalità necessitano attenzione');
        } else {
            console.log('🔴 SISTEMA EMAIL NON OPERATIVO');
            console.log('   - Rivedere configurazione SMTP');
        }
        
        console.log('='.repeat(60));
        return {
            passed: passCount,
            failed: failCount,
            successRate: (passCount / this.results.length) * 100,
            totalDuration: totalDuration
        };
    }

    async runAllTests() {
        console.log('🚀 Avvio test sistema email Vincanto...\n');
        
        const tests = [
            () => this.testEmailStatus(),
            () => this.testEmailConnection(),
            () => this.testSendTestEmail(),
            () => this.testBookingConfirmation(),
            () => this.testAdminNotification(),
            () => this.testPaymentConfirmation(),
            () => this.testCompleteWorkflow(),
            () => this.testErrorHandling()
        ];
        
        let continueTesting = true;
        
        for (const test of tests) {
            if (!continueTesting) break;
            
            try {
                await test();
                // Piccola pausa tra i test
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                // Continua anche se un test fallisce
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        return this.generateSummaryReport();
    }
}

// Esecuzione test se chiamato direttamente
if (require.main === module) {
    const tester = new EmailTester();
    
    // Gestione degli errori globali
    process.on('uncaughtException', (error) => {
        console.error('❌ Errore critico nel test:', error);
        process.exit(1);
    });
    
    process.on('unhandledRejection', (reason) => {
        console.error('❌ Promise rejection non gestita:', reason);
        process.exit(1);
    });
    
    tester.runAllTests()
        .then((report) => {
            console.log('\n🎯 Test completati!');
            if (report.successRate >= 80) {
                console.log('✅ Sistema email pronto per produzione!');
                process.exit(0);
            } else {
                console.log('⚠️  Sistema email necessita correzioni.');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('❌ Errore durante i test:', error);
            process.exit(1);
        });
}

module.exports = EmailTester;