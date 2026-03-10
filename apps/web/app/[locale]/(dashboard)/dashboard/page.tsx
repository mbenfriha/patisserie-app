'use client'

import {
	AlertCircle,
	ArrowDownRight,
	ArrowUpRight,
	CalendarCheck,
	CheckCircle,
	Clock,
	Euro,
	ShoppingBag,
	TrendingUp,
	Users,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { AnalyticsStats } from '@/components/dashboard/analytics-stats'
import { CalendarUpgradeBanner, DashboardCalendar } from '@/components/dashboard/calendar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import { api } from '@/lib/api/client'
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'
import { useAuth } from '@/lib/providers/auth-provider'

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

interface RecentOrder {
	id: string
	orderNumber: string
	clientName: string
	type: 'catalogue' | 'custom'
	status: string
	total: number | null
	createdAt: string
}

interface UpcomingWorkshop {
	id: string
	title: string
	date: string
	startTime: string
	capacity: number
	status: string
	durationMinutes: number
	bookingsCount?: number
}

const statusLabels: Record<string, string> = {
	pending: 'En attente',
	confirmed: 'Confirmée',
	in_progress: 'En cours',
	ready: 'Prête',
	delivered: 'Livrée',
	picked_up: 'Récupérée',
	cancelled: 'Annulée',
}

const chartConfig = {
	revenue: {
		label: 'Revenus',
		color: 'var(--chart-1)',
	},
	orders: {
		label: 'Commandes',
		color: 'var(--chart-2)',
	},
}

// Placeholder data for charts – will be replaced with API data when available
const revenueData = [
	{ month: 'Jan', revenue: 4200, orders: 32 },
	{ month: 'Fév', revenue: 5100, orders: 41 },
	{ month: 'Mar', revenue: 4800, orders: 38 },
	{ month: 'Avr', revenue: 6200, orders: 52 },
	{ month: 'Mai', revenue: 7100, orders: 58 },
	{ month: 'Jun', revenue: 6800, orders: 55 },
	{ month: 'Jul', revenue: 8450, orders: 68 },
]

const weeklyOrders = [
	{ day: 'Lun', orders: 12 },
	{ day: 'Mar', orders: 8 },
	{ day: 'Mer', orders: 15 },
	{ day: 'Jeu', orders: 10 },
	{ day: 'Ven', orders: 18 },
	{ day: 'Sam', orders: 22 },
	{ day: 'Dim', orders: 14 },
]

function StatCard({
	title,
	value,
	description,
	icon: Icon,
	trend,
	trendValue,
	isLoading,
}: {
	title: string
	value: string
	description: string
	icon: React.ElementType
	trend?: 'up' | 'down'
	trendValue?: string
	isLoading?: boolean
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
				<Icon className="size-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-8 w-24" />
				) : (
					<div className="text-2xl font-bold">{value}</div>
				)}
				<div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
					{trend && (
						<span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
							{trend === 'up' ? (
								<ArrowUpRight className="inline size-3" />
							) : (
								<ArrowDownRight className="inline size-3" />
							)}
							{trendValue}
						</span>
					)}
					<span>{description}</span>
				</div>
			</CardContent>
		</Card>
	)
}

function RecentOrdersCard({
	orders,
	isLoading,
	dashboardPrefix,
}: {
	orders: RecentOrder[]
	isLoading: boolean
	dashboardPrefix: string
}) {
	return (
		<Card className="col-span-full lg:col-span-2">
			<CardHeader>
				<CardTitle>Commandes récentes</CardTitle>
				<CardDescription>Dernières commandes nécessitant votre attention</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="flex items-center gap-4">
								<Skeleton className="size-10 rounded-full" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-20" />
								</div>
								<Skeleton className="h-4 w-16" />
							</div>
						))}
					</div>
				) : orders.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						Aucune commande pour le moment
					</p>
				) : (
					<div className="space-y-4">
						{orders.map((order) => (
							<Link
								key={order.id}
								href={`${dashboardPrefix}/orders/${order.id}`}
								className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted/50"
							>
								<div
									className={`flex size-10 items-center justify-center rounded-full ${
										order.status === 'pending'
											? 'bg-amber-100 text-amber-600'
											: order.status === 'in_progress'
												? 'bg-blue-100 text-blue-600'
												: order.status === 'confirmed'
													? 'bg-green-100 text-green-600'
													: 'bg-muted text-muted-foreground'
									}`}
								>
									{order.status === 'pending' ? (
										<AlertCircle className="size-5" />
									) : order.status === 'in_progress' ? (
										<Clock className="size-5" />
									) : (
										<CheckCircle className="size-5" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{order.clientName}</p>
									<p className="text-xs text-muted-foreground">{order.orderNumber}</p>
								</div>
								<div className="text-right">
									<p className="text-sm font-medium">
										{order.total != null ? `${Number(order.total).toFixed(2)} €` : '-'}
									</p>
									<Badge
										variant={order.status === 'pending' ? 'secondary' : 'outline'}
										className="text-xs"
									>
										{statusLabels[order.status] || order.status}
									</Badge>
								</div>
							</Link>
						))}
					</div>
				)}
				<Button variant="outline" className="mt-4 w-full" asChild>
					<Link href={`${dashboardPrefix}/orders`}>Voir toutes les commandes</Link>
				</Button>
			</CardContent>
		</Card>
	)
}

function UpcomingWorkshopsCard({
	workshops,
	isLoading,
	dashboardPrefix,
}: {
	workshops: UpcomingWorkshop[]
	isLoading: boolean
	dashboardPrefix: string
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Prochains ateliers</CardTitle>
				<CardDescription>Vos ateliers planifiés</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex items-start gap-3">
								<Skeleton className="size-10 rounded-lg" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-36" />
									<Skeleton className="h-3 w-24" />
									<Skeleton className="h-1.5 w-full rounded-full" />
								</div>
							</div>
						))}
					</div>
				) : workshops.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">Aucun atelier planifié</p>
				) : (
					<div className="space-y-4">
						{workshops.map((workshop) => {
							const bookings = workshop.bookingsCount ?? 0
							const fillPercent = Math.min((bookings / workshop.capacity) * 100, 100)

							return (
								<div key={workshop.id} className="flex items-start gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<Users className="size-5" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">{workshop.title}</p>
										<p className="text-xs text-muted-foreground">
											{new Date(workshop.date).toLocaleDateString('fr-FR', {
												day: 'numeric',
												month: 'short',
												year: 'numeric',
											})}{' '}
											à {workshop.startTime?.substring(0, 5)}
										</p>
										<div className="mt-1 flex items-center gap-2">
											<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full bg-primary transition-all"
													style={{ width: `${fillPercent}%` }}
												/>
											</div>
											<span className="text-xs text-muted-foreground">
												{bookings}/{workshop.capacity}
											</span>
										</div>
									</div>
								</div>
							)
						})}
					</div>
				)}
				<Button variant="outline" className="mt-4 w-full" asChild>
					<Link href={`${dashboardPrefix}/workshops`}>Voir tous les ateliers</Link>
				</Button>
			</CardContent>
		</Card>
	)
}

export default function DashboardPage() {
	const t = useTranslations('dashboard')
	const { user } = useAuth()
	const dashboardPrefix = useDashboardPrefix()
	const [stats, setStats] = useState<Stats | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
	const [ordersLoading, setOrdersLoading] = useState(true)
	const [upcomingWorkshops, setUpcomingWorkshops] = useState<UpcomingWorkshop[]>([])
	const [workshopsLoading, setWorkshopsLoading] = useState(true)

	const isPro = user?.profile?.plan === 'pro' || user?.profile?.plan === 'premium'

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

	useEffect(() => {
		if (!isPro) {
			setOrdersLoading(false)
			setWorkshopsLoading(false)
			return
		}

		api
			.get('/patissier/orders', { limit: '5' })
			.then((res) => {
				const data = res.data?.data?.data ?? res.data?.data ?? []
				setRecentOrders(Array.isArray(data) ? data : [])
			})
			.catch(() => {})
			.finally(() => setOrdersLoading(false))

		api
			.get('/patissier/workshops', { limit: '3', status: 'published' })
			.then((res) => {
				const data = res.data?.data?.data ?? res.data?.data ?? []
				setUpcomingWorkshops(Array.isArray(data) ? data : [])
			})
			.catch(() => {})
			.finally(() => setWorkshopsLoading(false))
	}, [isPro])

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					{t('welcome')}, {user?.fullName || user?.email}
				</h1>
				<p className="text-muted-foreground">{t('overview')}</p>
			</div>

			{/* Stat cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title={t('totalOrders')}
					value={String(stats?.orders?.total ?? 0)}
					description={`${stats?.orders?.confirmed ?? 0} confirmées`}
					icon={ShoppingBag}
					isLoading={isLoading}
				/>
				<StatCard
					title={t('totalRevenue')}
					value={`${Number(stats?.revenue?.total ?? 0).toFixed(2)} €`}
					description="Chiffre d'affaires"
					icon={Euro}
					isLoading={isLoading}
				/>
				<StatCard
					title={t('activeWorkshops')}
					value={String(stats?.workshops?.published ?? 0)}
					description={`${stats?.workshops?.total ?? 0} ateliers au total`}
					icon={Users}
					isLoading={isLoading}
				/>
				<StatCard
					title={t('pendingOrders')}
					value={String(stats?.bookings?.confirmed ?? 0)}
					description={`${stats?.bookings?.total ?? 0} réservations au total`}
					icon={CalendarCheck}
					isLoading={isLoading}
				/>
			</div>

			{/* Analytics */}
			<AnalyticsStats />

			{/* Calendar */}
			{isPro ? <DashboardCalendar /> : <CalendarUpgradeBanner />}

			{/* Charts */}
			<div className="grid gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="size-5" />
							Aperçu des revenus
						</CardTitle>
						<CardDescription>Revenus mensuels de l'année en cours</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px] w-full">
							<AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
								<defs>
									<linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
										<stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis dataKey="month" className="text-xs" />
								<YAxis className="text-xs" tickFormatter={(value: number) => `€${value / 1000}k`} />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Area
									type="monotone"
									dataKey="revenue"
									stroke="var(--chart-1)"
									strokeWidth={2}
									fill="url(#fillRevenue)"
								/>
							</AreaChart>
						</ChartContainer>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Commandes par jour</CardTitle>
						<CardDescription>Répartition hebdomadaire</CardDescription>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px] w-full">
							<BarChart data={weeklyOrders} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
								<XAxis dataKey="day" className="text-xs" />
								<YAxis className="text-xs" />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar dataKey="orders" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			{/* Recent orders + Upcoming workshops */}
			{isPro && (
				<div className="grid gap-4 lg:grid-cols-3">
					<RecentOrdersCard
						orders={recentOrders}
						isLoading={ordersLoading}
						dashboardPrefix={dashboardPrefix}
					/>
					<UpcomingWorkshopsCard
						workshops={upcomingWorkshops}
						isLoading={workshopsLoading}
						dashboardPrefix={dashboardPrefix}
					/>
				</div>
			)}
		</div>
	)
}
