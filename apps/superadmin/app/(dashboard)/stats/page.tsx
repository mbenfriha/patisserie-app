'use client'

import { BarChart3, Loader2, RefreshCw, TrendingUp, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api/client'

interface RevenueStats {
	totalRevenue: number
	monthlyRevenue: { month: string; revenue: number }[]
}

interface UserGrowthStats {
	totalUsers: number
	monthlyGrowth: { month: string; users: number }[]
}

export default function StatsPage() {
	const [revenue, setRevenue] = useState<RevenueStats | null>(null)
	const [userGrowth, setUserGrowth] = useState<UserGrowthStats | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	const fetchStats = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const [revenueData, growthData] = await Promise.all([
				api.get<RevenueStats>('/superadmin/stats/revenue'),
				api.get<UserGrowthStats>('/superadmin/stats/user-growth'),
			])
			setRevenue(revenueData)
			setUserGrowth(growthData)
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
					<h2 className="text-2xl font-bold text-foreground">Statistiques</h2>
					<p className="text-muted-foreground">Revenus et croissance utilisateurs</p>
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

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Revenue Stats */}
				<div className="bg-card border border-border rounded-xl p-6">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
							<TrendingUp className="w-5 h-5 text-emerald-500" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-foreground">Revenus</h3>
							{revenue && (
								<p className="text-sm text-muted-foreground">
									Total: {revenue.totalRevenue.toFixed(2)} EUR
								</p>
							)}
						</div>
					</div>

					{revenue?.monthlyRevenue && revenue.monthlyRevenue.length > 0 ? (
						<div className="space-y-3">
							{revenue.monthlyRevenue.map((item) => (
								<div key={item.month} className="flex items-center justify-between py-2 border-b border-border last:border-0">
									<span className="text-sm text-foreground">{item.month}</span>
									<span className="text-sm font-medium text-foreground">
										{item.revenue.toFixed(2)} EUR
									</span>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">Aucune donnee disponible</p>
					)}
				</div>

				{/* User Growth Stats */}
				<div className="bg-card border border-border rounded-xl p-6">
					<div className="flex items-center gap-3 mb-6">
						<div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
							<Users className="w-5 h-5 text-blue-500" />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-foreground">Croissance utilisateurs</h3>
							{userGrowth && (
								<p className="text-sm text-muted-foreground">
									Total: {userGrowth.totalUsers} utilisateurs
								</p>
							)}
						</div>
					</div>

					{userGrowth?.monthlyGrowth && userGrowth.monthlyGrowth.length > 0 ? (
						<div className="space-y-3">
							{userGrowth.monthlyGrowth.map((item) => (
								<div key={item.month} className="flex items-center justify-between py-2 border-b border-border last:border-0">
									<span className="text-sm text-foreground">{item.month}</span>
									<span className="text-sm font-medium text-foreground">
										+{item.users} utilisateurs
									</span>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">Aucune donnee disponible</p>
					)}
				</div>
			</div>
		</>
	)
}
