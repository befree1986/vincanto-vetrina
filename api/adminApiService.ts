/**
 * Servizio centralizzato per tutte le chiamate API del pannello admin.
 * Utilizza l'endpoint /api/unified per tutte le operazioni.
 */
export default class AdminApiService {
    private baseUrl = '/api';

    /**
     * Funzione helper generica per eseguire chiamate fetch all'API unificata.
     * @param endpoint L'azione da eseguire (es. 'booking', 'system-settings').
     * @param options Opzioni di fetch (method, body, etc.).
     */
    private async fetcher(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        const token = localStorage.getItem('vincanto_admin_token'); // Recupera il token per l'autenticazione

        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }), // Aggiungi header auth se presente
                ...options.headers,
            },
        });

        if (!res.ok) {
            const errorInfo = await res.json().catch(() => ({ error: 'Errore di rete o risposta non JSON' }));
            const error = new Error(`Errore API: ${res.statusText}`);
            // @ts-ignore
            error.info = errorInfo;
            // @ts-ignore
            error.status = res.status;
            throw error;
        }

        return res.json();
    }

    // --- GESTIONE PRENOTAZIONI ---

    /**
     * Recupera tutte le prenotazioni.
     */
    public getBookings(): Promise<any[]> {
        return this.fetcher('unified?action=booking', { method: 'GET' }).then(data => data.bookings || []);
    }

    /**
     * Aggiorna una prenotazione esistente con nuovi dati.
     * @param bookingId L'ID (numerico o stringa) della prenotazione.
     * @param data I campi da aggiornare (es. { status: 'confirmed', first_name: 'Mario' }).
     */
    public updateBooking(bookingId: string | number, data: Record<string, any>) {
        // L'ID deve essere nel body per l'azione di update, come gestito da unified.js
        return this.fetcher(`unified?action=booking`, {
            method: 'PUT',
            body: JSON.stringify({ id: bookingId, ...data }),
        });
    }

    /**
     * Elimina una prenotazione.
     * @param bookingId L'ID della prenotazione da eliminare.
     */
    public deleteBooking(bookingId: string | number) {
        return this.fetcher('unified?action=booking', {
            method: 'DELETE',
            body: JSON.stringify({ id: bookingId }),
        });
    }

    // --- INVIO EMAIL ---

    /**
     * Invia un'email personalizzata al cliente di una prenotazione.
     * @param bookingId L'ID della prenotazione.
     * @param emailData Oggetto con `subject` e `message`.
     */
    public sendEmailToCustomer(bookingId: string | number, emailData: { subject: string; message: string }) {
        return this.fetcher('unified?action=admin-send-customer-email', {
            method: 'POST',
            body: JSON.stringify({ ...emailData, bookingId }),
        });
    }

    // --- AZIONI RAPIDE ---

    /**
     * Conferma il pagamento di una prenotazione (acconto o saldo).
     * @param bookingId L'ID della prenotazione.
     * @param paymentType 'deposit' o 'full'.
     */
    public confirmBookingPayment(bookingId: string | number, paymentType: 'deposit' | 'full' = 'full') {
        const statusUpdate = {
            status: 'confirmed',
            payment_status: paymentType === 'full' ? 'paid_full' : 'deposit_paid'
        };
        return this.updateBooking(bookingId, statusUpdate);
    }

    /**
     * Annulla una prenotazione.
     * @param bookingId L'ID della prenotazione.
     */
    public cancelBooking(bookingId: string | number) {
        return this.updateBooking(bookingId, { status: 'cancelled' });
    }

    // --- ALTRI METODI UTILI (da AdminPanelPro.tsx) ---

    public getDashboardStats() {
        return this.fetcher('unified?action=dashboard-stats').then(data => data.stats);
    }

    public getCalendarBookings(options: { futureOnly?: boolean; limit?: number } = {}) {
        const params = new URLSearchParams();
        if (options.futureOnly) params.set('futureOnly', 'true');
        if (options.limit) params.set('limit', String(options.limit));
        return this.fetcher(`unified?action=calendar-bookings&${params.toString()}`);
    }

    public getSystemSettings() {
        return this.fetcher('unified?action=system-settings');
    }

    public updateSystemSetting(key: string, value: any) {
        return this.fetcher('unified?action=system-settings', {
            method: 'POST',
            body: JSON.stringify({ key, value }),
        });
    }

    public getAnalytics(): Promise<any[]> {
        return this.fetcher('unified?action=analytics').then(data => data.analytics || []);
    }

    public getNotifications(): Promise<any[]> {
        return this.fetcher('unified?action=notifications').then(data => data.notifications || []);
    }

    public getPayments(): Promise<any[]> {
        return this.fetcher('unified?action=payments').then(data => data.payments || []);
    }

    public getBlockedDates(): Promise<any[]> {
        return this.fetcher('unified?action=blocked-dates').then(data => data.blockedDates || []);
    }

    public getExtraServices(): Promise<any[]> {
        return this.fetcher('unified?action=extra-services').then(data => data.services || []);
    }
}