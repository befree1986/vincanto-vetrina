import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configurazione trasporter per Nodemailer
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false, // true per 465, false per altre porte
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Invia email di conferma prenotazione
 */
export async function sendBookingConfirmationEmail(booking) {
    try {
        const transporter = createTransporter();
        
        const checkInFormatted = new Date(booking.check_in_date).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const checkOutFormatted = new Date(booking.check_out_date).toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Email al cliente
        const customerMailOptions = {
            from: `"Vincanto Maiori" <${process.env.MAIL_FROM}>`,
            to: booking.guest_email,
            subject: `Conferma Prenotazione - Vincanto Maiori`,
            html: generateCustomerEmailTemplate(booking, checkInFormatted, checkOutFormatted)
        };
        
        // Email al proprietario
        const ownerMailOptions = {
            from: `"Sistema Prenotazioni" <${process.env.MAIL_FROM}>`,
            to: process.env.MAIL_TO,
            subject: `Nuova Prenotazione da ${booking.guest_name} ${booking.guest_surname}`,
            html: generateOwnerEmailTemplate(booking, checkInFormatted, checkOutFormatted)
        };
        
        // Invia entrambe le email
        await Promise.all([
            transporter.sendMail(customerMailOptions),
            transporter.sendMail(ownerMailOptions)
        ]);
        
        console.log(`✅ Email di conferma inviate per prenotazione ${booking.id}`);
        return true;
        
    } catch (error) {
        console.error('❌ Errore invio email:', error);
        throw error;
    }
}

/**
 * Template email per il cliente
 */
function generateCustomerEmailTemplate(booking, checkInFormatted, checkOutFormatted) {
    const paymentInstructions = generatePaymentInstructions(booking);
    
    return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conferma Prenotazione - Vincanto</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
            .header { color: #d2691e; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; text-align: center; }
            .content { margin: 20px 0; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table th, .details-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .details-table th { background-color: #f8f9fa; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #fff3cd; }
            .payment-info { background-color: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
            .logo { max-width: 150px; height: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Conferma Prenotazione</h1>
                <p>Vincanto - Maiori, Costiera Amalfitana</p>
            </div>
            
            <div class="content">
                <p>Gentile <strong>${booking.guest_name} ${booking.guest_surname}</strong>,</p>
                <p>La ringraziamo per aver scelto Vincanto per il Suo soggiorno. La Sua prenotazione è stata registrata con successo.</p>
                
                <h3>Dettagli della Prenotazione</h3>
                <table class="details-table">
                    <tr><th>ID Prenotazione</th><td>${booking.id}</td></tr>
                    <tr><th>Check-in</th><td>${checkInFormatted}</td></tr>
                    <tr><th>Check-out</th><td>${checkOutFormatted}</td></tr>
                    <tr><th>Ospiti</th><td>${booking.num_adults} adulti${booking.num_children > 0 ? `, ${booking.num_children} bambini` : ''}</td></tr>
                    <tr><th>Parcheggio</th><td>${booking.parking_option === 'private' ? 'Privato' : booking.parking_option === 'street' ? 'Strada' : 'Nessuno'}</td></tr>
                </table>
                
                <h3>Riepilogo Costi</h3>
                <table class="details-table">
                    <tr><td>Soggiorno base</td><td>€ ${booking.base_price.toFixed(2)}</td></tr>
                    ${booking.parking_cost > 0 ? `<tr><td>Parcheggio privato</td><td>€ ${booking.parking_cost.toFixed(2)}</td></tr>` : ''}
                    <tr><td>Pulizia finale</td><td>€ ${booking.cleaning_fee.toFixed(2)}</td></tr>
                    <tr><td>Tassa di soggiorno</td><td>€ ${booking.tourist_tax.toFixed(2)}</td></tr>
                    <tr class="total-row"><td><strong>Totale</strong></td><td><strong>€ ${booking.total_amount.toFixed(2)}</strong></td></tr>
                </table>
                
                ${paymentInstructions}
                
                ${booking.guest_message ? `
                <h3>Il Suo Messaggio</h3>
                <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; font-style: italic;">${booking.guest_message}</p>
                ` : ''}
                
                <h3>Informazioni Utili</h3>
                <ul>
                    <li><strong>Check-in:</strong> dalle 15:00 alle 20:00</li>
                    <li><strong>Check-out:</strong> entro le 10:00</li>
                    <li><strong>Contatti:</strong> ${process.env.MAIL_TO}</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>Vincanto - Via dei Limoneti, Maiori (SA)</p>
                <p>Costiera Amalfitana, Italia</p>
                <p><a href="https://www.vincantomaori.it">www.vincantomaori.it</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Template email per il proprietario
 */
function generateOwnerEmailTemplate(booking, checkInFormatted, checkOutFormatted) {
    return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuova Prenotazione - Admin</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; }
            .header { color: #28a745; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table th, .details-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .details-table th { background-color: #f8f9fa; font-weight: bold; }
            .highlight { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Nuova Prenotazione Ricevuta</h1>
                <p>ID: ${booking.id}</p>
            </div>
            
            <h3>Dettagli Cliente</h3>
            <table class="details-table">
                <tr><th>Nome</th><td>${booking.guest_name} ${booking.guest_surname}</td></tr>
                <tr><th>Email</th><td>${booking.guest_email}</td></tr>
                <tr><th>Telefono</th><td>${booking.guest_phone}</td></tr>
            </table>
            
            <h3>Dettagli Soggiorno</h3>
            <table class="details-table">
                <tr><th>Check-in</th><td>${checkInFormatted}</td></tr>
                <tr><th>Check-out</th><td>${checkOutFormatted}</td></tr>
                <tr><th>Ospiti</th><td>${booking.num_adults} adulti${booking.num_children > 0 ? `, ${booking.num_children} bambini` : ''}</td></tr>
                <tr><th>Parcheggio</th><td>${booking.parking_option}</td></tr>
                <tr><th>Pagamento</th><td>${booking.payment_method} - ${booking.payment_type === 'deposit' ? 'Acconto' : 'Totale'}</td></tr>
                <tr><th>Importo da pagare</th><td>€ ${booking.payment_amount.toFixed(2)}</td></tr>
            </table>
            
            ${booking.guest_message ? `
            <div class="highlight">
                <strong>Messaggio del cliente:</strong><br>
                ${booking.guest_message}
            </div>
            ` : ''}
            
            <div class="highlight">
                <strong>Azioni richieste:</strong>
                <ul>
                    <li>Verificare il pagamento</li>
                    <li>Confermare la prenotazione</li>
                    <li>Aggiornare il calendario</li>
                </ul>
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Genera istruzioni di pagamento basate sul metodo selezionato
 */
function generatePaymentInstructions(booking) {
    const amount = booking.payment_amount.toFixed(2);
    const paymentType = booking.payment_type === 'deposit' ? 'acconto' : 'saldo completo';
    
    if (booking.payment_method === 'bank_transfer') {
        return `
        <div class="payment-info">
            <h3>💳 Istruzioni per il Pagamento</h3>
            <p>Per completare la prenotazione, effettuare il ${paymentType} di <strong>€ ${amount}</strong> tramite bonifico bancario:</p>
            <ul>
                <li><strong>Beneficiario:</strong> ${process.env.BANK_NAME || 'Vincanto'}</li>
                <li><strong>IBAN:</strong> ${process.env.BANK_IBAN}</li>
                <li><strong>BIC/SWIFT:</strong> ${process.env.BANK_BIC}</li>
                <li><strong>Causale:</strong> Prenotazione ${booking.id}</li>
                <li><strong>Importo:</strong> € ${amount}</li>
            </ul>
            <p><strong>Importante:</strong> Indicare sempre l'ID prenotazione nella causale del bonifico.</p>
        </div>
        `;
    } else if (booking.payment_method === 'stripe' || booking.payment_method === 'paypal') {
        return `
        <div class="payment-info">
            <h3>💳 Pagamento Online</h3>
            <p>Il pagamento di <strong>€ ${amount}</strong> sarà processato tramite ${booking.payment_method === 'stripe' ? 'carta di credito' : 'PayPal'}.</p>
            <p>Riceverà una conferma separata una volta completato il pagamento.</p>
        </div>
        `;
    }
    
    return '';
}

export default {
    sendBookingConfirmationEmail
};