'use client'

import { PLATFORM_FEE_PERCENT, STRIPE_FEE_FIXED, STRIPE_FEE_PERCENT } from '@patissio/config'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PlanGate } from '@/components/auth/plan-gate'
import { api } from '@/lib/api/client'

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
	attachments: any[]
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
	patissierNotes: string | null
	customType: string | null
	customNbPersonnes: number | null
	customDateSouhaitee: string | null
	customTheme: string | null
	customAllergies: string | null
	customPhotoInspirationUrl: string | null
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

const statusColors: Record<string, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-blue-100 text-blue-800',
	in_progress: 'bg-orange-100 text-orange-800',
	ready: 'bg-green-100 text-green-800',
	delivered: 'bg-gray-100 text-gray-800',
	picked_up: 'bg-gray-100 text-gray-800',
	cancelled: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
	pending: 'En attente',
	confirmed: 'Confirmee',
	in_progress: 'En cours',
	ready: 'Prete',
	delivered: 'Livree',
	picked_up: 'Recuperee',
	cancelled: 'Annulee',
}

const paymentStatusColors: Record<string, string> = {
	paid: 'bg-green-100 text-green-800',
	pending: 'bg-yellow-100 text-yellow-800',
	refunded: 'bg-red-100 text-red-800',
}

const paymentStatusLabels: Record<string, string> = {
	paid: 'Payé',
	pending: 'En attente',
	refunded: 'Remboursé',
}

const allStatuses = [
	'pending',
	'confirmed',
	'in_progress',
	'ready',
	'delivered',
	'picked_up',
	'cancelled',
]

export default function PatissierOrderDetailPage() {
	const params = useParams()
	const searchParams = useSearchParams()
	const orderId = params.id as string

	const [order, setOrder] = useState<Order | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	// Status update
	const [newStatus, setNewStatus] = useState('')
	const [confirmedDate, setConfirmedDate] = useState('')
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
	const [statusError, setStatusError] = useState('')

	// Quote form (custom orders)
	const [quotedPrice, setQuotedPrice] = useState('')
	const [depositPercent, setDepositPercent] = useState('100')
	const [quoteResponseMessage, setQuoteResponseMessage] = useState('')
	const [quoteConfirmedDate, setQuoteConfirmedDate] = useState('')
	const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)
	const [quoteError, setQuoteError] = useState('')
	const [quoteSuccess, setQuoteSuccess] = useState('')

	// Mark as paid
	const [isMarkingPaid, setIsMarkingPaid] = useState(false)

	// Messages
	const [newMessage, setNewMessage] = useState('')
	const [isSending, setIsSending] = useState(false)

	// Edit mode
	const [isEditing, setIsEditing] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editError, setEditError] = useState('')
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
	const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
	const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
	const [removePhoto, setRemovePhoto] = useState(false)

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
		setEditPhotoFile(null)
		setEditPhotoPreview(null)
		setRemovePhoto(false)
		setEditError('')
		setIsEditing(true)
	}

	const cancelEditing = () => {
		setIsEditing(false)
		setEditError('')
		setEditPhotoFile(null)
		setEditPhotoPreview(null)
		setRemovePhoto(false)
	}

	const handleSaveEdit = async () => {
		if (!order) return
		setIsSaving(true)
		setEditError('')
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
				if (editPhotoFile) {
					formData.append('customPhotoInspiration', editPhotoFile)
				}
				if (removePhoto) {
					formData.append('removePhoto', 'true')
				}
			}
			const res = await api.upload(`/patissier/orders/${orderId}`, formData, 'PUT')
			setOrder(res.data.data)
			setIsEditing(false)
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde'
			setEditError(message)
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
				if (data.quotedPrice != null) {
					setQuotedPrice(String(data.quotedPrice))
				}
				if (data.responseMessage) {
					setQuoteResponseMessage(data.responseMessage)
				}
				if (data.customDateSouhaitee) {
					setQuoteConfirmedDate(data.confirmedDate || data.customDateSouhaitee)
				}
			})
			.catch((err: any) => setError(err.message || 'Commande introuvable'))
			.finally(() => setIsLoading(false))
	}

	useEffect(() => {
		fetchOrder()
	}, [orderId])

	// Auto-open edit mode when ?edit=1
	useEffect(() => {
		if (order && searchParams.get('edit') === '1' && !isEditing) {
			startEditing()
		}
	}, [order])

	const handleUpdateStatus = async () => {
		if (!newStatus || !order) return
		setIsUpdatingStatus(true)
		setStatusError('')
		try {
			const body: Record<string, string> = { status: newStatus }
			if (newStatus === 'confirmed' && confirmedDate) {
				body.confirmedDate = confirmedDate
			}
			const res = await api.put(`/patissier/orders/${orderId}/status`, body)
			setOrder({ ...order, ...res.data.data })
		} catch (err: any) {
			setStatusError(err.message || 'Erreur lors de la mise a jour du statut')
		} finally {
			setIsUpdatingStatus(false)
		}
	}

	const handleSubmitQuote = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!order) return
		setIsSubmittingQuote(true)
		setQuoteError('')
		setQuoteSuccess('')
		try {
			const res = await api.put(`/patissier/orders/${orderId}/quote`, {
				quotedPrice: Number(quotedPrice),
				depositPercent: Number(depositPercent),
				responseMessage: quoteResponseMessage || undefined,
				confirmedDate: quoteConfirmedDate || undefined,
			})
			setOrder({ ...order, ...res.data.data })
			const warnings = res.data.warnings as string[] | undefined
			if (warnings && warnings.length > 0) {
				setQuoteSuccess(warnings[0])
			} else {
				setQuoteSuccess(
					'Devis envoyé avec succès ! Le client a reçu un email avec le lien de paiement.'
				)
			}
			setTimeout(() => setQuoteSuccess(''), 8000)
		} catch (err: any) {
			setQuoteError(err.message || "Erreur lors de l'envoi du devis")
		} finally {
			setIsSubmittingQuote(false)
		}
	}

	const handleMarkPaid = async () => {
		if (!order) return
		setIsMarkingPaid(true)
		try {
			const res = await api.put(`/patissier/orders/${orderId}/payment`)
			setOrder({ ...order, ...res.data.data })
		} catch (err: any) {
			setError(err.message || 'Erreur lors du marquage du paiement')
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
		} catch (err: any) {
			setError(err.message || "Erreur lors de l'envoi du message")
		} finally {
			setIsSending(false)
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<p className="text-muted-foreground">Chargement...</p>
			</div>
		)
	}

	if (error || !order) {
		return (
			<div className="space-y-6">
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">{error || 'Commande introuvable'}</p>
				</div>
			</div>
		)
	}

	return (
		<PlanGate minPlan="pro">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Commande {order.orderNumber}</h1>
						<p className="mt-1 text-muted-foreground">
							{order.type === 'catalogue' ? 'Catalogue' : 'Sur mesure'} &mdash; Creee le{' '}
							{new Date(order.createdAt).toLocaleDateString('fr-FR')}
						</p>
					</div>
					<div className="flex items-center gap-3">
						{!isEditing ? (
							<button
								type="button"
								onClick={startEditing}
								className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
							>
								Modifier
							</button>
						) : (
							<>
								<button
									type="button"
									onClick={cancelEditing}
									className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
								>
									Annuler
								</button>
								<button
									type="button"
									onClick={handleSaveEdit}
									disabled={isSaving}
									className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
								>
									{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
								</button>
							</>
						)}
						<span
							className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[order.status] || 'bg-gray-100'}`}
						>
							{statusLabels[order.status] || order.status}
						</span>
					</div>
				</div>
				{editError && (
					<div className="rounded-lg border border-red-200 bg-red-50 p-4">
						<p className="text-sm text-red-600">{editError}</p>
					</div>
				)}

				{/* Status update */}
				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold">Mettre a jour le statut</h2>
					<div className="mt-4 flex flex-wrap items-end gap-3">
						<div className="flex-1">
							<label htmlFor="status" className="block text-sm font-medium text-muted-foreground">
								Nouveau statut
							</label>
							<select
								id="status"
								value={newStatus}
								onChange={(e) => setNewStatus(e.target.value)}
								className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							>
								{allStatuses.map((s) => (
									<option key={s} value={s}>
										{statusLabels[s] || s}
									</option>
								))}
							</select>
						</div>
						{newStatus === 'confirmed' && (
							<div className="flex-1">
								<label
									htmlFor="confirmedDate"
									className="block text-sm font-medium text-muted-foreground"
								>
									Date de {order.deliveryMethod === 'delivery' ? 'livraison' : 'retrait'}
								</label>
								<input
									id="confirmedDate"
									type="date"
									value={confirmedDate}
									onChange={(e) => setConfirmedDate(e.target.value)}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
						)}
						<button
							type="button"
							onClick={handleUpdateStatus}
							disabled={isUpdatingStatus || newStatus === order.status}
							className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{isUpdatingStatus ? 'Mise a jour...' : 'Mettre a jour'}
						</button>
					</div>
					{statusError && <p className="mt-2 text-sm text-red-600">{statusError}</p>}
				</div>

				{/* Client info */}
				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold">Informations client</h2>
					{isEditing ? (
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<label className="block text-sm font-medium text-muted-foreground">Nom</label>
								<input
									type="text"
									value={editForm.clientName}
									onChange={(e) => setEditForm({ ...editForm, clientName: e.target.value })}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-muted-foreground">Email</label>
								<input
									type="email"
									value={editForm.clientEmail}
									onChange={(e) => setEditForm({ ...editForm, clientEmail: e.target.value })}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-muted-foreground">Telephone</label>
								<input
									type="tel"
									value={editForm.clientPhone}
									onChange={(e) => setEditForm({ ...editForm, clientPhone: e.target.value })}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-muted-foreground">
									Mode de livraison
								</label>
								<select
									value={editForm.deliveryMethod}
									onChange={(e) =>
										setEditForm({
											...editForm,
											deliveryMethod: e.target.value as 'pickup' | 'delivery',
										})
									}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								>
									<option value="pickup">Retrait</option>
									<option value="delivery">Livraison</option>
								</select>
							</div>
							{editForm.deliveryMethod === 'delivery' && (
								<div className="sm:col-span-2">
									<label className="block text-sm font-medium text-muted-foreground">
										Adresse de livraison
									</label>
									<input
										type="text"
										value={editForm.deliveryAddress}
										onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
										className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
							)}
							<div className="sm:col-span-2">
								<label className="block text-sm font-medium text-muted-foreground">
									Notes de livraison
								</label>
								<textarea
									value={editForm.deliveryNotes}
									onChange={(e) => setEditForm({ ...editForm, deliveryNotes: e.target.value })}
									rows={2}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-muted-foreground">
									Date souhaitee
								</label>
								<input
									type="date"
									value={editForm.requestedDate}
									onChange={(e) => setEditForm({ ...editForm, requestedDate: e.target.value })}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								/>
							</div>
						</div>
					) : (
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<p className="text-sm text-muted-foreground">Nom</p>
								<p className="text-sm font-medium">{order.clientName}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Email</p>
								<p className="text-sm font-medium">{order.clientEmail}</p>
							</div>
							{order.clientPhone && (
								<div>
									<p className="text-sm text-muted-foreground">Telephone</p>
									<p className="text-sm font-medium">{order.clientPhone}</p>
								</div>
							)}
							<div>
								<p className="text-sm text-muted-foreground">Mode de livraison</p>
								<p className="text-sm font-medium">
									{order.deliveryMethod === 'pickup' ? 'Retrait' : 'Livraison'}
								</p>
							</div>
							{order.deliveryAddress && (
								<div>
									<p className="text-sm text-muted-foreground">Adresse de livraison</p>
									<p className="text-sm font-medium">{order.deliveryAddress}</p>
								</div>
							)}
							{order.deliveryNotes && (
								<div>
									<p className="text-sm text-muted-foreground">Notes de livraison</p>
									<p className="text-sm font-medium">{order.deliveryNotes}</p>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Dates */}
				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold">Dates</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<div>
							<p className="text-sm text-muted-foreground">Creee le</p>
							<p className="text-sm font-medium">
								{new Date(order.createdAt).toLocaleString('fr-FR')}
							</p>
						</div>
						{order.requestedDate && (
							<div>
								<p className="text-sm text-muted-foreground">Date souhaitee</p>
								<p className="text-sm font-medium">
									{new Date(order.requestedDate).toLocaleDateString('fr-FR')}
								</p>
							</div>
						)}
						{order.confirmedDate && (
							<div>
								<p className="text-sm text-muted-foreground">Date confirmee</p>
								<p className="text-sm font-medium">
									{new Date(order.confirmedDate).toLocaleDateString('fr-FR')}
								</p>
							</div>
						)}
						{order.confirmedAt && (
							<div>
								<p className="text-sm text-muted-foreground">Confirmee le</p>
								<p className="text-sm font-medium">
									{new Date(order.confirmedAt).toLocaleString('fr-FR')}
								</p>
							</div>
						)}
						{order.completedAt && (
							<div>
								<p className="text-sm text-muted-foreground">Terminee le</p>
								<p className="text-sm font-medium">
									{new Date(order.completedAt).toLocaleString('fr-FR')}
								</p>
							</div>
						)}
						{order.cancelledAt && (
							<div>
								<p className="text-sm text-muted-foreground">Annulee le</p>
								<p className="text-sm font-medium">
									{new Date(order.cancelledAt).toLocaleString('fr-FR')}
								</p>
							</div>
						)}
						<div>
							<p className="text-sm text-muted-foreground">Paiement</p>
							<div className="mt-1 flex items-center gap-2">
								<span
									className={`rounded-full px-2 py-0.5 text-xs font-medium ${paymentStatusColors[order.paymentStatus] || 'bg-gray-100'}`}
								>
									{paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
								</span>
								{order.paymentStatus === 'pending' && (
									<button
										type="button"
										onClick={handleMarkPaid}
										disabled={isMarkingPaid}
										className="rounded-md border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
									>
										{isMarkingPaid ? 'Mise à jour...' : 'Marquer comme payé'}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Items list for catalogue orders */}
				{order.type === 'catalogue' && order.items && order.items.length > 0 && (
					<div className="rounded-lg border bg-card p-6">
						<h2 className="text-lg font-semibold">Articles</h2>
						<div className="mt-4">
							<table className="w-full">
								<thead>
									<tr className="border-b">
										<th className="pb-2 text-left text-sm font-medium text-muted-foreground">
											Produit
										</th>
										<th className="pb-2 text-center text-sm font-medium text-muted-foreground">
											Qte
										</th>
										<th className="pb-2 text-right text-sm font-medium text-muted-foreground">
											Prix unit.
										</th>
										<th className="pb-2 text-right text-sm font-medium text-muted-foreground">
											Total
										</th>
									</tr>
								</thead>
								<tbody>
									{order.items.map((item) => (
										<tr key={item.id} className="border-b last:border-0">
											<td className="py-3 text-sm">
												{item.productName}
												{item.specialInstructions && (
													<p className="mt-0.5 text-xs text-muted-foreground">
														{item.specialInstructions}
													</p>
												)}
											</td>
											<td className="py-3 text-center text-sm">{item.quantity}</td>
											<td className="py-3 text-right text-sm">{item.unitPrice} &euro;</td>
											<td className="py-3 text-right text-sm font-medium">{item.total} &euro;</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<div className="mt-4 flex justify-end border-t pt-4">
							<div className="text-right">
								{order.subtotal != null && (
									<div className="flex justify-between gap-8">
										<p className="text-sm text-muted-foreground">Sous-total</p>
										<p className="text-sm">{order.subtotal} &euro;</p>
									</div>
								)}
								{order.total != null &&
									(() => {
										const platformFee = (Number(order.total) * PLATFORM_FEE_PERCENT) / 100
										const stripeFee =
											(Number(order.total) * STRIPE_FEE_PERCENT) / 100 + STRIPE_FEE_FIXED
										const totalFees = platformFee + stripeFee
										return (
											<>
												<div className="mt-1 flex justify-between gap-8">
													<p className="text-sm font-medium">Total client</p>
													<p className="text-sm font-medium">
														{Number(order.total).toFixed(2)} &euro;
													</p>
												</div>
												<div className="mt-1 flex justify-between gap-8">
													<p className="text-sm text-muted-foreground">
														Frais Patissio ({PLATFORM_FEE_PERCENT}%)
													</p>
													<p className="text-sm text-red-600">-{platformFee.toFixed(2)} &euro;</p>
												</div>
												<div className="mt-1 flex justify-between gap-8">
													<p className="text-sm text-muted-foreground">
														Frais Stripe ({STRIPE_FEE_PERCENT}% + {STRIPE_FEE_FIXED.toFixed(2)}{' '}
														&euro;)
													</p>
													<p className="text-sm text-red-600">-{stripeFee.toFixed(2)} &euro;</p>
												</div>
												<div className="mt-1 flex justify-between gap-8 border-t pt-2">
													<p className="text-sm font-semibold">Vous recevez</p>
													<p className="text-lg font-bold text-green-600">
														{(Number(order.total) - totalFees).toFixed(2)} &euro;
													</p>
												</div>
											</>
										)
									})()}
							</div>
						</div>
					</div>
				)}

				{/* Custom order details */}
				{order.type === 'custom' && (
					<div className="rounded-lg border bg-card p-6">
						<h2 className="text-lg font-semibold">Details de la demande sur mesure</h2>
						{isEditing ? (
							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								<div>
									<label className="block text-sm font-medium text-muted-foreground">
										Type de patisserie
									</label>
									<input
										type="text"
										value={editForm.customType}
										onChange={(e) => setEditForm({ ...editForm, customType: e.target.value })}
										className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-muted-foreground">
										Nombre de personnes
									</label>
									<input
										type="number"
										value={editForm.customNbPersonnes}
										onChange={(e) =>
											setEditForm({ ...editForm, customNbPersonnes: e.target.value })
										}
										className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-muted-foreground">
										Date souhaitee
									</label>
									<input
										type="date"
										value={editForm.customDateSouhaitee}
										onChange={(e) =>
											setEditForm({ ...editForm, customDateSouhaitee: e.target.value })
										}
										className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-muted-foreground">Theme</label>
									<input
										type="text"
										value={editForm.customTheme}
										onChange={(e) => setEditForm({ ...editForm, customTheme: e.target.value })}
										className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-muted-foreground">
										Allergies
									</label>
									<input
										type="text"
										value={editForm.customAllergies}
										onChange={(e) => setEditForm({ ...editForm, customAllergies: e.target.value })}
										className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
								<div className="sm:col-span-2">
									<label className="block text-sm font-medium text-muted-foreground">
										Photo d&apos;inspiration
									</label>
									{order.customPhotoInspirationUrl && !removePhoto && !editPhotoFile && (
										<div className="mt-1 flex items-center gap-3">
											<a
												href={order.customPhotoInspirationUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm text-primary underline"
											>
												Photo actuelle
											</a>
											<button
												type="button"
												onClick={() => setRemovePhoto(true)}
												className="text-xs text-red-600 hover:underline"
											>
												Supprimer
											</button>
										</div>
									)}
									{removePhoto && !editPhotoFile && (
										<div className="mt-1 flex items-center gap-3">
											<p className="text-sm text-muted-foreground italic">Photo supprimee</p>
											<button
												type="button"
												onClick={() => setRemovePhoto(false)}
												className="text-xs text-primary hover:underline"
											>
												Annuler
											</button>
										</div>
									)}
									{editPhotoPreview && (
										<div className="mt-2">
											<img
												src={editPhotoPreview}
												alt="Preview"
												className="h-24 w-24 rounded-md object-cover"
											/>
											<button
												type="button"
												onClick={() => {
													setEditPhotoFile(null)
													setEditPhotoPreview(null)
												}}
												className="mt-1 text-xs text-red-600 hover:underline"
											>
												Retirer
											</button>
										</div>
									)}
									<input
										type="file"
										accept="image/jpeg,image/png,image/webp,image/avif"
										onChange={(e) => {
											const file = e.target.files?.[0]
											if (file) {
												setEditPhotoFile(file)
												setEditPhotoPreview(URL.createObjectURL(file))
												setRemovePhoto(false)
											}
										}}
										className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
									/>
								</div>
								<div className="sm:col-span-2">
									<label className="block text-sm font-medium text-muted-foreground">Message</label>
									<textarea
										value={editForm.customMessage}
										onChange={(e) => setEditForm({ ...editForm, customMessage: e.target.value })}
										rows={3}
										className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									/>
								</div>
							</div>
						) : (
							<div className="mt-4 grid gap-4 sm:grid-cols-2">
								{order.customType && (
									<div>
										<p className="text-sm text-muted-foreground">Type de patisserie</p>
										<p className="text-sm font-medium">{order.customType}</p>
									</div>
								)}
								{order.customNbPersonnes && (
									<div>
										<p className="text-sm text-muted-foreground">Nombre de personnes</p>
										<p className="text-sm font-medium">{order.customNbPersonnes}</p>
									</div>
								)}
								{order.customDateSouhaitee && (
									<div>
										<p className="text-sm text-muted-foreground">Date souhaitee</p>
										<p className="text-sm font-medium">
											{new Date(order.customDateSouhaitee).toLocaleDateString('fr-FR')}
										</p>
									</div>
								)}
								{order.customTheme && (
									<div>
										<p className="text-sm text-muted-foreground">Theme</p>
										<p className="text-sm font-medium">{order.customTheme}</p>
									</div>
								)}
								{order.customAllergies && (
									<div>
										<p className="text-sm text-muted-foreground">Allergies</p>
										<p className="text-sm font-medium">{order.customAllergies}</p>
									</div>
								)}
								{order.customPhotoInspirationUrl && (
									<div className="sm:col-span-2">
										<p className="text-sm text-muted-foreground">Photo d&apos;inspiration</p>
										<a
											href={order.customPhotoInspirationUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm font-medium text-primary underline"
										>
											Voir la photo
										</a>
									</div>
								)}
								{order.customMessage && (
									<div className="sm:col-span-2">
										<p className="text-sm text-muted-foreground">Message du client</p>
										<p className="text-sm font-medium">{order.customMessage}</p>
									</div>
								)}
							</div>
						)}

						{/* Quote form */}
						<div className="mt-6 border-t pt-6">
							<h3 className="text-base font-semibold">Devis</h3>
							<form onSubmit={handleSubmitQuote} className="mt-4 space-y-4">
								<div>
									<label htmlFor="quotedPrice" className="block text-sm font-medium">
										Prix propose (EUR)
									</label>
									<input
										id="quotedPrice"
										type="number"
										step="0.01"
										min="0"
										value={quotedPrice}
										onChange={(e) => setQuotedPrice(e.target.value)}
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="0.00"
										required
									/>
								</div>
								<div>
									<label htmlFor="depositPercent" className="block text-sm font-medium">
										Acompte demande (%)
									</label>
									<select
										id="depositPercent"
										value={depositPercent}
										onChange={(e) => setDepositPercent(e.target.value)}
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									>
										<option value="30">30%</option>
										<option value="50">50%</option>
										<option value="70">70%</option>
										<option value="100">100% (paiement integral)</option>
									</select>
									{quotedPrice && (
										<p className="mt-1 text-xs text-muted-foreground">
											Le client recevra un lien de paiement de{' '}
											<strong>
												{((Number(quotedPrice) * Number(depositPercent)) / 100).toFixed(2)} €
											</strong>
										</p>
									)}
								</div>
								<div>
									<label htmlFor="quoteConfirmedDate" className="block text-sm font-medium">
										Date confirmée
									</label>
									<input
										id="quoteConfirmedDate"
										type="date"
										value={quoteConfirmedDate}
										onChange={(e) => setQuoteConfirmedDate(e.target.value)}
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									/>
									{order.customDateSouhaitee && !quoteConfirmedDate && (
										<p className="mt-1 text-xs text-muted-foreground">
											Date souhaitée par le client :{' '}
											{new Date(order.customDateSouhaitee).toLocaleDateString('fr-FR')}
										</p>
									)}
								</div>
								<div>
									<label htmlFor="quoteResponse" className="block text-sm font-medium">
										Message de reponse
									</label>
									<textarea
										id="quoteResponse"
										value={quoteResponseMessage}
										onChange={(e) => setQuoteResponseMessage(e.target.value)}
										rows={3}
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="Votre reponse au client..."
									/>
								</div>
								<button
									type="submit"
									disabled={isSubmittingQuote || !quotedPrice}
									className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
								>
									{isSubmittingQuote ? 'Envoi...' : 'Envoyer le devis'}
								</button>
								{quoteError && <p className="text-sm text-red-600">{quoteError}</p>}
								{quoteSuccess && (
									<p
										className={`text-sm ${quoteSuccess.includes('Stripe') || quoteSuccess.includes('échoué') ? 'text-orange-600' : 'text-green-600'}`}
									>
										{quoteSuccess}
									</p>
								)}
							</form>
						</div>

						{/* Total display */}
						{order.total != null &&
							(() => {
								const platformFee = (Number(order.total) * PLATFORM_FEE_PERCENT) / 100
								const stripeFee =
									(Number(order.total) * STRIPE_FEE_PERCENT) / 100 + STRIPE_FEE_FIXED
								const totalFees = platformFee + stripeFee
								return (
									<div className="mt-4 border-t pt-4 space-y-1">
										<div className="flex items-center justify-between">
											<p className="text-sm font-medium">Total client</p>
											<p className="text-sm font-medium">{Number(order.total).toFixed(2)} &euro;</p>
										</div>
										<div className="flex items-center justify-between">
											<p className="text-sm text-muted-foreground">
												Frais Patissio ({PLATFORM_FEE_PERCENT}%)
											</p>
											<p className="text-sm text-red-600">-{platformFee.toFixed(2)} &euro;</p>
										</div>
										<div className="flex items-center justify-between">
											<p className="text-sm text-muted-foreground">
												Frais Stripe ({STRIPE_FEE_PERCENT}% + {STRIPE_FEE_FIXED.toFixed(2)} &euro;)
											</p>
											<p className="text-sm text-red-600">-{stripeFee.toFixed(2)} &euro;</p>
										</div>
										<div className="flex items-center justify-between border-t pt-2">
											<p className="text-sm font-semibold">Vous recevez</p>
											<p className="text-xl font-bold text-green-600">
												{(Number(order.total) - totalFees).toFixed(2)} &euro;
											</p>
										</div>
									</div>
								)
							})()}
					</div>
				)}

				{/* Patissier notes */}
				{isEditing ? (
					<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
						<h2 className="text-lg font-semibold">Notes internes</h2>
						<textarea
							value={editForm.patissierNotes}
							onChange={(e) => setEditForm({ ...editForm, patissierNotes: e.target.value })}
							rows={3}
							className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Notes internes (visibles uniquement par vous)..."
						/>
					</div>
				) : (
					order.patissierNotes && (
						<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
							<h2 className="text-lg font-semibold">Notes internes</h2>
							<p className="mt-2 text-sm">{order.patissierNotes}</p>
						</div>
					)
				)}

				{/* Messages thread */}
				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold">Messages</h2>
					<div className="mt-4 space-y-4">
						{order.messages && order.messages.length > 0 ? (
							order.messages.map((msg) => (
								<div
									key={msg.id}
									className={`rounded-lg p-3 ${
										msg.senderType === 'patissier'
											? 'ml-8 bg-primary/10'
											: msg.senderType === 'system'
												? 'bg-muted text-center text-sm italic'
												: 'mr-8 bg-muted'
									}`}
								>
									<div className="flex items-center justify-between">
										<p className="text-xs font-medium text-muted-foreground">
											{msg.senderType === 'patissier'
												? 'Vous'
												: msg.senderType === 'system'
													? 'Systeme'
													: 'Client'}
										</p>
										<p className="text-xs text-muted-foreground">
											{new Date(msg.createdAt).toLocaleString('fr-FR')}
										</p>
									</div>
									<p className="mt-1 text-sm">{msg.message}</p>
								</div>
							))
						) : (
							<p className="text-sm text-muted-foreground">Aucun message</p>
						)}
					</div>

					{/* Send message form */}
					<form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
						<input
							type="text"
							value={newMessage}
							onChange={(e) => setNewMessage(e.target.value)}
							placeholder="Ecrire un message au client..."
							className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							required
						/>
						<button
							type="submit"
							disabled={isSending}
							className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{isSending ? 'Envoi...' : 'Envoyer'}
						</button>
					</form>
				</div>
			</div>
		</PlanGate>
	)
}
