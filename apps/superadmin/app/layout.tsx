import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import type React from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
	title: 'Patissio - Admin',
	description: 'Administration panel for Patissio',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="fr">
			<body className={`${inter.variable} font-sans antialiased`}>
				{children}
			</body>
		</html>
	)
}
