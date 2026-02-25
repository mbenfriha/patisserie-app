'use client'

import { useAuth } from '@/lib/providers/auth-provider'
import Link from 'next/link'

const PLAN_LEVELS: Record<string, number> = {
	starter: 1,
	pro: 2,
	premium: 3,
}

interface PlanGateProps {
	minPlan: 'pro' | 'premium'
	children: React.ReactNode
}

export function PlanGate({ minPlan, children }: PlanGateProps) {
	const { user } = useAuth()
	const userPlan = user?.profile?.plan || 'starter'
	const userLevel = PLAN_LEVELS[userPlan] || 1
	const requiredLevel = PLAN_LEVELS[minPlan] || 1

	if (userLevel >= requiredLevel) {
		return <>{children}</>
	}

	return (
		<div className="flex flex-col items-center justify-center py-20">
			<div className="mx-auto max-w-md text-center">
				<div
					className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
						minPlan === 'premium' ? 'bg-amber-100' : 'bg-blue-100'
					}`}
				>
					<svg
						className={`h-7 w-7 ${minPlan === 'premium' ? 'text-amber-600' : 'text-blue-600'}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={1.5}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
						/>
					</svg>
				</div>
				<h2 className="text-xl font-semibold">
					Fonctionnalité {minPlan === 'premium' ? 'Premium' : 'Pro'}
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					Cette fonctionnalité nécessite le plan{' '}
					<span className="font-medium">{minPlan === 'premium' ? 'Premium' : 'Pro'}</span> ou
					supérieur. Mettez à jour votre abonnement pour y accéder.
				</p>
				<Link
					href="/billing"
					className="mt-6 inline-block rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Voir les plans
				</Link>
			</div>
		</div>
	)
}
