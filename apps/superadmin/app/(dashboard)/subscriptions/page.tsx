'use client'

import { CreditCard, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api/client'

interface SubscriptionData {
	id: string
	userEmail: string
	plan: string
	interval: string
	status: string
	currentPeriodEnd: string
}

export default function SubscriptionsPage() {
	const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)

	const fetchSubscriptions = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const data = await api.get<{ data: SubscriptionData[]; meta: { lastPage: number } }>(
				`/superadmin/subscriptions?page=${page}`
			)
			setSubscriptions(data.data || [])
			setTotalPages(data.meta?.lastPage || 1)
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message)
			} else {
				setError('Erreur de chargement des abonnements')
			}
		} finally {
			setIsLoading(false)
		}
	}, [page])

	useEffect(() => {
		fetchSubscriptions()
	}, [fetchSubscriptions])

	const statusColor = (status: string) => {
		switch (status) {
			case 'active':
				return 'bg-green-500/10 text-green-600'
			case 'trialing':
				return 'bg-blue-500/10 text-blue-600'
			case 'past_due':
				return 'bg-yellow-500/10 text-yellow-600'
			case 'cancelled':
			case 'canceled':
				return 'bg-destructive/10 text-destructive'
			default:
				return 'bg-secondary text-muted-foreground'
		}
	}

	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold text-foreground">Abonnements</h2>
					<p className="text-muted-foreground">Tous les abonnements de la plateforme</p>
				</div>
				<button
					onClick={fetchSubscriptions}
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

			<div className="bg-card border border-border rounded-xl overflow-hidden">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-primary" />
					</div>
				) : subscriptions.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
						<CreditCard className="w-12 h-12 mb-4" />
						<p>Aucun abonnement trouve</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border bg-secondary/50">
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Plan</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Intervalle</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Fin de periode</th>
								</tr>
							</thead>
							<tbody>
								{subscriptions.map((sub) => (
									<tr key={sub.id} className="border-b border-border hover:bg-secondary/30">
										<td className="px-6 py-4 text-sm text-foreground">
											{sub.userEmail}
										</td>
										<td className="px-6 py-4">
											<span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
												{sub.plan}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-foreground">
											{sub.interval === 'month' ? 'Mensuel' : sub.interval === 'year' ? 'Annuel' : sub.interval}
										</td>
										<td className="px-6 py-4">
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor(sub.status)}`}>
												{sub.status}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-muted-foreground">
											{new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR')}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				{totalPages > 1 && (
					<div className="flex items-center justify-center gap-2 p-4 border-t border-border">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 transition-colors"
						>
							Precedent
						</button>
						<span className="text-sm text-muted-foreground">
							Page {page} / {totalPages}
						</span>
						<button
							onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
							disabled={page === totalPages}
							className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary disabled:opacity-50 transition-colors"
						>
							Suivant
						</button>
					</div>
				)}
			</div>
		</>
	)
}
