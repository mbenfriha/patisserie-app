'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Pencil, Check, X, Globe, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'
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
	const [isEditingName, setIsEditingName] = useState(false)
	const [editedName, setEditedName] = useState('')
	const [isSavingName, setIsSavingName] = useState(false)
	const [domainInput, setDomainInput] = useState('')
	const [domainLoading, setDomainLoading] = useState(false)
	const [domainError, setDomainError] = useState<string | null>(null)
	const [domainStatus, setDomainStatus] = useState<{ status: string; domain: string } | null>(null)
	const [domainVerifying, setDomainVerifying] = useState(false)

	const handleSaveName = async () => {
		const trimmed = editedName.trim()
		if (!trimmed || trimmed === profile?.businessName) {
			setIsEditingName(false)
			return
		}
		setIsSavingName(true)
		try {
			await api.patch('/patissier/profile', { businessName: trimmed })
			setProfile((p: any) => ({ ...p, businessName: trimmed }))
			setIsEditingName(false)
		} catch (err) {
			console.error(err)
		} finally {
			setIsSavingName(false)
		}
	}

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
			if (url) window.location.href = url
		} catch {
			// Dashboard failed — capabilities may be missing, re-trigger onboarding
			try {
				const res = await api.post('/patissier/integrations/stripe/connect')
				const data = res.data.data
				if (data.onboardingUrl) {
					window.location.href = data.onboardingUrl
				}
			} catch (err) {
				console.error(err)
			}
		}
	}

	const handleSetDomain = async () => {
		const domain = domainInput.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '')
		if (!domain) return
		setDomainLoading(true)
		setDomainError(null)
		try {
			const res = await api.put('/patissier/domain', { domain })
			setProfile((p: any) => ({ ...p, customDomain: domain, customDomainVerified: false }))
			setDomainStatus({ status: 'pending', domain })
			setDomainInput('')
		} catch (err: any) {
			setDomainError(err?.response?.data?.message || 'Erreur lors de la configuration du domaine')
		} finally {
			setDomainLoading(false)
		}
	}

	const handleRemoveDomain = async () => {
		setDomainLoading(true)
		try {
			await api.delete('/patissier/domain')
			setProfile((p: any) => ({ ...p, customDomain: null, customDomainVerified: false }))
			setDomainStatus(null)
		} catch (err) {
			console.error(err)
		} finally {
			setDomainLoading(false)
		}
	}

	const handleVerifyDomain = async () => {
		setDomainVerifying(true)
		try {
			const res = await api.get('/patissier/domain/verify')
			const data = res.data.data
			setDomainStatus({ status: data.status, domain: data.domain })
			if (data.status === 'verified') {
				setProfile((p: any) => ({ ...p, customDomainVerified: true }))
			}
		} catch (err) {
			console.error(err)
		} finally {
			setDomainVerifying(false)
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
							{isEditingName ? (
								<div className="mt-1 flex items-center gap-2">
									<input
										type="text"
										value={editedName}
										onChange={(e) => setEditedName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleSaveName()
											if (e.key === 'Escape') setIsEditingName(false)
										}}
										autoFocus
										disabled={isSavingName}
										className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
									/>
									<button
										type="button"
										onClick={handleSaveName}
										disabled={isSavingName}
										className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-green-600 hover:bg-green-50 disabled:opacity-50"
									>
										<Check className="h-4 w-4" />
									</button>
									<button
										type="button"
										onClick={() => setIsEditingName(false)}
										disabled={isSavingName}
										className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							) : (
								<div className="mt-1 flex items-center gap-2">
									<p className="text-sm">{profile?.businessName}</p>
									<button
										type="button"
										onClick={() => {
											setEditedName(profile?.businessName ?? '')
											setIsEditingName(true)
										}}
										className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
									>
										<Pencil className="h-3.5 w-3.5" />
									</button>
								</div>
							)}
						</div>
						<div>
							<label className="text-sm font-medium">URL du site</label>
							{profile?.plan === 'pro' || profile?.plan === 'premium' ? (
								<p className="mt-1 text-sm text-blue-600">{profile?.slug}.patissio.com</p>
							) : (
								<p className="mt-1 text-sm text-blue-600">patissio.com/{profile?.slug}</p>
							)}
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
							<h2 className="text-xl font-semibold">Assistance</h2>
							<p className="mt-2 text-sm text-muted-foreground">
								Autorisez l'equipe Patissio a acceder a votre site pour vous aider a le configurer.
								Vous pouvez desactiver cet acces a tout moment.
							</p>
						</div>
						{profile?.allowSupportAccess && (
							<span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
								Actif
							</span>
						)}
					</div>
					<div className="mt-4">
						<label className="flex cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								checked={profile?.allowSupportAccess ?? false}
								onChange={async (e) => {
									const checked = e.target.checked
									setProfile((p: any) => ({ ...p, allowSupportAccess: checked }))
									try {
										await api.patch('/patissier/profile', { allowSupportAccess: checked })
									} catch (err) {
										console.error(err)
										setProfile((p: any) => ({ ...p, allowSupportAccess: !checked }))
									}
								}}
								className="h-4 w-4 rounded border"
							/>
							<span className="text-sm font-medium">
								Autoriser l'acces au support Patissio
							</span>
						</label>
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
				{profile?.plan === 'premium' && (
					<section className="rounded-lg border p-6">
						<div className="flex items-start justify-between">
							<div>
								<h2 className="text-xl font-semibold">Domaine personnalisé</h2>
								<p className="mt-2 text-sm text-muted-foreground">
									Connectez votre propre nom de domaine pour que vos clients accèdent à votre site via votre URL.
								</p>
							</div>
							{profile?.customDomainVerified && (
								<span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
									Actif
								</span>
							)}
						</div>

						{profile?.customDomain ? (
							<div className="mt-4 space-y-4">
								<div className="flex items-center gap-3">
									<Globe className="h-5 w-5 text-muted-foreground" />
									<span className="text-sm font-medium">{profile.customDomain}</span>
									{profile.customDomainVerified ? (
										<span className="flex items-center gap-1 text-xs text-green-600">
											<CheckCircle2 className="h-3.5 w-3.5" />
											Vérifié
										</span>
									) : (
										<span className="flex items-center gap-1 text-xs text-amber-600">
											<AlertCircle className="h-3.5 w-3.5" />
											En attente de vérification
										</span>
									)}
								</div>

								{!profile.customDomainVerified && (
									<div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
										<p className="font-medium text-amber-800">Configuration DNS requise</p>
										<p className="mt-1 text-amber-700">
											Ajoutez un enregistrement CNAME chez votre registraire de domaine :
										</p>
										<div className="mt-3 overflow-x-auto rounded-md bg-white p-3 font-mono text-xs">
											<table className="w-full">
												<thead>
													<tr className="text-left text-amber-600">
														<th className="pr-6">Type</th>
														<th className="pr-6">Nom</th>
														<th>Valeur</th>
													</tr>
												</thead>
												<tbody className="text-amber-900">
													<tr>
														<td className="pr-6 pt-1">CNAME</td>
														<td className="pr-6 pt-1">@</td>
														<td className="pt-1">cname.vercel-dns.com</td>
													</tr>
												</tbody>
											</table>
										</div>
										<div className="mt-3 flex gap-2">
											<button
												type="button"
												onClick={handleVerifyDomain}
												disabled={domainVerifying}
												className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
											>
												{domainVerifying ? (
													<span className="flex items-center gap-1.5">
														<Loader2 className="h-3 w-3 animate-spin" />
														Vérification...
													</span>
												) : (
													'Vérifier le domaine'
												)}
											</button>
										</div>
									</div>
								)}

								<button
									type="button"
									onClick={handleRemoveDomain}
									disabled={domainLoading}
									className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
								>
									Supprimer le domaine
								</button>
							</div>
						) : (
							<div className="mt-4 space-y-3">
								<div className="flex gap-2">
									<input
										type="text"
										value={domainInput}
										onChange={(e) => {
											setDomainInput(e.target.value)
											setDomainError(null)
										}}
										placeholder="mon-site.com"
										className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleSetDomain()
										}}
									/>
									<button
										type="button"
										onClick={handleSetDomain}
										disabled={domainLoading || !domainInput.trim()}
										className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
									>
										{domainLoading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											'Ajouter'
										)}
									</button>
								</div>
								{domainError && (
									<p className="text-xs text-red-500">{domainError}</p>
								)}
							</div>
						)}
					</section>
				)}
			</div>
		</div>
	)
}
