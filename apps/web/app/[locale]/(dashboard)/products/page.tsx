'use client'

import {
	Check,
	Eye,
	EyeOff,
	Filter,
	FolderOpen,
	MoreHorizontal,
	Pencil,
	Plus,
	Search,
	ShoppingBag,
	Trash2,
	X,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PlanGate } from '@/components/auth/plan-gate'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CategoryCombobox } from '@/components/ui/category-combobox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api/client'
import { getImageUrl } from '@/lib/utils/image-url'

interface Product {
	id: string
	name: string
	description: string | null
	price: number
	unit: string | null
	minQuantity: number | null
	maxQuantity: number | null
	preparationDays: number | null
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
	minQuantity: '',
	maxQuantity: '',
	preparationDays: '',
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
	const [searchQuery, setSearchQuery] = useState('')
	const [categoryFilter, setCategoryFilter] = useState<string>('all')

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

	const filteredProducts = useMemo(() => {
		return products.filter((product) => {
			const matchesSearch =
				!searchQuery ||
				product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				product.description?.toLowerCase().includes(searchQuery.toLowerCase())
			const matchesCategory = categoryFilter === 'all' || product.categoryId === categoryFilter
			return matchesSearch && matchesCategory
		})
	}, [products, searchQuery, categoryFilter])

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
			minQuantity: product.minQuantity != null ? String(product.minQuantity) : '',
			maxQuantity: product.maxQuantity != null ? String(product.maxQuantity) : '',
			preparationDays: product.preparationDays != null ? String(product.preparationDays) : '',
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
				minQuantity: form.minQuantity ? Number(form.minQuantity) : null,
				maxQuantity: form.maxQuantity ? Number(form.maxQuantity) : null,
				preparationDays: form.preparationDays ? Number(form.preparationDays) : null,
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

	const handleToggleVisibility = async (product: Product) => {
		try {
			await api.put(`/patissier/products/${product.id}`, {
				...product,
				isVisible: !product.isVisible,
			})
			showToast(product.isVisible ? 'Produit masqué' : 'Produit affiché')
			await loadData()
		} catch {
			showToast('Erreur lors de la mise à jour')
		}
	}

	const handleToggleAvailability = async (product: Product) => {
		try {
			await api.put(`/patissier/products/${product.id}`, {
				...product,
				isAvailable: !product.isAvailable,
			})
			showToast(product.isAvailable ? 'Produit indisponible' : 'Produit disponible')
			await loadData()
		} catch {
			showToast('Erreur lors de la mise à jour')
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

	const handleIllustrationSelect = (
		productId: string | null,
		e: React.ChangeEvent<HTMLInputElement>
	) => {
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
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold tracking-tight">{t('products')}</h1>
							<Badge className="bg-primary/10 text-primary hover:bg-primary/20">Pro</Badge>
						</div>
						<p className="text-muted-foreground">Gérez votre catalogue de produits en vente</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={() => setShowCategories(true)}>
							<FolderOpen className="size-4" />
							Catégories
						</Button>
						<Button onClick={openCreate}>
							<Plus className="size-4" />
							Nouveau produit
						</Button>
					</div>
				</div>

				{/* Search + Category filter */}
				<div className="flex items-center gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Rechercher un produit..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger className="w-[200px]">
							<Filter className="size-4" />
							<SelectValue placeholder="Catégorie" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Toutes les catégories</SelectItem>
							{categories.map((cat) => (
								<SelectItem key={cat.id} value={cat.id}>
									{cat.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Table */}
				{isLoading ? (
					<p className="text-muted-foreground">Chargement...</p>
				) : (
					<Card>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[300px]">Produit</TableHead>
										<TableHead>Catégorie</TableHead>
										<TableHead>Prix</TableHead>
										<TableHead>Qté</TableHead>
										<TableHead>Préparation</TableHead>
										<TableHead>Statut</TableHead>
										<TableHead>Visible</TableHead>
										<TableHead className="w-[50px]">
											<span className="sr-only">Actions</span>
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredProducts.length === 0 ? (
										<TableRow>
											<TableCell colSpan={8} className="h-32 text-center">
												<div className="flex flex-col items-center justify-center gap-2">
													<ShoppingBag className="size-10 text-muted-foreground" />
													<p className="text-muted-foreground">
														{products.length === 0
															? 'Aucun produit dans le catalogue'
															: 'Aucun produit ne correspond aux filtres'}
													</p>
													{products.length === 0 && (
														<Button className="mt-2" onClick={openCreate}>
															Créer un produit
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									) : (
										filteredProducts.map((product) => (
											<TableRow key={product.id}>
												{/* Produit: image + name + description */}
												<TableCell>
													<div className="flex items-center gap-3">
														{product.images?.[0]?.url ? (
															<div className="size-12 shrink-0 overflow-hidden rounded-lg">
																<img
																	src={getImageUrl(product.images[0].url) || ''}
																	alt={product.name}
																	className="size-full object-cover"
																/>
															</div>
														) : (
															<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
																<ShoppingBag className="size-5 text-muted-foreground" />
															</div>
														)}
														<div className="min-w-0">
															<p className="font-medium">{product.name}</p>
															{product.description && (
																<p className="max-w-[200px] truncate text-xs text-muted-foreground">
																	{product.description}
																</p>
															)}
														</div>
													</div>
												</TableCell>

												{/* Catégorie */}
												<TableCell>
													{getCategoryName(product.categoryId) ? (
														<Badge variant="outline">{getCategoryName(product.categoryId)}</Badge>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</TableCell>

												{/* Prix */}
												<TableCell>
													<span className="font-medium">{product.price} &euro;</span>
													{product.unit && (
														<span className="text-muted-foreground"> / {product.unit}</span>
													)}
												</TableCell>

												{/* Qté */}
												<TableCell>
													{product.minQuantity != null || product.maxQuantity != null ? (
														<span className="text-sm">
															{product.minQuantity ?? '—'} - {product.maxQuantity ?? '—'}
														</span>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</TableCell>

												{/* Préparation */}
												<TableCell>
													{product.preparationDays != null && product.preparationDays > 0 ? (
														<span className="text-sm">
															{product.preparationDays} jour{product.preparationDays > 1 ? 's' : ''}
														</span>
													) : (
														<span className="text-muted-foreground">—</span>
													)}
												</TableCell>

												{/* Statut */}
												<TableCell>
													{product.isAvailable ? (
														<Badge className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
															<Check className="size-3" />
															Disponible
														</Badge>
													) : (
														<Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">
															<X className="size-3" />
															Indisponible
														</Badge>
													)}
												</TableCell>

												{/* Visible */}
												<TableCell>
													{product.isVisible ? (
														<Eye className="size-4 text-muted-foreground" />
													) : (
														<EyeOff className="size-4 text-muted-foreground" />
													)}
												</TableCell>

												{/* Actions */}
												<TableCell>
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button variant="ghost" size="icon" className="size-8">
																<MoreHorizontal className="size-4" />
																<span className="sr-only">Actions</span>
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end">
															<DropdownMenuItem onClick={() => openEdit(product)}>
																<Pencil className="size-4" />
																Modifier
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => handleToggleVisibility(product)}>
																{product.isVisible ? (
																	<>
																		<EyeOff className="size-4" />
																		Masquer
																	</>
																) : (
																	<>
																		<Eye className="size-4" />
																		Afficher
																	</>
																)}
															</DropdownMenuItem>
															<DropdownMenuItem onClick={() => handleToggleAvailability(product)}>
																{product.isAvailable ? (
																	<>
																		<X className="size-4" />
																		Indisponible
																	</>
																) : (
																	<>
																		<Check className="size-4" />
																		Disponible
																	</>
																)}
															</DropdownMenuItem>
															<DropdownMenuSeparator />
															<DropdownMenuItem
																variant="destructive"
																onClick={() => handleDelete(product.id)}
															>
																<Trash2 className="size-4" />
																Supprimer
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}

				{/* ── Dialog Create/Edit ── */}
				<Dialog open={showModal} onOpenChange={setShowModal}>
					<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
						<DialogHeader>
							<DialogTitle>{editingId ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
							<DialogDescription>
								{editingId
									? 'Modifiez les informations de votre produit.'
									: 'Remplissez les informations pour créer un nouveau produit.'}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							{/* Name */}
							<div className="space-y-2">
								<Label htmlFor="product-name">Nom *</Label>
								<Input
									id="product-name"
									type="text"
									value={form.name}
									onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
									placeholder="Nom du produit"
								/>
							</div>

							{/* Description */}
							<div className="space-y-2">
								<Label htmlFor="product-description">Description</Label>
								<Textarea
									id="product-description"
									value={form.description}
									onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
									rows={3}
									placeholder="Description du produit"
								/>
							</div>

							{/* Illustration */}
							<div className="space-y-2">
								<Label>Illustration</Label>
								{editingId ? (
									(() => {
										const currentProduct = products.find((p) => p.id === editingId)
										const hasImage = currentProduct?.images?.[0]?.url
										return hasImage ? (
											<div className="flex items-center gap-3">
												<div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border">
													<img
														src={getImageUrl(currentProduct!.images[0].url) || ''}
														alt=""
														className="h-full w-full object-cover"
													/>
												</div>
												<div className="flex gap-2">
													<label className="cursor-pointer rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
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
														className="rounded-md border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
													>
														Supprimer
													</button>
												</div>
											</div>
										) : (
											<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
												Ajouter une illustration
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={(e) => handleIllustrationSelect(editingId, e)}
												/>
											</label>
										)
									})()
								) : (
									<div>
										{stagedFile ? (
											<div className="flex items-center gap-3">
												<span className="text-sm text-muted-foreground">{stagedFile.name}</span>
												<button
													type="button"
													onClick={() => setStagedFile(null)}
													className="rounded-md border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
												>
													Retirer
												</button>
											</div>
										) : (
											<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
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
								<div className="space-y-2">
									<Label htmlFor="product-price">Prix * (€)</Label>
									<Input
										id="product-price"
										type="number"
										step="0.01"
										min="0"
										value={form.price}
										onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
										placeholder="0.00"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="product-unit">Unité</Label>
									<Input
										id="product-unit"
										type="text"
										value={form.unit}
										onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
										placeholder="pièce, kg, lot..."
									/>
								</div>
							</div>

							{/* Category */}
							<div className="space-y-2">
								<Label>Catégorie</Label>
								<CategoryCombobox
									categories={categories}
									value={form.categoryId}
									onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
									onCreateCategory={handleCreateCategory}
								/>
							</div>

							{/* Quantities + Preparation */}
							<div className="grid grid-cols-3 gap-3">
								<div className="space-y-2">
									<Label htmlFor="product-min-qty">Qté min</Label>
									<Input
										id="product-min-qty"
										type="number"
										min="1"
										value={form.minQuantity}
										onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
										placeholder="—"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="product-max-qty">Qté max</Label>
									<Input
										id="product-max-qty"
										type="number"
										min="1"
										value={form.maxQuantity}
										onChange={(e) => setForm((f) => ({ ...f, maxQuantity: e.target.value }))}
										placeholder="—"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="product-prep">Prépa (j)</Label>
									<Input
										id="product-prep"
										type="number"
										min="0"
										value={form.preparationDays}
										onChange={(e) => setForm((f) => ({ ...f, preparationDays: e.target.value }))}
										placeholder="—"
									/>
								</div>
							</div>

							{/* Allergens */}
							<div className="space-y-2">
								<Label>Allergènes</Label>
								<div className="flex gap-2">
									<Input
										type="text"
										value={allergenInput}
										onChange={(e) => setAllergenInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												addAllergen()
											}
										}}
										className="flex-1"
										placeholder="Gluten, lait, oeufs..."
									/>
									<Button variant="outline" size="sm" type="button" onClick={addAllergen}>
										<Plus className="size-4" />
									</Button>
								</div>
								{form.allergens.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{form.allergens.map((a) => (
											<Badge key={a} className="bg-orange-50 text-orange-700 hover:bg-orange-100">
												{a}
												<button
													type="button"
													onClick={() => removeAllergen(a)}
													className="hover:text-orange-900"
												>
													<X className="size-3" />
												</button>
											</Badge>
										))}
									</div>
								)}
							</div>

							{/* Tags */}
							<div className="space-y-2">
								<Label>Tags</Label>
								<div className="flex gap-2">
									<Input
										type="text"
										value={tagInput}
										onChange={(e) => setTagInput(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												addTag()
											}
										}}
										className="flex-1"
										placeholder="Ajouter un tag..."
									/>
									<Button variant="outline" size="sm" type="button" onClick={addTag}>
										<Plus className="size-4" />
									</Button>
								</div>
								{form.tags.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{form.tags.map((tag) => (
											<Badge key={tag} variant="secondary">
												{tag}
												<button
													type="button"
													onClick={() => removeTag(tag)}
													className="text-muted-foreground hover:text-foreground"
												>
													<X className="size-3" />
												</button>
											</Badge>
										))}
									</div>
								)}
							</div>

							{/* Toggles */}
							<div className="flex items-center gap-6">
								<div className="flex items-center gap-2">
									<Switch
										id="product-visible"
										checked={form.isVisible}
										onCheckedChange={(checked) => setForm((f) => ({ ...f, isVisible: checked }))}
									/>
									<Label htmlFor="product-visible">Visible sur le site</Label>
								</div>
								<div className="flex items-center gap-2">
									<Switch
										id="product-available"
										checked={form.isAvailable}
										onCheckedChange={(checked) => setForm((f) => ({ ...f, isAvailable: checked }))}
									/>
									<Label htmlFor="product-available">Disponible</Label>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => setShowModal(false)}>
								Annuler
							</Button>
							<Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.price}>
								{saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{showCategories && <CategoriesDialog onClose={() => setShowCategories(false)} />}

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
	}, [fetchCategories])

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
			<Card className="mx-4 w-full max-w-md shadow-lg">
				<CardContent className="p-6">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Gérer les catégories</h2>
						<Button variant="ghost" size="icon" onClick={onClose}>
							<X className="size-5" />
						</Button>
					</div>

					{/* Add new category */}
					<form onSubmit={handleCreate} className="mt-4 flex gap-2">
						<Input
							type="text"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="Nouvelle catégorie..."
							className="flex-1"
						/>
						<Button type="submit" disabled={isSaving || !newName.trim()}>
							Ajouter
						</Button>
					</form>

					{/* Category list */}
					<div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
						{isLoading ? (
							<p className="text-sm text-muted-foreground">Chargement...</p>
						) : categories.length === 0 ? (
							<p className="py-4 text-center text-sm text-muted-foreground">Aucune catégorie</p>
						) : (
							categories.map((cat) => (
								<div
									key={cat.id}
									className="flex items-center justify-between rounded-md border px-3 py-2"
								>
									{editingId === cat.id ? (
										<Input
											type="text"
											value={editingName}
											onChange={(e) => setEditingName(e.target.value)}
											onKeyDown={(e) => {
												if (e.key === 'Enter') handleUpdate(cat.id)
												if (e.key === 'Escape') setEditingId(null)
											}}
											className="flex-1"
											autoFocus
										/>
									) : (
										<span className="text-sm">{cat.name}</span>
									)}
									<div className="ml-2 flex gap-1">
										{editingId === cat.id ? (
											<>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleUpdate(cat.id)}
													className="text-primary"
												>
													<Check className="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setEditingId(null)}
													className="text-muted-foreground"
												>
													<X className="size-4" />
												</Button>
											</>
										) : (
											<>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => {
														setEditingId(cat.id)
														setEditingName(cat.name)
													}}
													className="text-muted-foreground hover:text-foreground"
												>
													<Pencil className="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => handleDelete(cat.id)}
													className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
												>
													<Trash2 className="size-4" />
												</Button>
											</>
										)}
									</div>
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
