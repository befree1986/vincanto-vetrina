export type PolicySection = {
	id: string;
	title: string;
	body?: string;
	list?: string[];
	note?: string;
};

export type PolicyContent = {
	lastUpdated: string;
	intro: string;
	sections: PolicySection[];
};

export const privacyPolicyContent: Record<string, PolicyContent> = {
	it: {
		lastUpdated: '20 gennaio 2026',
		intro:
			'Questa informativa descrive come trattiamo i dati personali in relazione al sito, alle prenotazioni e ai servizi connessi (pagamenti, calendario, assistenza).',
		sections: [
			{
				id: 'controller',
				title: '1. Titolare del trattamento',
				body:
					'Vincanto Maiori – Via Torre di Milo, 7 – 84010 Maiori (SA), info@vincantomaiori.it. Per ogni richiesta in materia privacy puoi scriverci via email. Ai sensi dell\'art. 37 GDPR non è prevista la nomina di un Responsabile della Protezione dei Dati (DPO), in quanto il trattamento non rientra nei casi obbligatori.'
			},
			{
				id: 'data-types',
				title: '2. Dati trattati',
				list: [
					'Dati anagrafici e di contatto: nome, cognome, email, telefono, preferenze di soggiorno.',
					'Dati di prenotazione: date, numero ospiti, servizi extra, importi, stato pagamento.',
					'Dati di pagamento: gestiti da Stripe e PayPal; riceviamo solo esiti e identificativi della transazione (non conserviamo numeri di carta).',
					'Dati tecnici di navigazione: indirizzo IP, user agent, log di sicurezza, performance hosting.',
					'Dati calendario da canali esterni (solo lettura iCal): Airbnb, Booking.com, Holidu.'
				]
			},
			{
				id: 'purposes',
				title: '3. Finalità e basi giuridiche',
				list: [
					'Gestione prenotazioni e richieste (esecuzione di misure precontrattuali e contrattuali).',
					'Pagamenti online tramite Stripe e PayPal (esecuzione del contratto).',
					'Prevenzione abusi, sicurezza applicativa e log di sistema (legittimo interesse).',
					'Adempimenti legali, fiscali e contabili (obbligo di legge).',
					'Marketing facoltativo / comunicazioni promozionali, solo previo consenso.',
					'Cookie e analytics non essenziali, solo previo consenso tramite banner.'
				]
			},
			{
				id: 'recipients',
				title: '4. Destinatari e servizi terzi',
				list: [
					'Hosting e delivery: Vercel Inc. (USA) – trasferimento coperto da SCC.',
					'Database e storage: Neon Inc. (USA) – PostgreSQL managed, trasferimento coperto da SCC.',
					'Pagamenti: Stripe, Inc. (USA) e PayPal Holdings, Inc. (USA) – trasferimento coperto da SCC.',
					'Email e notifiche: Seeweb S.r.l. (IT) – authsmtp.securemail.pro, server ubicato in Italia.',
					'Calendari esterni in sola lettura: Airbnb, Booking.com, Holidu (feed iCal).',
					'Analytics (Google Analytics): Google LLC (USA) – attivati solo con consenso, trasferimento coperto da SCC.',
					'Analytics opzionali aggiuntivi: solo se abilitati dal consenso cookie.'
				],
				note: 'I fornitori possono trovarsi in UE o extra-UE; in caso di trasferimenti internazionali, applichiamo Clausole Contrattuali Standard (SCC) o garanzie equivalenti quando richiesto.'
			},
			{
				id: 'retention',
				title: '5. Conservazione',
				list: [
					'Dati di prenotazione e fatturazione: per la durata del contratto e fino a 10 anni per obblighi civilistici/fiscali.',
					'Log di sicurezza e accesso: tipicamente 6-12 mesi, salvo necessità di indagine.',
					'Consensi marketing e preferenze cookie: fino a revoca o aggiornamento da parte dell’utente.',
					'Dati tecnici anonimi/aggregati: conservati per fini statistici anche oltre, senza possibilità di re-identificazione.'
				]
			},
			{
				id: 'rights',
				title: '6. Diritti degli interessati',
				body:
					'Puoi esercitare accesso, rettifica, cancellazione, limitazione, portabilità, opposizione e revoca del consenso scrivendo a info@vincantomaiori.it. Risponderemo entro 30 giorni dalla ricezione della richiesta (termine prorogabile fino a 90 giorni in casi di particolare complessità). Hai diritto di proporre reclamo al Garante per la protezione dei dati personali (www.gpdp.it).'
			},
			{
				id: 'security',
				title: '7. Sicurezza',
				list: [
					'Cifratura TLS in transito; i dati di pagamento restano sui processor (Stripe/PayPal).',
					'Principio di minimizzazione: conserviamo solo i dati necessari.',
					'Controlli di accesso e logging amministrativo sugli ambienti di produzione.',
					'Backup controllati per garantire continuità del servizio.'
				]
			},
			{
				id: 'cookies',
				title: '8. Cookie e preferenze',
				body:
					'Usiamo cookie tecnici necessari. Analytics/marketing sono disattivati di default e vengono attivati solo con il tuo consenso dal banner cookie. Puoi modificare le preferenze in ogni momento dalla sezione dedicata del sito. Il consenso può essere revocato in qualsiasi momento senza pregiudicare la liceità del trattamento basata sul consenso prestato prima della revoca.',
				list: [
					'Cookie tecnici (essenziali): necessari per il funzionamento del sito, non richiedono consenso (base giuridica: legittimo interesse)',
					'Cookie di analisi (Google Analytics): statistiche anonime e aggregate sui visitatori, attivati solo previo consenso',
					'Cookie di marketing: personalizzazione contenuti e pubblicità, attivati solo previo consenso',
					'Gestione preferenze: puoi modificare le tue scelte cookie dal footer del sito in qualsiasi momento',
					'Durata consenso: le preferenze rimangono attive fino a modifica o scadenza (massimo 12 mesi)',
					'Diritti: puoi revocare il consenso, accedere alle tue preferenze e richiedere la cancellazione dei dati di tracciamento'
				]
			},
			{
				id: 'updates',
				title: '9. Aggiornamenti',
				body:
					'Questa informativa può essere aggiornata; la versione corrente è indicata in “Ultimo aggiornamento”.'
			}
		]
	},

	en: {
		lastUpdated: '20 January 2026',
		intro:
			'This notice explains how we process personal data for the website, bookings, payments, calendar sync, and support.',
		sections: [
			{
				id: 'controller',
				title: '1. Data Controller',
				body:
					'Vincanto Maiori – Via Torre di Milo, 7 – 84010 Maiori (SA), Italy – info@vincantomaiori.it. You can contact us by email for any privacy request. As per Art. 37 GDPR, no Data Protection Officer (DPO) has been appointed, as the processing does not fall within the mandatory cases.'
			},
			{
				id: 'data-types',
				title: '2. Data we process',
				list: [
					'Identity and contact data: name, surname, email, phone, stay preferences.',
					'Booking data: dates, guests, extra services, amounts, payment status.',
					'Payment data: handled by Stripe and PayPal; we receive outcomes/IDs only (no card numbers stored).',
					'Technical data: IP address, user agent, security/performance logs.',
					'Calendar data (read-only iCal): Airbnb, Booking.com, Holidu.'
				]
			},
			{
				id: 'purposes',
				title: '3. Purposes and legal bases',
				list: [
					'Manage booking requests and reservations (pre-contractual/contractual necessity).',
					'Online payments via Stripe and PayPal (contract performance).',
					'Abuse prevention, security, and system logs (legitimate interest).',
					'Legal, tax, and accounting compliance (legal obligation).',
					'Optional marketing communications, only with consent.',
					'Non-essential cookies/analytics, only with consent via the cookie banner.'
				]
			},
			{
				id: 'recipients',
				title: '4. Recipients and third parties',
				list: [
					'Hosting and delivery: Vercel Inc. (USA) – transfer covered by SCC.',
					'Database/storage: Neon Inc. (USA) – managed PostgreSQL, transfer covered by SCC.',
					'Payments: Stripe, Inc. (USA) and PayPal Holdings, Inc. (USA) – transfer covered by SCC.',
					'Email/notifications: Seeweb S.r.l. (IT) – authsmtp.securemail.pro, server located in Italy.',
					'External calendars (read-only): Airbnb, Booking.com, Holidu iCal feeds.',
					'Analytics (Google Analytics): Google LLC (USA) – enabled only with consent, transfer covered by SCC.',
					'Additional optional analytics: only if enabled by cookie consent.'
				],
				note: 'Suppliers may be located in the EU or outside; for international transfers we apply Standard Contractual Clauses (SCC) or equivalent safeguards when required.'
			},
			{
				id: 'retention',
				title: '5. Retention',
				list: [
					'Booking and invoicing data: for the contract duration and up to 10 years for legal/accounting duties.',
					'Security/access logs: typically 6–12 months unless needed longer for investigations.',
					'Marketing consents and cookie preferences: until withdrawal or update by the user.',
					'Anonymous/aggregated technical data: may be kept for statistical purposes without re-identification.'
				]
			},
			{
				id: 'rights',
				title: '6. Your rights',
				body:
					'You can exercise access, rectification, erasure, restriction, portability, objection, and withdraw consent by emailing info@vincantomaiori.it. We will respond within 30 days of receiving your request (extendable to 90 days in complex cases). You can also lodge a complaint with the Italian Data Protection Authority (Garante, www.gpdp.it) or with the supervisory authority of your country of residence within the EU.'
			},
			{
				id: 'security',
				title: '7. Security',
				list: [
					'TLS encryption in transit; payment data stays with Stripe/PayPal.',
					'Data minimization: we keep only what is needed.',
					'Access controls and admin logging on production environments.',
					'Controlled backups for service continuity.'
				]
			},
			{
				id: 'cookies',
				title: '8. Cookies and preferences',
				body:
					'We use necessary technical cookies. Analytics/marketing cookies are disabled by default and activated only with your consent via the cookie banner. You can modify preferences anytime from the dedicated site section. Consent can be withdrawn at any time without affecting the lawfulness of processing based on consent before withdrawal.',
				list: [
					'Technical cookies (essential): necessary for site operation, do not require consent (legal basis: legitimate interest)',
					'Analytics cookies (Google Analytics): anonymous and aggregated visitor statistics, activated only with prior consent',
					'Marketing cookies: content and advertising personalization, activated only with prior consent',
					'Preference management: you can modify your cookie choices from the site footer at any time',
					'Consent duration: preferences remain active until modification or expiry (maximum 12 months)',
					'Rights: you can withdraw consent, access your preferences and request deletion of tracking data'
				]
			},
			{
				id: 'updates',
				title: '9. Updates',
				body:
					'We may update this notice; the current version is shown in “Last updated”.'
			}
		]
	},

	de: {
		lastUpdated: '20. Januar 2026',
		intro:
			'Diese Information erklärt, wie wir personenbezogene Daten für Website, Buchungen, Zahlungen, Kalender-Sync und Support verarbeiten.',
		sections: [
			{
				id: 'controller',
				title: '1. Verantwortlicher',
				body:
					'Vincanto Maiori – Via Torre di Milo, 7 – 84010 Maiori (SA), Italien – info@vincantomaiori.it. Für Datenschutzanfragen kontaktieren Sie uns per E-Mail. Gemäß Art. 37 DSGVO wurde kein Datenschutzbeauftragter (DSB) benannt, da die Verarbeitung nicht unter die obligatorischen Fälle fällt.'
			},
			{
				id: 'data-types',
				title: '2. Verarbeitete Daten',
				list: [
					'Identitäts- und Kontaktdaten: Name, E-Mail, Telefon, Aufenthaltspräferenzen.',
					'Buchungsdaten: Daten, Gäste, Extras, Beträge, Zahlungsstatus.',
					'Zahlungsdaten: von Stripe und PayPal verarbeitet; wir erhalten nur Ergebnis/ID (keine Kartennummern).',
					'Technische Daten: IP-Adresse, User-Agent, Sicherheits-/Performance-Logs.',
					'Kalenderdaten (Read-only iCal): Airbnb, Booking.com, Holidu.'
				]
			},
			{
				id: 'purposes',
				title: '3. Zwecke und Rechtsgrundlagen',
				list: [
					'Bearbeitung von Anfragen und Reservierungen (vor-/vertragliche Erforderlichkeit).',
					'Online-Zahlungen über Stripe und PayPal (Vertragserfüllung).',
					'Missbrauchsvermeidung, Sicherheit, System-Logs (berechtigtes Interesse).',
					'Gesetzliche, steuerliche und buchhalterische Pflichten (rechtliche Verpflichtung).',
					'Optionale Marketing-Kommunikation nur mit Einwilligung.',
					'Nicht notwendige Cookies/Analytics nur mit Einwilligung über das Cookie-Banner.'
				]
			},
			{
				id: 'recipients',
				title: '4. Empfänger und Drittanbieter',
				list: [
					'Hosting/Delivery: Vercel Inc. (USA) – Transfer durch SCC abgedeckt.',
					'Datenbank/Storage: Neon Inc. (USA) – Managed PostgreSQL, Transfer durch SCC abgedeckt.',
					'Zahlungen: Stripe, Inc. (USA) und PayPal Holdings, Inc. (USA) – Transfer durch SCC abgedeckt.',
					'E-Mail/Benachrichtigungen: Seeweb S.r.l. (IT) – authsmtp.securemail.pro, Server in Italien.',
					'Externe Kalender (Read-only): Airbnb, Booking.com, Holidu iCal.',
					'Analytics (Google Analytics): Google LLC (USA) – nur mit Einwilligung aktiviert, Transfer durch SCC abgedeckt.',
					'Weitere optionale Analytics nur bei Cookie-Einwilligung.'
				],
				note: 'Drittanbieter können in der EU oder außerhalb sitzen; bei internationalen Transfers nutzen wir Standardvertragsklauseln (SCC) oder gleichwertige Garantien, sofern erforderlich.'
			},
			{
				id: 'retention',
				title: '5. Aufbewahrung',
				list: [
					'Buchungs- und Abrechnungsdaten: für die Vertragsdauer und bis zu 10 Jahre für gesetzliche Pflichten.',
					'Sicherheits-/Zugriffs-Logs: typischerweise 6–12 Monate, länger nur bei Bedarf.',
					'Marketing-Einwilligungen und Cookie-Präferenzen: bis Widerruf oder Änderung.',
					'Anonymisierte/aggregierte technische Daten: statistische Nutzung ohne Re-Identifikation.'
				]
			},
			{
				id: 'rights',
				title: '6. Rechte der Betroffenen',
				body:
					'Sie können Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Widerruf der Einwilligung ausüben, indem Sie an info@vincantomaiori.it schreiben. Wir antworten innerhalb von 30 Tagen (verlängerbar auf 90 Tage bei komplexen Fällen). Beschwerderecht bei der italienischen Datenschutzbehörde (Garante, www.gpdp.it) oder der zuständigen Aufsichtsbehörde Ihres EU-Wohnsitzlandes.'
			},
			{
				id: 'security',
				title: '7. Sicherheit',
				list: [
					'TLS-Verschlüsselung; Zahlungsdaten verbleiben bei Stripe/PayPal.',
					'Datenminimierung: wir speichern nur das Notwendige.',
					'Zugriffskontrollen und Admin-Logging in Produktion.',
					'Gesteuerte Backups für Service-Kontinuität.'
				]
			},
			{
				id: 'cookies',
				title: '8. Cookies und Präferenzen',
				body:
					'Wir verwenden notwendige technische Cookies. Analytics/Marketing-Cookies sind standardmäßig aus und werden nur mit Ihrer Einwilligung über das Banner aktiviert. Präferenzen können jederzeit auf der Website angepasst werden. Die Einwilligung kann jederzeit widerrufen werden, ohne dass die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten Verarbeitung berührt wird.',
				list: [
					'Technische Cookies (essentiell): notwendig für den Website-Betrieb, erfordern keine Einwilligung (Rechtsgrundlage: berechtigtes Interesse)',
					'Analyse-Cookies (Google Analytics): anonyme und aggregierte Besucherstatistiken, nur mit vorheriger Einwilligung aktiviert',
					'Marketing-Cookies: Inhalts- und Werbepersonalisierung, nur mit vorheriger Einwilligung aktiviert',
					'Präferenzenverwaltung: Sie können Ihre Cookie-Auswahl jederzeit über die Website-Fußzeile ändern',
					'Einwilligungsdauer: Präferenzen bleiben bis zur Änderung oder zum Ablauf aktiv (maximal 12 Monate)',
					'Rechte: Sie können die Einwilligung widerrufen, auf Ihre Präferenzen zugreifen und die Löschung von Tracking-Daten anfordern'
				]
			},
			{
				id: 'updates',
				title: '9. Aktualisierungen',
				body:
					'Diese Information kann aktualisiert werden; das aktuelle Datum steht unter „Letzte Aktualisierung”.'
			}
		]
	},

	fr: {
		lastUpdated: '20 janvier 2026',
		intro:
			'La présente notice explique comment nous traitons les données personnelles pour le site, les réservations, les paiements, la synchronisation du calendrier et l’assistance.',
		sections: [
			{
				id: 'controller',
				title: '1. Responsable du traitement',
				body:
					'Vincanto Maiori – Via Torre di Milo, 7 – 84010 Maiori (SA), Italie – info@vincantomaiori.it. Contactez-nous par email pour toute demande liée à la confidentialité. Conformément à l\'art. 37 RGPD, aucun Délégué à la Protection des Données (DPD) n\'a été désigné, le traitement ne relevant pas des cas obligatoires.'
			},
			{
				id: 'data-types',
				title: '2. Données traitées',
				list: [
					'Données d’identité et de contact : nom, prénom, email, téléphone, préférences de séjour.',
					'Données de réservation : dates, invités, services additionnels, montants, statut de paiement.',
					'Données de paiement : gérées par Stripe et PayPal ; nous recevons uniquement l’issue et l’ID (pas de numéros de carte).',
					'Données techniques : adresse IP, user agent, journaux de sécurité/performance.',
					'Données calendrier en lecture seule (iCal) : Airbnb, Booking.com, Holidu.'
				]
			},
			{
				id: 'purposes',
				title: '3. Finalités et bases juridiques',
				list: [
					'Gérer les demandes et réservations (nécessité pré/contractuelle).',
					'Paiements en ligne via Stripe et PayPal (exécution du contrat).',
					'Prévention des abus, sécurité et logs systèmes (intérêt légitime).',
					'Obligations légales, fiscales et comptables (obligation légale).',
					'Marketing optionnel / communications promotionnelles, uniquement avec consentement.',
					'Cookies/analytics non essentiels, uniquement avec consentement via le bandeau.'
				]
			},
			{
				id: 'recipients',
				title: '4. Destinataires et tiers',
				list: [
					'Hébergement et delivery : Vercel Inc. (USA) – transfert couvert par CCT.',
					'Base de données/storage : Neon Inc. (USA) – PostgreSQL managé, transfert couvert par CCT.',
					'Paiements : Stripe, Inc. (USA) et PayPal Holdings, Inc. (USA) – transfert couvert par CCT.',
					'Email/notifications : Seeweb S.r.l. (IT) – authsmtp.securemail.pro, serveur situé en Italie.',
					'Calendriers externes (lecture seule) : flux iCal Airbnb, Booking.com, Holidu.',
					'Analytics (Google Analytics) : Google LLC (USA) – activés uniquement avec consentement, transfert couvert par CCT.',
					'Analytics optionnels supplémentaires : uniquement si activés par le consentement cookie.'
				],
				note: 'Les prestataires peuvent être situés dans ou hors UE ; pour les transferts internationaux, nous appliquons les Clauses Contractuelles Types (CCT) ou garanties équivalentes lorsque requis.'
			},
			{
				id: 'retention',
				title: '5. Conservation',
				list: [
					'Données de réservation/facturation : durée du contrat et jusqu’à 10 ans pour obligations légales.',
					'Journaux de sécurité/accès : en général 6–12 mois, plus long si nécessaire.',
					'Consentements marketing et préférences cookie : jusqu’au retrait ou mise à jour par l’utilisateur.',
					'Données techniques anonymes/agrégées : conservées à des fins statistiques sans ré-identification.'
				]
			},
			{
				id: 'rights',
				title: '6. Vos droits',
				body:
					'Vous pouvez exercer accès, rectification, effacement, limitation, portabilité, opposition et retrait du consentement en écrivant à info@vincantomaiori.it. Nous répondrons dans un délai de 30 jours (prorogeable à 90 jours en cas de complexité). Vous pouvez aussi déposer une réclamation auprès de l\'autorité italienne de protection des données (Garante, www.gpdp.it) ou de l\'autorité de contrôle de votre pays de résidence au sein de l\'UE.'
			},
			{
				id: 'security',
				title: '7. Sécurité',
				list: [
					'Chiffrement TLS en transit ; les données de paiement restent chez Stripe/PayPal.',
					'Minimisation des données : nous conservons uniquement ce qui est nécessaire.',
					'Contrôles d’accès et journaux administratifs sur les environnements de production.',
					'Sauvegardes contrôlées pour la continuité de service.'
				]
			},
			{
				id: 'cookies',
				title: '8. Cookies et préférences',
				body:
					'Nous utilisons des cookies techniques nécessaires. Les cookies analytiques/marketing sont désactivés par défaut et ne sont activés qu\'avec votre consentement via la bannière cookies. Vous pouvez modifier les préférences à tout moment depuis la section dédiée du site. Le consentement peut être retiré à tout moment sans affecter la licéité du traitement fondé sur le consentement avant le retrait.',
				list: [
					'Cookies techniques (essentiels): nécessaires au fonctionnement du site, ne nécessitent pas de consentement (base légale: intérêt légitime)',
					'Cookies d\'analyse (Google Analytics): statistiques anonymes et agrégées des visiteurs, activés seulement avec consentement préalable',
					'Cookies marketing: personnalisation du contenu et de la publicité, activés seulement avec consentement préalable',
					'Gestion des préférences: vous pouvez modifier vos choix de cookies depuis le pied de page du site à tout moment',
					'Durée du consentement: les préférences restent actives jusqu\'à modification ou expiration (maximum 12 mois)',
					'Droits: vous pouvez retirer votre consentement, accéder à vos préférences et demander la suppression des données de suivi'
				]
			},
			{
				id: 'updates',
				title: '9. Mises à jour',
				body:
					'Cette notice peut être mise à jour ; la version en vigueur figure dans « Dernière mise à jour ».'
			}
		]
	}
};