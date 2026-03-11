'use client'

import {
	AlertCircle,
	ArrowLeft,
	Calculator,
	Calendar,
	CheckCircle,
	Clock,
	CreditCard,
	FileText,
	Mail,
	MapPin,
	MessageSquare,
	Package,
	Phone,
	Save,
	Send,
	Truck,
	User,
	XCircle,
} from 'lucide-react'
import { useParams, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PlanGate } from '@/components/auth/plan-gate'
import { OrderCosting } from '@/components/dashboard/order-costing'
import { QuoteSection } from '@/components/dashboard/quote-section'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Link } from '@/i18n/navigation'
import { api } from '@/lib/api/client'
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'

interface OrderItem {
	id: string
	productName: string
	unitPrice: number
	quantity: number
	total: number
	specialInstructions: string | null
}

interface OrderMessage {
	id: string
	senderType: 'patissier' | 'client' | 'system'
	message: string
	attachments: unknown[]
	createdAt: string
}

interface Order {
	id: string
	orderNumber: string
	clientName: string
	clientEmail: string
	clientPhone: string | null
	type: 'catalogue' | 'custom'
	status: string
	total: number | null
	subtotal: number | null
	quotedPrice: number | null
	responseMessage: string | null
	deliveryMethod: 'pickup' | 'delivery'
	requestedDate: string | null
	confirmedDate: string | null
	deliveryAddress: string | null
	deliveryNotes: string | null
	paymentStatus: string
	depositPercent: number | null
	patissierNotes: string | null
	customType: string | null
	customNbPersonnes: number | null
	customDateSouhaitee: string | null
	customTheme: string | null
	customAllergies: string | null
	customPhotoUrls: string[]
	customMessage: string | null
	cancellationReason: string | null
	createdAt: string
	updatedAt: string
	confirmedAt: string | null
	completedAt: string | null
	cancelledAt: string | null
	items: OrderItem[]
	messages: OrderMessage[]
}

type OrderStatus =
	| 'pending'
	| 'confirmed'
	| 'in_progress'
	| 'ready'
	| 'delivered'
	| 'picked_up'
	| 'cancelled'

const allStatuses: OrderStatus[] = [
	'pending',
	'confirmed',
	'in_progress',
	'ready',
	'delivered',
	'picked_up',
	'cancelled',
]

function getStatusIcon(status: string) {
	switch (status) {
		case 'pending':
			return AlertCircle
		case 'confirmed':
			return CheckCircle
		case 'in_progress':
			return Clock
		case 'ready':
			return Package
		case 'delivered':
		case 'picked_up':
			return Truck
		case 'cancelled':
			return XCircle
		default:
			return AlertCircle
	}
}

function getStatusColor(status: string) {
	switch (status) {
		case 'pending':
			return 'text-amber-600 bg-amber-50 border-amber-200'
		case 'confirmed':
			return 'text-blue-600 bg-blue-50 border-blue-200'
		case 'in_progress':
			return 'text-purple-600 bg-purple-50 border-purple-200'
		case 'ready':
			return 'text-green-600 bg-green-50 border-green-200'
		case 'delivered':
		case 'picked_up':
			return 'text-green-700 bg-green-100 border-green-300'
		case 'cancelled':
			return 'text-red-600 bg-red-50 border-red-200'
		default:
			return ''
	}
}

function getPaymentStatusColor(status: string) {
	switch (status) {
		case 'paid':
			return 'text-green-600 bg-green-50 border-green-200'
		case 'pending':
			return 'text-amber-600 bg-amber-50 border-amber-200'
		case 'refunded':
			return 'text-red-600 bg-red-50 border-red-200'
		default:
			return ''
	}
}

function formatCurrency(amount: number) {
	return `${Number(amount).toFixed(2)} \u20AC`
}

export default function PatissierOrderDetailPage() {
	const params = useParams()
	const searchParams = useSearchParams()
	const orderId = params.id as string
	const dashboardPrefix = useDashboardPrefix()
	const t = useTranslations('orderDetail')
	const to = useTranslations('orders')
	const _tc = useTranslations('common')

	const [order, setOrder] = useState<Order | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	// Status update
	const [newStatus, setNewStatus] = useState('')
	const [confirmedDate, setConfirmedDate] = useState('')
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

	// Mark as paid
	const [isMarkingPaid, setIsMarkingPaid] = useState(false)

	// Messages
	const [newMessage, setNewMessage] = useState('')
	const [isSending, setIsSending] = useState(false)

	// Edit mode
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editForm, setEditForm] = useState({
		clientName: '',
		clientEmail: '',
		clientPhone: '',
		deliveryMethod: 'pickup' as 'pickup' | 'delivery',
		deliveryAddress: '',
		deliveryNotes: '',
		requestedDate: '',
		patissierNotes: '',
		total: '',
		customType: '',
		customNbPersonnes: '',
		customDateSouhaitee: '',
		customTheme: '',
		customAllergies: '',
		customMessage: '',
	})
	const [newPhotoFiles, setNewPhotoFiles] = useState<File[]>([])
	const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([])
	const [photosToRemove, setPhotosToRemove] = useState<string[]>([])

	// Lightbox
	const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

	const statusLabelKey = (s: string) => {
		const map: Record<string, string> = {
			pending: 'statusPending',
			confirmed: 'statusConfirmed',
			in_progress: 'statusInProgress',
			ready: 'statusReady',
			delivered: 'statusDelivered',
			picked_up: 'statusPickedUp',
			cancelled: 'statusCancelled',
		}
		return map[s] || s
	}

	const paymentLabelKey = (s: string) => {
		const map: Record<string, string> = {
			paid: 'paymentPaid',
			pending: 'paymentPending',
			refunded: 'paymentRefunded',
		}
		return map[s] || s
	}

	const startEditing = () => {
		if (!order) return
		setEditForm({
			clientName: order.clientName || '',
			clientEmail: order.clientEmail || '',
			clientPhone: order.clientPhone || '',
			deliveryMethod: order.deliveryMethod || 'pickup',
			deliveryAddress: order.deliveryAddress || '',
			deliveryNotes: order.deliveryNotes || '',
			requestedDate: order.requestedDate ? order.requestedDate.split('T')[0] : '',
			patissierNotes: order.patissierNotes || '',
			total: order.total != null ? String(order.total) : '',
			customType: order.customType || '',
			customNbPersonnes: order.customNbPersonnes != null ? String(order.customNbPersonnes) : '',
			customDateSouhaitee: order.customDateSouhaitee ? order.customDateSouhaitee.split('T')[0] : '',
			customTheme: order.customTheme || '',
			customAllergies: order.customAllergies || '',
			customMessage: order.customMessage || '',
		})
		setNewPhotoFiles([])
		setNewPhotoPreviews([])
		setPhotosToRemove([])
		setIsEditing(true)
	}

	const cancelEditing = () => {
		setIsEditing(false)
		setNewPhotoFiles([])
		setNewPhotoPreviews([])
		setPhotosToRemove([])
	}

	const handleAddPhotos = (files: FileList) => {
		const addedFiles = Array.from(files)
		setNewPhotoFiles((prev) => [...prev, ...addedFiles])
		setNewPhotoPreviews((prev) => [...prev, ...addedFiles.map((f) => URL.createObjectURL(f))])
	}

	const handleRemoveNewPhoto = (index: number) => {
		setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index))
		setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
	}

	const handleSaveEdit = async () => {
		if (!order) return
		setIsSaving(true)
		try {
			const formData = new FormData()
			formData.append('clientName', editForm.clientName)
			formData.append('clientEmail', editForm.clientEmail)
			formData.append('clientPhone', editForm.clientPhone)
			formData.append('deliveryMethod', editForm.deliveryMethod)
			formData.append('deliveryAddress', editForm.deliveryAddress)
			formData.append('deliveryNotes', editForm.deliveryNotes)
			formData.append('requestedDate', editForm.requestedDate)
			formData.append('patissierNotes', editForm.patissierNotes)
			if (editForm.total) {
				formData.append('total', editForm.total)
			}
			if (order.type === 'custom') {
				formData.append('customType', editForm.customType)
				formData.append('customNbPersonnes', editForm.customNbPersonnes)
				formData.append('customDateSouhaitee', editForm.customDateSouhaitee)
				formData.append('customTheme', editForm.customTheme)
				formData.append('customAllergies', editForm.customAllergies)
				formData.append('customMessage', editForm.customMessage)
				for (const file of newPhotoFiles) {
					formData.append('customPhotos', file)
				}
				if (photosToRemove.length > 0) {
					formData.append('removePhotos', JSON.stringify(photosToRemove))
				}
			}
			const res = await api.upload(`/patissier/orders/${orderId}`, formData, 'PUT')
			setOrder(res.data.data)
			setIsEditing(false)
			toast.success(t('saveChanges'))
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Error'
			toast.error(message)
		} finally {
			setIsSaving(false)
		}
	}

	const fetchOrder = () => {
		api
			.get(`/patissier/orders/${orderId}`)
			.then((res) => {
				const data = res.data.data
				setOrder(data)
				setNewStatus(data.status)
				if (data.confirmedDate) {
					setConfirmedDate(data.confirmedDate)
				}
			})
			.catch((err: unknown) => {
				const message = err instanceof Error ? err.message : t('notFound')
				setError(message)
			})
			.finally(() => setIsLoading(false))
	}

	useEffect(() => {
		fetchOrder()
	}, [fetchOrder])

	// Auto-open edit mode when ?edit=1
	useEffect(() => {
		if (order && searchParams.get('edit') === '1' && !isEditing) {
			startEditing()
		}
	}, [order, isEditing, searchParams, startEditing])

	const handleUpdateStatus = async () => {
		if (!newStatus || !order) return
		setIsUpdatingStatus(true)
		try {
			const body: Record<string, string> = { status: newStatus }
			if (newStatus === 'confirmed' && confirmedDate) {
				body.confirmedDate = confirmedDate
			}
			const res = await api.put(`/patissier/orders/${orderId}/status`, body)
			setOrder({ ...order, ...res.data.data })
			toast.success(t('update'))
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Error'
			toast.error(message)
		} finally {
			setIsUpdatingStatus(false)
		}
	}

	const handleMarkPaid = async () => {
		if (!order) return
		setIsMarkingPaid(true)
		try {
			const res = await api.put(`/patissier/orders/${orderId}/payment`)
			setOrder({ ...order, ...res.data.data })
			toast.success(t('markAsPaid'))
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Error'
			toast.error(message)
		} finally {
			setIsMarkingPaid(false)
		}
	}

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newMessage.trim() || !order) return
		setIsSending(true)
		try {
			await api.post(`/patissier/orders/${orderId}/messages`, {
				message: newMessage.trim(),
			})
			setNewMessage('')
			fetchOrder()
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Error'
			toast.error(message)
		} finally {
			setIsSending(false)
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-muted-foreground">{t('loading')}</p>
			</div>
		)
	}

	if (error || !order) {
		return (
			<div className="flex flex-col items-center justify-center py-12">
				<Package className="size-12 text-muted-foreground" />
				<h2 className="mt-4 text-lg font-semibold">{t('notFound')}</h2>
				<Button asChild className="mt-4">
					<Link href={`${dashboardPrefix}/orders`}>
						<ArrowLeft className="mr-2 size-4" />
						{t('backToOrders')}
					</Link>
				</Button>
			</div>
		)
	}

	const StatusIcon = getStatusIcon(order.status)

	// Client info card (reused across tabs)
	const ClientInfoCard = ({ showEdit = false }: { showEdit?: boolean }) => (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<User className="size-5" />
					{t('clientInfo')}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{showEdit && isEditing ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>{t('name')}</Label>
							<Input
								value={editForm.clientName}
								onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t('email')}</Label>
							<Input
								type="email"
								value={editForm.clientEmail}
								onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
							/>
						</div>
						<div className="space-y-2">
							<Label>{t('telephone')}</Label>
							<Input
								type="tel"
								value={editForm.clientPhone}
								onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })}
							/>
						</div>
					</div>
				) : (
					<>
						<div className="flex items-center gap-3">
							<Avatar>
								<AvatarFallback>
									{order.clientName
										.split(' ')
										.map((n) => n[0])
										.join('')}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-medium">{order.clientName}</p>
							</div>
						</div>
						<Separator />
						<div className="space-y-3">
							<div className="flex items-center gap-2 text-sm">
								<Mail className="size-4 text-muted-foreground" />
								<a href={`mailto:${order.clientEmail}`} className="hover:underline">
									{order.clientEmail}
								</a>
							</div>
							{order.clientPhone && (
								<div className="flex items-center gap-2 text-sm">
									<Phone className="size-4 text-muted-foreground" />
									<a href={`tel:${order.clientPhone}`} className="hover:underline">
										{order.clientPhone}
									</a>
								</div>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)

	return (
		<PlanGate minPlan="pro">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href={`${dashboardPrefix}/orders`}>
							<ArrowLeft className="size-4" />
						</Link>
					</Button>
					<div className="flex-1">
						<div className="flex items-center gap-3">
							<h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
							<Badge variant="outline" className={getStatusColor(order.status)}>
								<StatusIcon className="mr-1 size-3" />
								{to(statusLabelKey(order.status))}
							</Badge>
							<Badge variant="outline" className="capitalize">
								{order.type === 'catalogue' ? to('typeCatalogue') : to('typeCustom')}
							</Badge>
						</div>
						<p className="text-muted-foreground">
							{t('createdOn', {
								date: new Date(order.createdAt).toLocaleDateString('fr-FR'),
							})}
						</p>
					</div>
					<div className="flex items-center gap-2">
						{!isEditing ? (
							<Button variant="outline" onClick={startEditing}>
								{t('modify')}
							</Button>
						) : (
							<>
								<Button variant="outline" onClick={cancelEditing}>
									{t('cancel')}
								</Button>
								<Button onClick={handleSaveEdit} disabled={isSaving}>
									<Save className="mr-2 size-4" />
									{isSaving ? t('savingChanges') : t('saveChanges')}
								</Button>
							</>
						)}
					</div>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="details" className="space-y-6">
					<TabsList>
						<TabsTrigger value="details">
							<FileText className="mr-2 size-4" />
							{t('tabDetails')}
						</TabsTrigger>
						<TabsTrigger value="costing">
							<Calculator className="mr-2 size-4" />
							{t('tabCosting')}
						</TabsTrigger>
						<TabsTrigger value="messages">
							<MessageSquare className="mr-2 size-4" />
							{t('tabMessages')}
						</TabsTrigger>
					</TabsList>

					{/* Details Tab */}
					<TabsContent value="details">
						<div className="grid gap-6 lg:grid-cols-3">
							<div className="space-y-6 lg:col-span-2">
								{/* Status Card */}
								<Card>
									<CardHeader>
										<CardTitle>{t('orderStatus')}</CardTitle>
										<CardDescription>{t('orderStatusDesc')}</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Label>{t('newStatus')}</Label>
												<Select value={newStatus} onValueChange={(value) => setNewStatus(value)}>
													<SelectTrigger className="w-full">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{allStatuses.map((s) => (
															<SelectItem key={s} value={s}>
																{to(statusLabelKey(s))}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												<Label>{t('paymentStatus')}</Label>
												<div className="flex items-center gap-2">
													<Badge
														variant="outline"
														className={getPaymentStatusColor(order.paymentStatus)}
													>
														{to(paymentLabelKey(order.paymentStatus))}
													</Badge>
													{order.paymentStatus === 'pending' && (
														<Button
															size="sm"
															variant="outline"
															onClick={handleMarkPaid}
															disabled={isMarkingPaid}
														>
															<CreditCard className="mr-2 size-4" />
															{t('markAsPaid')}
														</Button>
													)}
												</div>
											</div>
										</div>
										{newStatus === 'confirmed' && (
											<div className="space-y-2">
												<Label>{t('confirmedDate')}</Label>
												<Input
													type="date"
													value={confirmedDate}
													onChange={(e) => setConfirmedDate(e.target.value)}
												/>
											</div>
										)}
										{newStatus === 'cancelled' && order.cancellationReason && (
											<div className="space-y-2">
												<Label>{t('cancellationReason')}</Label>
												<p className="text-sm text-muted-foreground">{order.cancellationReason}</p>
											</div>
										)}
										<Button
											onClick={handleUpdateStatus}
											disabled={isUpdatingStatus || newStatus === order.status}
										>
											{isUpdatingStatus ? t('updating') : t('update')}
										</Button>
									</CardContent>
								</Card>

								{/* Items table for catalogue orders */}
								{order.type === 'catalogue' && order.items && order.items.length > 0 && (
									<Card>
										<CardHeader>
											<CardTitle>{t('orderItems')}</CardTitle>
										</CardHeader>
										<CardContent>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>{t('product')}</TableHead>
														<TableHead className="text-right">{t('qty')}</TableHead>
														<TableHead className="text-right">{t('unitPrice')}</TableHead>
														<TableHead className="text-right">{t('itemTotal')}</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{order.items.map((item) => (
														<TableRow key={item.id}>
															<TableCell>
																<p className="font-medium">{item.productName}</p>
																{item.specialInstructions && (
																	<p className="text-sm text-muted-foreground">
																		{item.specialInstructions}
																	</p>
																)}
															</TableCell>
															<TableCell className="text-right">{item.quantity}</TableCell>
															<TableCell className="text-right">
																{formatCurrency(item.unitPrice)}
															</TableCell>
															<TableCell className="text-right font-medium">
																{formatCurrency(item.total)}
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
											{order.subtotal != null && (
												<div className="mt-4 flex justify-end border-t pt-4">
													<div className="space-y-1 text-right">
														<div className="flex justify-between gap-8">
															<span className="text-sm text-muted-foreground">{t('subtotal')}</span>
															<span className="text-sm">{formatCurrency(order.subtotal)}</span>
														</div>
														{order.total != null && (
															<div className="flex justify-between gap-8">
																<span className="text-sm font-semibold">{t('totalLabel')}</span>
																<span className="text-lg font-bold">
																	{formatCurrency(order.total)}
																</span>
															</div>
														)}
													</div>
												</div>
											)}
										</CardContent>
									</Card>
								)}

								{/* Custom order details */}
								{order.type === 'custom' && (
									<Card>
										<CardHeader>
											<CardTitle>{t('customDetails')}</CardTitle>
										</CardHeader>
										<CardContent className="space-y-4">
											{isEditing ? (
												<div className="grid gap-4 md:grid-cols-2">
													<div className="space-y-2">
														<Label>{t('pastryType')}</Label>
														<Input
															value={editForm.customType}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	customType: e.target.value,
																})
															}
														/>
													</div>
													<div className="space-y-2">
														<Label>{t('numberOfPeople')}</Label>
														<Input
															type="number"
															value={editForm.customNbPersonnes}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	customNbPersonnes: e.target.value,
																})
															}
														/>
													</div>
													<div className="space-y-2">
														<Label>{t('requestedDate')}</Label>
														<Input
															type="date"
															value={editForm.customDateSouhaitee}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	customDateSouhaitee: e.target.value,
																})
															}
														/>
													</div>
													<div className="space-y-2">
														<Label>{t('theme')}</Label>
														<Input
															value={editForm.customTheme}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	customTheme: e.target.value,
																})
															}
														/>
													</div>
													<div className="space-y-2">
														<Label>{t('allergies')}</Label>
														<Input
															value={editForm.customAllergies}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	customAllergies: e.target.value,
																})
															}
														/>
													</div>
													<div className="space-y-2 md:col-span-2">
														<Label>{t('inspirationPhotos')}</Label>
														{/* Existing photos */}
														{order.customPhotoUrls && order.customPhotoUrls.length > 0 && (
															<div className="mt-2 flex flex-wrap gap-3">
																{order.customPhotoUrls
																	.filter((url) => !photosToRemove.includes(url))
																	.map((url) => (
																		<div key={url} className="group relative">
																			<img
																				src={url}
																				alt="Inspiration"
																				className="h-20 w-20 cursor-pointer rounded-md object-cover ring-1 ring-border"
																				onClick={() => setLightboxUrl(url)}
																			/>
																			<button
																				type="button"
																				onClick={() => setPhotosToRemove((prev) => [...prev, url])}
																				className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
																			>
																				<XCircle className="size-3" />
																			</button>
																		</div>
																	))}
															</div>
														)}
														{photosToRemove.length > 0 && (
															<button
																type="button"
																onClick={() => setPhotosToRemove([])}
																className="mt-1 text-xs text-primary hover:underline"
															>
																{t('cancelEditPhotos')} ({photosToRemove.length})
															</button>
														)}
														{/* New photo previews */}
														{newPhotoPreviews.length > 0 && (
															<div className="mt-2 flex flex-wrap gap-3">
																{newPhotoPreviews.map((preview, i) => (
																	<div key={preview} className="group relative">
																		<img
																			src={preview}
																			alt="New"
																			className="h-20 w-20 rounded-md object-cover ring-1 ring-primary"
																		/>
																		<button
																			type="button"
																			onClick={() => handleRemoveNewPhoto(i)}
																			className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
																		>
																			<XCircle className="size-3" />
																		</button>
																	</div>
																))}
															</div>
														)}
														<input
															type="file"
															multiple
															accept="image/jpeg,image/png,image/webp,image/avif"
															onChange={(e) => {
																if (e.target.files && e.target.files.length > 0) {
																	handleAddPhotos(e.target.files)
																}
																e.target.value = ''
															}}
															className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
														/>
													</div>
													<div className="space-y-2 md:col-span-2">
														<Label>{t('clientMessage')}</Label>
														<Textarea
															value={editForm.customMessage}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	customMessage: e.target.value,
																})
															}
															rows={3}
														/>
													</div>
												</div>
											) : (
												<div className="grid gap-4 md:grid-cols-2">
													{order.customType && (
														<div>
															<p className="text-sm text-muted-foreground">{t('pastryType')}</p>
															<p className="font-medium">{order.customType}</p>
														</div>
													)}
													{order.customNbPersonnes && (
														<div>
															<p className="text-sm text-muted-foreground">{t('numberOfPeople')}</p>
															<p className="font-medium">{order.customNbPersonnes}</p>
														</div>
													)}
													{order.customDateSouhaitee && (
														<div>
															<p className="text-sm text-muted-foreground">{t('requestedDate')}</p>
															<p className="font-medium">
																{new Date(order.customDateSouhaitee).toLocaleDateString('fr-FR')}
															</p>
														</div>
													)}
													{order.customTheme && (
														<div>
															<p className="text-sm text-muted-foreground">{t('theme')}</p>
															<p className="font-medium">{order.customTheme}</p>
														</div>
													)}
													{order.customAllergies && (
														<div>
															<p className="text-sm text-muted-foreground">{t('allergies')}</p>
															<p className="font-medium">{order.customAllergies}</p>
														</div>
													)}
													{order.customPhotoUrls && order.customPhotoUrls.length > 0 && (
														<div className="md:col-span-2">
															<p className="text-sm text-muted-foreground">
																{t('inspirationPhotos')}
															</p>
															<div className="mt-2 flex flex-wrap gap-3">
																{order.customPhotoUrls.map((url) => (
																	<img
																		key={url}
																		src={url}
																		alt="Inspiration"
																		className="h-24 w-24 cursor-pointer rounded-md object-cover ring-1 ring-border transition-shadow hover:ring-2 hover:ring-primary"
																		onClick={() => setLightboxUrl(url)}
																	/>
																))}
															</div>
														</div>
													)}
													{order.customMessage && (
														<div className="md:col-span-2">
															<p className="text-sm text-muted-foreground">{t('clientMessage')}</p>
															<p className="font-medium">{order.customMessage}</p>
														</div>
													)}
												</div>
											)}
										</CardContent>
									</Card>
								)}

								{/* Quote section for custom orders */}
								{order.type === 'custom' && (
									<QuoteSection orderId={orderId} onQuoteChange={() => fetchOrder()} />
								)}

								{/* Total display */}
								{order.total != null && (
									<div className="flex items-center justify-between rounded-lg border bg-card p-4">
										<span className="text-sm font-semibold">{t('totalLabel')}</span>
										<span className="text-lg font-bold">{formatCurrency(order.total)}</span>
									</div>
								)}

								{/* Notes */}
								<Card>
									<CardHeader>
										<CardTitle>{t('internalNotes')}</CardTitle>
									</CardHeader>
									<CardContent>
										{isEditing ? (
											<Textarea
												value={editForm.patissierNotes}
												onChange={(e) =>
													setEditForm({
														...editForm,
														patissierNotes: e.target.value,
													})
												}
												rows={4}
												placeholder={t('internalNotesPlaceholder')}
											/>
										) : (
											<p className="text-sm text-muted-foreground">
												{order.patissierNotes || t('internalNotesPlaceholder')}
											</p>
										)}
									</CardContent>
								</Card>
							</div>

							{/* Right sidebar */}
							<div className="space-y-6">
								<ClientInfoCard showEdit />

								{/* Delivery Details */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Calendar className="size-5" />
											{t('deliveryDetails')}
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										{isEditing ? (
											<div className="space-y-4">
												<div className="space-y-2">
													<Label>{t('requestedDate')}</Label>
													<Input
														type="date"
														value={editForm.requestedDate}
														onChange={(e) =>
															setEditForm({
																...editForm,
																requestedDate: e.target.value,
															})
														}
													/>
												</div>
												<div className="space-y-2">
													<Label>{t('deliveryMethodLabel')}</Label>
													<Select
														value={editForm.deliveryMethod}
														onValueChange={(value) =>
															setEditForm({
																...editForm,
																deliveryMethod: value as 'pickup' | 'delivery',
															})
														}
													>
														<SelectTrigger className="w-full">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="pickup">{t('pickup')}</SelectItem>
															<SelectItem value="delivery">{t('deliveryLabel')}</SelectItem>
														</SelectContent>
													</Select>
												</div>
												{editForm.deliveryMethod === 'delivery' && (
													<div className="space-y-2">
														<Label>{t('deliveryAddress')}</Label>
														<Input
															value={editForm.deliveryAddress}
															onChange={(e) =>
																setEditForm({
																	...editForm,
																	deliveryAddress: e.target.value,
																})
															}
														/>
													</div>
												)}
												<div className="space-y-2">
													<Label>{t('deliveryNotes')}</Label>
													<Textarea
														value={editForm.deliveryNotes}
														onChange={(e) =>
															setEditForm({
																...editForm,
																deliveryNotes: e.target.value,
															})
														}
														rows={2}
													/>
												</div>
											</div>
										) : (
											<>
												{order.requestedDate && (
													<div>
														<p className="text-sm text-muted-foreground">{t('requestedDate')}</p>
														<p className="font-medium">
															{new Date(order.requestedDate).toLocaleDateString('fr-FR')}
														</p>
													</div>
												)}
												<div>
													<p className="text-sm text-muted-foreground">
														{t('deliveryMethodLabel')}
													</p>
													<Badge variant="outline" className="mt-1 capitalize">
														{order.deliveryMethod === 'pickup' ? (
															<>
																<Package className="mr-1 size-3" />
																{t('pickup')}
															</>
														) : (
															<>
																<Truck className="mr-1 size-3" />
																{t('deliveryLabel')}
															</>
														)}
													</Badge>
												</div>
												{order.deliveryAddress && (
													<div>
														<p className="text-sm text-muted-foreground">{t('deliveryAddress')}</p>
														<div className="mt-1 flex items-start gap-2">
															<MapPin className="mt-0.5 size-4 text-muted-foreground" />
															<p className="text-sm">{order.deliveryAddress}</p>
														</div>
													</div>
												)}
												{order.deliveryNotes && (
													<div>
														<p className="text-sm text-muted-foreground">{t('deliveryNotes')}</p>
														<p className="mt-1 text-sm">{order.deliveryNotes}</p>
													</div>
												)}
											</>
										)}
									</CardContent>
								</Card>

								{/* Dates */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Clock className="size-5" />
											{t('dates')}
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div>
											<p className="text-sm text-muted-foreground">{t('createdAt')}</p>
											<p className="text-sm font-medium">
												{new Date(order.createdAt).toLocaleString('fr-FR')}
											</p>
										</div>
										{order.confirmedDate && (
											<div>
												<p className="text-sm text-muted-foreground">{t('confirmedDate')}</p>
												<p className="text-sm font-medium">
													{new Date(order.confirmedDate).toLocaleDateString('fr-FR')}
												</p>
											</div>
										)}
										{order.confirmedAt && (
											<div>
												<p className="text-sm text-muted-foreground">{t('confirmedAt')}</p>
												<p className="text-sm font-medium">
													{new Date(order.confirmedAt).toLocaleString('fr-FR')}
												</p>
											</div>
										)}
										{order.completedAt && (
											<div>
												<p className="text-sm text-muted-foreground">{t('completedAt')}</p>
												<p className="text-sm font-medium">
													{new Date(order.completedAt).toLocaleString('fr-FR')}
												</p>
											</div>
										)}
										{order.cancelledAt && (
											<div>
												<p className="text-sm text-muted-foreground">{t('cancelledAt')}</p>
												<p className="text-sm font-medium">
													{new Date(order.cancelledAt).toLocaleString('fr-FR')}
												</p>
											</div>
										)}
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					{/* Costing Tab */}
					<TabsContent value="costing">
						<div className="grid gap-6 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<OrderCosting
									orderId={orderId}
									currentTotal={order.total ?? 0}
									onApplyPrice={async (price) => {
										try {
											await api.post(`/patissier/orders/${orderId}/quotes/draft`, {
												price,
												depositPercent: 30,
											})
											toast.success(t('quotePriceSaved'))
											fetchOrder()
										} catch {
											toast.error(t('quotePriceSaveError'))
										}
									}}
								/>
							</div>
							<div className="space-y-6">
								{/* Client card */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<User className="size-5" />
											{t('clientLabel')}
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-4">
										<div className="flex items-center gap-3">
											<Avatar>
												<AvatarFallback>
													{order.clientName
														.split(' ')
														.map((n) => n[0])
														.join('')}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-medium">{order.clientName}</p>
												<p className="text-sm text-muted-foreground">{order.clientEmail}</p>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Quote price card */}
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<CreditCard className="size-5" />
											{t('quotePriceCard')}
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex justify-between">
											<span className="text-muted-foreground">{t('currentPrice')}</span>
											<span className="text-2xl font-bold">
												{formatCurrency(order.quotedPrice ?? order.total ?? 0)}
											</span>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</TabsContent>

					{/* Messages Tab */}
					<TabsContent value="messages">
						<div className="grid gap-6 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<MessageSquare className="size-5" />
											{t('messages')}
										</CardTitle>
										<CardDescription>{t('messagesDesc')}</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										{order.messages && order.messages.length > 0 ? (
											<div className="max-h-96 space-y-4 overflow-y-auto">
												{order.messages.map((msg) => (
													<div
														key={msg.id}
														className={`flex gap-3 ${msg.senderType === 'patissier' ? 'flex-row-reverse' : ''}`}
													>
														<Avatar className="size-8">
															<AvatarFallback>
																{msg.senderType === 'patissier'
																	? 'P'
																	: msg.senderType === 'system'
																		? 'S'
																		: 'C'}
															</AvatarFallback>
														</Avatar>
														<div
															className={`max-w-md flex-1 ${msg.senderType === 'patissier' ? 'text-right' : ''}`}
														>
															<p className="text-xs font-medium text-muted-foreground">
																{msg.senderType === 'patissier'
																	? t('you')
																	: msg.senderType === 'system'
																		? t('system')
																		: t('clientLabel')}
															</p>
															<div
																className={`inline-block rounded-lg p-3 ${
																	msg.senderType === 'patissier'
																		? 'bg-primary text-primary-foreground'
																		: msg.senderType === 'system'
																			? 'bg-muted text-center italic'
																			: 'bg-muted'
																}`}
															>
																<p className="text-sm">{msg.message}</p>
															</div>
															<p className="mt-1 text-xs text-muted-foreground">
																{new Date(msg.createdAt).toLocaleString('fr-FR')}
															</p>
														</div>
													</div>
												))}
											</div>
										) : (
											<div className="py-12 text-center">
												<MessageSquare className="mx-auto size-12 text-muted-foreground" />
												<p className="mt-4 text-muted-foreground">{t('noMessages')}</p>
											</div>
										)}

										<Separator />

										<form onSubmit={handleSendMessage} className="flex gap-2">
											<Input
												value={newMessage}
												onChange={(e) => setNewMessage(e.target.value)}
												placeholder={t('messagePlaceholder')}
												required
											/>
											<Button type="submit" disabled={isSending}>
												<Send className="mr-2 size-4" />
												{isSending ? t('sending') : t('send')}
											</Button>
										</form>
									</CardContent>
								</Card>
							</div>
							<div>
								<ClientInfoCard />
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</div>

			{/* Lightbox */}
			{lightboxUrl && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
					onClick={() => setLightboxUrl(null)}
				>
					<button
						type="button"
						onClick={() => setLightboxUrl(null)}
						className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
					>
						<XCircle className="size-6" />
					</button>
					<img
						src={lightboxUrl}
						alt="Commande"
						className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</PlanGate>
	)
}
