import { PolicySection, PolicyContent } from './privacyPolicy';

export const cookiePolicyContent: Record<string, PolicyContent> = {
	it: {
		lastUpdated: '10 dicembre 2025',
		intro:
			'Questa Cookie Policy spiega come utilizziamo cookie e tecnologie simili e come puoi gestire le tue preferenze.',
		sections: [
			{
				id: 'what',
				title: '1. Cosa sono i cookie',
				body:
					'Piccoli file di testo salvati sul tuo dispositivo per consentire funzionalità tecniche, misurazioni statistiche e, se acconsenti, personalizzazione.'
			},
			{
				id: 'types',
				title: '2. Tipologie che usiamo',
				list: [
					'Cookie tecnici: necessari per il funzionamento del sito (autenticazione, preferenze, sicurezza).',
					'Cookie analitici opzionali: usati per statistiche aggregate, attivati solo con consenso.',
					'Cookie marketing/profilazione opzionali: attivati solo con consenso.'
				]
			},
			{
				id: 'legal',
				title: '3. Base giuridica',
				body:
					'Cookie tecnici: legittimo interesse/necessità del servizio. Analitici e marketing: solo previo consenso fornito tramite banner.'
			},
			{
				id: 'manage',
				title: '4. Gestione del consenso',
				body:
					'Al primo accesso puoi accettare o rifiutare le categorie non essenziali. Puoi modificare le scelte in qualsiasi momento dal link “Cookie Policy” o dalle impostazioni del banner.'
			},
			{
				id: 'third',
				title: '5. Terze parti',
				body:
					'Eventuali servizi esterni (es. analytics) possono impostare propri cookie. Consulta le loro informative per i dettagli.'
			},
			{
				id: 'disable',
				title: '6. Disabilitare i cookie dal browser',
				body:
					'Puoi bloccare o cancellare i cookie dalle impostazioni del browser. La disattivazione dei cookie tecnici può limitare alcune funzionalità.'
			},
			{
				id: 'changes',
				title: '7. Aggiornamenti',
				body:
					'Questa policy può cambiare; verifica “Ultimo aggiornamento” per la versione vigente.'
			}
		]
	},

	en: {
		lastUpdated: '10 December 2025',
		intro:
			'This Cookie Policy explains how we use cookies/trackers and how you can manage your choices.',
		sections: [
			{
				id: 'what',
				title: '1. What cookies are',
				body:
					'Small text files stored on your device to enable technical features, statistical measurement, and, if you consent, personalization.'
			},
			{
				id: 'types',
				title: '2. Types we use',
				list: [
					'Technical cookies: necessary for site operation (auth, preferences, security).',
					'Optional analytics cookies: aggregate stats, enabled only with consent.',
					'Optional marketing/profiling cookies: enabled only with consent.'
				]
			},
			{
				id: 'legal',
				title: '3. Legal basis',
				body:
					'Technical cookies: legitimate interest/necessity. Analytics and marketing: only with your consent via the banner.'
			},
			{
				id: 'manage',
				title: '4. Managing consent',
				body:
					'On first visit you can accept or refuse non-essential categories. You can change choices anytime from the “Cookie Policy” link or banner settings.'
			},
			{
				id: 'third',
				title: '5. Third parties',
				body:
					'External services (e.g., analytics) may set their own cookies. Please check their privacy notices for details.'
			},
			{
				id: 'disable',
				title: '6. Disable cookies in browser',
				body:
					'You can block or delete cookies via your browser settings. Disabling technical cookies may limit some features.'
			},
			{
				id: 'changes',
				title: '7. Updates',
				body:
					'We may update this policy; see “Last updated” for the current version.'
			}
		]
	},

	de: {
		lastUpdated: '10. Dezember 2025',
		intro:
			'Diese Cookie-Richtlinie erklärt, wie wir Cookies/Tracker nutzen und wie Sie Ihre Auswahl verwalten können.',
		sections: [
			{
				id: 'what',
				title: '1. Was sind Cookies',
				body:
					'Kleine Textdateien auf Ihrem Gerät, die technische Funktionen, Statistiken und – bei Einwilligung – Personalisierung ermöglichen.'
			},
			{
				id: 'types',
				title: '2. Arten, die wir nutzen',
				list: [
					'Technische Cookies: für den Betrieb erforderlich (Login, Präferenzen, Sicherheit).',
					'Optionale Analyse-Cookies: aggregierte Statistik, nur mit Einwilligung.',
					'Optionale Marketing/Profiling-Cookies: nur mit Einwilligung.'
				]
			},
			{
				id: 'legal',
				title: '3. Rechtsgrundlage',
				body:
					'Technische Cookies: berechtigtes Interesse/Notwendigkeit. Analyse- und Marketing-Cookies: nur mit Einwilligung über das Banner.'
			},
			{
				id: 'manage',
				title: '4. Einwilligung verwalten',
				body:
					'Beim ersten Besuch können Sie nicht-essenzielle Kategorien ablehnen oder annehmen. Änderungen sind jederzeit über den Link „Cookie Policy“ oder die Banner-Einstellungen möglich.'
			},
			{
				id: 'third',
				title: '5. Drittanbieter',
				body:
					'Externe Dienste (z. B. Analytics) können eigene Cookies setzen. Bitte prüfen Sie deren Datenschutzhinweise.'
			},
			{
				id: 'disable',
				title: '6. Cookies im Browser deaktivieren',
				body:
					'Sie können Cookies im Browser blockieren/löschen. Das Deaktivieren technischer Cookies kann Funktionen einschränken.'
			},
			{
				id: 'changes',
				title: '7. Aktualisierungen',
				body:
					'Wir können diese Richtlinie aktualisieren; das Datum „Letzte Aktualisierung“ zeigt die aktuelle Version.'
			}
		]
	},

	fr: {
		lastUpdated: '10 décembre 2025',
		intro:
			'Cette politique de cookies explique comment nous utilisons cookies/traceurs et comment gérer vos choix.',
		sections: [
			{
				id: 'what',
				title: '1. Que sont les cookies',
				body:
					'Petits fichiers texte stockés sur votre appareil pour permettre des fonctions techniques, des mesures statistiques et, avec votre consentement, la personnalisation.'
			},
			{
				id: 'types',
				title: '2. Types utilisés',
				list: [
					'Cookies techniques: nécessaires au fonctionnement (authentification, préférences, sécurité).',
					'Cookies analytiques optionnels: statistiques agrégées, activés seulement avec consentement.',
					'Cookies marketing/profilage optionnels: activés seulement avec consentement.'
				]
			},
			{
				id: 'legal',
				title: '3. Base légale',
				body:
					'Cookies techniques: intérêt légitime/nécessité. Analytics et marketing: uniquement avec consentement via le bandeau.'
			},
			{
				id: 'manage',
				title: '4. Gestion du consentement',
				body:
					'Lors de la première visite vous pouvez accepter/refuser les catégories non essentielles. Vous pouvez changer d’avis à tout moment via le lien « Cookie Policy » ou les réglages du bandeau.'
			},
			{
				id: 'third',
				title: '5. Tiers',
				body:
					'Des services externes (ex. analytics) peuvent déposer leurs cookies. Consultez leurs notices de confidentialité pour les détails.'
			},
			{
				id: 'disable',
				title: '6. Désactiver les cookies dans le navigateur',
				body:
					'Vous pouvez bloquer ou supprimer les cookies via votre navigateur. Désactiver les cookies techniques peut limiter certaines fonctions.'
			},
			{
				id: 'changes',
				title: '7. Mises à jour',
				body:
					'Cette politique peut évoluer ; « Dernière mise à jour » indique la version en vigueur.'
			}
		]
	}
};
