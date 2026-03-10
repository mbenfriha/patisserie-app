'use client'

import { PLANS } from '@patissio/config'
import { Check, CreditCard, Crown, ExternalLink, Star, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api/client'

type PlanKey = keyof typeof PLANS

const planOrder: PlanKey[] = ['starter', 'pro', 'premium']

const planIcons: Record<PlanKey, typeof Zap> = {
	starter: Zap,
	pro: Star,
	premium: Crown,
}

const planIconColors: Record<PlanKey, string> = {
	starter: 'bg-muted text-muted-foreground',
	pro: 'bg-primary/10 text-primary',
	premium: 'bg-amber-100 text-amber-600',
}

export default function BillingPage() {
	const t = useTranslations('billing')
	const tc = useTranslations('common')

	const [currentPlan, setCurrentPlan] = useState<{
		plan?: string
		status?: string
		cancelAtPeriodEnd?: boolean
		currentPeriodEnd?: string
	} | null>(null)
	const [isYearly, setIsYearly] = useState(false)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		api
			.get('/billing/current')
			.then((res) => {
				const data = res.data?.data ?? res.data
				setCurrentPlan(data as typeof currentPlan)
			})
			.catch(() => {})
			.finally(() => setIsLoading(false))
	}, [])

	const activePlan = (currentPlan?.plan as PlanKey) || 'starter'

	const handleSubscribe = async (plan: PlanKey) => {
		if (plan === activePlan) return
		try {
			const interval = isYearly ? 'yearly' : 'monthly'
			const res = await api.post('/billing/subscribe', { plan, interval })
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

	const getPlanDescription = (key: PlanKey) => {
		const map: Record<PlanKey, string> = {
			starter: t('starterDesc'),
			pro: t('proDesc'),
			premium: t('premiumDesc'),
		}
		return map[key]
	}

	if (isLoading) {
		return <p className="text-muted-foreground">{tc('loading')}</p>
	}

	const ActiveIcon = planIcons[activePlan]

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
				<p className="text-muted-foreground">{t('subtitle')}</p>
			</div>

			{/* Current plan card */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>{t('currentPlan')}</CardTitle>
							<CardDescription>
								{t('currentPlanDesc', { plan: PLANS[activePlan].name })}
							</CardDescription>
						</div>
						{activePlan !== 'starter' && (
							<Button variant="outline" onClick={handleManageBilling}>
								<CreditCard className="mr-2 size-4" />
								{t('manageBilling')}
								<ExternalLink className="ml-2 size-4" />
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4">
						<div
							className={`flex size-12 items-center justify-center rounded-lg ${planIconColors[activePlan]}`}
						>
							<ActiveIcon className="size-6" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="text-xl font-bold">
									{PLANS[activePlan].name}
								</span>
								{currentPlan?.status === 'active' && (
									<Badge variant="outline">{t('active')}</Badge>
								)}
								{currentPlan?.status === 'past_due' && (
									<Badge variant="destructive">{t('pastDue')}</Badge>
								)}
								{currentPlan?.status === 'canceled' && (
									<Badge variant="destructive">{t('canceled')}</Badge>
								)}
								{currentPlan?.cancelAtPeriodEnd && (
									<Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
										{t('cancelAtPeriodEnd')}
									</Badge>
								)}
							</div>
							<p className="text-sm text-muted-foreground">
								{PLANS[activePlan].priceMonthly === 0
									? t('free')
									: `${PLANS[activePlan].priceMonthly}€${t('perMonth')}`}
							</p>
						</div>
					</div>
					{activePlan !== 'starter' && currentPlan?.currentPeriodEnd && (
						<>
							<Separator className="my-4" />
							<div>
								<p className="text-sm text-muted-foreground">{t('nextBilling')}</p>
								<p className="font-medium">
									{new Date(currentPlan.currentPeriodEnd).toLocaleDateString('fr-FR', {
										day: 'numeric',
										month: 'long',
										year: 'numeric',
									})}
								</p>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Billing interval toggle */}
			<div className="flex items-center justify-center gap-3 py-4">
				<Label
					htmlFor="billing-toggle"
					className={!isYearly ? 'font-medium' : 'text-muted-foreground'}
				>
					{t('monthly')}
				</Label>
				<Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
				<Label
					htmlFor="billing-toggle"
					className={isYearly ? 'font-medium' : 'text-muted-foreground'}
				>
					{t('yearly')}
					<Badge variant="secondary" className="ml-2">
						{t('freeMonths')}
					</Badge>
				</Label>
			</div>

			{/* Plans grid */}
			<div className="grid gap-6 md:grid-cols-3">
				{planOrder.map((key) => {
					const plan = PLANS[key]
					const isActive = key === activePlan
					const price = isYearly ? plan.priceYearly : plan.priceMonthly
					const isUpgrade = planOrder.indexOf(key) > planOrder.indexOf(activePlan)
					const Icon = planIcons[key]

					return (
						<Card
							key={key}
							className={`relative flex flex-col ${
								key === 'pro' ? 'border-primary shadow-lg' : ''
							} ${isActive ? 'ring-2 ring-primary' : ''}`}
						>
							{key === 'pro' && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2">
									<Badge className="bg-primary text-primary-foreground">
										{t('popular')}
									</Badge>
								</div>
							)}
							<CardHeader>
								<div className="flex items-center gap-3">
									<div
										className={`flex size-10 items-center justify-center rounded-lg ${planIconColors[key]}`}
									>
										<Icon className="size-5" />
									</div>
									<div>
										<CardTitle className="flex items-center gap-2">
											{plan.name}
											{isActive && (
												<Badge variant="outline" className="text-xs">
													{t('currentPlanBtn')}
												</Badge>
											)}
										</CardTitle>
										<CardDescription>{getPlanDescription(key)}</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="flex-1 space-y-6">
								<div>
									<div className="flex items-baseline gap-1">
										<span className="text-4xl font-bold">
											{price === 0 ? t('free') : `${price}€`}
										</span>
										{price > 0 && (
											<span className="text-muted-foreground">
												{isYearly ? t('perYear') : t('perMonth')}
											</span>
										)}
									</div>
									{isYearly && price > 0 && (
										<Badge variant="secondary" className="mt-2">
											{t('perMonthEquiv', { price: Math.round(price / 12) })}
										</Badge>
									)}
								</div>

								<Separator />

								<div className="space-y-3">
									{plan.features.map((feature) => (
										<div key={feature} className="flex items-start gap-2">
											<Check className="mt-0.5 size-4 shrink-0 text-green-600" />
											<span className="text-sm">{feature}</span>
										</div>
									))}
								</div>
							</CardContent>
							<CardFooter>
								{isActive ? (
									<Button variant="outline" className="w-full" disabled>
										{t('currentPlanBtn')}
									</Button>
								) : isUpgrade ? (
									<Button
										className="w-full"
										variant={key === 'pro' ? 'default' : 'outline'}
										onClick={() => handleSubscribe(key)}
									>
										{t('upgradeTo', { plan: plan.name })}
									</Button>
								) : (
									<Button
										variant="outline"
										className="w-full"
										onClick={() => handleSubscribe(key)}
									>
										{t('downgrade')}
									</Button>
								)}
							</CardFooter>
						</Card>
					)
				})}
			</div>

			{/* Plan comparison table */}
			<Card>
				<CardHeader>
					<CardTitle>{t('planComparison')}</CardTitle>
					<CardDescription>{t('planComparisonDesc')}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b">
									<th className="py-3 text-left font-medium">{t('feature')}</th>
									<th className="py-3 text-center font-medium">Starter</th>
									<th className="py-3 text-center font-medium">Pro</th>
									<th className="py-3 text-center font-medium">Premium</th>
								</tr>
							</thead>
							<tbody className="divide-y">
								<tr>
									<td className="py-3">{t('creations')}</td>
									<td className="py-3 text-center">{t('creationsStarter')}</td>
									<td className="py-3 text-center">{t('creationsUnlimited')}</td>
									<td className="py-3 text-center">{t('creationsUnlimited')}</td>
								</tr>
								<tr>
									<td className="py-3">{t('siteCustomization')}</td>
									<td className="py-3 text-center">{t('basic')}</td>
									<td className="py-3 text-center">{t('advanced')}</td>
									<td className="py-3 text-center">{t('full')}</td>
								</tr>
								<tr>
									<td className="py-3">{t('onlineOrdering')}</td>
									<td className="py-3 text-center">-</td>
									<td className="py-3 text-center">
										<Check className="inline size-4 text-green-600" />
									</td>
									<td className="py-3 text-center">
										<Check className="inline size-4 text-green-600" />
									</td>
								</tr>
								<tr>
									<td className="py-3">{t('workshopBookings')}</td>
									<td className="py-3 text-center">-</td>
									<td className="py-3 text-center">
										<Check className="inline size-4 text-green-600" />
									</td>
									<td className="py-3 text-center">
										<Check className="inline size-4 text-green-600" />
									</td>
								</tr>
								<tr>
									<td className="py-3">{t('productCatalog')}</td>
									<td className="py-3 text-center">-</td>
									<td className="py-3 text-center">
										<Check className="inline size-4 text-green-600" />
									</td>
									<td className="py-3 text-center">
										<Check className="inline size-4 text-green-600" />
									</td>
								</tr>
								<tr>
									<td className="py-3">{t('customDomain')}</td>
									<td className="py-3 text-center">-</td>
									<td className="py-3 text-center">-</td>
									<td className="py-3 text-center">
										<Check className="inline size-4 text-green-600" />
									</td>
								</tr>
								<tr>
									<td className="py-3">{t('support')}</td>
									<td className="py-3 text-center">{t('supportEmail')}</td>
									<td className="py-3 text-center">{t('supportEmailChat')}</td>
									<td className="py-3 text-center">{t('supportPriority')}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
