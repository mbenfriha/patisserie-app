import type { Metadata, Viewport } from 'next'
import { Josefin_Sans, Cormorant_Garamond } from 'next/font/google'
import type React from 'react'
import './globals.css'

const josefin = Josefin_Sans({
	subsets: ['latin'],
	variable: '--font-sans',
	weight: ['300', '400', '500', '600'],
})

const cormorant = Cormorant_Garamond({
	subsets: ['latin'],
	variable: '--font-serif',
	weight: ['300', '400', '500', '600', '700'],
})

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://patissio.com'

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	themeColor: '#FDF8F0',
}

export const metadata: Metadata = {
	metadataBase: new URL(BASE_URL),
	title: {
		default: 'Patissio — La plateforme des artisans pâtissiers',
		template: '%s | Patissio',
	},
	description:
		'Créez votre vitrine pâtissière en ligne, recevez des commandes et proposez des ateliers. La plateforme tout-en-un pour les artisans pâtissiers.',
	authors: [{ name: 'Patissio' }],
	creator: 'Patissio',
	publisher: 'Patissio',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	keywords: [
		'patisserie',
		'pâtissier',
		'vitrine en ligne',
		'commande gâteau',
		'atelier pâtisserie',
		'site pâtissier',
		'vente en ligne pâtisserie',
		'réservation atelier',
	],
	openGraph: {
		type: 'website',
		url: BASE_URL,
		siteName: 'Patissio',
		locale: 'fr_FR',
	},
	twitter: {
		card: 'summary_large_image',
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
		},
	},
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="fr" suppressHydrationWarning>
			<body className={`${josefin.variable} ${cormorant.variable} font-sans antialiased bg-background text-foreground`}>{children}</body>
		</html>
	)
}
