'use client'

import { useEffect, useState } from 'react'
import { PLANS } from '@patissio/config'
import { api } from '@/lib/api/client'

type PlanKey = keyof typeof PLANS

const planOrder: PlanKey[] = ['starter', 'pro', 'premium']

export default function BillingPage() {
	const [currentPlan, setCurrentPlan] = useState<any>(null)
	const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		api
			.get('/billing/current')
			.then((res) => {
				const data = res.data?.data ?? res.data
				setCurrentPlan(data)
			})
			.catch(() => {})
			.finally(() => setIsLoading(false))
	}, [])

	const activePlan = (currentPlan?.plan as PlanKey) || 'starter'

	const handleSubscribe = async (plan: PlanKey) => {
		if (plan === activePlan) return
		try {
			const res = await api.post('/billing/subscribe', {
				plan,
				interval: billingInterval,
			})
			const data = res.data?.data ?? res.data
			if (data?.url) {
				window.location.href = data.url
			}
		} catch (err) {
			console.error(err)
		}
	}

	const handleManageBilling = async () => {
		try {
			const res = await api.post('/billing/portal')
			const data = res.data?.data ?? res.data
			if (data?.url) {
				window.location.href = data.url
			}
		} catch (err) {
			console.error(err)
		}
	}

	if (isLoading) {
		return <p className="text-muted-foreground">Chargement...</p>
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Abonnement</h1>
				{activePlan !== 'starter' && (
					<button
						type="button"
						onClick={handleManageBilling}
						className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
					>
						Gérer la facturation
					</button>
				)}
			</div>

			{/* Current plan banner */}
			<div className="rounded-lg border bg-card p-6">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-muted-foreground">Plan actuel</p>
						<p className="mt-1 text-2xl font-bold">{PLANS[activePlan].name}</p>
					</div>
					{currentPlan?.status && currentPlan.status !== 'active' && (
						<span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
							{currentPlan.status === 'past_due'
								? 'Paiement en retard'
								: currentPlan.status === 'canceled'
									? 'Annulé'
									: currentPlan.status}
						</span>
					)}
					{currentPlan?.cancelAtPeriodEnd && (
						<span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-medium text-yellow-600">
							Annulation en fin de période
						</span>
					)}
				</div>
				{activePlan !== 'starter' && currentPlan?.currentPeriodEnd && (
					<p className="mt-2 text-sm text-muted-foreground">
						Prochaine facturation :{' '}
						{new Date(currentPlan.currentPeriodEnd).toLocaleDateString('fr-FR', {
							day: 'numeric',
							month: 'long',
							year: 'numeric',
						})}
					</p>
				)}
			</div>

			{/* Billing interval toggle */}
			<div className="flex items-center justify-center gap-3">
				<span
					className={`text-sm font-medium ${billingInterval === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}
				>
					Mensuel
				</span>
				<button
					type="button"
					onClick={() => setBillingInterval((v) => (v === 'monthly' ? 'yearly' : 'monthly'))}
					className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors"
				>
					<span
						className={`inline-block h-4 w-4 rounded-full bg-primary transition-transform ${
							billingInterval === 'yearly' ? 'translate-x-6' : 'translate-x-1'
						}`}
					/>
				</button>
				<span
					className={`text-sm font-medium ${billingInterval === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}
				>
					Annuel
				</span>
				<span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
					2 mois offerts
				</span>
			</div>

			{/* Plans grid */}
			<div className="grid gap-6 md:grid-cols-3">
				{planOrder.map((key) => {
					const plan = PLANS[key]
					const isActive = key === activePlan
					const price = billingInterval === 'monthly' ? plan.priceMonthly : plan.priceYearly
					const isUpgrade = planOrder.indexOf(key) > planOrder.indexOf(activePlan)
					const isDowngrade = planOrder.indexOf(key) < planOrder.indexOf(activePlan)

					return (
						<div
							key={key}
							className={`relative rounded-lg border p-6 ${
								isActive
									? 'border-primary bg-primary/5'
									: key === 'pro'
										? 'border-primary/50'
										: 'bg-card'
							}`}
						>
							{key === 'pro' && (
								<span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
									Populaire
								</span>
							)}

							<div className="text-center">
								<h3 className="text-xl font-bold">{plan.name}</h3>
								<div className="mt-4">
									{price === 0 ? (
										<span className="text-3xl font-bold">Gratuit</span>
									) : (
										<>
											<span className="text-3xl font-bold">{price}&euro;</span>
											<span className="text-muted-foreground">
												/{billingInterval === 'monthly' ? 'mois' : 'an'}
											</span>
										</>
									)}
								</div>
								{billingInterval === 'yearly' && price > 0 && (
									<p className="mt-1 text-sm text-muted-foreground">
										soit {Math.round(price / 12)}&euro;/mois
									</p>
								)}
							</div>

							<ul className="mt-6 space-y-3 text-sm">
								{plan.features.map((feature) => (
									<li key={feature} className="flex items-start gap-2">
										<svg
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2.5"
											className="mt-0.5 shrink-0 text-primary"
										>
											<path d="M20 6L9 17l-5-5" />
										</svg>
										{feature}
									</li>
								))}
							</ul>

							<button
								type="button"
								onClick={() => handleSubscribe(key)}
								disabled={isActive}
								className={`mt-6 w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
									isActive
										? 'cursor-default border border-primary bg-primary/10 text-primary'
										: isUpgrade
											? 'bg-primary text-primary-foreground hover:bg-primary/90'
											: isDowngrade
												? 'border border-input bg-background text-foreground hover:bg-accent'
												: 'bg-primary text-primary-foreground hover:bg-primary/90'
								}`}
							>
								{isActive
									? 'Plan actuel'
									: isUpgrade
										? 'Passer au plan ' + plan.name
										: 'Rétrograder'}
							</button>
						</div>
					)
				})}
			</div>
		</div>
	)
}
