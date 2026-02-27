export const emailTranslations = {
	common: {
		greeting: 'Bonjour',
		seeYouSoon: 'À bientôt !',
		teamSignature: "L'équipe Patissio",
	},

	verifyEmail: {
		title: 'Vérifiez votre email',
		preview: 'Vérifiez votre adresse email pour activer votre compte',
		heading: 'Vérification de votre email',
		body: 'Merci de vous être inscrit. Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email :',
		button: 'Vérifier mon email',
		ignore: "Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.",
	},

	orderConfirmation: {
		title: 'Commande confirmée',
		preview: (orderNumber: string) => `Votre commande ${orderNumber} a été enregistrée`,
		heading: 'Commande enregistrée !',
		orderLabel: 'Numéro',
		typeLabel: 'Type',
		totalLabel: 'Total',
		footer: 'Vous recevrez une notification dès que le pâtissier aura mis à jour le statut de votre commande.',
	},

	bookingConfirmation: {
		title: 'Réservation confirmée',
		preview: (workshopTitle: string) => `Votre réservation pour ${workshopTitle} est confirmée`,
		heading: 'Réservation confirmée !',
		workshopLabel: 'Atelier',
		dateLabel: 'Date & Heure',
		participantsLabel: 'Participants',
		totalLabel: 'Prix total',
		depositLabel: 'Acompte versé',
		remainingLabel: 'Reste à payer',
		footer: "Le solde restant sera à régler le jour de l'atelier.",
	},

	paymentConfirmation: {
		title: 'Paiement confirmé',
		preview: (workshopTitle: string) => `Votre paiement pour ${workshopTitle} a été reçu`,
		heading: 'Paiement confirmé !',
		subheading: 'Récapitulatif de votre réservation',
		workshopLabel: 'Atelier',
		organizerLabel: 'Organisé par',
		dateLabel: 'Date',
		timeLabel: 'Heure',
		durationLabel: 'Durée',
		locationLabel: 'Lieu',
		participantsLabel: 'Participants',
		amountPaidLabel: 'Montant payé',
		remainingLabel: 'Reste à régler sur place',
		totalLabel: 'Prix total',
		fullPaymentFooter: "Votre paiement est complet. Il ne vous reste plus qu'à vous présenter le jour J !",
		depositFooter: (amount: string) =>
			`Le solde restant de ${amount} sera à régler le jour de l'atelier.`,
	},

	newBookingNotification: {
		title: 'Nouvelle réservation',
		preview: (workshopTitle: string) => `Nouvelle réservation pour ${workshopTitle}`,
		heading: 'Nouvelle réservation !',
		body: (workshopTitle: string) =>
			`Vous avez reçu une nouvelle réservation pour l'atelier ${workshopTitle}.`,
		clientLabel: 'Client',
		dateLabel: 'Date & Heure',
		participantsLabel: 'Participants',
		depositLabel: 'Acompte',
	},

	orderMessageNotification: {
		title: 'Nouveau message',
		preview: (orderNumber: string) => `Nouveau message sur la commande ${orderNumber}`,
		heading: 'Nouveau message !',
		body: (senderName: string, orderNumber: string) =>
			`${senderName} vous a envoyé un message concernant la commande ${orderNumber} :`,
		footer: 'Connectez-vous pour consulter la conversation et répondre.',
	},

	bookingCancellation: {
		title: 'Annulation de réservation',
		preview: (workshopTitle: string) => `Annulation pour ${workshopTitle}`,
		heading: 'Réservation annulée',
		dateLabel: 'Date',
		participantsLabel: 'Participants',
		reasonLabel: 'Raison',
	},

	forgotPassword: {
		title: 'Réinitialiser votre mot de passe',
		preview: 'Réinitialiser votre mot de passe Patissio',
		heading: 'Réinitialisation du mot de passe',
		body: 'Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau :',
		button: 'Réinitialiser mon mot de passe',
		expiry: 'Ce lien expire dans 1 heure.',
		ignore:
			"Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email. Votre mot de passe restera inchangé.",
	},
}
