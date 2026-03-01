'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api/client'
import { PlanGate } from '@/components/auth/plan-gate'
import { CategoryCombobox } from '@/components/ui/category-combobox'
import { ImageCropper } from '@/components/ui/image-cropper'
import { getImageUrl } from '@/lib/utils/image-url'

interface Product {
	id: string
	name: string
	description: string | null
	price: number
	unit: string | null
	minQuantity: number
	maxQuantity: number | null
	preparationDays: number
	isAvailable: boolean
	isVisible: boolean
	categoryId: string | null
	allergens: string[]
	tags: string[]
	images: { url: string; alt?: string }[]
}

interface Category {
	id: string
	name: string
	slug: string
}

interface ProductForm {
	name: string
	description: string
	categoryId: string
	price: string
	unit: string
	minQuantity: string
	maxQuantity: string
	preparationDays: string
	isAvailable: boolean
	isVisible: boolean
	allergens: string[]
	tags: string[]
}

const emptyForm: ProductForm = {
	name: '',
	description: '',
	categoryId: '',
	price: '',
	unit: '',
	minQuantity: '1',
	maxQuantity: '',
	preparationDays: '2',
	isAvailable: true,
	isVisible: true,
	allergens: [],
	tags: [],
}

export default function ProductsPage() {
	const t = useTranslations('nav')
	const [products, setProducts] = useState<Product[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [showCategories, setShowCategories] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [form, setForm] = useState<ProductForm>(emptyForm)
	const [saving, setSaving] = useState(false)
	const [tagInput, setTagInput] = useState('')
	const [allergenInput, setAllergenInput] = useState('')
	const [toast, setToast] = useState('')
	const [cropState, setCropState] = useState<{
		productId: string | null
		src: string
		file?: File
	} | null>(null)
	const [stagedFile, setStagedFile] = useState<File | null>(null)

	const showToast = (msg: string) => {
		setToast(msg)
		setTimeout(() => setToast(''), 3000)
	}

	const loadData = useCallback(async () => {
		try {
			const [prodRes, catRes] = await Promise.all([
				api.get('/patissier/products'),
				api.get('/patissier/categories'),
			])
			const rawProd = prodRes.data?.data?.data ?? prodRes.data?.data ?? []
			setProducts(Array.isArray(rawProd) ? rawProd : [])
			const rawCat = catRes.data?.data ?? []
			const catArr = Array.isArray(rawCat) ? rawCat : []
			setCategories(catArr.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })))
		} catch {
			// silently fail
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

	const openCreate = () => {
		setEditingId(null)
		setForm(emptyForm)
		setTagInput('')
		setAllergenInput('')
		setStagedFile(null)
		setShowModal(true)
	}

	const openEdit = (product: Product) => {
		setEditingId(product.id)
		setForm({
			name: product.name,
			description: product.description || '',
			categoryId: product.categoryId || '',
			price: String(product.price),
			unit: product.unit || '',
			minQuantity: String(product.minQuantity),
			maxQuantity: product.maxQuantity ? String(product.maxQuantity) : '',
			preparationDays: String(product.preparationDays),
			isAvailable: product.isAvailable,
			isVisible: product.isVisible,
			allergens: product.allergens || [],
			tags: product.tags || [],
		})
		setTagInput('')
		setAllergenInput('')
		setStagedFile(null)
		setShowModal(true)
	}

	const handleSave = async () => {
		if (!form.name.trim() || !form.price) return
		setSaving(true)
		try {
			const body = {
				name: form.name.trim(),
				description: form.description || null,
				categoryId: form.categoryId || null,
				price: Number(form.price),
				unit: form.unit || null,
				minQuantity: Number(form.minQuantity) || 1,
				maxQuantity: form.maxQuantity ? Number(form.maxQuantity) : null,
				preparationDays: Number(form.preparationDays) || 2,
				isAvailable: form.isAvailable,
				isVisible: form.isVisible,
				allergens: form.allergens,
				tags: form.tags,
			}
			if (editingId) {
				await api.put(`/patissier/products/${editingId}`, body)
				showToast('Produit modifié')
			} else {
				const res = await api.post('/patissier/products', body)
				const newProduct = res.data?.data
				if (stagedFile && newProduct?.id) {
					const formData = new FormData()
					formData.append('image', stagedFile, stagedFile.name)
					await api.upload(`/patissier/products/${newProduct.id}/illustration`, formData)
					setStagedFile(null)
				}
				showToast('Produit créé')
			}
			setShowModal(false)
			await loadData()
		} catch {
			showToast('Erreur lors de la sauvegarde')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id: string) => {
		try {
			await api.delete(`/patissier/products/${id}`)
			showToast('Produit supprimé')
			await loadData()
		} catch {
			showToast('Erreur lors de la suppression')
		}
	}

	const handleCreateCategory = async (name: string): Promise<string | null> => {
		try {
			const res = await api.post('/patissier/categories', { name })
			const newCat = res.data?.data
			if (newCat?.id) {
				setCategories((prev) => [...prev, { id: newCat.id, name: newCat.name, slug: newCat.slug }])
				return newCat.id
			}
		} catch {
			// silently fail
		}
		return null
	}

	const addTag = () => {
		const tag = tagInput.trim()
		if (tag && !form.tags.includes(tag)) {
			setForm((f) => ({ ...f, tags: [...f.tags, tag] }))
		}
		setTagInput('')
	}

	const removeTag = (tag: string) => {
		setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))
	}

	const addAllergen = () => {
		const allergen = allergenInput.trim()
		if (allergen && !form.allergens.includes(allergen)) {
			setForm((f) => ({ ...f, allergens: [...f.allergens, allergen] }))
		}
		setAllergenInput('')
	}

	const removeAllergen = (allergen: string) => {
		setForm((f) => ({ ...f, allergens: f.allergens.filter((a) => a !== allergen) }))
	}

	const getCategoryName = (id: string | null) => {
		if (!id) return null
		return categories.find((c) => c.id === id)?.name || null
	}

	const handleIllustrationSelect = (productId: string | null, e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const src = URL.createObjectURL(file)
		setCropState({ productId, src, file })
		e.target.value = ''
	}

	const handleCropConfirm = async (blob: Blob) => {
		if (!cropState) return
		const fileName = cropState.file?.name || 'illustration.jpg'
		if (cropState.src.startsWith('blob:')) URL.revokeObjectURL(cropState.src)
		const productId = cropState.productId
		setCropState(null)

		if (!productId) {
			// Create flow: stage the blob as a File for upload after product creation
			const file = new File([blob], fileName, { type: blob.type })
			setStagedFile(file)
			showToast('Illustration prête')
			return
		}

		const formData = new FormData()
		formData.append('image', blob, fileName)
		try {
			await api.upload(`/patissier/products/${productId}/illustration`, formData)
			showToast('Illustration ajoutée')
			await loadData()
		} catch {
			showToast("Erreur lors de l'upload")
		}
	}

	const handleIllustrationDelete = async (productId: string) => {
		try {
			await api.delete(`/patissier/products/${productId}/illustration`)
			showToast('Illustration supprimée')
			await loadData()
		} catch {
			showToast('Erreur lors de la suppression')
		}
	}

	return (
		<PlanGate minPlan="pro">
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
						onClick={openCreate}
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
					<button
						type="button"
						onClick={openCreate}
						className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Créer un produit
					</button>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{products.map((product) => (
						<div
							key={product.id}
							className="group relative cursor-pointer rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
							onClick={() => openEdit(product)}
						>
							<div className="flex items-start justify-between">
								<div className="min-w-0 flex-1">
									<h3 className="font-medium">{product.name}</h3>
									{getCategoryName(product.categoryId) && (
										<p className="mt-0.5 text-xs text-muted-foreground">
											{getCategoryName(product.categoryId)}
										</p>
									)}
								</div>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation()
										handleDelete(product.id)
									}}
									className="ml-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
										<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
									</svg>
								</button>
							</div>
							<p className="mt-2 text-lg font-bold text-primary">
								{product.price} &euro;{product.unit ? ` / ${product.unit}` : ''}
							</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{!product.isAvailable && (
									<span className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
										Indisponible
									</span>
								)}
								{!product.isVisible && (
									<span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
										Masqué
									</span>
								)}
								{product.preparationDays > 0 && (
									<span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
										{product.preparationDays}j de prépa
									</span>
								)}
							</div>
							{product.images?.[0]?.url && (
								<div className="mt-3">
									<div className="h-16 w-24 shrink-0 overflow-hidden rounded">
										<img
											src={getImageUrl(product.images[0].url) || ''}
											alt=""
											className="h-full w-full object-cover"
										/>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* ── Modal Create/Edit ── */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
					<div className="max-h-[85vh] w-full overflow-y-auto rounded-t-xl bg-white p-4 shadow-xl sm:max-w-lg sm:rounded-lg sm:p-6">
						<h2 className="text-xl font-bold">
							{editingId ? 'Modifier le produit' : 'Nouveau produit'}
						</h2>

						<div className="mt-4 space-y-4">
							{/* Name */}
							<div>
								<label className="mb-1 block text-sm font-medium">Nom *</label>
								<input
									type="text"
									value={form.name}
									onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
									className="w-full rounded border px-3 py-2 text-sm"
									placeholder="Nom du produit"
								/>
							</div>

							{/* Description */}
							<div>
								<label className="mb-1 block text-sm font-medium">Description</label>
								<textarea
									value={form.description}
									onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
									className="w-full rounded border px-3 py-2 text-sm"
									rows={3}
									placeholder="Description du produit"
								/>
							</div>

							{/* Illustration */}
							<div>
								<label className="mb-1 block text-sm font-medium">Illustration</label>
								{editingId ? (() => {
									const currentProduct = products.find((p) => p.id === editingId)
									const hasImage = currentProduct?.images?.[0]?.url
									return hasImage ? (
										<div className="flex items-center gap-3">
											<div className="h-16 w-24 shrink-0 overflow-hidden rounded border">
												<img
													src={getImageUrl(currentProduct!.images[0].url) || ''}
													alt=""
													className="h-full w-full object-cover"
												/>
											</div>
											<div className="flex gap-2">
												<label className="cursor-pointer rounded border px-3 py-1.5 text-xs hover:bg-muted">
													Changer
													<input
														type="file"
														accept="image/*"
														className="hidden"
														onChange={(e) => handleIllustrationSelect(editingId, e)}
													/>
												</label>
												<button
													type="button"
													onClick={() => handleIllustrationDelete(editingId)}
													className="rounded border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
												>
													Supprimer
												</button>
											</div>
										</div>
									) : (
										<label className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-muted">
											Ajouter une illustration
											<input
												type="file"
												accept="image/*"
												className="hidden"
												onChange={(e) => handleIllustrationSelect(editingId, e)}
											/>
										</label>
									)
								})() : (
									<div>
										{stagedFile ? (
											<div className="flex items-center gap-3">
												<span className="text-sm text-muted-foreground">{stagedFile.name}</span>
												<button
													type="button"
													onClick={() => setStagedFile(null)}
													className="rounded border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
												>
													Retirer
												</button>
											</div>
										) : (
											<label className="inline-flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-muted">
												Ajouter une illustration
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={(e) => handleIllustrationSelect(null, e)}
												/>
											</label>
										)}
									</div>
								)}
							</div>

							{/* Price + Unit */}
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="mb-1 block text-sm font-medium">Prix * (€)</label>
									<input
										type="number"
										step="0.01"
										min="0"
										value={form.price}
										onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
										placeholder="0.00"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium">Unité</label>
									<input
										type="text"
										value={form.unit}
										onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
										placeholder="pièce, kg, lot..."
									/>
								</div>
							</div>

							{/* Category */}
							<div>
								<label className="mb-1 block text-sm font-medium">Catégorie</label>
								<CategoryCombobox
									categories={categories}
									value={form.categoryId}
									onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
									onCreateCategory={handleCreateCategory}
								/>
							</div>

							{/* Quantities + Preparation */}
							<div className="grid grid-cols-3 gap-3">
								<div>
									<label className="mb-1 block text-sm font-medium">Qté min</label>
									<input
										type="number"
										min="1"
										value={form.minQuantity}
										onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium">Qté max</label>
									<input
										type="number"
										min="1"
										value={form.maxQuantity}
										onChange={(e) => setForm((f) => ({ ...f, maxQuantity: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
										placeholder="Illimité"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium">Prépa (j)</label>
									<input
										type="number"
										min="0"
										value={form.preparationDays}
										onChange={(e) => setForm((f) => ({ ...f, preparationDays: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
									/>
								</div>
							</div>

							{/* Allergens */}
							<div>
								<label className="mb-1 block text-sm font-medium">Allergènes</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={allergenInput}
										onChange={(e) => setAllergenInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												addAllergen()
											}
										}}
										className="flex-1 rounded border px-3 py-2 text-sm"
										placeholder="Gluten, lait, oeufs..."
									/>
									<button type="button" onClick={addAllergen} className="rounded border px-3 py-2 text-sm hover:bg-muted">
										+
									</button>
								</div>
								{form.allergens.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{form.allergens.map((a) => (
											<span key={a} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">
												{a}
												<button type="button" onClick={() => removeAllergen(a)} className="hover:text-orange-900">
													&times;
												</button>
											</span>
										))}
									</div>
								)}
							</div>

							{/* Tags */}
							<div>
								<label className="mb-1 block text-sm font-medium">Tags</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={tagInput}
										onChange={(e) => setTagInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												addTag()
											}
										}}
										className="flex-1 rounded border px-3 py-2 text-sm"
										placeholder="Ajouter un tag..."
									/>
									<button type="button" onClick={addTag} className="rounded border px-3 py-2 text-sm hover:bg-muted">
										+
									</button>
								</div>
								{form.tags.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{form.tags.map((tag) => (
											<span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
												{tag}
												<button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground">
													&times;
												</button>
											</span>
										))}
									</div>
								)}
							</div>

							{/* Toggles */}
							<div className="flex gap-6">
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={form.isVisible}
										onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
										className="h-4 w-4 rounded border"
									/>
									Visible sur le site
								</label>
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={form.isAvailable}
										onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
										className="h-4 w-4 rounded border"
									/>
									Disponible
								</label>
							</div>
						</div>

						{/* Actions */}
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowModal(false)}
								className="rounded border px-4 py-2 text-sm hover:bg-muted"
							>
								Annuler
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={saving || !form.name.trim() || !form.price}
								className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
							</button>
						</div>
					</div>
				</div>
			)}

			{showCategories && (
				<CategoriesDialog onClose={() => setShowCategories(false)} />
			)}

			{/* ── Image Cropper ── */}
			{cropState && (
				<ImageCropper
					imageSrc={cropState.src}
					onCrop={handleCropConfirm}
					onCancel={() => {
						if (cropState.src.startsWith('blob:')) URL.revokeObjectURL(cropState.src)
						setCropState(null)
					}}
					aspect={4 / 3}
				/>
			)}

			{/* Toast */}
			{toast && (
				<div className="fixed bottom-6 right-6 z-50 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg">
					{toast}
				</div>
			)}
		</div>
		</PlanGate>
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
