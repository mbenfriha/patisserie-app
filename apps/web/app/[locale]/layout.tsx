import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import type React from 'react'
import { Toaster } from 'sonner'
import type { Locale } from '@/i18n/config'
import { routing } from '@/i18n/routing'
import { AuthProvider } from '@/lib/providers/auth-provider'
import { QueryProvider } from '@/lib/providers/query-provider'

type Props = {
	children: React.ReactNode
	params: Promise<{ locale: string }>
}

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params

	if (!routing.locales.includes(locale as Locale)) {
		notFound()
	}

	setRequestLocale(locale)
	const messages = await getMessages()

	return (
		<QueryProvider>
			<NextIntlClientProvider messages={messages}>
				<AuthProvider>
					{children}
					<Toaster richColors position="bottom-right" />
				</AuthProvider>
			</NextIntlClientProvider>
		</QueryProvider>
	)
}
