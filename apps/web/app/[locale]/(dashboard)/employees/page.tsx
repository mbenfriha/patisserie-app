'use client'

import { Loader2, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api/client'

interface Employee {
	id: string
	name: string
	role: string | null
	hourlyRate: number
	createdAt: string
}

interface EmployeeForm {
	name: string
	role: string
	hourlyRate: string
}

const emptyForm: EmployeeForm = {
	name: '',
	role: '',
	hourlyRate: '',
}

function formatCurrency(amount: number) {
	return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

export default function EmployeesPage() {
	const t = useTranslations('employees')
	const tc = useTranslations('common')
	const [employees, setEmployees] = useState<Employee[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')

	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
	const [form, setForm] = useState<EmployeeForm>(emptyForm)
	const [saving, setSaving] = useState(false)

	const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
	const [deleting, setDeleting] = useState(false)

	const fetchEmployees = useCallback(() => {
		setIsLoading(true)
		api
			.get('/patissier/employees')
			.then((res) => {
				const list = res.data?.data ?? res.data
				setEmployees(Array.isArray(list) ? list : [])
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	useEffect(() => {
		fetchEmployees()
	}, [fetchEmployees])

	const filteredEmployees = useMemo(() => {
		if (!searchQuery) return employees
		const query = searchQuery.toLowerCase()
		return employees.filter(
			(emp) => emp.name.toLowerCase().includes(query) || emp.role?.toLowerCase().includes(query)
		)
	}, [employees, searchQuery])

	const averageHourlyRate = useMemo(() => {
		if (employees.length === 0) return 0
		return employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / employees.length
	}, [employees])

	const totalHourlyCost = useMemo(() => {
		return employees.reduce((sum, emp) => sum + emp.hourlyRate, 0)
	}, [employees])

	const openCreateDialog = () => {
		setEditingEmployee(null)
		setForm(emptyForm)
		setDialogOpen(true)
	}

	const openEditDialog = (emp: Employee) => {
		setEditingEmployee(emp)
		setForm({
			name: emp.name,
			role: emp.role ?? '',
			hourlyRate: String(emp.hourlyRate),
		})
		setDialogOpen(true)
	}

	const handleSave = async () => {
		if (!form.name.trim() || !form.hourlyRate) return
		setSaving(true)
		try {
			const body = {
				name: form.name.trim(),
				role: form.role.trim() || null,
				hourlyRate: Number(form.hourlyRate),
			}
			if (editingEmployee) {
				await api.put(`/patissier/employees/${editingEmployee.id}`, body)
			} else {
				await api.post('/patissier/employees', body)
			}
			toast.success(t('saved'))
			setDialogOpen(false)
			fetchEmployees()
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
			await api.delete(`/patissier/employees/${deleteTarget.id}`)
			setDeleteTarget(null)
			fetchEmployees()
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

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>{t('totalEmployees')}</CardDescription>
						<CardTitle className="text-3xl">{employees.length}</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>{t('avgHourlyRate')}</CardDescription>
						<CardTitle className="text-3xl">{formatCurrency(averageHourlyRate)}/h</CardTitle>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardDescription>{t('totalHourlyCost')}</CardDescription>
						<CardTitle className="text-3xl">{formatCurrency(totalHourlyCost)}/h</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div>
							<CardTitle>{t('count', { count: filteredEmployees.length })}</CardTitle>
							<CardDescription>{t('listDescription')}</CardDescription>
						</div>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder={t('searchPlaceholder')}
								className="w-full pl-9 md:w-64"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
						</div>
					) : filteredEmployees.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12">
							<Users className="size-12 text-muted-foreground" />
							<h3 className="mt-4 text-lg font-semibold">{t('emptyTitle')}</h3>
							<p className="text-muted-foreground">{t('emptyDescription')}</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t('name')}</TableHead>
									<TableHead>{t('role')}</TableHead>
									<TableHead className="text-right">{t('hourlyRate')}</TableHead>
									<TableHead className="text-right">{t('actions')}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredEmployees.map((employee) => (
									<TableRow key={employee.id}>
										<TableCell className="font-medium">{employee.name}</TableCell>
										<TableCell className="text-muted-foreground">{employee.role || '-'}</TableCell>
										<TableCell className="text-right font-mono">
											{formatCurrency(employee.hourlyRate)}/h
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => openEditDialog(employee)}
												>
													<Pencil className="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setDeleteTarget(employee)}
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
						<DialogTitle>{editingEmployee ? t('editTitle') : t('createTitle')}</DialogTitle>
						<DialogDescription>
							{editingEmployee ? t('editDescription') : t('createDescription')}
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
						<div className="space-y-2">
							<Label htmlFor="role">{t('role')}</Label>
							<Input
								id="role"
								value={form.role}
								onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
								placeholder={t('rolePlaceholder')}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="hourlyRate">{t('hourlyRate')}</Label>
							<Input
								id="hourlyRate"
								type="number"
								step="0.50"
								min="0"
								value={form.hourlyRate}
								onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							{tc('cancel')}
						</Button>
						<Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.hourlyRate}>
							{saving ? tc('loading') : editingEmployee ? tc('save') : t('add')}
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
