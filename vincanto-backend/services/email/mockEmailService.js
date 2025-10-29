/**
 * Mock Email Service per Test - Simula invio email senza SMTP
 * Utilizzato per testare tutto il sistema senza connessioni esterne
 */

const path = require('path');
const fs = require('fs').promises;

class MockEmailService {
    constructor() {
        this.sentEmails = [];
        console.log('📧 Mock Email Service inizializzato - Test Mode');
    }

    async loadTemplate(templateName) {
        try {
            const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
            const template = await fs.readFile(templatePath, 'utf8');
            return template;
        } catch (error) {
            console.error(`❌ Template ${templateName} non trovato:`, error);
            throw new Error(`Template ${templateName} non disponibile`);
        }
    }

    replaceTemplateVariables(template, variables) {
        let processedTemplate = template;
        
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processedTemplate = processedTemplate.replace(regex, value || '');
        }
        
        return processedTemplate;
    }

    async mockSendEmail(type, toEmail, subject, htmlContent, variables = {}) {
        // Simula latenza di invio email
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        const mockResult = {
            messageId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            to: toEmail,
            subject: subject,
            timestamp: new Date().toISOString(),
            status: 'sent',
            provider: 'mock-smtp',
            templateVariables: variables,
            htmlLength: htmlContent.length
        };
        
        this.sentEmails.push(mockResult);
        console.log(`✅ Mock Email ${type} inviata a ${toEmail}: ${mockResult.messageId}`);
        
        return { success: true, messageId: mockResult.messageId };
    }

    async sendBookingConfirmation(bookingData) {
        try {
            const template = await this.loadTemplate('booking-confirmation');
            
            const variables = {
                customerName: bookingData.customer_name,
                bookingId: bookingData.booking_id,
                checkInDate: new Date(bookingData.check_in).toLocaleDateString('it-IT'),
                checkOutDate: new Date(bookingData.check_out).toLocaleDateString('it-IT'),
                guests: bookingData.guests,
                totalAmount: `€${parseFloat(bookingData.total_amount).toFixed(2)}`,
                propertyName: 'Vincanto Maori',
                propertyAddress: 'Via dei Maori, Marina di Ragusa',
                contactPhone: '+39 123 456 789',
                contactEmail: 'info@vincantomaori.it'
            };

            const htmlContent = this.replaceTemplateVariables(template, variables);
            const subject = `Conferma Prenotazione #${bookingData.booking_id} - Vincanto Maori`;

            return await this.mockSendEmail(
                'booking_confirmation',
                bookingData.customer_email,
                subject,
                htmlContent,
                variables
            );
            
        } catch (error) {
            console.error('❌ Errore mock booking confirmation:', error);
            throw error;
        }
    }

    async sendAdminNotification(bookingData) {
        try {
            const template = await this.loadTemplate('admin-notification');
            
            const variables = {
                bookingId: bookingData.booking_id,
                customerName: bookingData.customer_name,
                customerEmail: bookingData.customer_email,
                checkInDate: new Date(bookingData.check_in).toLocaleDateString('it-IT'),
                checkOutDate: new Date(bookingData.check_out).toLocaleDateString('it-IT'),
                guests: bookingData.guests,
                totalAmount: `€${parseFloat(bookingData.total_amount).toFixed(2)}`,
                bookingDate: new Date().toLocaleString('it-IT'),
                paymentStatus: bookingData.payment_status || 'pending'
            };

            const htmlContent = this.replaceTemplateVariables(template, variables);
            const subject = `🏠 Nuova Prenotazione #${bookingData.booking_id}`;

            return await this.mockSendEmail(
                'admin_notification',
                process.env.ADMIN_EMAIL || 'admin@vincantomaori.it',
                subject,
                htmlContent,
                variables
            );
            
        } catch (error) {
            console.error('❌ Errore mock admin notification:', error);
            throw error;
        }
    }

    async sendPaymentConfirmation(paymentData) {
        try {
            const template = await this.loadTemplate('payment-confirmation');
            
            const variables = {
                customerName: paymentData.customer_name,
                bookingId: paymentData.booking_id,
                paymentAmount: `€${parseFloat(paymentData.amount).toFixed(2)}`,
                paymentDate: new Date().toLocaleDateString('it-IT'),
                paymentMethod: 'Carta di Credito',
                transactionId: paymentData.payment_intent_id
            };

            const htmlContent = this.replaceTemplateVariables(template, variables);
            const subject = `Pagamento Confermato #${paymentData.booking_id} - Vincanto Maori`;

            return await this.mockSendEmail(
                'payment_confirmation',
                paymentData.customer_email,
                subject,
                htmlContent,
                variables
            );
            
        } catch (error) {
            console.error('❌ Errore mock payment confirmation:', error);
            throw error;
        }
    }

    async testConnection() {
        // Simula test connessione
        await new Promise(resolve => setTimeout(resolve, 50));
        console.log('✅ Mock connection test passed');
        return { success: true, message: 'Mock SMTP connection active' };
    }

    async sendTestEmail(toEmail) {
        const htmlContent = `
            <h2>✅ Mock Email System Funzionante!</h2>
            <p>Questo è un test del mock email system di Vincanto.</p>
            <p><strong>Data Test:</strong> ${new Date().toLocaleString('it-IT')}</p>
            <p><em>Se vedi questo log, il sistema mock funziona correttamente.</em></p>
        `;

        return await this.mockSendEmail(
            'test_email',
            toEmail,
            'Mock Test Email - Vincanto',
            htmlContent
        );
    }

    // Metodi per testare e debug
    getSentEmails() {
        return this.sentEmails;
    }

    getEmailStats() {
        const stats = {
            totalSent: this.sentEmails.length,
            byType: {},
            lastEmail: this.sentEmails[this.sentEmails.length - 1] || null
        };

        this.sentEmails.forEach(email => {
            stats.byType[email.type] = (stats.byType[email.type] || 0) + 1;
        });

        return stats;
    }

    clearEmailHistory() {
        this.sentEmails = [];
        console.log('🗑️ Cronologia email mock azzerata');
    }
}

module.exports = new MockEmailService();