'use client'

import {
	EyeOff,
	ImagePlus,
	MoreHorizontal,
	Palette,
	Pencil,
	Plus,
	Search,
	Star,
	Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
import { RichEditor } from '@/components/ui/rich-editor'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api/client'
import { getImageUrl } from '@/lib/utils/image-url'

interface CreationImage {
	url: string
	alt: string | null
	is_cover: boolean
}

interface Creation {
	id: string
	title: string
	description: string | null
	images: CreationImage[]
	price: number | null
	isVisible: boolean
	isFeatured: boolean
	categoryId: string | null
	tags: string[]
}

interface Category {
	id: string
	name: string
	slug: string
}

interface CreationForm {
	title: string
	description: string
	categoryId: string
	isVisible: boolean
	isFeatured: boolean
	tags: string[]
}

const emptyForm: CreationForm = {
	title: '',
	description: '',
	categoryId: '',
	isVisible: true,
	isFeatured: false,
	tags: [],
}

export default function CreationsPage() {
	const t = useTranslations('nav')
	const [creations, setCreations] = useState<Creation[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [form, setForm] = useState<CreationForm>(emptyForm)
	const [saving, setSaving] = useState(false)
	const [tagInput, setTagInput] = useState('')
	const [toast, setToast] = useState('')
	const [cropState, setCropState] = useState<{
		creationId: string
		src: string
		file?: File
		editIdx?: number
	} | null>(null)
	const [imageMenuId, setImageMenuId] = useState<{ creationId: string; idx: number } | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [categoryFilter, setCategoryFilter] = useState<string>('all')

	const showToast = (msg: string) => {
		setToast(msg)
		setTimeout(() => setToast(''), 3000)
	}

	const loadData = useCallback(async () => {
		try {
			const [crRes, catRes] = await Promise.all([
				api.get('/patissier/creations'),
				api.get('/patissier/categories'),
			])
			const rawCr = crRes.data?.data?.data ?? crRes.data?.data ?? []
			setCreations(Array.isArray(rawCr) ? rawCr : [])
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

	useEffect(() => {
		if (!imageMenuId) return
		const handleClick = () => setImageMenuId(null)
		document.addEventListener('click', handleClick)
		return () => document.removeEventListener('click', handleClick)
	}, [imageMenuId])

	const filteredCreations = useMemo(() => {
		return creations.filter((creation) => {
			const matchesSearch =
				!searchQuery ||
				creation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				creation.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
			const matchesCategory = categoryFilter === 'all' || creation.categoryId === categoryFilter
			return matchesSearch && matchesCategory
		})
	}, [creations, searchQuery, categoryFilter])

	const openCreate = () => {
		setEditingId(null)
		setForm(emptyForm)
		setTagInput('')
		setShowModal(true)
	}

	const openEdit = (creation: Creation) => {
		setEditingId(creation.id)
		setForm({
			title: creation.title,
			description: creation.description || '',
			categoryId: creation.categoryId || '',
			isVisible: creation.isVisible,
			isFeatured: creation.isFeatured,
			tags: creation.tags || [],
		})
		setTagInput('')
		setShowModal(true)
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			const body = {
				title: form.title,
				description: form.description || null,
				categoryId: form.categoryId || null,
				isVisible: form.isVisible,
				isFeatured: form.isFeatured,
				tags: form.tags,
			}
			if (editingId) {
				await api.put(`/patissier/creations/${editingId}`, body)
				showToast('Création modifiée')
			} else {
				await api.post('/patissier/creations', body)
				showToast('Création ajoutée')
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
			await api.delete(`/patissier/creations/${id}`)
			showToast('Création supprimée')
			await loadData()
		} catch {
			showToast('Erreur lors de la suppression')
		}
	}

	const handleImageSelect = (creationId: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		e.target.value = ''
		const src = URL.createObjectURL(file)
		setCropState({ creationId, src, file })
	}

	const handleCropConfirm = async (blob: Blob) => {
		if (!cropState) return
		const { creationId, src, file, editIdx } = cropState
		const formData = new FormData()
		formData.append('image', blob, file?.name || 'image.jpg')
		URL.revokeObjectURL(src)
		setCropState(null)
		try {
			if (editIdx !== undefined) {
				await api.upload(`/patissier/creations/${creationId}/images/${editIdx}`, formData, 'PUT')
				showToast('Image modifiée')
			} else {
				await api.upload(`/patissier/creations/${creationId}/images`, formData)
				showToast('Image ajoutée')
			}
			await loadData()
		} catch {
			showToast("Erreur lors de l'upload")
		}
	}

	const handleCropCancel = () => {
		if (cropState) URL.revokeObjectURL(cropState.src)
		setCropState(null)
	}

	const handleEditImage = (creationId: string, idx: number, imageUrl: string) => {
		setImageMenuId(null)
		const src = getImageUrl(imageUrl) || ''
		setCropState({ creationId, src, editIdx: idx })
	}

	const handleSetCover = async (creationId: string, idx: number) => {
		try {
			await api.put(`/patissier/creations/${creationId}/cover/${idx}`)
			showToast('Image de couverture mise à jour')
			await loadData()
		} catch {
			showToast('Erreur lors du changement de couverture')
		}
	}

	const handleImageDelete = async (creationId: string, idx: number) => {
		try {
			await api.delete(`/patissier/creations/${creationId}/images/${idx}`)
			showToast('Image supprimée')
			await loadData()
		} catch {
			showToast('Erreur lors de la suppression')
		}
	}

	const handleCreateCategory = async (name: string): Promise<string | null> => {
		try {
			const res = await api.post('/patissier/categories', { name })
			const cat = res.data?.data
			if (cat?.id) {
				setCategories((prev) => [...prev, { id: cat.id, name: cat.name, slug: cat.slug }])
				showToast(`Catégorie "${name}" créée`)
				return cat.id
			}
			return null
		} catch {
			showToast('Erreur lors de la création de la catégorie')
			return null
		}
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

	const getCategoryName = (id: string | null) => {
		if (!id) return null
		return categories.find((c) => c.id === id)?.name || null
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">{t('creations')}</h1>
					<p className="text-muted-foreground">Gérez vos créations pâtissières</p>
				</div>
				<Button onClick={openCreate}>
					<Plus />
					Nouvelle création
				</Button>
			</div>

			{/* Search + Category filter */}
			{!isLoading && creations.length > 0 && (
				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="relative flex-1">
						<Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
						<Input
							placeholder="Rechercher une création..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger className="w-full sm:w-[200px]">
							<SelectValue placeholder="Toutes les catégories" />
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
			)}

			{isLoading ? (
				<p className="text-muted-foreground">Chargement...</p>
			) : creations.length === 0 ? (
				<Card className="border-dashed py-12">
					<CardContent className="flex flex-col items-center text-center">
						<Palette className="mb-3 h-12 w-12 text-muted-foreground/40" />
						<p className="font-medium">Aucune création pour le moment</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Ajoutez vos premières créations pour les afficher sur votre site
						</p>
						<Button onClick={openCreate} className="mt-4">
							<Plus />
							Nouvelle création
						</Button>
					</CardContent>
				</Card>
			) : filteredCreations.length === 0 ? (
				<Card className="border-dashed py-12">
					<CardContent className="flex flex-col items-center text-center">
						<Search className="mb-3 h-12 w-12 text-muted-foreground/40" />
						<p className="font-medium">Aucun résultat</p>
						<p className="mt-1 text-sm text-muted-foreground">
							Essayez de modifier votre recherche ou vos filtres
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{filteredCreations.map((creation) => (
						<Card key={creation.id} className="group relative gap-0 overflow-hidden p-0">
							{/* Image area */}
							<div className="relative aspect-square bg-muted">
								{creation.images?.[0]?.url ? (
									<img
										src={getImageUrl(creation.images[0].url) || ''}
										alt={creation.title}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
										<ImagePlus className="h-12 w-12" />
									</div>
								)}

								{/* Featured badge - top left */}
								{creation.isFeatured && (
									<Badge className="absolute top-2 left-2 bg-amber-500 text-white hover:bg-amber-500">
										<Star className="h-3 w-3" />
										En vedette
									</Badge>
								)}

								{/* Hidden badge - top right */}
								{!creation.isVisible && (
									<Badge
										variant="secondary"
										className="absolute top-2 right-2 bg-black/60 text-white hover:bg-black/60"
									>
										<EyeOff className="h-3 w-3" />
										Masqué
									</Badge>
								)}

								{/* Hover overlay with actions */}
								<div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
									<div className="flex w-full items-center justify-between p-3">
										<Button variant="secondary" size="sm" asChild>
											<label className="cursor-pointer">
												<ImagePlus className="h-4 w-4" />
												Photo
												<input
													type="file"
													accept="image/*"
													className="hidden"
													onChange={(e) => handleImageSelect(creation.id, e)}
												/>
											</label>
										</Button>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="secondary" size="icon" className="h-8 w-8">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => openEdit(creation)}>
													<Pencil />
													Modifier
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={async () => {
														const body = {
															title: creation.title,
															isVisible: !creation.isVisible,
														}
														try {
															await api.put(`/patissier/creations/${creation.id}`, body)
															showToast(
																creation.isVisible ? 'Création masquée' : 'Création visible'
															)
															await loadData()
														} catch {
															showToast('Erreur lors de la mise à jour')
														}
													}}
												>
													<EyeOff />
													{creation.isVisible ? 'Masquer' : 'Rendre visible'}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={async () => {
														const body = {
															title: creation.title,
															isFeatured: !creation.isFeatured,
														}
														try {
															await api.put(`/patissier/creations/${creation.id}`, body)
															showToast(
																creation.isFeatured ? 'Retirée des vedettes' : 'Mise en vedette'
															)
															await loadData()
														} catch {
															showToast('Erreur lors de la mise à jour')
														}
													}}
												>
													<Star />
													{creation.isFeatured ? 'Retirer des vedettes' : 'Mettre en vedette'}
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													variant="destructive"
													onClick={() => handleDelete(creation.id)}
												>
													<Trash2 />
													Supprimer
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</div>
							</div>

							{/* Content */}
							<CardContent className="p-4">
								<h3 className="font-medium">
									{creation.title || (
										<span className="text-muted-foreground italic">Sans titre</span>
									)}
								</h3>
								{getCategoryName(creation.categoryId) && (
									<p className="mt-0.5 text-sm text-muted-foreground">
										{getCategoryName(creation.categoryId)}
									</p>
								)}
								{creation.price !== null && creation.price !== undefined && (
									<p className="mt-1 text-sm font-semibold">
										{new Intl.NumberFormat('fr-FR', {
											style: 'currency',
											currency: 'EUR',
										}).format(creation.price)}
									</p>
								)}
								{creation.tags && creation.tags.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1">
										{creation.tags.slice(0, 3).map((tag) => (
											<Badge key={tag} variant="secondary" className="text-xs">
												{tag}
											</Badge>
										))}
										{creation.tags.length > 3 && (
											<Badge variant="outline" className="text-xs">
												+{creation.tags.length - 3}
											</Badge>
										)}
									</div>
								)}

								{/* Image thumbnails */}
								{creation.images?.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
										{creation.images.map((img, idx) => (
											<div key={idx} className="relative h-12 w-12 shrink-0">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<button
															type="button"
															className={`h-full w-full overflow-hidden rounded border-2 transition-colors ${idx === 0 ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'}`}
														>
															<img
																src={getImageUrl(img.url) || ''}
																alt=""
																className="h-full w-full object-cover"
															/>
														</button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="start">
														{idx !== 0 && (
															<DropdownMenuItem onClick={() => handleSetCover(creation.id, idx)}>
																<Star />
																Couverture
															</DropdownMenuItem>
														)}
														<DropdownMenuItem
															onClick={() => handleEditImage(creation.id, idx, img.url)}
														>
															<ImagePlus />
															Recadrer
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															variant="destructive"
															onClick={() => handleImageDelete(creation.id, idx)}
														>
															<Trash2 />
															Supprimer
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
												{idx === 0 && (
													<span className="absolute -top-1 -left-1 rounded bg-primary px-1 text-[8px] font-semibold text-primary-foreground">
														Cover
													</span>
												)}
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* ── Dialog Create/Edit ── */}
			<Dialog open={showModal} onOpenChange={setShowModal}>
				<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{editingId ? 'Modifier la création' : 'Nouvelle création'}</DialogTitle>
						<DialogDescription>
							{editingId
								? 'Modifiez les informations de votre création.'
								: 'Ajoutez une nouvelle création à votre catalogue.'}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						{/* Title */}
						<div className="space-y-2">
							<Label htmlFor="creation-title">Titre</Label>
							<Input
								id="creation-title"
								type="text"
								value={form.title}
								onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
								placeholder="Nom de la création"
							/>
						</div>

						{/* Description */}
						<div className="space-y-2">
							<Label>Description</Label>
							<RichEditor
								content={form.description}
								onChange={(html) => setForm((f) => ({ ...f, description: html }))}
								placeholder="Description de la creation"
							/>
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
								<Button variant="outline" size="sm" onClick={addTag} className="h-9">
									<Plus />
								</Button>
							</div>
							{form.tags.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{form.tags.map((tag) => (
										<Badge key={tag} variant="secondary" className="gap-1">
											{tag}
											<button
												type="button"
												onClick={() => removeTag(tag)}
												className="text-muted-foreground hover:text-foreground"
											>
												&times;
											</button>
										</Badge>
									))}
								</div>
							)}
						</div>

						{/* Toggles */}
						<div className="flex flex-col gap-4 rounded-lg border p-4">
							<div className="flex items-center justify-between">
								<Label htmlFor="creation-visible" className="cursor-pointer">
									Visible sur le site
								</Label>
								<Switch
									id="creation-visible"
									checked={form.isVisible}
									onCheckedChange={(checked) => setForm((f) => ({ ...f, isVisible: checked }))}
								/>
							</div>
							<div className="flex items-center justify-between">
								<Label htmlFor="creation-featured" className="cursor-pointer">
									En vedette
								</Label>
								<Switch
									id="creation-featured"
									checked={form.isFeatured}
									onCheckedChange={(checked) => setForm((f) => ({ ...f, isFeatured: checked }))}
								/>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setShowModal(false)}>
							Annuler
						</Button>
						<Button onClick={handleSave} disabled={saving}>
							{saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Image Cropper ── */}
			{cropState && (
				<ImageCropper
					imageSrc={cropState.src}
					onCrop={handleCropConfirm}
					onCancel={handleCropCancel}
				/>
			)}

			{/* ── Toast ── */}
			{toast && (
				<div className="fixed bottom-6 right-6 z-50 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg">
					{toast}
				</div>
			)}
		</div>
	)
}
