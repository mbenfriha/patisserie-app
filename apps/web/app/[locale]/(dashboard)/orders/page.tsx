'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { useAuth } from '@/lib/providers/auth-provider'
import { PlanGate } from '@/components/auth/plan-gate'
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'

interface Order {
	id: string
	orderNumber: string
	clientName: string
	type: 'catalogue' | 'custom'
	status: string
	total: number | null
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
	// Devis fields
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
	customType: '',
	customNbPersonnes: '',
	customDateSouhaitee: '',
	customTheme: '',
	customAllergies: '',
	customMessage: '',
}

const statusColors: Record<string, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-blue-100 text-blue-800',
	in_progress: 'bg-purple-100 text-purple-800',
	ready: 'bg-green-100 text-green-800',
	delivered: 'bg-gray-100 text-gray-800',
	picked_up: 'bg-gray-100 text-gray-800',
	cancelled: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
	pending: 'En attente',
	confirmed: 'Confirmée',
	in_progress: 'En cours',
	ready: 'Prête',
	delivered: 'Livrée',
	picked_up: 'Récupérée',
	cancelled: 'Annulée',
}

const typeLabels: Record<string, string> = {
	catalogue: 'Catalogue',
	custom: 'Sur-mesure',
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
	const { user } = useAuth()
	const [orders, setOrders] = useState<Order[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [copied, setCopied] = useState<string | null>(null)
	const dashboardPrefix = useDashboardPrefix()

	// Create modal state
	const [showCreateModal, setShowCreateModal] = useState(false)
	const [form, setForm] = useState<CreateForm>(emptyForm)
	const [cartItems, setCartItems] = useState<CartItem[]>([])
	const [products, setProducts] = useState<ProductOption[]>([])
	const [selectedProductId, setSelectedProductId] = useState('')
	const [selectedQuantity, setSelectedQuantity] = useState(1)
	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState<string | null>(null)

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
				const list = Array.isArray(payload) ? payload : payload?.data ?? []
				setOrders(list)
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	useEffect(() => {
		fetchOrders()
	}, [fetchOrders])

	// Load products when switching to catalogue mode
	useEffect(() => {
		if (form.type === 'catalogue' && products.length === 0) {
			api
				.get('/patissier/products?limit=200')
				.then((res) => {
					const payload = res.data?.data
					const list = Array.isArray(payload) ? payload : payload?.data ?? []
					setProducts(list)
				})
				.catch(console.error)
		}
	}, [form.type, products.length])

	const openCreateModal = () => {
		setForm(emptyForm)
		setCartItems([])
		setSelectedProductId('')
		setSelectedQuantity(1)
		setShowCreateModal(true)
	}

	const addCartItem = () => {
		const product = products.find((p) => p.id === selectedProductId)
		if (!product) return

		const existing = cartItems.find((i) => i.product_id === selectedProductId)
		if (existing) {
			setCartItems((items) =>
				items.map((i) =>
					i.product_id === selectedProductId
						? { ...i, quantity: i.quantity + selectedQuantity }
						: i
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

	const canSave =
		form.clientName.trim() &&
		form.clientEmail.trim() &&
		(form.type === 'custom' || cartItems.length > 0)

	const handleSave = async () => {
		if (!canSave) return
		setSaving(true)
		try {
			const payload: Record<string, unknown> = {
				type: form.type,
				clientName: form.clientName,
				clientEmail: form.clientEmail,
				clientPhone: form.clientPhone || undefined,
				requestedDate: form.requestedDate || undefined,
				deliveryMethod: form.deliveryMethod,
				patissierNotes: form.patissierNotes || undefined,
			}

			if (form.deliveryMethod === 'delivery') {
				payload.deliveryAddress = form.deliveryAddress || undefined
				payload.deliveryNotes = form.deliveryNotes || undefined
			}

			if (form.type === 'catalogue') {
				payload.items = cartItems.map((i) => ({
					product_id: i.product_id,
					quantity: i.quantity,
				}))
			} else {
				payload.customType = form.customType || undefined
				payload.customNbPersonnes = form.customNbPersonnes || undefined
				payload.customDateSouhaitee = form.customDateSouhaitee || undefined
				payload.customTheme = form.customTheme || undefined
				payload.customAllergies = form.customAllergies || undefined
				payload.customMessage = form.customMessage || undefined
			}

			await api.post('/patissier/orders', payload)
			setShowCreateModal(false)
			fetchOrders()
			setToast('Commande créée avec succès')
			setTimeout(() => setToast(null), 3000)
		} catch (err) {
			console.error(err)
			setToast('Erreur lors de la création')
			setTimeout(() => setToast(null), 3000)
		} finally {
			setSaving(false)
		}
	}

	return (
		<PlanGate minPlan="pro">
		<div className="space-y-6">
			{toast && (
				<div className="fixed right-4 top-4 z-[60] rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg">
					{toast}
				</div>
			)}

			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">Commandes</h1>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={openCreateModal}
						className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="M12 5v14M5 12h14" />
						</svg>
						Nouvelle commande
					</button>
					{devisUrl && (
						<>
							<button
								type="button"
								onClick={() => copyLink(devisUrl, 'devis')}
								className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
							>
								{copied === 'devis' ? (
									<>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
											<path d="M20 6L9 17l-5-5" />
										</svg>
										<span className="text-green-600">Copié !</span>
									</>
								) : (
									<>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
											<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
											<path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
										</svg>
										Partager le formulaire de devis
									</>
								)}
							</button>
							{catalogueUrl && (
								<button
									type="button"
									onClick={() => copyLink(catalogueUrl, 'catalogue')}
									className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
								>
									{copied === 'catalogue' ? (
										<>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
												<path d="M20 6L9 17l-5-5" />
											</svg>
											<span className="text-green-600">Copié !</span>
										</>
									) : (
										<>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
												<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
												<path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
											</svg>
											Partager le catalogue
										</>
									)}
								</button>
							)}
						</>
					)}
				</div>
			</div>

			{isLoading ? (
				<p className="text-muted-foreground">Chargement...</p>
			) : orders.length === 0 ? (
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">Aucune commande pour le moment.</p>
				</div>
			) : (
				<>
				{/* Mobile: card list */}
				<div className="space-y-3 sm:hidden">
					{orders.map((order) => (
						<Link
							key={order.id}
							href={`${dashboardPrefix}/orders/${order.id}`}
							className="block rounded-lg border p-4 transition-colors hover:bg-muted/30"
						>
							<div className="flex items-center justify-between">
								<span className="font-mono text-sm font-medium text-primary">{order.orderNumber}</span>
								<span
									className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}
								>
									{statusLabels[order.status] || order.status}
								</span>
							</div>
							<div className="mt-2 flex items-center justify-between text-sm">
								<span className="text-foreground">{order.clientName}</span>
								<span className="font-medium">{order.total != null ? `${order.total} €` : '-'}</span>
							</div>
							<div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
								<span>{typeLabels[order.type] || order.type}</span>
								<span>{new Date(order.createdAt).toLocaleDateString('fr-FR')}</span>
							</div>
						</Link>
					))}
				</div>

				{/* Desktop: table */}
				<div className="hidden rounded-lg border sm:block">
					<table className="w-full">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left text-sm font-medium">N°</th>
								<th className="px-4 py-3 text-left text-sm font-medium">Client</th>
								<th className="px-4 py-3 text-left text-sm font-medium">Type</th>
								<th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
								<th className="hidden px-4 py-3 text-left text-sm font-medium md:table-cell">Date</th>
								<th className="px-4 py-3 text-right text-sm font-medium">Total</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((order) => (
								<tr key={order.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
									<td className="px-4 py-3 text-sm">
										<Link href={`${dashboardPrefix}/orders/${order.id}`} className="font-mono text-primary hover:underline">
											{order.orderNumber}
										</Link>
									</td>
									<td className="px-4 py-3 text-sm">{order.clientName}</td>
									<td className="px-4 py-3 text-sm">{typeLabels[order.type] || order.type}</td>
									<td className="px-4 py-3">
										<span
											className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[order.status] || 'bg-gray-100'}`}
										>
											{statusLabels[order.status] || order.status}
										</span>
									</td>
									<td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
										{new Date(order.createdAt).toLocaleDateString('fr-FR')}
									</td>
									<td className="px-4 py-3 text-right text-sm">
										{order.total != null ? `${order.total} €` : '-'}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				</>
			)}

			{/* Create order modal */}
			{showCreateModal && (
				<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
					<div className="max-h-[85vh] w-full overflow-y-auto rounded-t-xl bg-white p-4 shadow-xl dark:bg-gray-900 sm:max-w-lg sm:rounded-lg sm:p-6">
						<h2 className="text-xl font-bold">Nouvelle commande</h2>

						<div className="mt-4 space-y-4">
							{/* Type toggle */}
							<div className="flex rounded-lg border p-1">
								<button
									type="button"
									onClick={() => setForm((f) => ({ ...f, type: 'custom' }))}
									className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${form.type === 'custom' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
								>
									Devis
								</button>
								<button
									type="button"
									onClick={() => setForm((f) => ({ ...f, type: 'catalogue' }))}
									className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${form.type === 'catalogue' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
								>
									Catalogue
								</button>
							</div>

							{/* Common fields */}
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="mb-1 block text-sm font-medium">
										Nom du client <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										value={form.clientName}
										onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
										placeholder="Jean Dupont"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium">
										Email du client <span className="text-red-500">*</span>
									</label>
									<input
										type="email"
										value={form.clientEmail}
										onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
										placeholder="jean@exemple.com"
									/>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="mb-1 block text-sm font-medium">Téléphone</label>
									<input
										type="tel"
										value={form.clientPhone}
										onChange={(e) => setForm((f) => ({ ...f, clientPhone: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
										placeholder="06 12 34 56 78"
									/>
								</div>
								<div>
									<label className="mb-1 block text-sm font-medium">Date souhaitée</label>
									<input
										type="date"
										value={form.requestedDate}
										onChange={(e) => setForm((f) => ({ ...f, requestedDate: e.target.value }))}
										className="w-full rounded border px-3 py-2 text-sm"
									/>
								</div>
							</div>

							<div>
								<label className="mb-1 block text-sm font-medium">Mode de livraison</label>
								<div className="flex gap-4">
									<label className="flex items-center gap-2 text-sm">
										<input
											type="radio"
											name="deliveryMethod"
											checked={form.deliveryMethod === 'pickup'}
											onChange={() => setForm((f) => ({ ...f, deliveryMethod: 'pickup' }))}
											className="h-4 w-4"
										/>
										Retrait
									</label>
									<label className="flex items-center gap-2 text-sm">
										<input
											type="radio"
											name="deliveryMethod"
											checked={form.deliveryMethod === 'delivery'}
											onChange={() => setForm((f) => ({ ...f, deliveryMethod: 'delivery' }))}
											className="h-4 w-4"
										/>
										Livraison
									</label>
								</div>
							</div>

							{form.deliveryMethod === 'delivery' && (
								<>
									<div>
										<label className="mb-1 block text-sm font-medium">Adresse de livraison</label>
										<input
											type="text"
											value={form.deliveryAddress}
											onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
											className="w-full rounded border px-3 py-2 text-sm"
											placeholder="123 rue de la Paix, 75001 Paris"
										/>
									</div>
									<div>
										<label className="mb-1 block text-sm font-medium">Notes de livraison</label>
										<input
											type="text"
											value={form.deliveryNotes}
											onChange={(e) => setForm((f) => ({ ...f, deliveryNotes: e.target.value }))}
											className="w-full rounded border px-3 py-2 text-sm"
											placeholder="Code d'entrée, étage..."
										/>
									</div>
								</>
							)}

							<div>
								<label className="mb-1 block text-sm font-medium">Notes internes</label>
								<textarea
									value={form.patissierNotes}
									onChange={(e) => setForm((f) => ({ ...f, patissierNotes: e.target.value }))}
									className="w-full rounded border px-3 py-2 text-sm"
									rows={2}
									placeholder="Notes visibles uniquement par vous..."
								/>
							</div>

							{/* Catalogue-specific fields */}
							{form.type === 'catalogue' && (
								<div className="space-y-3 rounded-lg border bg-muted/30 p-3">
									<label className="block text-sm font-medium">Articles</label>
									<div className="flex gap-2">
										<select
											value={selectedProductId}
											onChange={(e) => setSelectedProductId(e.target.value)}
											className="flex-1 rounded border px-3 py-2 text-sm"
										>
											<option value="">Sélectionner un produit...</option>
											{products.map((p) => (
												<option key={p.id} value={p.id}>
													{p.name} — {p.price} €
												</option>
											))}
										</select>
										<input
											type="number"
											min={1}
											value={selectedQuantity}
											onChange={(e) => setSelectedQuantity(Math.max(1, Number(e.target.value)))}
											className="w-16 rounded border px-2 py-2 text-center text-sm"
										/>
										<button
											type="button"
											onClick={addCartItem}
											disabled={!selectedProductId}
											className="rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
										>
											+
										</button>
									</div>

									{cartItems.length > 0 && (
										<div className="space-y-1">
											{cartItems.map((item) => (
												<div
													key={item.product_id}
													className="flex items-center justify-between rounded border bg-white px-3 py-2 text-sm dark:bg-gray-800"
												>
													<span className="flex-1">{item.name}</span>
													<span className="mx-2 text-muted-foreground">
														{item.price} € × {item.quantity}
													</span>
													<span className="mr-2 font-medium">{(item.price * item.quantity).toFixed(2)} €</span>
													<button
														type="button"
														onClick={() => removeCartItem(item.product_id)}
														className="text-muted-foreground hover:text-red-500"
													>
														&times;
													</button>
												</div>
											))}
											<div className="pt-1 text-right text-sm font-medium">
												Total : {cartTotal.toFixed(2)} €
											</div>
										</div>
									)}
								</div>
							)}

							{/* Devis-specific fields */}
							{form.type === 'custom' && (
								<div className="space-y-4 rounded-lg border bg-muted/30 p-3">
									<label className="block text-sm font-medium">Détails du devis</label>
									<div className="grid gap-4 sm:grid-cols-2">
										<div>
											<label className="mb-1 block text-xs text-muted-foreground">Type de pâtisserie</label>
											<input
												type="text"
												value={form.customType}
												onChange={(e) => setForm((f) => ({ ...f, customType: e.target.value }))}
												className="w-full rounded border px-3 py-2 text-sm"
												placeholder="Gâteau d'anniversaire..."
											/>
										</div>
										<div>
											<label className="mb-1 block text-xs text-muted-foreground">Nombre de personnes</label>
											<input
												type="text"
												value={form.customNbPersonnes}
												onChange={(e) => setForm((f) => ({ ...f, customNbPersonnes: e.target.value }))}
												className="w-full rounded border px-3 py-2 text-sm"
												placeholder="10"
											/>
										</div>
									</div>
									<div className="grid gap-4 sm:grid-cols-2">
										<div>
											<label className="mb-1 block text-xs text-muted-foreground">Date de l'événement</label>
											<input
												type="date"
												value={form.customDateSouhaitee}
												onChange={(e) => setForm((f) => ({ ...f, customDateSouhaitee: e.target.value }))}
												className="w-full rounded border px-3 py-2 text-sm"
											/>
										</div>
										<div>
											<label className="mb-1 block text-xs text-muted-foreground">Thème</label>
											<input
												type="text"
												value={form.customTheme}
												onChange={(e) => setForm((f) => ({ ...f, customTheme: e.target.value }))}
												className="w-full rounded border px-3 py-2 text-sm"
												placeholder="Princesse, floral..."
											/>
										</div>
									</div>
									<div>
										<label className="mb-1 block text-xs text-muted-foreground">Allergies</label>
										<input
											type="text"
											value={form.customAllergies}
											onChange={(e) => setForm((f) => ({ ...f, customAllergies: e.target.value }))}
											className="w-full rounded border px-3 py-2 text-sm"
											placeholder="Gluten, lactose..."
										/>
									</div>
									<div>
										<label className="mb-1 block text-xs text-muted-foreground">Message / description</label>
										<textarea
											value={form.customMessage}
											onChange={(e) => setForm((f) => ({ ...f, customMessage: e.target.value }))}
											className="w-full rounded border px-3 py-2 text-sm"
											rows={3}
											placeholder="Décrivez la commande souhaitée..."
										/>
									</div>
								</div>
							)}
						</div>

						{/* Footer */}
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowCreateModal(false)}
								className="rounded border px-4 py-2 text-sm hover:bg-muted"
							>
								Annuler
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={saving || !canSave}
								className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
							>
								{saving ? 'Création...' : 'Créer la commande'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
		</PlanGate>
	)
}
