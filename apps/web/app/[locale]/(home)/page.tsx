import type { Metadata } from 'next'
import { HomeContent } from './home-content'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://patissio.com'

export const metadata: Metadata = {
	title: 'Patissio — Créez votre vitrine pâtissière en ligne',
	description:
		'Patissio est la plateforme tout-en-un pour les artisans pâtissiers : créez votre site vitrine, recevez des commandes en ligne et proposez des ateliers. Inscription gratuite.',
	alternates: {
		canonical: BASE_URL,
	},
	openGraph: {
		title: 'Patissio — Créez votre vitrine pâtissière en ligne',
		description:
			'La plateforme tout-en-un pour les artisans pâtissiers. Site vitrine, commandes en ligne et ateliers. Gratuit pour démarrer.',
		url: BASE_URL,
		siteName: 'Patissio',
		locale: 'fr_FR',
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Patissio — Créez votre vitrine pâtissière en ligne',
		description:
			'La plateforme tout-en-un pour les artisans pâtissiers. Site vitrine, commandes en ligne et ateliers.',
	},
}

export default function HomePage() {
	return <HomeContent />
}
