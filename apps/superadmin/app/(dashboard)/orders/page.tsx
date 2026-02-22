'use client'

import { Loader2, RefreshCw, ShoppingBag } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api/client'

interface OrderData {
	id: string
	orderNumber: string
	patissierName: string
	clientName: string
	type: string
	status: string
	total: number
	createdAt: string
}

export default function OrdersPage() {
	const [orders, setOrders] = useState<OrderData[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)

	const fetchOrders = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const data = await api.get<{ data: OrderData[]; meta: { lastPage: number } }>(
				`/superadmin/orders?page=${page}`
			)
			setOrders(data.data || [])
			setTotalPages(data.meta?.lastPage || 1)
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message)
			} else {
				setError('Erreur de chargement des commandes')
			}
		} finally {
			setIsLoading(false)
		}
	}, [page])

	useEffect(() => {
		fetchOrders()
	}, [fetchOrders])

	const statusColor = (status: string) => {
		switch (status) {
			case 'completed':
				return 'bg-green-500/10 text-green-600'
			case 'pending':
				return 'bg-yellow-500/10 text-yellow-600'
			case 'cancelled':
				return 'bg-destructive/10 text-destructive'
			case 'in_progress':
				return 'bg-blue-500/10 text-blue-600'
			default:
				return 'bg-secondary text-muted-foreground'
		}
	}

	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold text-foreground">Commandes</h2>
					<p className="text-muted-foreground">Toutes les commandes de la plateforme</p>
				</div>
				<button
					onClick={fetchOrders}
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
				) : orders.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
						<ShoppingBag className="w-12 h-12 mb-4" />
						<p>Aucune commande trouvee</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border bg-secondary/50">
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">N. commande</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Patissier</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Client</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Type</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Total</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
								</tr>
							</thead>
							<tbody>
								{orders.map((order) => (
									<tr key={order.id} className="border-b border-border hover:bg-secondary/30">
										<td className="px-6 py-4 text-sm font-medium text-foreground">
											{order.orderNumber}
										</td>
										<td className="px-6 py-4 text-sm text-foreground">
											{order.patissierName}
										</td>
										<td className="px-6 py-4 text-sm text-foreground">
											{order.clientName}
										</td>
										<td className="px-6 py-4">
											<span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
												{order.type}
											</span>
										</td>
										<td className="px-6 py-4">
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor(order.status)}`}>
												{order.status}
											</span>
										</td>
										<td className="px-6 py-4 text-sm font-medium text-foreground">
											{order.total.toFixed(2)} EUR
										</td>
										<td className="px-6 py-4 text-sm text-muted-foreground">
											{new Date(order.createdAt).toLocaleDateString('fr-FR')}
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
