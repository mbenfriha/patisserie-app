'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { PlanGate } from '@/components/auth/plan-gate'

interface Order {
	id: string
	orderNumber: string
	clientName: string
	type: 'catalogue' | 'custom'
	status: string
	total: number | null
	createdAt: string
}

const statusColors: Record<string, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-blue-100 text-blue-800',
	in_progress: 'bg-purple-100 text-purple-800',
	ready: 'bg-green-100 text-green-800',
	delivered: 'bg-gray-100 text-gray-800',
	picked_up: 'bg-gray-100 text-gray-800',
	cancelled: 'bg-red-100 text-red-800',
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

const typeLabels: Record<string, string> = {
	catalogue: 'Catalogue',
	custom: 'Sur-mesure',
}

export default function OrdersPage() {
	const [orders, setOrders] = useState<Order[]>([])
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		api
			.get('/patissier/orders')
			.then((res) => {
				const payload = res.data?.data
				// Handle paginated response: { data: { meta, data: [...] } }
				const list = Array.isArray(payload) ? payload : payload?.data ?? []
				setOrders(list)
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	return (
		<PlanGate minPlan="pro">
		<div className="space-y-6">
			<h1 className="text-3xl font-bold">Commandes</h1>

			{isLoading ? (
				<p className="text-muted-foreground">Chargement...</p>
			) : orders.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">Aucune commande pour le moment.</p>
				</div>
			) : (
				<>
				{/* Mobile: card list */}
				<div className="space-y-3 sm:hidden">
					{orders.map((order) => (
						<Link
							key={order.id}
							href={`/orders/${order.id}`}
							className="block rounded-lg border p-4 transition-colors hover:bg-muted/30"
						>
							<div className="flex items-center justify-between">
								<span className="font-mono text-sm font-medium text-primary">{order.orderNumber}</span>
								<span
									className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}
								>
									{statusLabels[order.status] || order.status}
								</span>
							</div>
							<div className="mt-2 flex items-center justify-between text-sm">
								<span className="text-foreground">{order.clientName}</span>
								<span className="font-medium">{order.total != null ? `${order.total} €` : '-'}</span>
							</div>
							<div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
								<span>{typeLabels[order.type] || order.type}</span>
								<span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
							</div>
						</Link>
					))}
				</div>

				{/* Desktop: table */}
				<div className="hidden rounded-lg border sm:block">
					<table className="w-full">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left text-sm font-medium">N°</th>
								<th className="px-4 py-3 text-left text-sm font-medium">Client</th>
								<th className="px-4 py-3 text-left text-sm font-medium">Type</th>
								<th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
								<th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Date</th>
								<th className="px-4 py-3 text-right text-sm font-medium">Total</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((order) => (
								<tr key={order.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
									<td className="px-4 py-3 text-sm">
										<Link href={`/orders/${order.id}`} className="font-mono text-primary hover:underline">
											{order.orderNumber}
										</Link>
									</td>
									<td className="px-4 py-3 text-sm">{order.clientName}</td>
									<td className="px-4 py-3 text-sm">{typeLabels[order.type] || order.type}</td>
									<td className="px-4 py-3">
										<span
											className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}
										>
											{statusLabels[order.status] || order.status}
										</span>
									</td>
									<td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
										{new Date(order.createdAt).toLocaleDateString('fr-FR')}
									</td>
									<td className="px-4 py-3 text-right text-sm">
										{order.total != null ? `${order.total} €` : '-'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				</>
			)}
		</div>
		</PlanGate>
	)
}
