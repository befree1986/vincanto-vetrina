// i18n strings for email templates
// Supported languages: it (Italian), en (English), de (German), fr (French)

export const emailStrings = {
  it: {
    // Booking Confirmation
    booking_confirmation: {
      subject: 'Conferma Prenotazione',
      title: 'Prenotazione Confermata',
      greeting: 'Ciao',
      intro: 'Grazie per aver scelto Vincanto Maori! La tua prenotazione è stata ricevuta con successo.',
      booking_code: 'Codice Prenotazione',
      check_in: 'Check-in',
      check_out: 'Check-out',
      guests: 'Ospiti',
      adults: 'Adulti',
      children: 'Bambini',

      // ⭐ NUOVE CHIAVI
      cost_breakdown: "Riepilogo costi",
      accommodation_base: "Soggiorno base",
      cleaning_fee: "Pulizia finale",
      private_parking: "Parcheggio privato",
      tourist_tax: "Tassa di soggiorno",

      total_amount: 'Importo Totale',
      deposit_amount: 'Acconto (20%)',
      amount_paid: 'Importo Pagato',
      remaining_balance: 'Saldo da pagare al check-in',
      payment_method: 'Metodo di pagamento',
      method_card: 'Carta di credito/debito',
      method_paypal: 'PayPal',
      method_bank_transfer: 'Bonifico bancario',
      extra_services: 'Servizi Extra',
      included_services: 'Servizi Inclusi',
      included_badge: 'Incluso',
      extras_total: 'Totale servizi extra',
      no_extras: 'Nessun servizio extra selezionato',
      important_info: 'Informazioni Importanti',
      checkin_time: 'Check-in: dalle 15:00 alle 20:00',
      checkout_time: 'Check-out: entro le 10:00',
      bring_id: 'Porta un documento d\'identità valido',
      bank_transfer_details: 'Dettagli per il Bonifico',
      bank_beneficiary: 'Beneficiario',
      bank_iban: 'IBAN',
      bank_bic: 'BIC/SWIFT',
      bank_bank: 'Banca',
      bank_reason: 'Causale',
      bank_reason_val: 'Prenotazione',
      contact_us: 'Per richieste o modifiche, rispondi a questa email',
      footer: 'Vincanto Maori • Maiori, Costiera Amalfitana',
      website: 'www.vincantomaori.it'
    },

    // Final Payment Confirmation
    booking_final: {
      subject: 'Pagamento Ricevuto - Prenotazione',
      title: 'Pagamento Ricevuto - Prenotazione Confermata',
      greeting: 'Ciao',
      intro: 'Il tuo pagamento è stato ricevuto con successo e la prenotazione è ora',
      confirmed: 'CONFERMATA',
      booking_code: 'Codice Prenotazione',
      check_in: 'Check-in',
      check_out: 'Check-out',
      total_amount: 'Importo Totale',
      amount_paid: 'Pagato ora',
      remaining_balance: 'Saldo restante',
      payment_method: 'Metodo di pagamento',
      method_card: 'Carta di credito/debito',
      method_paypal: 'PayPal',
      method_bank_transfer: 'Bonifico bancario',
      extra_services: 'Servizi Extra',
      included_services: 'Servizi Inclusi',
      included_badge: 'Incluso',
      extras_total: 'Totale servizi extra',
      no_extras: 'Nessun servizio extra selezionato',
      waiting_for_you: 'Ti aspettiamo a Maiori! Conserva questa email per riferimento.',
      contact: 'Per richieste o modifiche rispondi direttamente a questa email',
      footer: 'Vincanto Maori • www.vincantomaori.it'
    }
  },

  en: {
    booking_confirmation: {
      subject: 'Booking Confirmation',
      title: 'Booking Confirmed',
      greeting: 'Hello',
      intro: 'Thank you for choosing Vincanto Maori! Your booking has been successfully received.',
      booking_code: 'Booking Code',
      check_in: 'Check-in',
      check_out: 'Check-out',
      guests: 'Guests',
      adults: 'Adults',
      children: 'Children',

      // ⭐ NEW KEYS
      cost_breakdown: "Cost breakdown",
      accommodation_base: "Accommodation base",
      cleaning_fee: "Final cleaning",
      private_parking: "Private parking",
      tourist_tax: "Tourist tax",

      total_amount: 'Total Amount',
      deposit_amount: 'Deposit (20%)',
      amount_paid: 'Amount Paid',
      remaining_balance: 'Balance due at check-in',
      payment_method: 'Payment method',
      method_card: 'Credit/Debit Card',
      method_paypal: 'PayPal',
      method_bank_transfer: 'Bank Transfer',
      extra_services: 'Extra Services',
      included_services: 'Included Services',
      included_badge: 'Included',
      extras_total: 'Extra services total',
      no_extras: 'No extra services selected',
      important_info: 'Important Information',
      checkin_time: 'Check-in: 3:00 PM - 8:00 PM',
      checkout_time: 'Check-out: by 10:00 AM',
      bring_id: 'Please bring a valid ID document',
      bank_transfer_details: 'Bank Transfer Details',
      bank_beneficiary: 'Beneficiary',
      bank_iban: 'IBAN',
      bank_bic: 'BIC/SWIFT',
      bank_bank: 'Bank',
      bank_reason: 'Reason',
      bank_reason_val: 'Booking',
      contact_us: 'For inquiries or changes, reply to this email',
      footer: 'Vincanto Maori • Maiori, Amalfi Coast',
      website: 'www.vincantomaori.it'
    },

    booking_final: {
      subject: 'Payment Received - Booking',
      title: 'Payment Received - Booking Confirmed',
      greeting: 'Hello',
      intro: 'Your payment has been successfully received and your booking is now',
      confirmed: 'CONFIRMED',
      booking_code: 'Booking Code',
      check_in: 'Check-in',
      check_out: 'Check-out',
      total_amount: 'Total Amount',
      amount_paid: 'Amount Paid',
      remaining_balance: 'Remaining Balance',
      payment_method: 'Payment method',
      method_card: 'Credit/Debit Card',
      method_paypal: 'PayPal',
      method_bank_transfer: 'Bank Transfer',
      extra_services: 'Extra Services',
      included_services: 'Included Services',
      included_badge: 'Included',
      extras_total: 'Extra services total',
      no_extras: 'No extra services selected',
      waiting_for_you: 'We look forward to welcoming you in Maiori! Please keep this email for your records.',
      contact: 'For inquiries or changes, reply directly to this email',
      footer: 'Vincanto Maori • www.vincantomaori.it'
    }
  },

  de: {
    booking_confirmation: {
      subject: 'Buchungsbestätigung',
      title: 'Buchung Bestätigt',
      greeting: 'Hallo',
      intro: 'Vielen Dank, dass Sie sich für Vincanto Maori entschieden haben! Ihre Buchung wurde erfolgreich erhalten.',
      booking_code: 'Buchungscode',
      check_in: 'Check-in',
      check_out: 'Check-out',
      guests: 'Gäste',
      adults: 'Erwachsene',
      children: 'Kinder',

      // ⭐ NEUE SCHLÜSSEL
      cost_breakdown: "Kostenübersicht",
      accommodation_base: "Grundpreis Unterkunft",
      cleaning_fee: "Endreinigung",
      private_parking: "Privater Parkplatz",
      tourist_tax: "Kurtaxe",

      total_amount: 'Gesamtbetrag',
      deposit_amount: 'Anzahlung (20%)',
      amount_paid: 'Bezahlter Betrag',
      remaining_balance: 'Restzahlung beim Check-in',
      payment_method: 'Zahlungsmethode',
      method_card: 'Kredit-/Debitkarte',
      method_paypal: 'PayPal',
      method_bank_transfer: 'Banküberweisung',
      extra_services: 'Zusatzleistungen',
      included_services: 'Inklusive Leistungen',
      included_badge: 'Inklusive',
      extras_total: 'Summe Zusatzleistungen',
      no_extras: 'Keine Zusatzleistungen ausgewählt',
      important_info: 'Wichtige Informationen',
      checkin_time: 'Check-in: 15:00 - 20:00 Uhr',
      checkout_time: 'Check-out: bis 10:00 Uhr',
      bring_id: 'Bitte bringen Sie einen gültigen Ausweis mit',
      bank_transfer_details: 'Banküberweisung Details',
      bank_beneficiary: 'Begünstigter',
      bank_iban: 'IBAN',
      bank_bic: 'BIC/SWIFT',
      bank_bank: 'Bank',
      bank_reason: 'Verwendungszweck',
      bank_reason_val: 'Buchung',
      contact_us: 'Bei Fragen oder Änderungen antworten Sie auf diese E-Mail',
      footer: 'Vincanto Maori • Maiori, Amalfiküste',
      website: 'www.vincantomaori.it'
    },

    booking_final: {
      subject: 'Zahlung Erhalten - Buchung',
      title: 'Zahlung Erhalten - Buchung Bestätigt',
      greeting: 'Hallo',
      intro: 'Ihre Zahlung wurde erfolgreich erhalten und Ihre Buchung ist jetzt',
      confirmed: 'BESTÄTIGT',
      booking_code: 'Buchungscode',
      check_in: 'Check-in',
      check_out: 'Check-out',
      total_amount: 'Gesamtbetrag',
      amount_paid: 'Gezahlter Betrag',
      remaining_balance: 'Restbetrag',
      payment_method: 'Zahlungsmethode',
      method_card: 'Kredit-/Debitkarte',
      method_paypal: 'PayPal',
      method_bank_transfer: 'Banküberweisung',
      extra_services: 'Zusatzleistungen',
      included_services: 'Inklusive Leistungen',
      included_badge: 'Inklusive',
      extras_total: 'Summe Zusatzleistungen',
      no_extras: 'Keine Zusatzleistungen ausgewählt',
      waiting_for_you: 'Wir freuen uns auf Sie in Maiori! Bitte bewahren Sie diese E-Mail auf.',
      contact: 'Bei Fragen oder Änderungen antworten Sie direkt auf diese E-Mail',
      footer: 'Vincanto Maori • www.vincantomaori.it'
    }
  },

  fr: {
    booking_confirmation: {
      subject: 'Confirmation de Réservation',
      title: 'Réservation Confirmée',
      greeting: 'Bonjour',
      intro: 'Merci d\'avoir choisi Vincanto Maori ! Votre réservation a été reçue avec succès.',
      booking_code: 'Code de Réservation',
      check_in: 'Arrivée',
      check_out: 'Départ',
      guests: 'Invités',
      adults: 'Adultes',
      children: 'Enfants',

      // ⭐ NOUVELLES CLÉS
      cost_breakdown: "Détail des coûts",
      accommodation_base: "Hébergement de base",
      cleaning_fee: "Ménage final",
      private_parking: "Parking privé",
      tourist_tax: "Taxe de séjour",

      total_amount: 'Montant Total',
      deposit_amount: 'Acompte (20%)',
      amount_paid: 'Montant Payé',
      remaining_balance: 'Solde à payer à l\'arrivée',
      payment_method: 'Mode de paiement',
      method_card: 'Carte de crédit/débit',
      method_paypal: 'PayPal',
      method_bank_transfer: 'Virement bancaire',
      extra_services: 'Services supplémentaires',
      included_services: 'Services inclus',
      included_badge: 'Inclus',
      extras_total: 'Total services supplémentaires',
      no_extras: 'Aucun service supplémentaire sélectionné',
      important_info: 'Informations Importantes',
      checkin_time: 'Arrivée: 15h00 - 20h00',
      checkout_time: 'Départ: avant 10h00',
      bring_id: 'Veuillez apporter une pièce d\'identité valide',
      bank_transfer_details: 'Détails du Virement Bancaire',
      bank_beneficiary: 'Bénéficiaire',
      bank_iban: 'IBAN',
      bank_bic: 'BIC/SWIFT',
      bank_bank: 'Banque',
      bank_reason: 'Motif',
      bank_reason_val: 'Réservation',
      contact_us: 'Pour toute demande ou modification, répondez à cet email',
      footer: 'Vincanto Maori • Maiori, Côte Amalfitaine',
      website: 'www.vincantomaori.it'
    },

    booking_final: {
      subject: 'Paiement Reçu - Réservation',
      title: 'Paiement Reçu - Réservation Confirmée',
      greeting: 'Bonjour',
      intro: 'Votre paiement a été reçu avec succès et votre réservation est maintenant',
      confirmed: 'CONFIRMÉE',
      booking_code: 'Code de Réservation',
      check_in: 'Arrivée',
      check_out: 'Départ',
      total_amount: 'Montant Total',
      amount_paid: 'Montant Payé',
      remaining_balance: 'Solde Restant',
      payment_method: 'Mode de paiement',
      method_card: 'Carte de crédit/débit',
      method_paypal: 'PayPal',
      method_bank_transfer: 'Virement bancaire',
      extra_services: 'Services supplémentaires',
      included_services: 'Services inclus',
      included_badge: 'Inclus',
      extras_total: 'Total services supplémentaires',
      no_extras: 'Aucun service supplémentaire sélectionné',
      waiting_for_you: 'Nous avons hâte de vous accueillir à Maiori ! Conservez cet email pour référence.',
      contact: 'Pour toute demande ou modification, répondez directement à cet email',
      footer: 'Vincanto Maori • www.vincantomaori.it'
    }
  }
};

// Get strings for specific template and language
export function getEmailStrings(templateName, language = 'it') {
  const lang = emailStrings[language] || emailStrings.it;
  return lang[templateName] || lang.booking_confirmation;
}

// Detect language from email domain or user preference
export function detectLanguage(userLanguage) {
  if (userLanguage && emailStrings[userLanguage]) {
    return userLanguage;
  }
  return 'it';
}

// Format date based on language
export function formatDateByLanguage(dateString, language = 'it') {
  try {
    const date = new Date(dateString);
    const locales = {
      it: 'it-IT',
      en: 'en-US',
      de: 'de-DE',
      fr: 'fr-FR'
    };
    return date.toLocaleDateString(locales[language] || 'it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}