'use client'

import {
	CalendarDays,
	CreditCard,
	DollarSign,
	Loader2,
	RefreshCw,
	ShoppingBag,
	Store,
	Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api/client'

interface DashboardStats {
	totalUsers: number
	totalPatissiers: number
	totalOrders: number
	totalRevenue: number
	totalWorkshops: number
	activeSubscriptions: number
}

export default function DashboardPage() {
	const [stats, setStats] = useState<DashboardStats | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	const fetchStats = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const data = await api.get<{ stats: DashboardStats }>('/superadmin/stats/dashboard')
			setStats(data.stats)
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message)
			} else {
				setError('Erreur de chargement des statistiques')
			}
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchStats()
	}, [fetchStats])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		)
	}

	return (
		<>
			<div className="flex items-center justify-between mb-8">
				<div>
					<h2 className="text-2xl font-bold text-foreground">Tableau de bord</h2>
					<p className="text-muted-foreground">Vue d&apos;ensemble de la plateforme</p>
				</div>
				<button
					onClick={fetchStats}
					className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
				>
					<RefreshCw className="w-4 h-4" />
					Actualiser
				</button>
			</div>

			{error && (
				<div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg mb-6">
					{error}
				</div>
			)}

			{stats && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					<StatCard
						icon={Users}
						label="Utilisateurs"
						value={stats.totalUsers}
						color="bg-blue-500/10 text-blue-500"
					/>
					<StatCard
						icon={Store}
						label="Patissiers"
						value={stats.totalPatissiers}
						color="bg-amber-500/10 text-amber-500"
					/>
					<StatCard
						icon={ShoppingBag}
						label="Commandes"
						value={stats.totalOrders}
						color="bg-green-500/10 text-green-500"
					/>
					<StatCard
						icon={DollarSign}
						label="Revenus"
						value={`${stats.totalRevenue.toFixed(2)} EUR`}
						color="bg-emerald-500/10 text-emerald-500"
					/>
					<StatCard
						icon={CalendarDays}
						label="Ateliers"
						value={stats.totalWorkshops}
						color="bg-purple-500/10 text-purple-500"
					/>
					<StatCard
						icon={CreditCard}
						label="Abonnements actifs"
						value={stats.activeSubscriptions}
						color="bg-indigo-500/10 text-indigo-500"
					/>
				</div>
			)}
		</>
	)
}

function StatCard({
	icon: Icon,
	label,
	value,
	color,
}: {
	icon: React.ElementType
	label: string
	value: string | number
	color: string
}) {
	return (
		<div className="bg-card border border-border rounded-xl p-6">
			<div className="flex items-center gap-4">
				<div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
					<Icon className="w-6 h-6" />
				</div>
				<div>
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className="text-2xl font-bold text-foreground">{value}</p>
				</div>
			</div>
		</div>
	)
}
