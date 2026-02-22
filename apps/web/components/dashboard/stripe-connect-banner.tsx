'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/lib/providers/auth-provider'

export function StripeConnectBanner() {
	const { user } = useAuth()
	const [dismissed, setDismissed] = useState(false)

	const profile = user?.profile
	if (!profile || profile.stripeOnboardingComplete || dismissed) {
		return null
	}

	return (
		<div className="mb-6 flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-6 py-4">
			<div className="flex items-start gap-3">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					className="mt-0.5 shrink-0 text-yellow-600"
				>
					<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
				<div>
					<p className="font-medium text-yellow-900">
						Vérifiez votre identité pour commencer à vendre
					</p>
					<p className="mt-1 text-sm text-yellow-700">
						Connectez votre compte Stripe pour recevoir les paiements de vos ateliers et commandes en ligne.
					</p>
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-2">
				<Link
					href="/settings"
					className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
				>
					Configurer
				</Link>
				<button
					type="button"
					onClick={() => setDismissed(true)}
					className="rounded-md p-1.5 text-yellow-600 hover:bg-yellow-100"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
					<span className="sr-only">Fermer</span>
				</button>
			</div>
		</div>
	)
}
