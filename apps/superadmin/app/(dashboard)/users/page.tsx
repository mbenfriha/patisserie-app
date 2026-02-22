'use client'

import { Loader2, RefreshCw, Search, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '@/lib/api/client'

interface UserData {
	id: string
	email: string
	fullName: string | null
	role: string
	emailVerifiedAt: string | null
	suspendedAt: string | null
	createdAt: string
}

export default function UsersPage() {
	const [users, setUsers] = useState<UserData[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

	const fetchUsers = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const params = new URLSearchParams({ page: page.toString() })
			if (search) params.append('search', search)

			const data = await api.get<{ data: UserData[]; meta: { lastPage: number } }>(
				`/superadmin/users?${params.toString()}`
			)
			setUsers(data.data || [])
			setTotalPages(data.meta?.lastPage || 1)
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message)
			} else {
				setError('Erreur de chargement des utilisateurs')
			}
		} finally {
			setIsLoading(false)
		}
	}, [page, search])

	useEffect(() => {
		fetchUsers()
	}, [fetchUsers])

	const handleSuspend = async (userId: string, isSuspended: boolean) => {
		setActionLoadingId(userId)
		try {
			if (isSuspended) {
				await api.post(`/superadmin/users/${userId}/unsuspend`)
			} else {
				await api.post(`/superadmin/users/${userId}/suspend`, {
					reason: "Suspendu par l'administrateur",
				})
			}
			fetchUsers()
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message)
			}
		} finally {
			setActionLoadingId(null)
		}
	}

	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-2xl font-bold text-foreground">Utilisateurs</h2>
					<p className="text-muted-foreground">Gestion des utilisateurs de la plateforme</p>
				</div>
				<button
					onClick={fetchUsers}
					className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
				>
					<RefreshCw className="w-4 h-4" />
					Actualiser
				</button>
			</div>

			{/* Search */}
			<div className="relative mb-6 max-w-md">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<input
					placeholder="Rechercher par email, nom..."
					value={search}
					onChange={(e) => {
						setSearch(e.target.value)
						setPage(1)
					}}
					className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
				/>
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
				) : users.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
						<Users className="w-12 h-12 mb-4" />
						<p>Aucun utilisateur trouve</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-border bg-secondary/50">
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Nom</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email verifie</th>
									<th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
									<th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
								</tr>
							</thead>
							<tbody>
								{users.map((user) => {
									const isSuspended = !!user.suspendedAt
									return (
										<tr
											key={user.id}
											className={`border-b border-border hover:bg-secondary/30 ${isSuspended ? 'bg-destructive/5' : ''}`}
										>
											<td className="px-6 py-4 text-sm text-foreground">{user.email}</td>
											<td className="px-6 py-4 text-sm text-foreground">{user.fullName || '-'}</td>
											<td className="px-6 py-4">
												<span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
													{user.role}
												</span>
											</td>
											<td className="px-6 py-4">
												{user.emailVerifiedAt ? (
													<span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-600">Oui</span>
												) : (
													<span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-600">Non</span>
												)}
											</td>
											<td className="px-6 py-4 text-sm text-muted-foreground">
												{new Date(user.createdAt).toLocaleDateString('fr-FR')}
											</td>
											<td className="px-6 py-4 text-right">
												<button
													onClick={() => handleSuspend(user.id, isSuspended)}
													disabled={actionLoadingId === user.id}
													className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
														isSuspended
															? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
															: 'bg-destructive/10 text-destructive hover:bg-destructive/20'
													} disabled:opacity-50`}
												>
													{actionLoadingId === user.id ? (
														<Loader2 className="w-3 h-3 animate-spin inline" />
													) : isSuspended ? (
														'Reactiver'
													) : (
														'Suspendre'
													)}
												</button>
											</td>
										</tr>
									)
								})}
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
