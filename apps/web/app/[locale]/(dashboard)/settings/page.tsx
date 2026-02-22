'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/providers/auth-provider'
import { api } from '@/lib/api/client'

export default function SettingsPage() {
	const { user, refreshUser } = useAuth()
	const searchParams = useSearchParams()
	const [profile, setProfile] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isConnecting, setIsConnecting] = useState(false)
	const [stripeStatus, setStripeStatus] = useState<string | null>(null)
	const callbackHandled = useRef(false)

	const loadProfile = useCallback(() => {
		api
			.get('/patissier/profile')
			.then((res) => setProfile(res.data.data))
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	useEffect(() => {
		loadProfile()
	}, [loadProfile])

	// Handle Stripe callback
	useEffect(() => {
		const stripeParam = searchParams.get('stripe')
		if (stripeParam === 'callback' && !callbackHandled.current) {
			callbackHandled.current = true
			api
				.get('/patissier/integrations/stripe/callback')
				.then((res) => {
					const data = res.data.data
					if (data.onboardingComplete) {
						setStripeStatus('success')
						loadProfile()
						refreshUser?.()
					} else {
						setStripeStatus('incomplete')
					}
				})
				.catch(() => setStripeStatus('error'))
		} else if (stripeParam === 'refresh') {
			setStripeStatus('refresh')
		}
	}, [searchParams, loadProfile, refreshUser])

	const handleConnectStripe = async () => {
		setIsConnecting(true)
		try {
			const res = await api.post('/patissier/integrations/stripe/connect')
			const data = res.data.data
			if (data.onboardingComplete) {
				setStripeStatus('success')
				loadProfile()
			} else if (data.onboardingUrl) {
				window.location.href = data.onboardingUrl
			}
		} catch (err) {
			console.error(err)
		} finally {
			setIsConnecting(false)
		}
	}

	const handleStripeDashboard = async () => {
		try {
			const res = await api.get('/patissier/integrations/stripe/dashboard')
			const url = res.data.data?.url
			if (url) window.open(url, '_blank')
		} catch (err) {
			console.error(err)
		}
	}

	if (isLoading) {
		return <p className="text-muted-foreground">Chargement...</p>
	}

	return (
		<div className="space-y-8">
			<h1 className="text-3xl font-bold">Paramètres</h1>

			{/* Stripe callback messages */}
			{stripeStatus === 'success' && (
				<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
					Votre compte Stripe a été connecté avec succès ! Vous pouvez maintenant recevoir des paiements.
				</div>
			)}
			{stripeStatus === 'incomplete' && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
					La vérification de votre compte Stripe n'est pas encore terminée. Veuillez compléter toutes les étapes.
				</div>
			)}
			{stripeStatus === 'refresh' && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
					Le lien d'onboarding a expiré. Cliquez sur "Connecter Stripe" pour obtenir un nouveau lien.
				</div>
			)}
			{stripeStatus === 'error' && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
					Une erreur est survenue lors de la vérification de votre compte Stripe.
				</div>
			)}

			<div className="space-y-6">
				<section className="rounded-lg border p-6">
					<h2 className="text-xl font-semibold">Profil</h2>
					<div className="mt-4 grid gap-4 md:grid-cols-2">
						<div>
							<label className="text-sm font-medium">Nom de la pâtisserie</label>
							<p className="mt-1 text-sm">{profile?.businessName}</p>
						</div>
						<div>
							<label className="text-sm font-medium">Slug</label>
							<p className="mt-1 text-sm">{profile?.slug}.patissio.com</p>
						</div>
						<div>
							<label className="text-sm font-medium">Téléphone</label>
							<p className="mt-1 text-sm">{profile?.phone || '-'}</p>
						</div>
						<div>
							<label className="text-sm font-medium">Plan</label>
							<p className="mt-1 text-sm capitalize">{profile?.plan}</p>
						</div>
					</div>
				</section>

				<section className="rounded-lg border p-6">
					<h2 className="text-xl font-semibold">Design du site</h2>
					<div className="mt-4 grid gap-4 md:grid-cols-2">
						<div>
							<label className="text-sm font-medium">Couleur principale</label>
							<div className="mt-1 flex items-center gap-2">
								<div
									className="h-6 w-6 rounded-full border"
									style={{ backgroundColor: profile?.primaryColor }}
								/>
								<span className="text-sm">{profile?.primaryColor}</span>
							</div>
						</div>
						<div>
							<label className="text-sm font-medium">Couleur secondaire</label>
							<div className="mt-1 flex items-center gap-2">
								<div
									className="h-6 w-6 rounded-full border"
									style={{ backgroundColor: profile?.secondaryColor }}
								/>
								<span className="text-sm">{profile?.secondaryColor}</span>
							</div>
						</div>
					</div>
				</section>

				<section className="rounded-lg border p-6">
					<div className="flex items-start justify-between">
						<div>
							<h2 className="text-xl font-semibold">Paiements - Stripe Connect</h2>
							<p className="mt-2 text-sm text-muted-foreground">
								{profile?.stripeOnboardingComplete
									? 'Votre compte Stripe est connecté. Vous recevez les paiements de vos ateliers et commandes.'
									: 'Connectez votre compte Stripe pour recevoir les paiements en ligne de vos clients (ateliers, commandes).'}
							</p>
						</div>
						{profile?.stripeOnboardingComplete && (
							<span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
								Actif
							</span>
						)}
					</div>

					<div className="mt-4 flex gap-3">
						{profile?.stripeOnboardingComplete ? (
							<button
								type="button"
								onClick={handleStripeDashboard}
								className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
							>
								Ouvrir le dashboard Stripe
							</button>
						) : (
							<button
								type="button"
								onClick={handleConnectStripe}
								disabled={isConnecting}
								className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{isConnecting
									? 'Connexion en cours...'
									: profile?.stripeAccountId
										? 'Reprendre la vérification'
										: 'Connecter Stripe'}
							</button>
						)}
					</div>
				</section>
			</div>
		</div>
	)
}
