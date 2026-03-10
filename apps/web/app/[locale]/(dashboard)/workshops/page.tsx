'use client'

import {
	Calendar,
	Clock,
	Copy,
	ExternalLink,
	Eye,
	EyeOff,
	Globe,
	ImagePlus,
	MoreVertical,
	Pencil,
	Plus,
	Search,
	Trash2,
	Users,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'
import { useAuth } from '@/lib/providers/auth-provider'
import { getImageUrl } from '@/lib/utils/image-url'

interface Category {
	id: string
	name: string
}

interface Workshop {
	id: string
	slug: string
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
	bookingsCount?: number
}

interface WorkshopForm {
	title: string
	description: string
	price: string
	paymentMode: 'full' | 'deposit'
	depositPercent: string
	capacity: string
	durationHours: string
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
	durationHours: '2',
	durationMinutes: '0',
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
const DURATION_HOURS = Array.from({ length: 13 }, (_, i) => String(i))
const DURATION_MINUTES = ['0', '15', '30', '45']

function formatDuration(minutes: number): string {
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	if (h > 0) return `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}`
	return `${m}min`
}

function computeEndTime(startHour: string, startMinute: string, durationMinutes: number): string {
	const totalMin = Number(startHour) * 60 + Number(startMinute) + durationMinutes
	const endH = Math.floor(totalMin / 60) % 24
	const endM = totalMin % 60
	return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

const LEVELS = [
	{ value: 'tous_niveaux', label: 'Tous niveaux' },
	{ value: 'debutant', label: 'Débutant' },
	{ value: 'intermediaire', label: 'Intermédiaire' },
	{ value: 'avance', label: 'Avancé' },
]

const STATUS_BADGES: Record<
	string,
	{
		label: string
		className: string
	}
> = {
	draft: {
		label: 'Brouillon',
		className: 'text-slate-600 bg-slate-50 border-slate-200',
	},
	published: {
		label: 'Publié',
		className: 'text-green-600 bg-green-50 border-green-200',
	},
	full: {
		label: 'Complet',
		className: 'text-amber-600 bg-amber-50 border-amber-200',
	},
	completed: {
		label: 'Terminé',
		className: 'text-blue-600 bg-blue-50 border-blue-200',
	},
	cancelled: {
		label: 'Annulé',
		className: 'text-red-600 bg-red-50 border-red-200',
	},
}

function getSiteUrl(profile: { slug: string; plan: string; customDomain?: string | null }) {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
	const { hostname, protocol, port } = new URL(baseUrl)
	const portSuffix = port ? `:${port}` : ''
	if (profile.plan === 'premium' && profile.customDomain) {
		return `https://${profile.customDomain}`
	}
	if (profile.plan === 'pro') {
		return `${protocol}//${profile.slug}.${hostname}${portSuffix}`
	}
	return `${baseUrl}/${profile.slug}`
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
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [cropState, setCropState] = useState<{
		workshopId: string
		src: string
		file?: File
	} | null>(null)
	const dashboardPrefix = useDashboardPrefix()
	const { user } = useAuth()

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

	const filteredWorkshops = useMemo(() => {
		return workshops.filter((w) => {
			const matchesSearch =
				!searchQuery ||
				w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				w.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
			const matchesStatus = statusFilter === 'all' || w.status === statusFilter
			return matchesSearch && matchesStatus
		})
	}, [workshops, searchQuery, statusFilter])

	const publishedCount = workshops.filter((w) => w.status === 'published').length
	const totalBookings = workshops.reduce((sum, w) => sum + (w.bookingsCount ?? 0), 0)

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
			durationHours: String(Math.floor(w.durationMinutes / 60)),
			durationMinutes: String(w.durationMinutes % 60),
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
			const totalDurationMinutes = Number(form.durationHours) * 60 + Number(form.durationMinutes)
			const body: Record<string, unknown> = {
				title: form.title,
				description: form.description || null,
				price: Number(form.price),
				depositPercent: form.paymentMode === 'full' ? 100 : Number(form.depositPercent),
				capacity: Number(form.capacity),
				durationMinutes: totalDurationMinutes || 120,
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

	const handleDuplicate = (w: Workshop) => {
		const [h, m] = (w.startTime || '14:00').split(':')
		setEditingId(null)
		setForm({
			title: w.title,
			description: w.description || '',
			price: String(w.price),
			paymentMode: w.depositPercent >= 100 ? 'full' : 'deposit',
			depositPercent: w.depositPercent >= 100 ? '30' : String(w.depositPercent),
			capacity: String(w.capacity),
			durationHours: String(Math.floor(w.durationMinutes / 60)),
			durationMinutes: String(w.durationMinutes % 60),
			location: w.location || '',
			date: '',
			startHour: h || '14',
			startMinute: m || '00',
			whatIncluded: w.whatIncluded || '',
			level: w.level,
			categoryId: w.categoryId || '',
			isVisible: w.isVisible,
		})
		setShowModal(true)
	}

	const handleIllustrationSelect = (workshopId: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const src = URL.createObjectURL(file)
		setCropState({ workshopId, src, file })
		e.target.value = ''
	}

	const handleCropConfirm = async (blob: Blob) => {
		if (!cropState) return
		const formData = new FormData()
		formData.append('image', blob, cropState.file?.name || 'illustration.jpg')
		if (cropState.src.startsWith('blob:')) URL.revokeObjectURL(cropState.src)
		setCropState(null)
		try {
			await api.upload(`/patissier/workshops/${cropState.workshopId}/illustration`, formData)
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
		<PlanGate minPlan="pro">
			<div className="space-y-6">
				{/* ── Header ── */}
				<div className="flex items-center justify-between">
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold tracking-tight">Ateliers</h1>
							<Badge className="bg-primary/10 text-primary border-transparent">Pro</Badge>
						</div>
						<p className="text-muted-foreground">
							Gérez vos ateliers et réservations
						</p>
					</div>
					<Button onClick={openCreate}>
						<Plus />
						Nouvel atelier
					</Button>
				</div>

				{/* ── Stat Cards ── */}
				<div className="grid gap-4 sm:grid-cols-3">
					<Card>
						<CardContent className="flex items-center gap-4 p-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
								<Globe className="h-5 w-5 text-green-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Publiés</p>
								<p className="text-2xl font-bold">{publishedCount}</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="flex items-center gap-4 p-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
								<Calendar className="h-5 w-5 text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Total ateliers</p>
								<p className="text-2xl font-bold">{workshops.length}</p>
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="flex items-center gap-4 p-4">
							<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50">
								<Users className="h-5 w-5 text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Total réservations</p>
								<p className="text-2xl font-bold">{totalBookings}</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* ── Search + Filter ── */}
				<div className="flex flex-col gap-3 sm:flex-row">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Rechercher un atelier..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full sm:w-[180px]">
							<SelectValue placeholder="Tous les statuts" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Tous les statuts</SelectItem>
							<SelectItem value="draft">Brouillon</SelectItem>
							<SelectItem value="published">Publié</SelectItem>
							<SelectItem value="full">Complet</SelectItem>
							<SelectItem value="completed">Terminé</SelectItem>
							<SelectItem value="cancelled">Annulé</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* ── Workshop Grid ── */}
				{isLoading ? (
					<p className="text-muted-foreground">Chargement...</p>
				) : filteredWorkshops.length === 0 ? (
					<Card className="border-dashed">
						<CardContent className="py-12 text-center">
							<Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
							<p className="mt-3 text-muted-foreground">Aucun atelier pour le moment</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Créez votre premier atelier pour le proposer à vos clients
							</p>
							<Button className="mt-4" onClick={openCreate}>
								<Plus className="h-4 w-4" />
								Créer un atelier
							</Button>
						</CardContent>
					</Card>
				) : (
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filteredWorkshops.map((workshop) => {
							const statusInfo = STATUS_BADGES[workshop.status] || STATUS_BADGES.draft
							const participants = workshop.bookingsCount ?? 0
							const capacityPercent = workshop.capacity > 0
								? Math.min(100, Math.round((participants / workshop.capacity) * 100))
								: 0
							return (
								<Card key={workshop.id} className="group overflow-hidden p-0">
									{/* Image area */}
									<div className="relative aspect-video bg-muted">
										{workshop.images?.[0]?.url ? (
											<img
												src={getImageUrl(workshop.images[0].url) || ''}
												alt={workshop.title}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
												<ImagePlus className="h-12 w-12" />
											</div>
										)}
										{/* Status badge top-left */}
										<Badge
											variant="outline"
											className={`absolute top-2 left-2 ${statusInfo.className}`}
										>
											{statusInfo.label}
										</Badge>
										{/* Dropdown top-right */}
										<div className="absolute top-2 right-2">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="secondary"
														size="icon"
														className="h-8 w-8 bg-white/80 backdrop-blur-sm hover:bg-white"
													>
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="w-48">
													<DropdownMenuItem onClick={() => openEdit(workshop)}>
														<Pencil className="h-3.5 w-3.5" />
														Modifier
													</DropdownMenuItem>
													{user?.profile && workshop.slug && (
														<DropdownMenuItem asChild>
															<a
																href={`${getSiteUrl(user.profile)}/workshops/${workshop.slug}`}
																target="_blank"
																rel="noopener noreferrer"
															>
																<ExternalLink className="h-3.5 w-3.5" />
																Voir sur le site
															</a>
														</DropdownMenuItem>
													)}
													{workshop.status === 'draft' && (
														<DropdownMenuItem
															onClick={() => handleStatusChange(workshop.id, 'published')}
															className="text-green-600"
														>
															<Eye className="h-3.5 w-3.5" />
															Publier
														</DropdownMenuItem>
													)}
													{workshop.status === 'published' && (
														<DropdownMenuItem
															onClick={() => handleStatusChange(workshop.id, 'draft')}
														>
															<EyeOff className="h-3.5 w-3.5" />
															Dépublier
														</DropdownMenuItem>
													)}
													<DropdownMenuItem asChild>
														<label className="cursor-pointer">
															<ImagePlus className="h-3.5 w-3.5" />
															{workshop.images?.[0]
																? 'Changer illustration'
																: 'Ajouter illustration'}
															<input
																type="file"
																accept="image/*"
																className="hidden"
																onChange={(e) => handleIllustrationSelect(workshop.id, e)}
															/>
														</label>
													</DropdownMenuItem>
													{workshop.images?.[0]?.url && (
														<DropdownMenuItem
															onClick={() => handleIllustrationDelete(workshop.id)}
														>
															<Trash2 className="h-3.5 w-3.5" />
															Supprimer illustration
														</DropdownMenuItem>
													)}
													<DropdownMenuItem onClick={() => handleDuplicate(workshop)}>
														<Copy className="h-3.5 w-3.5" />
														Dupliquer
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														variant="destructive"
														onClick={() => handleDelete(workshop.id)}
													>
														<Trash2 className="h-3.5 w-3.5" />
														Supprimer
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</div>

									{/* Card content */}
									<CardContent className="p-4">
										<h3 className="font-semibold">{workshop.title}</h3>
										{workshop.category && (
											<p className="mt-0.5 text-xs text-muted-foreground">
												{workshop.category.name}
											</p>
										)}

										{/* Date + time */}
										<div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
											<Calendar className="h-3.5 w-3.5" />
											{formatDate(workshop.date)} &middot; {workshop.startTime} -{' '}
											{computeEndTime(
												workshop.startTime.split(':')[0],
												workshop.startTime.split(':')[1],
												workshop.durationMinutes
											)}
										</div>

										{/* Capacity bar */}
										<div className="mt-3">
											<div className="flex items-center justify-between text-xs text-muted-foreground">
												<span>Participants</span>
												<span>
													{participants}/{workshop.capacity}
												</span>
											</div>
											<div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full bg-primary transition-all"
													style={{ width: `${capacityPercent}%` }}
												/>
											</div>
										</div>

										{/* Price */}
										<p className="mt-3 text-lg font-bold text-primary">
											{workshop.price}&nbsp;&euro;
											<span className="text-sm font-normal text-muted-foreground">/pers</span>
										</p>

										{/* Badges: level + duration + hidden */}
										<div className="mt-2 flex flex-wrap gap-1.5">
											<Badge variant="outline">
												{LEVELS.find((l) => l.value === workshop.level)?.label || workshop.level}
											</Badge>
											<Badge variant="outline">
												<Clock className="h-3 w-3" />
												{formatDuration(workshop.durationMinutes)}
											</Badge>
											{!workshop.isVisible && (
												<Badge variant="outline">
													<EyeOff className="h-3 w-3" />
													Masqué
												</Badge>
											)}
										</div>

										{/* Action button */}
										<Button variant="outline" size="sm" className="mt-3 w-full" asChild>
											<Link href={`${dashboardPrefix}/workshops/${workshop.id}`}>
												<Eye className="h-3.5 w-3.5" />
												Voir les réservations
											</Link>
										</Button>
									</CardContent>
								</Card>
							)
						})}
					</div>
				)}

				{/* ── Create/Edit Dialog ── */}
				<Dialog open={showModal} onOpenChange={setShowModal}>
					<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
						<DialogHeader>
							<DialogTitle>
								{editingId ? "Modifier l'atelier" : 'Nouvel atelier'}
							</DialogTitle>
							<DialogDescription>
								{editingId
									? 'Modifiez les informations de votre atelier.'
									: 'Remplissez les informations pour créer un nouvel atelier.'}
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							{/* Title */}
							<div className="space-y-2">
								<Label>Titre *</Label>
								<Input
									type="text"
									value={form.title}
									onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
									placeholder="Nom de l'atelier"
								/>
							</div>

							{/* Description */}
							<div className="space-y-2">
								<Label>Description</Label>
								<RichEditor
									content={form.description}
									onChange={(html) => setForm((f) => ({ ...f, description: html }))}
									placeholder="Décrivez votre atelier..."
								/>
							</div>

							{/* Date & Time */}
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>Date *</Label>
									<Input
										type="date"
										value={form.date}
										onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label>Heure de début *</Label>
									<div className="flex items-center gap-1">
										<Select
											value={form.startHour}
											onValueChange={(v) => setForm((f) => ({ ...f, startHour: v }))}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{HOURS.map((h) => (
													<SelectItem key={h} value={h}>
														{h}h
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<span className="text-muted-foreground">:</span>
										<Select
											value={form.startMinute}
											onValueChange={(v) => setForm((f) => ({ ...f, startMinute: v }))}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{MINUTES.map((m) => (
													<SelectItem key={m} value={m}>
														{m}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									{(Number(form.durationHours) > 0 || Number(form.durationMinutes) > 0) && (
										<p className="text-xs text-muted-foreground">
											Fin estimée :{' '}
											{computeEndTime(
												form.startHour,
												form.startMinute,
												Number(form.durationHours) * 60 + Number(form.durationMinutes)
											)}
										</p>
									)}
								</div>
							</div>

							{/* Price */}
							<div className="space-y-2">
								<Label>Prix par personne (&euro;) *</Label>
								<Input
									type="number"
									min="0"
									step="0.01"
									value={form.price}
									onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
									placeholder="45"
								/>
							</div>

							{/* Payment mode */}
							<div className="space-y-2">
								<Label>Mode de paiement à la réservation</Label>
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
									<div className="space-y-2">
										<Label>Pourcentage d&apos;acompte (%)</Label>
										<Input
											type="number"
											min="1"
											max="99"
											value={form.depositPercent}
											onChange={(e) => setForm((f) => ({ ...f, depositPercent: e.target.value }))}
											placeholder="30"
										/>
									</div>
								)}

								{form.price && (
									<p className="text-sm text-muted-foreground">
										{form.paymentMode === 'full'
											? `Le client paiera ${Number(form.price).toFixed(2)} \u20AC à la réservation`
											: `Le client paiera ${((Number(form.price) * Number(form.depositPercent || 0)) / 100).toFixed(2)} \u20AC d'acompte à la réservation`}
									</p>
								)}
							</div>

							{/* Capacity & Duration */}
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>Capacité</Label>
									<Input
										type="number"
										min="1"
										value={form.capacity}
										onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
									/>
								</div>
								<div className="space-y-2">
									<Label>Durée</Label>
									<div className="flex items-center gap-2">
										<Select
											value={form.durationHours}
											onValueChange={(v) => setForm((f) => ({ ...f, durationHours: v }))}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{DURATION_HOURS.map((h) => (
													<SelectItem key={h} value={h}>
														{h}h
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Select
											value={form.durationMinutes}
											onValueChange={(v) => setForm((f) => ({ ...f, durationMinutes: v }))}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{DURATION_MINUTES.map((m) => (
													<SelectItem key={m} value={m}>
														{m}min
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>

							{/* Level & Location */}
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label>Niveau</Label>
									<Select
										value={form.level}
										onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{LEVELS.map((l) => (
												<SelectItem key={l.value} value={l.value}>
													{l.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Lieu</Label>
									<Input
										type="text"
										value={form.location}
										onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
										placeholder="Adresse ou lieu"
									/>
								</div>
							</div>

							{/* What's included */}
							<div className="space-y-2">
								<Label>Ce qui est inclus</Label>
								<RichEditor
									content={form.whatIncluded}
									onChange={(html) => setForm((f) => ({ ...f, whatIncluded: html }))}
									placeholder="Ingrédients, matériel, tablier..."
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

							{/* Visible toggle */}
							<div className="flex items-center gap-3">
								<Switch
									id="workshop-visible"
									checked={form.isVisible}
									onCheckedChange={(checked) => setForm((f) => ({ ...f, isVisible: checked }))}
								/>
								<Label htmlFor="workshop-visible">Visible sur le site</Label>
							</div>
						</div>

						{/* Actions */}
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowModal(false)}>
								Annuler
							</Button>
							{!editingId && (
								<Button
									variant="outline"
									onClick={() => handleSave('draft')}
									disabled={saving || !form.title.trim() || !form.price || !form.date}
								>
									{saving ? 'Enregistrement...' : 'Sauvegarder le brouillon'}
								</Button>
							)}
							<Button
								onClick={() => handleSave(editingId ? undefined : 'published')}
								disabled={saving || !form.title.trim() || !form.price || !form.date}
							>
								{saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Publier'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

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

				{/* ── Toast ── */}
				{toast && (
					<div className="fixed bottom-6 right-6 z-50 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg">
						{toast}
					</div>
				)}
			</div>
		</PlanGate>
	)
}
