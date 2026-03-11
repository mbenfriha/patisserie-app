'use client'

import { FileText, Loader2, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '@/lib/api/client'

interface AuditLogEntry {
	id: string
	userId: string | null
	action: string
	resourceType: string | null
	resourceId: string | null
	metadata: Record<string, unknown>
	ipAddress: string | null
	userAgent: string | null
	createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
	created: 'bg-green-500/10 text-green-600',
	updated: 'bg-blue-500/10 text-blue-600',
	deleted: 'bg-red-500/10 text-red-600',
	login: 'bg-purple-500/10 text-purple-600',
	suspended: 'bg-orange-500/10 text-orange-600',
	unsuspended: 'bg-teal-500/10 text-teal-600',
}

function getActionColor(action: string): string {
	for (const [key, color] of Object.entries(ACTION_COLORS)) {
		if (action.includes(key)) return color
	}
	return 'bg-secondary text-muted-foreground'
}

export default function AuditLogsPage() {
	const [logs, setLogs] = useState<AuditLogEntry[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [actionFilter, setActionFilter] = useState('')
	const [resourceTypeFilter, setResourceTypeFilter] = useState('')
	const [dateFrom, setDateFrom] = useState('')
	const [dateTo, setDateTo] = useState('')

	const fetchLogs = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const params = new URLSearchParams({ page: page.toString(), limit: '30' })
			if (actionFilter) params.append('action', actionFilter)
			if (resourceTypeFilter) params.append('resourceType', resourceTypeFilter)
			if (dateFrom) params.append('from', dateFrom)
			if (dateTo) params.append('to', dateTo)

			const res = await api.get<{
				success: boolean
				data: { data: AuditLogEntry[]; meta: { lastPage: number } }
			}>(`/superadmin/audit-logs?${params.toString()}`)
			setLogs(res.data?.data || [])
			setTotalPages(res.data?.meta?.lastPage || 1)
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message)
			} else {
				setError('Erreur de chargement des logs')
			}
		} finally {
			setIsLoading(false)
		}
	}, [page, actionFilter, resourceTypeFilter, dateFrom, dateTo])

	useEffect(() => {
		fetchLogs()
	}, [fetchLogs])

	const resetFilters = () => {
		setActionFilter('')
		setResourceTypeFilter('')
		setDateFrom('')
		setDateTo('')
		setPage(1)
	}

	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold text-foreground">Audit Logs</h2>
					<p className="text-muted-foreground">Historique des actions sur la plateforme</p>
				</div>
				<button
					type="button"
					onClick={fetchLogs}
					className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
				>
					<RefreshCw className="w-4 h-4" />
					Actualiser
				</button>
			</div>

			{/* Filters */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<input
						placeholder="Filtrer par action..."
						value={actionFilter}
						onChange={(e) => {
							setActionFilter(e.target.value)
							setPage(1)
						}}
						className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
					/>
				</div>
				<select
					value={resourceTypeFilter}
					onChange={(e) => {
						setResourceTypeFilter(e.target.value)
						setPage(1)
					}}
					className="px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
				>
					<option value="">Toutes les ressources</option>
					<option value="category">Categories</option>
					<option value="creation">Creations</option>
					<option value="product">Produits</option>
					<option value="order">Commandes</option>
					<option value="workshop">Ateliers</option>
					<option value="patissier_profile">Profils</option>
					<option value="user">Utilisateurs</option>
				</select>
				<input
					type="date"
					value={dateFrom}
					onChange={(e) => {
						setDateFrom(e.target.value)
						setPage(1)
					}}
					placeholder="Du"
					className="px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
				/>
				<div className="flex gap-2">
					<input
						type="date"
						value={dateTo}
						onChange={(e) => {
							setDateTo(e.target.value)
							setPage(1)
						}}
						placeholder="Au"
						className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
					/>
					{(actionFilter || resourceTypeFilter || dateFrom || dateTo) && (
						<button
							type="button"
							onClick={resetFilters}
							className="px-3 py-2.5 text-sm border border-border rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
						>
							Reset
						</button>
					)}
				</div>
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
				) : logs.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
						<FileText className="w-12 h-12 mb-4" />
						<p>Aucun log trouve</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border bg-secondary/50">
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Date
									</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Action
									</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Ressource
									</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										User ID
									</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										IP
									</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">
										Details
									</th>
								</tr>
							</thead>
							<tbody>
								{logs.map((log) => (
									<tr key={log.id} className="border-b border-border hover:bg-secondary/30">
										<td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
											{new Date(log.createdAt).toLocaleString('fr-FR', {
												day: '2-digit',
												month: '2-digit',
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</td>
										<td className="px-6 py-4">
											<span
												className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}
											>
												{log.action}
											</span>
										</td>
										<td className="px-6 py-4 text-sm text-foreground">
											{log.resourceType && (
												<span className="text-muted-foreground">
													{log.resourceType}
													{log.resourceId && (
														<span className="text-xs ml-1 opacity-60">
															#{log.resourceId.slice(0, 8)}
														</span>
													)}
												</span>
											)}
										</td>
										<td className="px-6 py-4 text-sm text-muted-foreground font-mono">
											{log.userId ? `${log.userId.slice(0, 8)}...` : '-'}
										</td>
										<td className="px-6 py-4 text-sm text-muted-foreground font-mono">
											{log.ipAddress || '-'}
										</td>
										<td className="px-6 py-4 text-sm text-muted-foreground">
											{Object.keys(log.metadata || {}).length > 0 ? (
												<details className="cursor-pointer">
													<summary className="text-xs text-primary hover:underline">Voir</summary>
													<pre className="mt-2 text-xs bg-secondary p-2 rounded max-w-xs overflow-auto">
														{JSON.stringify(log.metadata, null, 2)}
													</pre>
												</details>
											) : (
												'-'
											)}
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
							type="button"
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
							type="button"
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
