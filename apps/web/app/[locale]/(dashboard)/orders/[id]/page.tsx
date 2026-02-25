'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api/client'
import { PlanGate } from '@/components/auth/plan-gate'

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

const allStatuses = ['pending', 'confirmed', 'in_progress', 'ready', 'delivered', 'picked_up', 'cancelled']

export default function PatissierOrderDetailPage() {
	const params = useParams()
	const orderId = params.id as string

	const [order, setOrder] = useState<Order | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	// Status update
	const [newStatus, setNewStatus] = useState('')
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
	const [statusError, setStatusError] = useState('')

	// Quote form (custom orders)
	const [quotedPrice, setQuotedPrice] = useState('')
	const [depositPercent, setDepositPercent] = useState('100')
	const [quoteResponseMessage, setQuoteResponseMessage] = useState('')
	const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)
	const [quoteError, setQuoteError] = useState('')
	const [quoteSuccess, setQuoteSuccess] = useState('')

	// Messages
	const [newMessage, setNewMessage] = useState('')
	const [isSending, setIsSending] = useState(false)

	const fetchOrder = () => {
		api
			.get(`/patissier/orders/${orderId}`)
			.then((res) => {
				const data = res.data.data
				setOrder(data)
				setNewStatus(data.status)
				if (data.quotedPrice != null) {
					setQuotedPrice(String(data.quotedPrice))
				}
				if (data.responseMessage) {
					setQuoteResponseMessage(data.responseMessage)
				}
			})
			.catch((err: any) => setError(err.message || 'Commande introuvable'))
			.finally(() => setIsLoading(false))
	}

	useEffect(() => {
		fetchOrder()
	}, [orderId])

	const handleUpdateStatus = async () => {
		if (!newStatus || !order) return
		setIsUpdatingStatus(true)
		setStatusError('')
		try {
			const res = await api.put(`/patissier/orders/${orderId}/status`, { status: newStatus })
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
			})
			setOrder({ ...order, ...res.data.data })
			setQuoteSuccess('Devis envoyé avec succès ! Le client a été notifié par email.')
			setTimeout(() => setQuoteSuccess(''), 5000)
		} catch (err: any) {
			setQuoteError(err.message || 'Erreur lors de l\'envoi du devis')
		} finally {
			setIsSubmittingQuote(false)
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
			setError(err.message || 'Erreur lors de l\'envoi du message')
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
				<span
					className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[order.status] || 'bg-gray-100'}`}
				>
					{statusLabels[order.status] || order.status}
				</span>
			</div>

			{/* Status update */}
			<div className="rounded-lg border bg-card p-6">
				<h2 className="text-lg font-semibold">Mettre a jour le statut</h2>
				<div className="mt-4 flex items-end gap-3">
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
						<p className="text-sm font-medium">{order.deliveryMethod === 'pickup' ? 'Retrait' : 'Livraison'}</p>
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
			</div>

			{/* Dates */}
			<div className="rounded-lg border bg-card p-6">
				<h2 className="text-lg font-semibold">Dates</h2>
				<div className="mt-4 grid gap-4 sm:grid-cols-2">
					<div>
						<p className="text-sm text-muted-foreground">Creee le</p>
						<p className="text-sm font-medium">{new Date(order.createdAt).toLocaleString('fr-FR')}</p>
					</div>
					{order.requestedDate && (
						<div>
							<p className="text-sm text-muted-foreground">Date souhaitee</p>
							<p className="text-sm font-medium">{new Date(order.requestedDate).toLocaleDateString('fr-FR')}</p>
						</div>
					)}
					{order.confirmedDate && (
						<div>
							<p className="text-sm text-muted-foreground">Date confirmee</p>
							<p className="text-sm font-medium">{new Date(order.confirmedDate).toLocaleDateString('fr-FR')}</p>
						</div>
					)}
					{order.confirmedAt && (
						<div>
							<p className="text-sm text-muted-foreground">Confirmee le</p>
							<p className="text-sm font-medium">{new Date(order.confirmedAt).toLocaleString('fr-FR')}</p>
						</div>
					)}
					{order.completedAt && (
						<div>
							<p className="text-sm text-muted-foreground">Terminee le</p>
							<p className="text-sm font-medium">{new Date(order.completedAt).toLocaleString('fr-FR')}</p>
						</div>
					)}
					{order.cancelledAt && (
						<div>
							<p className="text-sm text-muted-foreground">Annulee le</p>
							<p className="text-sm font-medium">{new Date(order.cancelledAt).toLocaleString('fr-FR')}</p>
						</div>
					)}
					<div>
						<p className="text-sm text-muted-foreground">Paiement</p>
						<p className="text-sm font-medium capitalize">{order.paymentStatus}</p>
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
									<th className="pb-2 text-left text-sm font-medium text-muted-foreground">Produit</th>
									<th className="pb-2 text-center text-sm font-medium text-muted-foreground">Qte</th>
									<th className="pb-2 text-right text-sm font-medium text-muted-foreground">Prix unit.</th>
									<th className="pb-2 text-right text-sm font-medium text-muted-foreground">Total</th>
								</tr>
							</thead>
							<tbody>
								{order.items.map((item) => (
									<tr key={item.id} className="border-b last:border-0">
										<td className="py-3 text-sm">
											{item.productName}
											{item.specialInstructions && (
												<p className="mt-0.5 text-xs text-muted-foreground">{item.specialInstructions}</p>
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
							{order.total != null && (
								<div className="mt-1 flex justify-between gap-8">
									<p className="text-sm font-medium">Total</p>
									<p className="text-lg font-bold">{order.total} &euro;</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Custom order details */}
			{order.type === 'custom' && (
				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold">Details de la demande sur mesure</h2>
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
								<p className="text-sm font-medium">{new Date(order.customDateSouhaitee).toLocaleDateString('fr-FR')}</p>
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
										<strong>{(Number(quotedPrice) * Number(depositPercent) / 100).toFixed(2)} €</strong>
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
							{quoteSuccess && <p className="text-sm text-green-600">{quoteSuccess}</p>}
						</form>
					</div>

					{/* Total display */}
					{order.total != null && (
						<div className="mt-4 border-t pt-4">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium">Total</p>
								<p className="text-xl font-bold">{order.total} &euro;</p>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Patissier notes */}
			{order.patissierNotes && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
					<h2 className="text-lg font-semibold">Notes internes</h2>
					<p className="mt-2 text-sm">{order.patissierNotes}</p>
				</div>
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
