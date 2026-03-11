'use client'

import {
	AlertCircle,
	Check,
	CheckCircle,
	Clock,
	Eye,
	Filter,
	LinkIcon,
	MoreHorizontal,
	Package,
	Pencil,
	Plus,
	Search,
	ShoppingBag,
	Trash2,
	Truck,
	XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PlanGate } from '@/components/auth/plan-gate'
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
import { Textarea } from '@/components/ui/textarea'
import { Link } from '@/i18n/navigation'
import { api } from '@/lib/api/client'
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'
import { useAuth } from '@/lib/providers/auth-provider'

interface Order {
	id: string
	orderNumber: string
	clientName: string
	type: 'catalogue' | 'custom'
	status: string
	total: number | null
	requestedDate: string | null
	paymentStatus: 'pending' | 'paid' | 'refunded'
	createdAt: string
}

interface ProductOption {
	id: string
	name: string
	price: number
}

interface CartItem {
	product_id: string
	name: string
	price: number
	quantity: number
}

interface CreateForm {
	type: 'custom' | 'catalogue'
	clientName: string
	clientEmail: string
	clientPhone: string
	requestedDate: string
	deliveryMethod: 'pickup' | 'delivery'
	deliveryAddress: string
	deliveryNotes: string
	patissierNotes: string
	total: string
	depositPercent: string
	depositPaid: boolean
	customType: string
	customNbPersonnes: string
	customDateSouhaitee: string
	customTheme: string
	customAllergies: string
	customMessage: string
}

const emptyForm: CreateForm = {
	type: 'custom',
	clientName: '',
	clientEmail: '',
	clientPhone: '',
	requestedDate: '',
	deliveryMethod: 'pickup',
	deliveryAddress: '',
	deliveryNotes: '',
	patissierNotes: '',
	total: '',
	depositPercent: '100',
	depositPaid: false,
	customType: '',
	customNbPersonnes: '',
	customDateSouhaitee: '',
	customTheme: '',
	customAllergies: '',
	customMessage: '',
}

const statusColors: Record<string, string> = {
	pending: 'text-amber-600 bg-amber-50 border-amber-200',
	confirmed: 'text-blue-600 bg-blue-50 border-blue-200',
	in_progress: 'text-purple-600 bg-purple-50 border-purple-200',
	ready: 'text-green-600 bg-green-50 border-green-200',
	delivered: 'text-gray-600 bg-gray-50 border-gray-200',
	picked_up: 'text-gray-600 bg-gray-50 border-gray-200',
	cancelled: 'text-red-600 bg-red-50 border-red-200',
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
	pending: AlertCircle,
	confirmed: CheckCircle,
	in_progress: Clock,
	ready: Package,
	delivered: Truck,
	picked_up: CheckCircle,
	cancelled: XCircle,
}

const paymentStatusColors: Record<string, string> = {
	paid: 'text-green-600 bg-green-50 border-green-200',
	pending: 'text-amber-600 bg-amber-50 border-amber-200',
	refunded: 'text-red-600 bg-red-50 border-red-200',
}

function getSiteUrl(profile: { slug: string; plan: string; customDomain?: string | null }) {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
	const { hostname, protocol, port } = new URL(baseUrl)
	const portSuffix = port ? `:${port}` : ''
	if (profile.plan === 'premium' && profile.customDomain) return `https://${profile.customDomain}`
	if (profile.plan === 'pro') return `${protocol}//${profile.slug}.${hostname}${portSuffix}`
	return `${baseUrl}/${profile.slug}`
}

export default function OrdersPage() {
	const t = useTranslations('orders')
	const tc = useTranslations('common')
	const { user } = useAuth()
	const [orders, setOrders] = useState<Order[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [copied, setCopied] = useState<string | null>(null)
	const dashboardPrefix = useDashboardPrefix()
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<string>('all')

	// Create modal state
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [form, setForm] = useState<CreateForm>(emptyForm)
	const [cartItems, setCartItems] = useState<CartItem[]>([])
	const [products, setProducts] = useState<ProductOption[]>([])
	const [selectedProductId, setSelectedProductId] = useState('')
	const [selectedQuantity, setSelectedQuantity] = useState(1)
	const [saving, setSaving] = useState(false)
	const [photoFiles, setPhotoFiles] = useState<File[]>([])
	const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
	const [deleteTarget, setDeleteTarget] = useState<Order | null>(null)
	const [deleting, setDeleting] = useState(false)

	const getStatusLabel = (status: string) => {
		const map: Record<string, string> = {
			pending: t('statusPending'),
			confirmed: t('statusConfirmed'),
			in_progress: t('statusInProgress'),
			ready: t('statusReady'),
			delivered: t('statusDelivered'),
			picked_up: t('statusPickedUp'),
			cancelled: t('statusCancelled'),
		}
		return map[status] || status
	}

	const getPaymentStatusLabel = (status: string) => {
		const map: Record<string, string> = {
			paid: t('paymentPaid'),
			pending: t('paymentPending'),
			refunded: t('paymentRefunded'),
		}
		return map[status] || status
	}

	const getTypeLabel = (type: string) => {
		const map: Record<string, string> = {
			catalogue: t('typeCatalogue'),
			custom: t('typeCustom'),
		}
		return map[type] || type
	}

	function StatusBadge({ status }: { status: string }) {
		const Icon = statusIcons[status]
		return (
			<Badge variant="outline" className={statusColors[status] || ''}>
				{Icon && <Icon className="mr-1 size-3" />}
				{getStatusLabel(status)}
			</Badge>
		)
	}

	const devisUrl = useMemo(() => {
		if (!user?.profile) return null
		return `${getSiteUrl(user.profile)}/commandes?tab=devis`
	}, [user?.profile])

	const catalogueUrl = useMemo(() => {
		if (!user?.profile) return null
		return `${getSiteUrl(user.profile)}/commandes?tab=catalogue`
	}, [user?.profile])

	const copyLink = (url: string, label: string) => {
		navigator.clipboard.writeText(url)
		setCopied(label)
		setTimeout(() => setCopied(null), 2000)
	}

	const fetchOrders = useCallback(() => {
		setIsLoading(true)
		api
			.get('/patissier/orders')
			.then((res) => {
				const payload = res.data?.data
				const list = Array.isArray(payload) ? payload : (payload?.data ?? [])
				setOrders(list)
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	useEffect(() => {
		fetchOrders()
	}, [fetchOrders])

	useEffect(() => {
		if (form.type === 'catalogue' && products.length === 0) {
			api
				.get('/patissier/products?limit=200')
				.then((res) => {
					const payload = res.data?.data
					const list = Array.isArray(payload) ? payload : (payload?.data ?? [])
					setProducts(list)
				})
				.catch(console.error)
		}
	}, [form.type, products.length])

	const filteredOrders = useMemo(() => {
		return orders.filter((order) => {
			const matchesSearch =
				!searchQuery ||
				order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.clientName.toLowerCase().includes(searchQuery.toLowerCase())
			const matchesStatus = statusFilter === 'all' || order.status === statusFilter
			return matchesSearch && matchesStatus
		})
	}, [orders, searchQuery, statusFilter])

	const pendingCount = orders.filter((o) => o.status === 'pending').length
	const activeCount = orders.filter((o) =>
		['confirmed', 'in_progress', 'ready'].includes(o.status)
	).length

	const openCreateModal = () => {
		setForm(emptyForm)
		setCartItems([])
		setSelectedProductId('')
		setSelectedQuantity(1)
		setPhotoFiles([])
		setPhotoPreviews([])
		setShowCreateModal(true)
	}

	const addCartItem = () => {
		const product = products.find((p) => p.id === selectedProductId)
		if (!product) return

		const existing = cartItems.find((i) => i.product_id === selectedProductId)
		if (existing) {
			setCartItems((items) =>
				items.map((i) =>
					i.product_id === selectedProductId ? { ...i, quantity: i.quantity + selectedQuantity } : i
				)
			)
		} else {
			setCartItems((items) => [
				...items,
				{
					product_id: product.id,
					name: product.name,
					price: product.price,
					quantity: selectedQuantity,
				},
			])
		}
		setSelectedProductId('')
		setSelectedQuantity(1)
	}

	const removeCartItem = (productId: string) => {
		setCartItems((items) => items.filter((i) => i.product_id !== productId))
	}

	const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
	const hasItems = cartItems.length > 0 || !!selectedProductId
	const canSave =
		form.clientName.trim() && form.clientEmail.trim() && (form.type === 'custom' || hasItems)

	const handleSave = async () => {
		if (!canSave) return
		setSaving(true)
		try {
			let finalCartItems = cartItems
			if (form.type === 'catalogue' && selectedProductId) {
				const product = products.find((p) => p.id === selectedProductId)
				if (product) {
					const existing = finalCartItems.find((i) => i.product_id === selectedProductId)
					if (existing) {
						finalCartItems = finalCartItems.map((i) =>
							i.product_id === selectedProductId
								? { ...i, quantity: i.quantity + selectedQuantity }
								: i
						)
					} else {
						finalCartItems = [
							...finalCartItems,
							{
								product_id: product.id,
								name: product.name,
								price: product.price,
								quantity: selectedQuantity,
							},
						]
					}
				}
			}

			const formData = new FormData()
			formData.append('type', form.type)
			formData.append('clientName', form.clientName)
			formData.append('clientEmail', form.clientEmail)
			if (form.clientPhone) formData.append('clientPhone', form.clientPhone)
			if (form.requestedDate) formData.append('requestedDate', form.requestedDate)
			formData.append('deliveryMethod', form.deliveryMethod)
			if (form.patissierNotes) formData.append('patissierNotes', form.patissierNotes)
			if (form.total) {
				formData.append('total', form.total)
				formData.append('depositPercent', form.depositPercent)
			}
			if (form.depositPaid) formData.append('paymentStatus', 'paid')
			if (form.deliveryMethod === 'delivery') {
				if (form.deliveryAddress) formData.append('deliveryAddress', form.deliveryAddress)
				if (form.deliveryNotes) formData.append('deliveryNotes', form.deliveryNotes)
			}
			if (form.type === 'catalogue') {
				formData.append(
					'items',
					JSON.stringify(
						finalCartItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
					)
				)
			} else {
				if (form.customType) formData.append('customType', form.customType)
				if (form.customNbPersonnes) formData.append('customNbPersonnes', form.customNbPersonnes)
				if (form.customDateSouhaitee)
					formData.append('customDateSouhaitee', form.customDateSouhaitee)
				if (form.customTheme) formData.append('customTheme', form.customTheme)
				if (form.customAllergies) formData.append('customAllergies', form.customAllergies)
				if (form.customMessage) formData.append('customMessage', form.customMessage)
				for (const file of photoFiles) {
					formData.append('customPhotos', file)
				}
			}

			await api.upload('/patissier/orders', formData)
			setShowCreateModal(false)
			fetchOrders()
			toast(t('created'))
		} catch (err) {
			console.error(err)
			toast.error(t('error'))
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async () => {
		if (!deleteTarget) return
		setDeleting(true)
		try {
			await api.delete(`/patissier/orders/${deleteTarget.id}`)
			setDeleteTarget(null)
			fetchOrders()
			toast(t('deleted'))
		} catch (err) {
			console.error(err)
			toast.error(t('error'))
		} finally {
			setDeleting(false)
		}
	}

	return (
		<PlanGate minPlan="pro">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
							<Badge variant="secondary" className="text-xs">
								{tc('pro')}
							</Badge>
						</div>
						<p className="text-muted-foreground">{t('subtitle')}</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button onClick={openCreateModal}>
							<Plus className="mr-2 size-4" />
							{t('newOrder')}
						</Button>
						{devisUrl && (
							<Button variant="outline" onClick={() => copyLink(devisUrl, 'devis')}>
								{copied === 'devis' ? (
									<>
										<Check className="mr-2 size-4 text-green-500" />
										<span className="text-green-600">{t('copied')}</span>
									</>
								) : (
									<>
										<LinkIcon className="mr-2 size-4" />
										{t('linkQuote')}
									</>
								)}
							</Button>
						)}
						{catalogueUrl && (
							<Button variant="outline" onClick={() => copyLink(catalogueUrl, 'catalogue')}>
								{copied === 'catalogue' ? (
									<>
										<Check className="mr-2 size-4 text-green-500" />
										<span className="text-green-600">{t('copied')}</span>
									</>
								) : (
									<>
										<LinkIcon className="mr-2 size-4" />
										{t('linkCatalogue')}
									</>
								)}
							</Button>
						)}
					</div>
				</div>

				{/* Stat cards */}
				<div className="grid gap-4 md:grid-cols-3">
					<Card className="py-4">
						<CardContent className="flex items-center gap-4">
							<div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
								<AlertCircle className="size-5" />
							</div>
							<div>
								<p className="text-2xl font-bold">{pendingCount}</p>
								<p className="text-sm text-muted-foreground">{t('pendingOrders')}</p>
							</div>
						</CardContent>
					</Card>
					<Card className="py-4">
						<CardContent className="flex items-center gap-4">
							<div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
								<Clock className="size-5" />
							</div>
							<div>
								<p className="text-2xl font-bold">{activeCount}</p>
								<p className="text-sm text-muted-foreground">{t('activeOrders')}</p>
							</div>
						</CardContent>
					</Card>
					<Card className="py-4">
						<CardContent className="flex items-center gap-4">
							<div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600">
								<CheckCircle className="size-5" />
							</div>
							<div>
								<p className="text-2xl font-bold">{orders.length}</p>
								<p className="text-sm text-muted-foreground">{t('totalOrders')}</p>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Search + filter */}
				<div className="flex flex-col gap-4 md:flex-row md:items-center">
					<div className="relative max-w-sm flex-1">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={t('searchPlaceholder')}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[200px]">
							<Filter className="mr-2 size-4" />
							<SelectValue placeholder={t('allStatuses')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t('allStatuses')}</SelectItem>
							<SelectItem value="pending">{t('statusPending')}</SelectItem>
							<SelectItem value="confirmed">{t('statusConfirmed')}</SelectItem>
							<SelectItem value="in_progress">{t('statusInProgress')}</SelectItem>
							<SelectItem value="ready">{t('statusReady')}</SelectItem>
							<SelectItem value="delivered">{t('statusDelivered')}</SelectItem>
							<SelectItem value="picked_up">{t('statusPickedUp')}</SelectItem>
							<SelectItem value="cancelled">{t('statusCancelled')}</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{isLoading ? (
					<p className="text-muted-foreground">{tc('loading')}</p>
				) : filteredOrders.length === 0 ? (
					<Card className="py-12">
						<CardContent className="text-center">
							<Package className="mx-auto size-12 text-muted-foreground" />
							<p className="mt-4 text-lg font-semibold">{t('emptyTitle')}</p>
							<p className="text-sm text-muted-foreground">
								{searchQuery || statusFilter !== 'all' ? t('emptyFiltered') : t('emptyDefault')}
							</p>
						</CardContent>
					</Card>
				) : (
					<>
						{/* Mobile: card list */}
						<div className="space-y-3 sm:hidden">
							{filteredOrders.map((order) => (
								<Card key={order.id} className="py-4">
									<CardContent className="relative">
										<Link href={`${dashboardPrefix}/orders/${order.id}`} className="block">
											<div className="flex items-center justify-between pr-8">
												<span className="font-mono text-sm font-medium text-primary">
													{order.orderNumber}
												</span>
												<StatusBadge status={order.status} />
											</div>
											<div className="mt-2 flex items-center justify-between text-sm">
												<span className="text-foreground">{order.clientName}</span>
												<span className="font-medium">
													{order.total != null ? `${Number(order.total).toFixed(2)} €` : '-'}
												</span>
											</div>
											<div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
												<span className="flex items-center gap-2">
													<Badge variant="outline" className="text-[10px]">
														{getTypeLabel(order.type)}
													</Badge>
													<Badge
														variant="outline"
														className={`text-[10px] ${paymentStatusColors[order.paymentStatus] || ''}`}
													>
														{getPaymentStatusLabel(order.paymentStatus)}
													</Badge>
												</span>
												<span>
													{order.requestedDate
														? new Date(order.requestedDate).toLocaleDateString('fr-FR')
														: '-'}
												</span>
											</div>
										</Link>
										<div className="absolute right-4 top-0">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<button
														type="button"
														className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
													>
														<MoreHorizontal className="size-4" />
													</button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem asChild>
														<Link href={`${dashboardPrefix}/orders/${order.id}`}>
															<Eye className="mr-2 size-4" />
															{t('viewOrder')}
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem asChild>
														<Link href={`${dashboardPrefix}/orders/${order.id}?edit=1`}>
															<Pencil className="mr-2 size-4" />
															{tc('edit')}
														</Link>
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														variant="destructive"
														onClick={() => setDeleteTarget(order)}
													>
														<Trash2 className="mr-2 size-4" />
														{tc('delete')}
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
									<TableRow className="bg-muted/50">
										<TableHead className="px-4">{t('orderNumber')}</TableHead>
										<TableHead className="px-4">{t('client')}</TableHead>
										<TableHead className="px-4">{t('type')}</TableHead>
										<TableHead className="px-4">{t('status')}</TableHead>
										<TableHead className="px-4">{t('total')}</TableHead>
										<TableHead className="hidden px-4 md:table-cell">
											{t('requestedDate')}
										</TableHead>
										<TableHead className="hidden px-4 md:table-cell">{t('payment')}</TableHead>
										<TableHead className="w-10 px-2" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredOrders.map((order) => (
										<TableRow key={order.id}>
											<TableCell className="px-4">
												<Link
													href={`${dashboardPrefix}/orders/${order.id}`}
													className="font-mono text-primary hover:underline"
												>
													{order.orderNumber}
												</Link>
											</TableCell>
											<TableCell className="px-4">
												<div>
													<div className="font-medium">{order.clientName}</div>
												</div>
											</TableCell>
											<TableCell className="px-4">
												<Badge variant="outline">{getTypeLabel(order.type)}</Badge>
											</TableCell>
											<TableCell className="px-4">
												<StatusBadge status={order.status} />
											</TableCell>
											<TableCell className="px-4 font-medium">
												{order.total != null ? `${Number(order.total).toFixed(2)} €` : '-'}
											</TableCell>
											<TableCell className="hidden px-4 text-muted-foreground md:table-cell">
												{order.requestedDate
													? new Date(order.requestedDate).toLocaleDateString('fr-FR')
													: '-'}
											</TableCell>
											<TableCell className="hidden px-4 md:table-cell">
												<Badge
													variant="outline"
													className={paymentStatusColors[order.paymentStatus] || ''}
												>
													{getPaymentStatusLabel(order.paymentStatus)}
												</Badge>
											</TableCell>
											<TableCell className="px-2 text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<button
															type="button"
															className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
														>
															<MoreHorizontal className="size-4" />
														</button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem asChild>
															<Link href={`${dashboardPrefix}/orders/${order.id}`}>
																<Eye className="mr-2 size-4" />
																{t('viewOrder')}
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem asChild>
															<Link href={`${dashboardPrefix}/orders/${order.id}?edit=1`}>
																<Pencil className="mr-2 size-4" />
																{tc('edit')}
															</Link>
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															variant="destructive"
															onClick={() => setDeleteTarget(order)}
														>
															<Trash2 className="mr-2 size-4" />
															{tc('delete')}
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

				{/* Delete confirmation dialog */}
				<Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t('deleteTitle')}</DialogTitle>
							<DialogDescription>
								{t('deleteDescription', {
									orderNumber: deleteTarget?.orderNumber ?? '',
									clientName: deleteTarget?.clientName ?? '',
								})}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
								{tc('cancel')}
							</Button>
							<Button variant="destructive" onClick={handleDelete} disabled={deleting}>
								{deleting ? tc('deleting') : tc('delete')}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				{/* Create order dialog */}
				<Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
					<DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
						<DialogHeader>
							<DialogTitle>{t('createTitle')}</DialogTitle>
							<DialogDescription>{t('createDescription')}</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							{/* Type toggle */}
							<div className="grid grid-cols-2 gap-4">
								<button
									type="button"
									onClick={() => setForm((f) => ({ ...f, type: 'custom' }))}
									className={`rounded-lg border-2 p-4 text-left transition-colors ${
										form.type === 'custom'
											? 'border-primary bg-primary/5'
											: 'border-muted hover:border-muted-foreground/20'
									}`}
								>
									<Package className="mb-2 size-6" />
									<p className="font-medium">{t('customOrder')}</p>
									<p className="text-sm text-muted-foreground">{t('customOrderDesc')}</p>
								</button>
								<button
									type="button"
									onClick={() => setForm((f) => ({ ...f, type: 'catalogue' }))}
									className={`rounded-lg border-2 p-4 text-left transition-colors ${
										form.type === 'catalogue'
											? 'border-primary bg-primary/5'
											: 'border-muted hover:border-muted-foreground/20'
									}`}
								>
									<ShoppingBag className="mb-2 size-6" />
									<p className="font-medium">{t('catalogueOrder')}</p>
									<p className="text-sm text-muted-foreground">{t('catalogueOrderDesc')}</p>
								</button>
							</div>

							{/* Common fields */}
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<Label className="mb-1">
										{t('clientName')} <span className="text-destructive">*</span>
									</Label>
									<Input
										value={form.clientName}
										onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
										placeholder="Jean Dupont"
									/>
								</div>
								<div>
									<Label className="mb-1">
										{t('clientEmail')} <span className="text-destructive">*</span>
									</Label>
									<Input
										type="email"
										value={form.clientEmail}
										onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
										placeholder="jean@exemple.com"
									/>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<Label className="mb-1">{t('phone')}</Label>
									<Input
										type="tel"
										value={form.clientPhone}
										onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
										placeholder="06 12 34 56 78"
									/>
								</div>
								<div>
									<Label className="mb-1">{t('requestedDate')}</Label>
									<Input
										type="date"
										value={form.requestedDate}
										onChange={(e) => setForm((f) => ({ ...f, requestedDate: e.target.value }))}
									/>
								</div>
							</div>

							<div>
								<Label className="mb-1">{t('deliveryMethod')}</Label>
								<div className="flex gap-4">
									<label className="flex items-center gap-2 text-sm">
										<input
											type="radio"
											name="deliveryMethod"
											checked={form.deliveryMethod === 'pickup'}
											onChange={() => setForm((f) => ({ ...f, deliveryMethod: 'pickup' }))}
											className="size-4"
										/>
										{t('pickup')}
									</label>
									<label className="flex items-center gap-2 text-sm">
										<input
											type="radio"
											name="deliveryMethod"
											checked={form.deliveryMethod === 'delivery'}
											onChange={() => setForm((f) => ({ ...f, deliveryMethod: 'delivery' }))}
											className="size-4"
										/>
										{t('delivery')}
									</label>
								</div>
							</div>

							{form.deliveryMethod === 'delivery' && (
								<>
									<div>
										<Label className="mb-1">{t('deliveryAddress')}</Label>
										<Input
											value={form.deliveryAddress}
											onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
											placeholder="123 rue de la Paix, 75001 Paris"
										/>
									</div>
									<div>
										<Label className="mb-1">{t('deliveryNotes')}</Label>
										<Input
											value={form.deliveryNotes}
											onChange={(e) => setForm((f) => ({ ...f, deliveryNotes: e.target.value }))}
											placeholder="Code d'entrée, étage..."
										/>
									</div>
								</>
							)}

							<div>
								<Label className="mb-1">{t('internalNotes')}</Label>
								<Textarea
									value={form.patissierNotes}
									onChange={(e) => setForm((f) => ({ ...f, patissierNotes: e.target.value }))}
									rows={2}
									placeholder={t('internalNotesPlaceholder')}
								/>
							</div>

							{/* Payment section */}
							<div className="space-y-3 rounded-lg border bg-muted/30 p-3">
								<Label>{t('paymentSection')}</Label>
								<div className="grid gap-4 sm:grid-cols-2">
									<div>
										<Label className="mb-1 text-xs text-muted-foreground">{t('totalAmount')}</Label>
										<Input
											type="number"
											step="0.01"
											min="0"
											value={form.total}
											onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))}
											placeholder="0.00"
										/>
									</div>
									<div>
										<Label className="mb-1 text-xs text-muted-foreground">
											{t('depositPercent')}
										</Label>
										<Select
											value={form.depositPercent}
											onValueChange={(value) => setForm((f) => ({ ...f, depositPercent: value }))}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="30">30%</SelectItem>
												<SelectItem value="50">50%</SelectItem>
												<SelectItem value="70">70%</SelectItem>
												<SelectItem value="100">{t('deposit100')}</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								{form.total && (
									<p className="text-xs text-muted-foreground">
										{t('depositAmount')}{' '}
										<strong>
											{((Number(form.total) * Number(form.depositPercent)) / 100).toFixed(2)} €
										</strong>
									</p>
								)}
								<label className="flex items-center gap-2 text-sm">
									<input
										type="checkbox"
										checked={form.depositPaid}
										onChange={(e) => setForm((f) => ({ ...f, depositPaid: e.target.checked }))}
										className="size-4 rounded border"
									/>
									{t('depositAlreadyPaid')}
								</label>
							</div>

							{/* Catalogue-specific */}
							{form.type === 'catalogue' && (
								<div className="space-y-3 rounded-lg border bg-muted/30 p-3">
									<Label>{t('articles')}</Label>
									<div className="flex gap-2">
										<Select value={selectedProductId} onValueChange={setSelectedProductId}>
											<SelectTrigger className="flex-1">
												<SelectValue placeholder={t('selectProduct')} />
											</SelectTrigger>
											<SelectContent>
												{products.map((p) => (
													<SelectItem key={p.id} value={p.id}>
														{p.name} — {p.price} €
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Input
											type="number"
											min={1}
											value={selectedQuantity}
											onChange={(e) => setSelectedQuantity(Math.max(1, Number(e.target.value)))}
											className="w-16 text-center"
										/>
										<Button onClick={addCartItem} disabled={!selectedProductId} size="sm">
											<Plus className="size-4" />
										</Button>
									</div>
									{cartItems.length > 0 && (
										<div className="space-y-1">
											{cartItems.map((item) => (
												<div
													key={item.product_id}
													className="flex items-center justify-between rounded border bg-card px-3 py-2 text-sm"
												>
													<span className="flex-1">{item.name}</span>
													<span className="mx-2 text-muted-foreground">
														{item.price} € × {item.quantity}
													</span>
													<span className="mr-2 font-medium">
														{(item.price * item.quantity).toFixed(2)} €
													</span>
													<button
														type="button"
														onClick={() => removeCartItem(item.product_id)}
														className="text-muted-foreground hover:text-destructive"
													>
														&times;
													</button>
												</div>
											))}
											<div className="pt-1 text-right text-sm font-medium">
												{t('total')} : {cartTotal.toFixed(2)} €
											</div>
										</div>
									)}
								</div>
							)}

							{/* Custom / Devis-specific */}
							{form.type === 'custom' && (
								<div className="space-y-4 rounded-lg border bg-muted/30 p-3">
									<Label>{t('quoteDetails')}</Label>
									<div className="grid gap-4 sm:grid-cols-2">
										<div>
											<Label className="mb-1 text-xs text-muted-foreground">
												{t('pastryType')}
											</Label>
											<Input
												value={form.customType}
												onChange={(e) => setForm((f) => ({ ...f, customType: e.target.value }))}
												placeholder="Gâteau d'anniversaire..."
											/>
										</div>
										<div>
											<Label className="mb-1 text-xs text-muted-foreground">
												{t('numberOfPeople')}
											</Label>
											<Input
												value={form.customNbPersonnes}
												onChange={(e) =>
													setForm((f) => ({ ...f, customNbPersonnes: e.target.value }))
												}
												placeholder="10"
											/>
										</div>
									</div>
									<div className="grid gap-4 sm:grid-cols-2">
										<div>
											<Label className="mb-1 text-xs text-muted-foreground">{t('eventDate')}</Label>
											<Input
												type="date"
												value={form.customDateSouhaitee}
												onChange={(e) =>
													setForm((f) => ({ ...f, customDateSouhaitee: e.target.value }))
												}
											/>
										</div>
										<div>
											<Label className="mb-1 text-xs text-muted-foreground">{t('theme')}</Label>
											<Input
												value={form.customTheme}
												onChange={(e) => setForm((f) => ({ ...f, customTheme: e.target.value }))}
												placeholder="Princesse, floral..."
											/>
										</div>
									</div>
									<div>
										<Label className="mb-1 text-xs text-muted-foreground">{t('allergies')}</Label>
										<Input
											value={form.customAllergies}
											onChange={(e) => setForm((f) => ({ ...f, customAllergies: e.target.value }))}
											placeholder="Gluten, lactose..."
										/>
									</div>
									<div>
										<Label className="mb-1 text-xs text-muted-foreground">
											{t('messageDescription')}
										</Label>
										<Textarea
											value={form.customMessage}
											onChange={(e) => setForm((f) => ({ ...f, customMessage: e.target.value }))}
											rows={3}
											placeholder="Décrivez la commande souhaitée..."
										/>
									</div>
									<div>
										<Label className="mb-1 text-xs text-muted-foreground">
											{t('inspirationPhotos')}
										</Label>
										{photoPreviews.length > 0 && (
											<div className="mb-2 flex flex-wrap gap-2">
												{photoPreviews.map((preview, i) => (
													<div key={preview} className="group relative inline-block">
														<img
															src={preview}
															alt="Aperçu"
															className="size-20 rounded-lg border object-cover"
														/>
														<button
															type="button"
															onClick={() => {
																setPhotoFiles((prev) => prev.filter((_, idx) => idx !== i))
																setPhotoPreviews((prev) => prev.filter((_, idx) => idx !== i))
															}}
															className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
														>
															<svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
																<path
																	fillRule="evenodd"
																	d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
																	clipRule="evenodd"
																/>
															</svg>
														</button>
													</div>
												))}
											</div>
										)}
										<label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-3 py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground">
											<Plus className="size-5" />
											{t('addPhotos')}
											<input
												type="file"
												multiple
												accept="image/jpeg,image/png,image/webp,image/avif"
												className="hidden"
												onChange={(e) => {
													const files = e.target.files
													if (files && files.length > 0) {
														const newFiles = Array.from(files)
														setPhotoFiles((prev) => [...prev, ...newFiles])
														setPhotoPreviews((prev) => [
															...prev,
															...newFiles.map((f) => URL.createObjectURL(f)),
														])
													}
													e.target.value = ''
												}}
											/>
										</label>
									</div>
								</div>
							)}
						</div>

						{/* Footer */}
						<DialogFooter>
							<Button variant="outline" onClick={() => setShowCreateModal(false)}>
								{tc('cancel')}
							</Button>
							<Button onClick={handleSave} disabled={saving || !canSave}>
								{saving ? t('creating') : t('createOrder')}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</PlanGate>
	)
}
