'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/providers/auth-provider'

export default function DashboardPage() {
	const t = useTranslations('dashboard')
	const { user } = useAuth()

	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-3xl font-bold">
					{t('welcome')}, {user?.fullName || user?.email}
				</h1>
				<p className="text-muted-foreground mt-1">{t('overview')}</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('totalOrders')}</h3>
					<p className="mt-2 text-3xl font-bold">0</p>
				</div>
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('totalRevenue')}</h3>
					<p className="mt-2 text-3xl font-bold">0 &euro;</p>
				</div>
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('activeWorkshops')}</h3>
					<p className="mt-2 text-3xl font-bold">0</p>
				</div>
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('pendingOrders')}</h3>
					<p className="mt-2 text-3xl font-bold">0</p>
				</div>
			</div>
		</div>
	)
}
