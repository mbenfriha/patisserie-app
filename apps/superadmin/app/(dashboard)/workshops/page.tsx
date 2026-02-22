'use client'

import { CalendarDays, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api/client'

interface WorkshopData {
	id: string
	title: string
	patissierName: string
	date: string
	capacity: number
	bookingsCount: number
	status: string
}

export default function WorkshopsPage() {
	const [workshops, setWorkshops] = useState<WorkshopData[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)

	const fetchWorkshops = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const data = await api.get<{ data: WorkshopData[]; meta: { lastPage: number } }>(
				`/superadmin/workshops?page=${page}`
			)
			setWorkshops(data.data || [])
			setTotalPages(data.meta?.lastPage || 1)
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message)
			} else {
				setError('Erreur de chargement des ateliers')
			}
		} finally {
			setIsLoading(false)
		}
	}, [page])

	useEffect(() => {
		fetchWorkshops()
	}, [fetchWorkshops])

	const statusColor = (status: string) => {
		switch (status) {
			case 'published':
				return 'bg-green-500/10 text-green-600'
			case 'draft':
				return 'bg-yellow-500/10 text-yellow-600'
			case 'cancelled':
				return 'bg-destructive/10 text-destructive'
			case 'completed':
				return 'bg-blue-500/10 text-blue-600'
			default:
				return 'bg-secondary text-muted-foreground'
		}
	}

	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold text-foreground">Ateliers</h2>
					<p className="text-muted-foreground">Tous les ateliers de la plateforme</p>
				</div>
				<button
					onClick={fetchWorkshops}
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
				) : workshops.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
						<CalendarDays className="w-12 h-12 mb-4" />
						<p>Aucun atelier trouve</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border bg-secondary/50">
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Titre</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Patissier</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Capacite</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Reservations</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Statut</th>
								</tr>
							</thead>
							<tbody>
								{workshops.map((workshop) => (
									<tr key={workshop.id} className="border-b border-border hover:bg-secondary/30">
										<td className="px-6 py-4 text-sm font-medium text-foreground">
											{workshop.title}
										</td>
										<td className="px-6 py-4 text-sm text-foreground">
											{workshop.patissierName}
										</td>
										<td className="px-6 py-4 text-sm text-foreground">
											{new Date(workshop.date).toLocaleDateString('fr-FR', {
												day: 'numeric',
												month: 'short',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</td>
										<td className="px-6 py-4 text-sm text-foreground">
											{workshop.capacity}
										</td>
										<td className="px-6 py-4 text-sm text-foreground">
											<span className={`font-medium ${
												workshop.bookingsCount >= workshop.capacity
													? 'text-destructive'
													: 'text-foreground'
											}`}>
												{workshop.bookingsCount}
											</span>
											<span className="text-muted-foreground"> / {workshop.capacity}</span>
										</td>
										<td className="px-6 py-4">
											<span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor(workshop.status)}`}>
												{workshop.status}
											</span>
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
