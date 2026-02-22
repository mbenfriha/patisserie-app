'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api/client'

interface Product {
	id: string
	name: string
	price: number
	unit: string | null
	isAvailable: boolean
	isVisible: boolean
	categoryId: string | null
}

interface Category {
	id: string
	name: string
	slug: string
}

export default function ProductsPage() {
	const t = useTranslations('nav')
	const [products, setProducts] = useState<Product[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [showCategories, setShowCategories] = useState(false)

	useEffect(() => {
		api
			.get('/patissier/products')
			.then((res) => {
				const list = res.data?.data ?? res.data
				setProducts(Array.isArray(list) ? list : [])
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">{t('products')}</h1>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setShowCategories(true)}
						className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
					>
						Catégories
					</button>
					<button
						type="button"
						className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						+ Nouveau produit
					</button>
				</div>
			</div>

			{isLoading ? (
				<p className="text-muted-foreground">Chargement...</p>
			) : products.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">Aucun produit dans le catalogue</p>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{products.map((product) => (
						<div key={product.id} className="rounded-lg border bg-card p-4">
							<h3 className="font-medium">{product.name}</h3>
							<p className="mt-1 text-lg font-bold text-primary">
								{product.price} &euro;{product.unit ? ` / ${product.unit}` : ''}
							</p>
							<div className="mt-2 flex gap-2">
								{!product.isAvailable && (
									<span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
										Indisponible
									</span>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{showCategories && (
				<CategoriesDialog onClose={() => setShowCategories(false)} />
			)}
		</div>
	)
}

function CategoriesDialog({ onClose }: { onClose: () => void }) {
	const [categories, setCategories] = useState<Category[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [newName, setNewName] = useState('')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editingName, setEditingName] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const backdropRef = useRef<HTMLDivElement>(null)

	const fetchCategories = () => {
		api
			.get('/patissier/categories')
			.then((res) => {
				const list = res.data?.data ?? res.data
				setCategories(Array.isArray(list) ? list : [])
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}

	useEffect(() => {
		fetchCategories()
	}, [])

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newName.trim() || isSaving) return
		setIsSaving(true)
		try {
			await api.post('/patissier/categories', { name: newName.trim() })
			setNewName('')
			fetchCategories()
		} catch (err) {
			console.error(err)
		} finally {
			setIsSaving(false)
		}
	}

	const handleUpdate = async (id: string) => {
		if (!editingName.trim() || isSaving) return
		setIsSaving(true)
		try {
			await api.put(`/patissier/categories/${id}`, { name: editingName.trim() })
			setEditingId(null)
			setEditingName('')
			fetchCategories()
		} catch (err) {
			console.error(err)
		} finally {
			setIsSaving(false)
		}
	}

	const handleDelete = async (id: string) => {
		if (isSaving) return
		setIsSaving(true)
		try {
			await api.delete(`/patissier/categories/${id}`)
			fetchCategories()
		} catch (err) {
			console.error(err)
		} finally {
			setIsSaving(false)
		}
	}

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === backdropRef.current) onClose()
	}

	return (
		<div
			ref={backdropRef}
			onClick={handleBackdropClick}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		>
			<div className="mx-4 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Gérer les catégories</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1 text-muted-foreground hover:bg-accent"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Add new category */}
				<form onSubmit={handleCreate} className="mt-4 flex gap-2">
					<input
						type="text"
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="Nouvelle catégorie..."
						className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
					/>
					<button
						type="submit"
						disabled={isSaving || !newName.trim()}
						className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						Ajouter
					</button>
				</form>

				{/* Category list */}
				<div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
					{isLoading ? (
						<p className="text-sm text-muted-foreground">Chargement...</p>
					) : categories.length === 0 ? (
						<p className="py-4 text-center text-sm text-muted-foreground">Aucune catégorie</p>
					) : (
						categories.map((cat) => (
							<div key={cat.id} className="flex items-center justify-between rounded-md border px-3 py-2">
								{editingId === cat.id ? (
									<input
										type="text"
										value={editingName}
										onChange={(e) => setEditingName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') handleUpdate(cat.id)
											if (e.key === 'Escape') setEditingId(null)
										}}
										className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none"
										autoFocus
									/>
								) : (
									<span className="text-sm">{cat.name}</span>
								)}
								<div className="ml-2 flex gap-1">
									{editingId === cat.id ? (
										<>
											<button
												type="button"
												onClick={() => handleUpdate(cat.id)}
												className="rounded p-1 text-primary hover:bg-accent"
											>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
													<path d="M20 6L9 17l-5-5" />
												</svg>
											</button>
											<button
												type="button"
												onClick={() => setEditingId(null)}
												className="rounded p-1 text-muted-foreground hover:bg-accent"
											>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M18 6L6 18M6 6l12 12" />
												</svg>
											</button>
										</>
									) : (
										<>
											<button
												type="button"
												onClick={() => {
													setEditingId(cat.id)
													setEditingName(cat.name)
												}}
												className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
											>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
													<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
												</svg>
											</button>
											<button
												type="button"
												onClick={() => handleDelete(cat.id)}
												className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
											>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
												</svg>
											</button>
										</>
									)}
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	)
}
