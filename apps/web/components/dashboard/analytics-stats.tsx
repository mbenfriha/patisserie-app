'use client'

import { Activity, Clock, Eye, MousePointerClick } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
						{data.realtime} {t('realtimeVisitors')}
					</span>
				)}
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{t('visitors30d')}
						</CardTitle>
						<Eye className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							<div className="text-2xl font-bold">{data?.aggregate.visitors ?? 0}</div>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{t('pageviews30d')}
						</CardTitle>
						<MousePointerClick className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							<div className="text-2xl font-bold">{data?.aggregate.pageviews ?? 0}</div>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{t('bounceRate')}
						</CardTitle>
						<Activity className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							<div className="text-2xl font-bold">{data?.aggregate.bounceRate ?? 0}%</div>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							{t('avgDuration')}
						</CardTitle>
						<Clock className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							<div className="text-2xl font-bold">
								{formatDuration(data?.aggregate.visitDuration ?? 0)}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
