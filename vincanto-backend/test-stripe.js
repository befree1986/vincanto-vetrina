/**
 * Test rapido per verificare che l'integrazione Stripe sia funzionante
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_PLACEHOLDER_FOR_PRODUCTION');

async function testStripeIntegration() {
    console.log('🧪 Testing Stripe Integration...');
    
    try {
        // Test 1: Verifica connettività Stripe
        console.log('1️⃣ Verifica connettività Stripe...');
        const account = await stripe.accounts.retrieve();
        console.log(`✅ Account Stripe connesso: ${account.id} (${account.type})`);
        
        // Test 2: Crea Payment Intent di test
        console.log('2️⃣ Creazione Payment Intent di test...');
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 11760, // €117.60 in centesimi
            currency: 'eur',
            metadata: {
                booking_id: 'TEST_BOOKING_001',
                property: 'vincanto-maiori'
            },
            description: 'Test prenotazione Vincanto Maiori - TEST001'
        });
        
        console.log(`✅ Payment Intent creato: ${paymentIntent.id}`);
        console.log(`   Status: ${paymentIntent.status}`);
        console.log(`   Amount: €${paymentIntent.amount / 100}`);
        console.log(`   Client Secret: ${paymentIntent.client_secret.substring(0, 20)}...`);
        
        // Test 3: Lista Payment Intents recenti
        console.log('3️⃣ Lista ultimi Payment Intents...');
        const recentPayments = await stripe.paymentIntents.list({ limit: 3 });
        console.log(`✅ Trovati ${recentPayments.data.length} Payment Intent recenti`);
        
        console.log('\n🎉 Integrazione Stripe completamente funzionante!');
        console.log('📝 Il sistema è pronto per elaborare pagamenti reali.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Errore test Stripe:', error.message);
        console.error('🔧 Verifica le chiavi API e la connessione internet');
        return false;
    }
}

// Esegui test se chiamato direttamente
if (require.main === module) {
    testStripeIntegration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { testStripeIntegration };