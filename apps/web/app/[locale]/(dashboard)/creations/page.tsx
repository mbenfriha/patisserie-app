'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { api } from '@/lib/api/client'
import { getImageUrl } from '@/lib/utils/image-url'
import { CategoryCombobox } from '@/components/ui/category-combobox'
import { RichEditor } from '@/components/ui/rich-editor'
import { ImageCropper } from '@/components/ui/image-cropper'

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
	const [cropState, setCropState] = useState<{ creationId: string; src: string; file?: File; editIdx?: number } | null>(null)
	const [imageMenuId, setImageMenuId] = useState<{ creationId: string; idx: number } | null>(null)

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
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">{t('creations')}</h1>
				<button
					type="button"
					onClick={openCreate}
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					+ Nouvelle création
				</button>
			</div>

			{isLoading ? (
				<p className="text-muted-foreground">Chargement...</p>
			) : creations.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">Aucune création pour le moment</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Ajoutez vos premières créations pour les afficher sur votre site
					</p>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{creations.map((creation) => (
						<div key={creation.id} className="group relative rounded-lg border bg-card">
							{/* Image */}
							<div className="relative aspect-[4/3] bg-muted">
								{creation.images?.[0]?.url ? (
									<img
										src={getImageUrl(creation.images[0].url) || ''}
										alt={creation.title}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
										<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
										</svg>
									</div>
								)}
								{/* Image count badge */}
								{creation.images?.length > 1 && (
									<span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
										{creation.images.length} photos
									</span>
								)}
							</div>

							{/* Content */}
							<div className="p-4">
								<h3 className="font-medium">{creation.title || <span className="text-muted-foreground italic">Sans titre</span>}</h3>
								{creation.description && (
									<div
										className="mt-1 line-clamp-2 text-sm text-muted-foreground"
										dangerouslySetInnerHTML={{ __html: creation.description }}
									/>
								)}
								{getCategoryName(creation.categoryId) && (
									<span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
										{getCategoryName(creation.categoryId)}
									</span>
								)}
								<div className="mt-2 flex gap-2">
									{creation.isFeatured && (
										<span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
											En vedette
										</span>
									)}
									{!creation.isVisible && (
										<span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
											Masqué
										</span>
									)}
								</div>

								{/* Actions */}
								<div className="mt-3 flex items-center gap-2 border-t pt-3">
									<label className="cursor-pointer rounded border px-3 py-1.5 text-xs hover:bg-muted">
										+ Photo
										<input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(creation.id, e)} />
									</label>
									<button
										type="button"
										onClick={() => openEdit(creation)}
										className="rounded border px-3 py-1.5 text-xs hover:bg-muted"
									>
										Modifier
									</button>
									<button
										type="button"
										onClick={() => handleDelete(creation.id)}
										className="rounded border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
									>
										Supprimer
									</button>
								</div>

								{/* Image thumbnails */}
								{creation.images?.length > 0 && (
									<div className="mt-3 flex flex-wrap gap-2">
										{creation.images.map((img, idx) => (
											<div key={idx} className="relative h-16 w-16 shrink-0">
												<button
													type="button"
													onClick={(e) => { e.stopPropagation(); setImageMenuId(imageMenuId?.creationId === creation.id && imageMenuId?.idx === idx ? null : { creationId: creation.id, idx }) }}
													className={`h-full w-full overflow-hidden rounded border-2 transition-colors ${idx === 0 ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'}`}
												>
													<img src={getImageUrl(img.url) || ''} alt="" className="h-full w-full object-cover" />
												</button>
												{idx === 0 && (
													<span className="absolute -top-1 -left-1 rounded bg-primary px-1 text-[8px] font-semibold text-primary-foreground">
														Cover
													</span>
												)}
												{imageMenuId?.creationId === creation.id && imageMenuId?.idx === idx && (
													<div className="absolute top-full left-0 z-20 mt-1 w-36 rounded-md border bg-card py-1 shadow-lg">
														{idx !== 0 && (
															<button
																type="button"
																onClick={() => { handleSetCover(creation.id, idx); setImageMenuId(null) }}
																className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
															>
																<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
																Couverture
															</button>
														)}
														<button
															type="button"
															onClick={() => handleEditImage(creation.id, idx, img.url)}
															className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted"
														>
															<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21z" /></svg>
															Recadrer
														</button>
														<div className="my-1 border-t" />
														<button
															type="button"
															onClick={() => { handleImageDelete(creation.id, idx); setImageMenuId(null) }}
															className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
														>
															<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
															Supprimer
														</button>
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			{/* ── Modal Create/Edit ── */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
					<div className="max-h-[85vh] w-full overflow-y-auto rounded-t-xl bg-white p-4 shadow-xl sm:max-w-lg sm:rounded-lg sm:p-6">
						<h2 className="text-xl font-bold">
							{editingId ? 'Modifier la création' : 'Nouvelle création'}
						</h2>

						<div className="mt-4 space-y-4">
							{/* Title */}
							<div>
								<label className="mb-1 block text-sm font-medium">Titre</label>
								<input
									type="text"
									value={form.title}
									onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
									className="w-full rounded border px-3 py-2 text-sm"
									placeholder="Nom de la création"
								/>
							</div>

							{/* Description */}
							<div>
								<label className="mb-1 block text-sm font-medium">Description</label>
								<RichEditor
									content={form.description}
									onChange={(html) => setForm((f) => ({ ...f, description: html }))}
									placeholder="Description de la creation"
								/>
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
										checked={form.isFeatured}
										onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
										className="h-4 w-4 rounded border"
									/>
									En vedette
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
								disabled={saving}
								className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
							</button>
						</div>
					</div>
				</div>
			)}

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
