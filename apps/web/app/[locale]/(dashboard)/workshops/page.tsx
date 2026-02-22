'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { getImageUrl } from '@/lib/utils/image-url'
import { CategoryCombobox } from '@/components/ui/category-combobox'
import { RichEditor } from '@/components/ui/rich-editor'

interface Category {
	id: string
	name: string
}

interface Workshop {
	id: string
	title: string
	description: string | null
	images: { url: string; alt?: string }[]
	price: number
	depositPercent: number
	capacity: number
	durationMinutes: number
	location: string | null
	date: string
	startTime: string
	status: string
	whatIncluded: string | null
	level: string
	categoryId: string | null
	category: Category | null
	isVisible: boolean
}

interface WorkshopForm {
	title: string
	description: string
	price: string
	paymentMode: 'full' | 'deposit'
	depositPercent: string
	capacity: string
	durationMinutes: string
	location: string
	date: string
	startHour: string
	startMinute: string
	whatIncluded: string
	level: string
	categoryId: string
	isVisible: boolean
}

const emptyForm: WorkshopForm = {
	title: '',
	description: '',
	price: '',
	paymentMode: 'deposit',
	depositPercent: '30',
	capacity: '10',
	durationMinutes: '120',
	location: '',
	date: '',
	startHour: '14',
	startMinute: '00',
	whatIncluded: '',
	level: 'tous_niveaux',
	categoryId: '',
	isVisible: true,
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

const LEVELS = [
	{ value: 'tous_niveaux', label: 'Tous niveaux' },
	{ value: 'debutant', label: 'Débutant' },
	{ value: 'intermediaire', label: 'Intermédiaire' },
	{ value: 'avance', label: 'Avancé' },
]

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
	draft: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
	published: { label: 'Publié', className: 'bg-green-100 text-green-700' },
	full: { label: 'Complet', className: 'bg-orange-100 text-orange-700' },
	cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-600' },
	completed: { label: 'Terminé', className: 'bg-blue-100 text-blue-700' },
}

export default function WorkshopsPage() {
	const [workshops, setWorkshops] = useState<Workshop[]>([])
	const [categories, setCategories] = useState<Category[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [form, setForm] = useState<WorkshopForm>(emptyForm)
	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState('')
	const [openMenuId, setOpenMenuId] = useState<string | null>(null)
	const menuRef = useRef<HTMLDivElement>(null)

	const showToast = (msg: string) => {
		setToast(msg)
		setTimeout(() => setToast(''), 3000)
	}

	const loadData = useCallback(async () => {
		try {
			const [workshopsRes, categoriesRes] = await Promise.all([
				api.get('/patissier/workshops'),
				api.get('/patissier/categories'),
			])
			const list = workshopsRes.data?.data?.data ?? workshopsRes.data?.data ?? []
			setWorkshops(Array.isArray(list) ? list : [])
			const cats = categoriesRes.data?.data ?? []
			setCategories(Array.isArray(cats) ? cats : [])
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
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setOpenMenuId(null)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const openCreate = () => {
		setEditingId(null)
		setForm(emptyForm)
		setShowModal(true)
	}

	const openEdit = (w: Workshop) => {
		const [h, m] = (w.startTime || '14:00').split(':')
		setEditingId(w.id)
		setForm({
			title: w.title,
			description: w.description || '',
			price: String(w.price),
			paymentMode: w.depositPercent >= 100 ? 'full' : 'deposit',
			depositPercent: w.depositPercent >= 100 ? '30' : String(w.depositPercent),
			capacity: String(w.capacity),
			durationMinutes: String(w.durationMinutes),
			location: w.location || '',
			date: w.date,
			startHour: h || '14',
			startMinute: m || '00',
			whatIncluded: w.whatIncluded || '',
			level: w.level,
			categoryId: w.categoryId || '',
			isVisible: w.isVisible,
		})
		setShowModal(true)
	}

	const handleSave = async (status?: 'published' | 'draft') => {
		if (!form.title.trim() || !form.price || !form.date) return
		setSaving(true)
		try {
			const body: Record<string, any> = {
				title: form.title,
				description: form.description || null,
				price: Number(form.price),
				depositPercent: form.paymentMode === 'full' ? 100 : Number(form.depositPercent),
				capacity: Number(form.capacity),
				durationMinutes: Number(form.durationMinutes),
				location: form.location || null,
				date: form.date,
				startTime: `${form.startHour}:${form.startMinute}`,
				whatIncluded: form.whatIncluded || null,
				level: form.level,
				categoryId: form.categoryId || null,
				isVisible: form.isVisible,
			}
			if (status) {
				body.status = status
			}
			if (editingId) {
				await api.put(`/patissier/workshops/${editingId}`, body)
				showToast('Atelier modifié')
			} else {
				body.status = status || 'published'
				await api.post('/patissier/workshops', body)
				showToast(status === 'draft' ? 'Brouillon sauvegardé' : 'Atelier publié')
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
			await api.delete(`/patissier/workshops/${id}`)
			showToast('Atelier supprimé')
			await loadData()
		} catch {
			showToast('Erreur lors de la suppression')
		}
	}

	const handleStatusChange = async (id: string, status: string) => {
		try {
			await api.put(`/patissier/workshops/${id}/status`, { status })
			showToast('Statut mis à jour')
			await loadData()
		} catch {
			showToast('Erreur lors du changement de statut')
		}
	}

	const handleCreateCategory = async (name: string): Promise<string | null> => {
		try {
			const res = await api.post('/patissier/categories', { name })
			const cat = res.data?.data
			if (cat?.id) {
				setCategories((prev) => [...prev, { id: cat.id, name: cat.name }])
				showToast(`Catégorie "${name}" créée`)
				return cat.id
			}
			return null
		} catch {
			showToast('Erreur lors de la création de la catégorie')
			return null
		}
	}

	const handleIllustrationUpload = async (workshopId: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const formData = new FormData()
		formData.append('image', file)
		try {
			await api.upload(`/patissier/workshops/${workshopId}/illustration`, formData)
			showToast('Illustration ajoutée')
			await loadData()
		} catch {
			showToast("Erreur lors de l'upload")
		}
	}

	const handleIllustrationDelete = async (workshopId: string) => {
		try {
			await api.delete(`/patissier/workshops/${workshopId}/illustration`)
			showToast('Illustration supprimée')
			await loadData()
		} catch {
			showToast('Erreur lors de la suppression')
		}
	}

	const formatDate = (dateStr: string) => {
		try {
			return new Date(dateStr).toLocaleDateString('fr-FR', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			})
		} catch {
			return dateStr
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Ateliers</h1>
				<button
					type="button"
					onClick={openCreate}
					className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					+ Nouvel atelier
				</button>
			</div>

			{isLoading ? (
				<p className="text-muted-foreground">Chargement...</p>
			) : workshops.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">Aucun atelier pour le moment</p>
					<p className="mt-1 text-sm text-muted-foreground">
						Créez votre premier atelier pour le proposer à vos clients
					</p>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{workshops.map((workshop) => {
						const statusInfo = STATUS_LABELS[workshop.status] || STATUS_LABELS.draft
						return (
							<div key={workshop.id} className="rounded-lg border bg-card p-6">
								<div className="flex items-start justify-between">
									<div>
										<h3 className="text-lg font-medium">{workshop.title}</h3>
										<p className="mt-1 text-sm text-muted-foreground">
											{formatDate(workshop.date)} à {workshop.startTime}
										</p>
									</div>
									<span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
										{workshop.price}&nbsp;&euro;/pers
									</span>
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									<span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}>
										{statusInfo.label}
									</span>
									{workshop.category && (
										<span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
											{workshop.category.name}
										</span>
									)}
									<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
										{LEVELS.find((l) => l.value === workshop.level)?.label || workshop.level}
									</span>
									<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
										{workshop.capacity} places
									</span>
									<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
										{workshop.durationMinutes} min
									</span>
									{!workshop.isVisible && (
										<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
											Masqué
										</span>
									)}
								</div>
								{/* Illustration */}
								{workshop.images?.[0]?.url ? (
									<div className="mt-3">
										<div className="h-16 w-24 shrink-0 overflow-hidden rounded">
											<img src={getImageUrl(workshop.images[0].url) || ''} alt="" className="h-full w-full object-cover" />
										</div>
									</div>
								) : null}

								{/* Actions */}
								<div className="mt-4 flex items-center gap-2 border-t pt-4">
									<Link
										href={`/dashboard/workshops/${workshop.id}`}
										className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
									>
										Voir
									</Link>
									<button
										type="button"
										onClick={() => openEdit(workshop)}
										className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
									>
										Modifier
									</button>
									<div className="relative ml-auto" ref={openMenuId === workshop.id ? menuRef : undefined}>
										<button
											type="button"
											onClick={() => setOpenMenuId(openMenuId === workshop.id ? null : workshop.id)}
											className="rounded-md border p-1.5 hover:bg-muted"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
												<circle cx="12" cy="5" r="2" />
												<circle cx="12" cy="12" r="2" />
												<circle cx="12" cy="19" r="2" />
											</svg>
										</button>
										{openMenuId === workshop.id && (
											<div className="absolute right-0 z-10 mt-1 w-48 rounded-md border bg-card py-1 shadow-lg">
												{workshop.status === 'draft' && (
													<button
														type="button"
														onClick={() => { handleStatusChange(workshop.id, 'published'); setOpenMenuId(null) }}
														className="flex w-full items-center px-3 py-2 text-left text-xs text-green-600 hover:bg-muted"
													>
														Publier
													</button>
												)}
												{workshop.status === 'published' && (
													<button
														type="button"
														onClick={() => { handleStatusChange(workshop.id, 'draft'); setOpenMenuId(null) }}
														className="flex w-full items-center px-3 py-2 text-left text-xs hover:bg-muted"
													>
														Dépublier
													</button>
												)}
												<label className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-xs hover:bg-muted">
													{workshop.images?.[0] ? 'Changer illustration' : 'Ajouter illustration'}
													<input type="file" accept="image/*" className="hidden" onChange={(e) => { handleIllustrationUpload(workshop.id, e); setOpenMenuId(null) }} />
												</label>
												{workshop.images?.[0]?.url && (
													<button
														type="button"
														onClick={() => { handleIllustrationDelete(workshop.id); setOpenMenuId(null) }}
														className="flex w-full items-center px-3 py-2 text-left text-xs hover:bg-muted"
													>
														Supprimer illustration
													</button>
												)}
												<div className="my-1 border-t" />
												<button
													type="button"
													onClick={() => { handleDelete(workshop.id); setOpenMenuId(null) }}
													className="flex w-full items-center px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
												>
													Supprimer
												</button>
											</div>
										)}
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}

			{/* ── Modal Create/Edit ── */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
					<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
						<h2 className="text-xl font-bold">
							{editingId ? "Modifier l'atelier" : 'Nouvel atelier'}
						</h2>

						<div className="mt-4 space-y-4">
							{/* Title */}
							<div>
								<label className="mb-1 block text-sm font-medium">Titre *</label>
								<input
									type="text"
									value={form.title}
									onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
									className="w-full rounded border px-3 py-2 text-sm"
									placeholder="Nom de l'atelier"
								/>
							</div>

							{/* Description */}
							<div>
								<label className="mb-1 block text-sm font-medium">Description</label>
								<RichEditor
									content={form.description}
									onChange={(html) => setForm((f) => ({ ...f, description: html }))}
									placeholder="Décrivez votre atelier..."
								/>
							</div>

							{/* Date & Time */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="mb-1 block text-sm font-medium">Date *</label>
									<input
										type="date"
										value={form.date}
										onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium">Heure de début *</label>
									<div className="flex items-center gap-1">
										<select
											value={form.startHour}
											onChange={(e) => setForm((f) => ({ ...f, startHour: e.target.value }))}
											className="w-full rounded border px-3 py-2 text-sm"
										>
											{HOURS.map((h) => (
												<option key={h} value={h}>{h}h</option>
											))}
										</select>
										<span className="text-muted-foreground">:</span>
										<select
											value={form.startMinute}
											onChange={(e) => setForm((f) => ({ ...f, startMinute: e.target.value }))}
											className="w-full rounded border px-3 py-2 text-sm"
										>
											{MINUTES.map((m) => (
												<option key={m} value={m}>{m}</option>
											))}
										</select>
									</div>
								</div>
							</div>

							{/* Price */}
							<div>
								<label className="mb-1 block text-sm font-medium">Prix par personne (€) *</label>
								<input
									type="number"
									min="0"
									step="0.01"
									value={form.price}
									onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
									className="w-full rounded border px-3 py-2 text-sm"
									placeholder="45"
								/>
							</div>

							{/* Payment mode */}
							<div>
								<label className="mb-2 block text-sm font-medium">Mode de paiement à la réservation</label>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setForm((f) => ({ ...f, paymentMode: 'full' }))}
										className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
											form.paymentMode === 'full'
												? 'border-primary bg-primary/5 text-primary'
												: 'border-gray-200 text-gray-600 hover:border-gray-300'
										}`}
									>
										Paiement intégral
									</button>
									<button
										type="button"
										onClick={() => setForm((f) => ({ ...f, paymentMode: 'deposit' }))}
										className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
											form.paymentMode === 'deposit'
												? 'border-primary bg-primary/5 text-primary'
												: 'border-gray-200 text-gray-600 hover:border-gray-300'
										}`}
									>
										Acompte
									</button>
								</div>

								{form.paymentMode === 'deposit' && (
									<div className="mt-3">
										<label className="mb-1 block text-sm font-medium">Pourcentage d'acompte (%)</label>
										<input
											type="number"
											min="1"
											max="99"
											value={form.depositPercent}
											onChange={(e) => setForm((f) => ({ ...f, depositPercent: e.target.value }))}
											className="w-full rounded border px-3 py-2 text-sm"
											placeholder="30"
										/>
									</div>
								)}

								{form.price && (
									<p className="mt-2 text-sm text-muted-foreground">
										{form.paymentMode === 'full'
											? `Le client paiera ${Number(form.price).toFixed(2)} € à la réservation`
											: `Le client paiera ${((Number(form.price) * Number(form.depositPercent || 0)) / 100).toFixed(2)} € d'acompte à la réservation`}
									</p>
								)}
							</div>

							{/* Capacity & Duration */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="mb-1 block text-sm font-medium">Capacité</label>
									<input
										type="number"
										min="1"
										value={form.capacity}
										onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium">Durée (min)</label>
									<input
										type="number"
										min="15"
										step="15"
										value={form.durationMinutes}
										onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
									/>
								</div>
							</div>

							{/* Level & Location */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="mb-1 block text-sm font-medium">Niveau</label>
									<select
										value={form.level}
										onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
									>
										{LEVELS.map((l) => (
											<option key={l.value} value={l.value}>
												{l.label}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium">Lieu</label>
									<input
										type="text"
										value={form.location}
										onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
										placeholder="Adresse ou lieu"
									/>
								</div>
							</div>

							{/* What's included */}
							<div>
								<label className="mb-1 block text-sm font-medium">Ce qui est inclus</label>
								<RichEditor
									content={form.whatIncluded}
									onChange={(html) => setForm((f) => ({ ...f, whatIncluded: html }))}
									placeholder="Ingrédients, matériel, tablier..."
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

							{/* Visible toggle */}
							<label className="flex items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={form.isVisible}
									onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
									className="h-4 w-4 rounded border"
								/>
								Visible sur le site
							</label>
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
							{!editingId && (
								<button
									type="button"
									onClick={() => handleSave('draft')}
									disabled={saving || !form.title.trim() || !form.price || !form.date}
									className="rounded border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
								>
									{saving ? 'Enregistrement...' : 'Sauvegarder le brouillon'}
								</button>
							)}
							<button
								type="button"
								onClick={() => handleSave(editingId ? undefined : 'published')}
								disabled={saving || !form.title.trim() || !form.price || !form.date}
								className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Publier'}
							</button>
						</div>
					</div>
				</div>
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
