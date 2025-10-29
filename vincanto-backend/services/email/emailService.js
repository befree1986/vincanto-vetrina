const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

class EmailService {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }

    initTransporter() {
        // Configuration per diversi provider SMTP
        const emailConfig = {
            // Gmail/Google Workspace
            gmail: {
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            },
            // SMTP Generico (es. hosting provider)
            smtp: {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            },
            // Development/Testing
            test: {
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: 'test@vincanto.test',
                    pass: 'testpass'
                }
            }
        };

        const provider = process.env.EMAIL_PROVIDER || 'test';
        
        try {
            this.transporter = nodemailer.createTransport(emailConfig[provider]);
            console.log(`📧 Email Service inizializzato con provider: ${provider}`);
        } catch (error) {
            console.error('❌ Errore inizializzazione Email Service:', error);
            // Fallback al provider test
            this.transporter = nodemailer.createTransport(emailConfig.test);
        }
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

            const mailOptions = {
                from: `"Vincanto Maori" <${process.env.SENDER_EMAIL}>`,
                to: bookingData.customer_email,
                subject: `Conferma Prenotazione #${bookingData.booking_id} - Vincanto Maori`,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email conferma booking inviata:', result.messageId);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Errore invio email conferma booking:', error);
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

            const mailOptions = {
                from: `"Sistema Vincanto" <${process.env.SENDER_EMAIL}>`,
                to: process.env.ADMIN_EMAIL,
                subject: `🏠 Nuova Prenotazione #${bookingData.booking_id}`,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Notifica admin inviata:', result.messageId);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Errore invio notifica admin:', error);
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

            const mailOptions = {
                from: `"Vincanto Maori" <${process.env.SENDER_EMAIL}>`,
                to: paymentData.customer_email,
                subject: `Pagamento Confermato #${paymentData.booking_id} - Vincanto Maori`,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email conferma pagamento inviata:', result.messageId);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Errore invio conferma pagamento:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Connessione email verificata');
            return { success: true, message: 'Connessione SMTP attiva' };
        } catch (error) {
            console.error('❌ Test connessione email fallito:', error);
            return { success: false, error: error.message };
        }
    }

    async sendTestEmail(toEmail) {
        try {
            const mailOptions = {
                from: `"Vincanto Test" <${process.env.SENDER_EMAIL}>`,
                to: toEmail,
                subject: 'Test Email System - Vincanto',
                html: `
                    <h2>✅ Sistema Email Funzionante!</h2>
                    <p>Questo è un test del sistema email di Vincanto.</p>
                    <p><strong>Data Test:</strong> ${new Date().toLocaleString('it-IT')}</p>
                    <p><em>Se ricevi questa email, il sistema funziona correttamente.</em></p>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email test inviata:', result.messageId);
            return { success: true, messageId: result.messageId };

        } catch (error) {
            console.error('❌ Errore invio email test:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();