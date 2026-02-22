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
		'patissier',
		'gateau',
		'commande',
		'atelier',
		'reservation',
		'cake',
		'boulangerie',
	],
	openGraph: {
		type: 'website',
		url: BASE_URL,
		siteName: 'Patissio',
	},
	robots: {
		index: true,
		follow: true,
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
