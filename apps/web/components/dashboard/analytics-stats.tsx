'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'

interface AnalyticsData {
	siteId: string | null
	period: string
	realtime: number
	aggregate: {
		visitors: number
		pageviews: number
		bounceRate: number
		visitDuration: number
	}
}

function formatDuration(seconds: number): string {
	if (seconds < 60) return `${Math.round(seconds)}s`
	const mins = Math.floor(seconds / 60)
	const secs = Math.round(seconds % 60)
	return `${mins}m ${secs}s`
}

export function AnalyticsStats() {
	const t = useTranslations('dashboard')
	const [data, setData] = useState<AnalyticsData | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		api
			.get('/patissier/stats/analytics')
			.then((res) => {
				setData(res.data?.data || res.data)
			})
			.catch((err) => {
				console.error('Failed to load analytics:', err)
			})
			.finally(() => setIsLoading(false))
	}, [])

	if (!isLoading && !data?.siteId) return null

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<h2 className="text-lg font-semibold">{t('analytics')}</h2>
				{!isLoading && data && data.realtime > 0 && (
					<span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
						<span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
						{data.realtime} {t('realtimeVisitors')}
					</span>
				)}
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('visitors30d')}</h3>
					<p className="mt-2 text-3xl font-bold">
						{isLoading ? '–' : (data?.aggregate.visitors ?? 0)}
					</p>
				</div>
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('pageviews30d')}</h3>
					<p className="mt-2 text-3xl font-bold">
						{isLoading ? '–' : (data?.aggregate.pageviews ?? 0)}
					</p>
				</div>
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('bounceRate')}</h3>
					<p className="mt-2 text-3xl font-bold">
						{isLoading ? '–' : `${data?.aggregate.bounceRate ?? 0}%`}
					</p>
				</div>
				<div className="rounded-lg border bg-card p-6">
					<h3 className="text-sm font-medium text-muted-foreground">{t('avgDuration')}</h3>
					<p className="mt-2 text-3xl font-bold">
						{isLoading ? '–' : formatDuration(data?.aggregate.visitDuration ?? 0)}
					</p>
				</div>
			</div>
		</div>
	)
}
