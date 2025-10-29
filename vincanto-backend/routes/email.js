const express = require('express');
const emailService = require('../services/email/emailService');
const router = express.Router();

// Test connessione email
router.get('/test-connection', async (req, res) => {
    try {
        const result = await emailService.testConnection();
        res.json({
            success: result.success,
            message: result.message || 'Connessione email testata',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Errore test connessione email:', error);
        res.status(500).json({
            success: false,
            error: 'Test connessione fallito',
            details: error.message
        });
    }
});

// Invio email di test
router.post('/send-test', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email destinatario richiesta'
            });
        }

        const result = await emailService.sendTestEmail(email);
        res.json({
            success: true,
            message: 'Email test inviata',
            messageId: result.messageId,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore invio email test:', error);
        res.status(500).json({
            success: false,
            error: 'Invio email test fallito',
            details: error.message
        });
    }
});

// Invio conferma booking
router.post('/booking-confirmation', async (req, res) => {
    try {
        const bookingData = req.body;
        
        // Validazione dati obbligatori
        const requiredFields = ['booking_id', 'customer_name', 'customer_email', 'check_in', 'check_out', 'guests', 'total_amount'];
        const missingFields = requiredFields.filter(field => !bookingData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Dati mancanti',
                missing_fields: missingFields
            });
        }

        console.log('📧 Invio conferma booking per:', bookingData.booking_id);
        
        const result = await emailService.sendBookingConfirmation(bookingData);
        res.json({
            success: true,
            message: 'Email conferma booking inviata',
            messageId: result.messageId,
            booking_id: bookingData.booking_id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore conferma booking email:', error);
        res.status(500).json({
            success: false,
            error: 'Invio conferma booking fallito',
            details: error.message
        });
    }
});

// Invio notifica admin
router.post('/admin-notification', async (req, res) => {
    try {
        const bookingData = req.body;
        
        // Validazione dati obbligatori
        const requiredFields = ['booking_id', 'customer_name', 'customer_email', 'check_in', 'check_out', 'guests', 'total_amount'];
        const missingFields = requiredFields.filter(field => !bookingData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Dati mancanti',
                missing_fields: missingFields
            });
        }

        console.log('🚨 Invio notifica admin per booking:', bookingData.booking_id);
        
        const result = await emailService.sendAdminNotification(bookingData);
        res.json({
            success: true,
            message: 'Notifica admin inviata',
            messageId: result.messageId,
            booking_id: bookingData.booking_id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore notifica admin:', error);
        res.status(500).json({
            success: false,
            error: 'Invio notifica admin fallito',
            details: error.message
        });
    }
});

// Invio conferma pagamento
router.post('/payment-confirmation', async (req, res) => {
    try {
        const paymentData = req.body;
        
        // Validazione dati obbligatori
        const requiredFields = ['booking_id', 'customer_name', 'customer_email', 'amount', 'payment_intent_id'];
        const missingFields = requiredFields.filter(field => !paymentData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Dati mancanti',
                missing_fields: missingFields
            });
        }

        console.log('💳 Invio conferma pagamento per:', paymentData.booking_id);
        
        const result = await emailService.sendPaymentConfirmation(paymentData);
        res.json({
            success: true,
            message: 'Email conferma pagamento inviata',
            messageId: result.messageId,
            booking_id: paymentData.booking_id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore conferma pagamento email:', error);
        res.status(500).json({
            success: false,
            error: 'Invio conferma pagamento fallito',
            details: error.message
        });
    }
});

// Invio email completo (booking + admin + pagamento)
router.post('/send-complete-workflow', async (req, res) => {
    try {
        const { bookingData, paymentData } = req.body;
        
        if (!bookingData || !paymentData) {
            return res.status(400).json({
                success: false,
                error: 'Dati booking e pagamento richiesti'
            });
        }

        console.log('🔄 Avvio workflow email completo per:', bookingData.booking_id);
        
        const results = [];
        
        // 1. Conferma booking al cliente
        try {
            const bookingResult = await emailService.sendBookingConfirmation(bookingData);
            results.push({ type: 'booking_confirmation', success: true, messageId: bookingResult.messageId });
        } catch (error) {
            results.push({ type: 'booking_confirmation', success: false, error: error.message });
        }
        
        // 2. Notifica admin
        try {
            const adminResult = await emailService.sendAdminNotification(bookingData);
            results.push({ type: 'admin_notification', success: true, messageId: adminResult.messageId });
        } catch (error) {
            results.push({ type: 'admin_notification', success: false, error: error.message });
        }
        
        // 3. Conferma pagamento al cliente
        try {
            const paymentResult = await emailService.sendPaymentConfirmation(paymentData);
            results.push({ type: 'payment_confirmation', success: true, messageId: paymentResult.messageId });
        } catch (error) {
            results.push({ type: 'payment_confirmation', success: false, error: error.message });
        }
        
        const successCount = results.filter(r => r.success).length;
        
        res.json({
            success: successCount > 0,
            message: `Workflow completato: ${successCount}/${results.length} email inviate`,
            results: results,
            booking_id: bookingData.booking_id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore workflow email:', error);
        res.status(500).json({
            success: false,
            error: 'Workflow email fallito',
            details: error.message
        });
    }
});

// Stato email service
router.get('/status', (req, res) => {
    try {
        const config = {
            provider: process.env.EMAIL_PROVIDER || 'test',
            sender_email: process.env.SENDER_EMAIL || 'non configurato',
            admin_email: process.env.ADMIN_EMAIL || 'non configurato',
            smtp_host: process.env.SMTP_HOST || 'non configurato'
        };
        
        res.json({
            success: true,
            message: 'Email service attivo',
            config: config,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Errore status email service',
            details: error.message
        });
    }
});

module.exports = router;