'use client'

import {
	Eye,
	EyeOff,
	FolderOpen,
	GripVertical,
	MoreHorizontal,
	Pencil,
	Plus,
	Search,
	Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

interface Category {
	id: string
	name: string
	slug: string
	description: string | null
	sortOrder: number
	isVisible: boolean
}

interface CategoryForm {
	name: string
	description: string
	isVisible: boolean
}

const emptyForm: CategoryForm = {
	name: '',
	description: '',
	isVisible: true,
}

export default function CategoriesPage() {
	const [categories, setCategories] = useState<Category[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [toast, setToast] = useState<string | null>(null)

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingCategory, setEditingCategory] = useState<Category | null>(null)
	const [form, setForm] = useState<CategoryForm>(emptyForm)
	const [saving, setSaving] = useState(false)

	// Delete confirmation
	const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
	const [deleting, setDeleting] = useState(false)

	const showToast = (message: string) => {
		setToast(message)
		setTimeout(() => setToast(null), 3000)
	}

	const fetchCategories = useCallback(() => {
		setIsLoading(true)
		api
			.get('/patissier/categories')
			.then((res) => {
				const list = res.data?.data ?? res.data
				setCategories(Array.isArray(list) ? list : [])
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	useEffect(() => {
		fetchCategories()
	}, [fetchCategories])

	const filteredCategories = useMemo(() => {
		if (!searchQuery) return categories
		const query = searchQuery.toLowerCase()
		return categories.filter(
			(cat) =>
				cat.name.toLowerCase().includes(query) ||
				(cat.description && cat.description.toLowerCase().includes(query))
		)
	}, [categories, searchQuery])

	const visibleCount = categories.filter((c) => c.isVisible).length
	const hiddenCount = categories.filter((c) => !c.isVisible).length

	const openCreateDialog = () => {
		setEditingCategory(null)
		setForm(emptyForm)
		setDialogOpen(true)
	}

	const openEditDialog = (cat: Category) => {
		setEditingCategory(cat)
		setForm({
			name: cat.name,
			description: cat.description ?? '',
			isVisible: cat.isVisible,
		})
		setDialogOpen(true)
	}

	const handleSave = async () => {
		if (!form.name.trim()) return
		setSaving(true)
		try {
			if (editingCategory) {
				await api.put(`/patissier/categories/${editingCategory.id}`, {
					name: form.name,
					description: form.description || null,
					isVisible: form.isVisible,
				})
				showToast('Catégorie modifiée avec succès')
			} else {
				await api.post('/patissier/categories', {
					name: form.name,
					description: form.description || null,
					isVisible: form.isVisible,
				})
				showToast('Catégorie créée avec succès')
			}
			setDialogOpen(false)
			fetchCategories()
		} catch (err) {
			console.error(err)
			showToast('Erreur lors de la sauvegarde')
		} finally {
			setSaving(false)
		}
	}

	const handleToggleVisibility = async (cat: Category) => {
		try {
			await api.put(`/patissier/categories/${cat.id}`, {
				isVisible: !cat.isVisible,
			})
			fetchCategories()
			showToast(cat.isVisible ? 'Catégorie masquée' : 'Catégorie affichée')
		} catch (err) {
			console.error(err)
			showToast('Erreur lors de la modification')
		}
	}

	const handleDelete = async () => {
		if (!deleteTarget) return
		setDeleting(true)
		try {
			await api.delete(`/patissier/categories/${deleteTarget.id}`)
			setDeleteTarget(null)
			fetchCategories()
			showToast('Catégorie supprimée avec succès')
		} catch (err) {
			console.error(err)
			showToast('Erreur lors de la suppression')
		} finally {
			setDeleting(false)
		}
	}

	return (
		<div className="space-y-6">
			{toast && (
				<div className="fixed right-4 top-4 z-[60] rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg">
					{toast}
				</div>
			)}

			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Catégories</h1>
					<p className="text-muted-foreground">
						Organisez vos créations, produits et ateliers
					</p>
				</div>
				<Button onClick={openCreateDialog}>
					<Plus className="mr-2 size-4" />
					Nouvelle catégorie
				</Button>
			</div>

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="py-4">
					<CardContent className="flex items-center gap-4">
						<div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
							<FolderOpen className="size-5" />
						</div>
						<div>
							<p className="text-2xl font-bold">{categories.length}</p>
							<p className="text-sm text-muted-foreground">Total</p>
						</div>
					</CardContent>
				</Card>
				<Card className="py-4">
					<CardContent className="flex items-center gap-4">
						<div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600">
							<Eye className="size-5" />
						</div>
						<div>
							<p className="text-2xl font-bold">{visibleCount}</p>
							<p className="text-sm text-muted-foreground">Visibles</p>
						</div>
					</CardContent>
				</Card>
				<Card className="py-4">
					<CardContent className="flex items-center gap-4">
						<div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
							<EyeOff className="size-5" />
						</div>
						<div>
							<p className="text-2xl font-bold">{hiddenCount}</p>
							<p className="text-sm text-muted-foreground">Masquées</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search */}
			<div className="relative max-w-sm">
				<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Rechercher une catégorie..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Content */}
			{isLoading ? (
				<p className="text-muted-foreground">Chargement...</p>
			) : filteredCategories.length === 0 ? (
				<Card className="py-12">
					<CardContent className="text-center">
						<FolderOpen className="mx-auto size-12 text-muted-foreground" />
						<p className="mt-4 text-lg font-semibold">Aucune catégorie trouvée</p>
						<p className="text-sm text-muted-foreground">
							{searchQuery
								? 'Essayez de modifier votre recherche'
								: 'Créez votre première catégorie pour organiser vos créations'}
						</p>
						{!searchQuery && (
							<Button onClick={openCreateDialog} className="mt-4">
								<Plus className="mr-2 size-4" />
								Créer une catégorie
							</Button>
						)}
					</CardContent>
				</Card>
			) : (
				<>
					{/* Mobile: card list */}
					<div className="space-y-3 sm:hidden">
						{filteredCategories.map((cat) => (
							<Card key={cat.id} className="py-4">
								<CardContent className="relative">
									<div className="flex items-start justify-between pr-8">
										<div className="flex items-center gap-3">
											<GripVertical className="size-4 shrink-0 text-muted-foreground" />
											<div>
												<div className="flex items-center gap-2">
													<FolderOpen className="size-4 text-muted-foreground" />
													<span className="font-medium">{cat.name}</span>
												</div>
												{cat.description && (
													<p className="mt-1 text-sm text-muted-foreground">
														{cat.description}
													</p>
												)}
											</div>
										</div>
										<Badge
											variant={cat.isVisible ? 'default' : 'secondary'}
											className="shrink-0"
										>
											{cat.isVisible ? 'Visible' : 'Masqué'}
										</Badge>
									</div>
									<div className="absolute right-4 top-0">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm" className="size-8 p-0">
													<MoreHorizontal className="size-4" />
													<span className="sr-only">Actions</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => openEditDialog(cat)}>
													<Pencil className="size-4" />
													Modifier
												</DropdownMenuItem>
												<DropdownMenuItem onClick={() => handleToggleVisibility(cat)}>
													{cat.isVisible ? (
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
												<DropdownMenuSeparator />
												<DropdownMenuItem
													variant="destructive"
													onClick={() => setDeleteTarget(cat)}
												>
													<Trash2 className="size-4" />
													Supprimer
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{/* Desktop: table */}
					<Card className="hidden sm:block">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10" />
									<TableHead>Nom</TableHead>
									<TableHead>Statut</TableHead>
									<TableHead className="w-10">
										<span className="sr-only">Actions</span>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCategories.map((cat) => (
									<TableRow key={cat.id}>
										<TableCell>
											<GripVertical className="size-4 text-muted-foreground" />
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-3">
												<div className="flex size-8 items-center justify-center rounded-md bg-muted">
													<FolderOpen className="size-4 text-muted-foreground" />
												</div>
												<div>
													<p className="font-medium">{cat.name}</p>
													{cat.description && (
														<p className="text-sm text-muted-foreground">
															{cat.description}
														</p>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant={cat.isVisible ? 'default' : 'secondary'}>
												{cat.isVisible ? 'Visible' : 'Masqué'}
											</Badge>
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm" className="size-8 p-0">
														<MoreHorizontal className="size-4" />
														<span className="sr-only">Actions</span>
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => openEditDialog(cat)}>
														<Pencil className="size-4" />
														Modifier
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleToggleVisibility(cat)}>
														{cat.isVisible ? (
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
													<DropdownMenuSeparator />
													<DropdownMenuItem
														variant="destructive"
														onClick={() => setDeleteTarget(cat)}
													>
														<Trash2 className="size-4" />
														Supprimer
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>
				</>
			)}

			{/* Create / Edit dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
						</DialogTitle>
						<DialogDescription>
							{editingCategory
								? 'Modifiez les informations de la catégorie.'
								: 'Créez une nouvelle catégorie pour organiser vos créations.'}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="category-name">Nom</Label>
							<Input
								id="category-name"
								value={form.name}
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
								placeholder="Ex: Gâteaux d'anniversaire"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="category-description">Description (optionnel)</Label>
							<Textarea
								id="category-description"
								value={form.description}
								onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
								placeholder="Décrivez cette catégorie..."
								rows={3}
							/>
						</div>
						<div className="flex items-center justify-between rounded-lg border p-3">
							<div className="space-y-0.5">
								<Label htmlFor="category-visible">Visible</Label>
								<p className="text-sm text-muted-foreground">
									Rendre cette catégorie visible sur votre site
								</p>
							</div>
							<Switch
								id="category-visible"
								checked={form.isVisible}
								onCheckedChange={(checked) =>
									setForm((f) => ({ ...f, isVisible: checked }))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							Annuler
						</Button>
						<Button onClick={handleSave} disabled={saving || !form.name.trim()}>
							{saving
								? editingCategory
									? 'Modification...'
									: 'Création...'
								: editingCategory
									? 'Modifier'
									: 'Créer'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete confirmation dialog */}
			<Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Supprimer la catégorie</DialogTitle>
						<DialogDescription>
							Vous êtes sur le point de supprimer la catégorie{' '}
							<strong>{deleteTarget?.name}</strong>. Les créations, produits et ateliers
							associés ne seront plus classés. Cette action est irréversible.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteTarget(null)}
							disabled={deleting}
						>
							Annuler
						</Button>
						<Button variant="destructive" onClick={handleDelete} disabled={deleting}>
							{deleting ? 'Suppression...' : 'Supprimer'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
