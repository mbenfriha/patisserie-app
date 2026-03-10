'use client'

import { Filter, Loader2, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api/client'

interface Ingredient {
	id: string
	name: string
	category: string
	unit: string
	pricePerUnit: number
	stock: number | null
	createdAt: string
}

interface IngredientForm {
	name: string
	category: string
	unit: string
	pricePerUnit: string
	stock: string
}

const emptyForm: IngredientForm = {
	name: '',
	category: '',
	unit: '',
	pricePerUnit: '',
	stock: '',
}

const categoryColors: Record<string, string> = {
	sec: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
	frais: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
	fruits: 'bg-green-100 text-green-800 hover:bg-green-100',
	decoration: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
	autre: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export default function IngredientsPage() {
	const t = useTranslations('ingredients')
	const tc = useTranslations('common')
	const [ingredients, setIngredients] = useState<Ingredient[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [categoryFilter, setCategoryFilter] = useState<string>('all')

	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
	const [form, setForm] = useState<IngredientForm>(emptyForm)
	const [saving, setSaving] = useState(false)

	const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)
	const [deleting, setDeleting] = useState(false)

	const categoryLabels: Record<string, string> = {
		sec: t('categorySec'),
		frais: t('categoryFrais'),
		fruits: t('categoryFruits'),
		decoration: t('categoryDecoration'),
		autre: t('categoryAutre'),
	}

	const unitLabels: Record<string, string> = {
		g: t('unitG'),
		kg: t('unitKg'),
		ml: t('unitMl'),
		L: t('unitL'),
		piece: t('unitPiece'),
	}

	const fetchIngredients = useCallback(() => {
		setIsLoading(true)
		api
			.get('/patissier/ingredients')
			.then((res) => {
				const list = res.data?.data ?? res.data
				setIngredients(Array.isArray(list) ? list : [])
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	useEffect(() => {
		fetchIngredients()
	}, [fetchIngredients])

	const filteredIngredients = useMemo(() => {
		let result = ingredients
		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			result = result.filter((ing) => ing.name.toLowerCase().includes(query))
		}
		if (categoryFilter && categoryFilter !== 'all') {
			result = result.filter((ing) => ing.category === categoryFilter)
		}
		return result
	}, [ingredients, searchQuery, categoryFilter])

	const openCreateDialog = () => {
		setEditingIngredient(null)
		setForm(emptyForm)
		setDialogOpen(true)
	}

	const openEditDialog = (ingredient: Ingredient) => {
		setEditingIngredient(ingredient)
		setForm({
			name: ingredient.name,
			category: ingredient.category,
			unit: ingredient.unit,
			pricePerUnit: String(ingredient.pricePerUnit),
			stock: ingredient.stock !== null ? String(ingredient.stock) : '',
		})
		setDialogOpen(true)
	}

	const handleSave = async () => {
		if (!form.name.trim() || !form.category || !form.unit || !form.pricePerUnit) return
		setSaving(true)
		try {
			const body = {
				name: form.name,
				category: form.category,
				unit: form.unit,
				pricePerUnit: Number(form.pricePerUnit),
				stock: form.stock ? Number(form.stock) : null,
			}
			if (editingIngredient) {
				await api.put(`/patissier/ingredients/${editingIngredient.id}`, body)
			} else {
				await api.post('/patissier/ingredients', body)
			}
			toast.success(t('saved'))
			setDialogOpen(false)
			fetchIngredients()
		} catch {
			toast.error(t('error'))
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async () => {
		if (!deleteTarget) return
		setDeleting(true)
		try {
			await api.delete(`/patissier/ingredients/${deleteTarget.id}`)
			setDeleteTarget(null)
			fetchIngredients()
			toast.success(t('deleted'))
		} catch {
			toast.error(t('error'))
		} finally {
			setDeleting(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
					<p className="text-muted-foreground">{t('subtitle')}</p>
				</div>
				<Button onClick={openCreateDialog}>
					<Plus className="mr-2 size-4" />
					{t('add')}
				</Button>
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<CardTitle>{t('count', { count: filteredIngredients.length })}</CardTitle>
							<CardDescription>{t('listDescription')}</CardDescription>
						</div>
						<div className="flex flex-col gap-2 md:flex-row md:items-center">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder={t('searchPlaceholder')}
									className="w-full pl-9 md:w-64"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger className="w-full md:w-40">
									<Filter className="mr-2 size-4" />
									<SelectValue placeholder={t('category')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">{t('allCategories')}</SelectItem>
									{Object.entries(categoryLabels).map(([value, label]) => (
										<SelectItem key={value} value={value}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
						</div>
					) : filteredIngredients.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Package className="size-12 text-muted-foreground" />
							<h3 className="mt-4 text-lg font-semibold">{t('emptyTitle')}</h3>
							<p className="text-muted-foreground">{t('emptyDescription')}</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t('name')}</TableHead>
									<TableHead>{t('category')}</TableHead>
									<TableHead>{t('unit')}</TableHead>
									<TableHead className="text-right">{t('priceColumn')}</TableHead>
									<TableHead className="text-right">{t('stock')}</TableHead>
									<TableHead className="text-right">{t('actions')}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredIngredients.map((ingredient) => (
									<TableRow key={ingredient.id}>
										<TableCell className="font-medium">{ingredient.name}</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={categoryColors[ingredient.category] || ''}
											>
												{categoryLabels[ingredient.category] || ingredient.category}
											</Badge>
										</TableCell>
										<TableCell>{unitLabels[ingredient.unit] || ingredient.unit}</TableCell>
										<TableCell className="text-right font-mono">
											{formatCurrency(ingredient.pricePerUnit)}/{ingredient.unit}
										</TableCell>
										<TableCell className="text-right">
											{ingredient.stock !== null ? `${ingredient.stock} ${ingredient.unit}` : '-'}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => openEditDialog(ingredient)}
												>
													<Pencil className="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setDeleteTarget(ingredient)}
												>
													<Trash2 className="size-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{editingIngredient ? t('editTitle') : t('createTitle')}</DialogTitle>
						<DialogDescription>
							{editingIngredient ? t('editDescription') : t('createDescription')}
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">{t('name')}</Label>
							<Input
								id="name"
								value={form.name}
								onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
								placeholder={t('namePlaceholder')}
							/>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>{t('category')}</Label>
								<Select
									value={form.category}
									onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(categoryLabels).map(([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>{t('unit')}</Label>
								<Select
									value={form.unit}
									onValueChange={(value) => setForm((f) => ({ ...f, unit: value }))}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(unitLabels).map(([value, label]) => (
											<SelectItem key={value} value={value}>
												{label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="price">{t('pricePerUnit')}</Label>
								<Input
									id="price"
									type="number"
									step="0.01"
									min="0"
									value={form.pricePerUnit}
									onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="stock">{t('stock')}</Label>
								<Input
									id="stock"
									type="number"
									min="0"
									value={form.stock}
									onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							{tc('cancel')}
						</Button>
						<Button
							onClick={handleSave}
							disabled={
								saving || !form.name.trim() || !form.category || !form.unit || !form.pricePerUnit
							}
						>
							{saving ? tc('loading') : editingIngredient ? tc('save') : t('add')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
						<AlertDialogDescription>
							{t('deleteDescription', { name: deleteTarget?.name || '' })}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleting}>{tc('cancel')}</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={deleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleting ? tc('loading') : tc('delete')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
