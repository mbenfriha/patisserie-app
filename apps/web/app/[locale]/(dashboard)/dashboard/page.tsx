'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/providers/auth-provider'
import { api } from '@/lib/api/client'

interface Stats {
	orders: {
		total: number
		pending: number
		confirmed: number
		inProgress: number
	}
	revenue: {
		total: number
	}
	workshops: {
		total: number
		published: number
	}
	bookings: {
		total: number
		confirmed: number
	}
}

export default function DashboardPage() {
	const t = useTranslations('dashboard')
	const { user } = useAuth()
	const [stats, setStats] = useState<Stats | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		api
			.get('/patissier/stats')
			.then((res) => {
				const statsData = res.data?.data || res.data
				setStats(statsData)
			})
			.catch((err) => {
				console.error('Failed to load stats:', err)
			})
			.finally(() => setIsLoading(false))
	}, [])

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
					<p className="mt-2 text-3xl font-bold">
						{isLoading ? '–' : stats?.orders?.total ?? 0}
					</p>
				</div>
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('totalRevenue')}</h3>
					<p className="mt-2 text-3xl font-bold">
						{isLoading ? '–' : `${stats?.revenue?.total ?? 0} €`}
					</p>
				</div>
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('activeWorkshops')}</h3>
					<p className="mt-2 text-3xl font-bold">
						{isLoading ? '–' : stats?.workshops?.published ?? 0}
					</p>
				</div>
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('pendingOrders')}</h3>
					<p className="mt-2 text-3xl font-bold">
						{isLoading ? '–' : stats?.orders?.pending ?? 0}
					</p>
				</div>
			</div>
		</div>
	)
}
