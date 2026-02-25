'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { api } from '@/lib/api/client'

interface OrderItem {
	id: string
	productName: string
	unitPrice: number
	quantity: number
	total: number
	specialInstructions: string | null
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
	customType: string | null
	customNbPersonnes: number | null
	customDateSouhaitee: string | null
	customTheme: string | null
	customAllergies: string | null
	customMessage: string | null
	createdAt: string
	updatedAt: string
	items: OrderItem[]
}

interface OrderMessage {
	id: string
	senderType: 'patissier' | 'client' | 'system'
	message: string
	createdAt: string
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

export default function ClientOrderTrackingPage() {
	const params = useParams()
	const orderNumber = params.id as string

	const [email, setEmail] = useState('')
	const [order, setOrder] = useState<Order | null>(null)
	const [messages, setMessages] = useState<OrderMessage[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState('')
	const [newMessage, setNewMessage] = useState('')
	const [isSending, setIsSending] = useState(false)
	const [hasSearched, setHasSearched] = useState(false)

	const fetchOrder = async (searchEmail: string) => {
		setIsLoading(true)
		setError('')
		try {
			const res = await api.get(`/client/orders/${orderNumber}`, { email: searchEmail })
			setOrder(res.data.data)
			setHasSearched(true)
			fetchMessages(searchEmail)
		} catch (err: any) {
			setError(err.message || 'Commande introuvable')
			setOrder(null)
			setHasSearched(true)
		} finally {
			setIsLoading(false)
		}
	}

	const fetchMessages = async (searchEmail: string) => {
		try {
			const res = await api.get(`/client/orders/${orderNumber}/messages`, { email: searchEmail })
			setMessages(res.data.data || [])
		} catch {
			setMessages([])
		}
	}

	const handleSubmitEmail = (e: React.FormEvent) => {
		e.preventDefault()
		if (!email.trim()) return
		fetchOrder(email.trim())
	}

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!newMessage.trim() || !order) return
		setIsSending(true)
		try {
			await api.post(`/client/orders/${orderNumber}/messages`, {
				message: newMessage.trim(),
				senderName: order.clientName,
			})
			setNewMessage('')
			fetchMessages(email)
		} catch (err: any) {
			setError(err.message || 'Erreur lors de l\'envoi du message')
		} finally {
			setIsSending(false)
		}
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<h1 className="text-3xl font-bold">Suivi de commande</h1>
			<p className="mt-1 text-muted-foreground">
				Commande <span className="font-mono font-medium">{orderNumber}</span>
			</p>

			{!order && (
				<form onSubmit={handleSubmitEmail} className="mt-6 space-y-4">
					<div>
						<label htmlFor="email" className="block text-sm font-medium">
							Entrez votre email pour consulter la commande
						</label>
						<div className="mt-2 flex gap-2">
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="votre@email.com"
								className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								required
							/>
							<button
								type="submit"
								disabled={isLoading}
								className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{isLoading ? 'Recherche...' : 'Rechercher'}
							</button>
						</div>
					</div>
					{error && hasSearched && (
						<p className="text-sm text-red-600">{error}</p>
					)}
				</form>
			)}

			{order && (
				<div className="mt-8 space-y-6">
					{/* Status banner */}
					<div className="rounded-lg border bg-card p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Statut</p>
								<span
									className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium ${statusColors[order.status] || 'bg-gray-100'}`}
								>
									{statusLabels[order.status] || order.status}
								</span>
							</div>
							<div className="text-right">
								<p className="text-sm text-muted-foreground">Type</p>
								<p className="mt-1 text-sm font-medium capitalize">{order.type === 'catalogue' ? 'Catalogue' : 'Sur mesure'}</p>
							</div>
						</div>
					</div>

					{/* Order details */}
					<div className="rounded-lg border bg-card p-6">
						<h2 className="text-lg font-semibold">Details de la commande</h2>
						<div className="mt-4 grid gap-4 sm:grid-cols-2">
							<div>
								<p className="text-sm text-muted-foreground">Client</p>
								<p className="text-sm font-medium">{order.clientName}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Email</p>
								<p className="text-sm font-medium">{order.clientEmail}</p>
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
							<div>
								<p className="text-sm text-muted-foreground">Mode de livraison</p>
								<p className="text-sm font-medium">{order.deliveryMethod === 'pickup' ? 'Retrait' : 'Livraison'}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Paiement</p>
								<p className="text-sm font-medium capitalize">{order.paymentStatus}</p>
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Cree le</p>
								<p className="text-sm font-medium">
									{new Date(order.createdAt).toLocaleDateString('fr-FR')}
								</p>
							</div>
						</div>
					</div>

					{/* Custom order details */}
					{order.type === 'custom' && (
						<div className="rounded-lg border bg-card p-6">
							<h2 className="text-lg font-semibold">Details de la demande sur mesure</h2>
							<div className="mt-4 space-y-3">
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
								{order.customMessage && (
									<div>
										<p className="text-sm text-muted-foreground">Message</p>
										<p className="text-sm font-medium">{order.customMessage}</p>
									</div>
								)}
								{order.quotedPrice != null && (
									<div>
										<p className="text-sm text-muted-foreground">Devis</p>
										<p className="text-sm font-medium">{order.quotedPrice} &euro;</p>
									</div>
								)}
								{order.responseMessage && (
									<div>
										<p className="text-sm text-muted-foreground">Reponse du patissier</p>
										<p className="text-sm font-medium">{order.responseMessage}</p>
									</div>
								)}
							</div>
						</div>
					)}

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
							{order.total != null && (
								<div className="mt-4 flex justify-end border-t pt-4">
									<div className="text-right">
										<p className="text-sm text-muted-foreground">Total</p>
										<p className="text-xl font-bold">{order.total} &euro;</p>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Total for custom orders */}
					{order.type === 'custom' && order.total != null && (
						<div className="rounded-lg border bg-card p-6">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">Total</h2>
								<p className="text-xl font-bold">{order.total} &euro;</p>
							</div>
						</div>
					)}

					{/* Messages thread */}
					<div className="rounded-lg border bg-card p-6">
						<h2 className="text-lg font-semibold">Messages</h2>
						<div className="mt-4 space-y-4">
							{messages.length === 0 ? (
								<p className="text-sm text-muted-foreground">Aucun message pour le moment</p>
							) : (
								messages.map((msg) => (
									<div
										key={msg.id}
										className={`rounded-lg p-3 ${
											msg.senderType === 'client'
												? 'ml-8 bg-primary/10'
												: msg.senderType === 'system'
													? 'bg-muted text-center text-sm italic'
													: 'mr-8 bg-muted'
										}`}
									>
										<div className="flex items-center justify-between">
											<p className="text-xs font-medium text-muted-foreground">
												{msg.senderType === 'client'
													? 'Vous'
													: msg.senderType === 'system'
														? 'Systeme'
														: 'Patissier'}
											</p>
											<p className="text-xs text-muted-foreground">
												{new Date(msg.createdAt).toLocaleString('fr-FR')}
											</p>
										</div>
										<p className="mt-1 text-sm">{msg.message}</p>
									</div>
								))
							)}
						</div>

						{/* Send message form */}
						{order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'picked_up' && (
							<form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
								<input
									type="text"
									value={newMessage}
									onChange={(e) => setNewMessage(e.target.value)}
									placeholder="Ecrire un message..."
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
						)}
					</div>
				</div>
			)}
		</div>
	)
}
