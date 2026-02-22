'use client'

import { Loader2, RefreshCw, Store } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api/client'

interface PatissierData {
	id: string
	businessName: string
	slug: string
	plan: string
	ordersCount: number
	stripeAccountId: string | null
	stripeStatus: string | null
	createdAt: string
}

export default function PatissiersPage() {
	const [patissiers, setPatissiers] = useState<PatissierData[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)

	const fetchPatissiers = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const data = await api.get<{ data: PatissierData[]; meta: { lastPage: number } }>(
				`/superadmin/patissiers?page=${page}`
			)
			setPatissiers(data.data || [])
			setTotalPages(data.meta?.lastPage || 1)
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message)
			} else {
				setError('Erreur de chargement des patissiers')
			}
		} finally {
			setIsLoading(false)
		}
	}, [page])

	useEffect(() => {
		fetchPatissiers()
	}, [fetchPatissiers])

	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold text-foreground">Patissiers</h2>
					<p className="text-muted-foreground">Liste des patissiers de la plateforme</p>
				</div>
				<button
					onClick={fetchPatissiers}
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
				) : patissiers.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
						<Store className="w-12 h-12 mb-4" />
						<p>Aucun patissier trouve</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border bg-secondary/50">
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Nom</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Slug</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Plan</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Commandes</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Stripe</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
								</tr>
							</thead>
							<tbody>
								{patissiers.map((patissier) => (
									<tr key={patissier.id} className="border-b border-border hover:bg-secondary/30">
										<td className="px-6 py-4 text-sm font-medium text-foreground">
											{patissier.businessName}
										</td>
										<td className="px-6 py-4 text-sm text-muted-foreground">
											{patissier.slug}
										</td>
										<td className="px-6 py-4">
											<span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
												{patissier.plan}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-foreground">
											{patissier.ordersCount}
										</td>
										<td className="px-6 py-4">
											{patissier.stripeAccountId ? (
												<span className={`px-2 py-1 text-xs rounded-full ${
													patissier.stripeStatus === 'active'
														? 'bg-green-500/10 text-green-600'
														: 'bg-yellow-500/10 text-yellow-600'
												}`}>
													{patissier.stripeStatus || 'connecte'}
												</span>
											) : (
												<span className="px-2 py-1 text-xs rounded-full bg-secondary text-muted-foreground">
													Non connecte
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-sm text-muted-foreground">
											{new Date(patissier.createdAt).toLocaleDateString('fr-FR')}
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
