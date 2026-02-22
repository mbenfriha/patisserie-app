'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

type Product = {
	id: string
	name: string
	price: number
	unit: string
	description?: string | null
	images?: { url: string }[]
}

type CartItem = {
	product_id: string
	quantity: number
}

interface CatalogueTabProps {
	products: Product[]
	slug: string
	onSuccess: () => void
}

const inputClassName =
	'mt-2 block w-full rounded-lg border-2 border-[#eee] bg-white px-4 py-3 text-sm text-[var(--dark)] outline-none transition-colors duration-200 focus:border-[var(--gold)]'

const labelClassName =
	'block text-[12px] font-semibold uppercase tracking-[1px] text-[var(--dark-soft)]'

export function CatalogueTab({ products, slug, onSuccess }: CatalogueTabProps) {
	const [cart, setCart] = useState<CartItem[]>([])
	const [common, setCommon] = useState({
		client_name: '',
		client_email: '',
		client_phone: '',
		delivery_method: 'pickup',
		requested_date: '',
	})
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState('')

	function updateCartItem(productId: string, quantity: number) {
		setCart((prev) => {
			if (quantity <= 0) {
				return prev.filter((item) => item.product_id !== productId)
			}
			const existing = prev.find((item) => item.product_id === productId)
			if (existing) {
				return prev.map((item) =>
					item.product_id === productId ? { ...item, quantity } : item
				)
			}
			return [...prev, { product_id: productId, quantity }]
		})
	}

	function getCartQuantity(productId: string): number {
		return cart.find((item) => item.product_id === productId)?.quantity || 0
	}

	function getSubtotal(): number {
		return cart.reduce((total, item) => {
			const product = products.find((p) => p.id === item.product_id)
			return total + (product?.price || 0) * item.quantity
		}, 0)
	}

	function handleCommonChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
		const { name, value } = e.target
		setCommon((prev) => ({ ...prev, [name]: value }))
	}

	const cartItems = cart
		.map((item) => {
			const product = products.find((p) => p.id === item.product_id)
			if (!product) return null
			return { ...item, product }
		})
		.filter(Boolean) as { product_id: string; quantity: number; product: Product }[]

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setError('')

		try {
			const res = await fetch(`${API_URL}/client/orders`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					slug,
					type: 'catalogue',
					clientName: common.client_name,
					clientEmail: common.client_email,
					clientPhone: common.client_phone,
					deliveryMethod: common.delivery_method,
					requestedDate: common.requested_date,
					items: cart.map((item) => ({
						product_id: item.product_id,
						quantity: item.quantity,
					})),
				}),
			})

			if (!res.ok) {
				const data = await res.json().catch(() => null)
				throw new Error(data?.message || 'Une erreur est survenue')
			}

			onSuccess()
		} catch (err: any) {
			setError(err.message || 'Une erreur est survenue')
		} finally {
			setSubmitting(false)
		}
	}

	if (products.length === 0) {
		return (
			<div className="py-24 text-center" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
				<div
					className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
					style={{ backgroundColor: 'var(--gold)', opacity: 0.1 }}
				/>
				<h3 className="font-[family-name:'Cormorant_Garamond'] text-2xl text-[var(--dark)]">
					Catalogue non disponible
				</h3>
				<p
					className="mx-auto mt-3 max-w-md text-sm leading-relaxed"
					style={{ color: 'var(--dark-soft)', fontFamily: "'Josefin Sans', sans-serif" }}
				>
					Notre catalogue sera bient&ocirc;t disponible. Vous pouvez passer une commande sur-mesure en attendant.
				</p>
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit} style={{ animation: 'fadeInUp 0.5s ease-out' }}>
			{/* Product grid */}
			<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{products.map((product, i) => {
					const qty = getCartQuantity(product.id)
					return (
						<div
							key={product.id}
							className="group overflow-hidden rounded-2xl bg-white transition-all duration-400 hover:-translate-y-2"
							style={{
								animation: `fadeInUp 0.6s ease-out ${i * 0.08}s both`,
								boxShadow: qty > 0
									? '0 8px 32px rgba(197,165,90,0.2)'
									: '0 4px 24px rgba(0,0,0,0.06)',
								border: qty > 0
									? '2px solid var(--gold)'
									: '2px solid transparent',
							}}
						>
							{/* Product image */}
							<div className="relative overflow-hidden" style={{ aspectRatio: '3/2' }}>
								{product.images?.[0]?.url ? (
									<img
										src={product.images[0].url}
										alt={product.name}
										className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-[1.05]"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--cream)] to-[var(--cream-dark)]">
										<span className="font-[family-name:'Cormorant_Garamond'] text-xl text-[var(--gold)]/30">
											{product.name}
										</span>
									</div>
								)}
							</div>

							{/* Product details */}
							<div className="p-6">
								<h3 className="font-[family-name:'Cormorant_Garamond'] text-[22px] font-medium text-[var(--dark)]">
									{product.name}
								</h3>

								<div className="mt-2 flex items-baseline gap-2">
									<span className="font-[family-name:'Josefin_Sans'] text-lg font-semibold text-[var(--gold)]">
										{product.price}&nbsp;&euro;
									</span>
									{product.unit && (
										<span className="text-xs text-[var(--dark-soft)]/50">
											/ {product.unit}
										</span>
									)}
								</div>

								{/* Quantity counter */}
								<div className="mt-5 flex items-center gap-3">
									<button
										type="button"
										onClick={() => updateCartItem(product.id, qty - 1)}
										className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[var(--gold)]/30 text-sm font-medium text-[var(--dark-soft)] transition-all duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 hover:text-[var(--gold)]"
										style={{ fontFamily: "'Josefin Sans', sans-serif" }}
									>
										&minus;
									</button>
									<span
										className="w-10 text-center text-base font-semibold text-[var(--dark)]"
										style={{ fontFamily: "'Josefin Sans', sans-serif" }}
									>
										{qty}
									</span>
									<button
										type="button"
										onClick={() => updateCartItem(product.id, qty + 1)}
										className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[var(--gold)]/30 text-sm font-medium text-[var(--dark-soft)] transition-all duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5 hover:text-[var(--gold)]"
										style={{ fontFamily: "'Josefin Sans', sans-serif" }}
									>
										+
									</button>
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{/* Cart summary */}
			{cartItems.length > 0 && (
				<div
					className="mt-12 rounded-2xl bg-[var(--cream-dark)] p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
					style={{ animation: 'fadeInUp 0.4s ease-out' }}
				>
					<h3 className="mb-6 font-[family-name:'Cormorant_Garamond'] text-[24px] font-medium text-[var(--dark)]">
						R&eacute;capitulatif
					</h3>

					<div className="space-y-3">
						{cartItems.map((item) => (
							<div
								key={item.product_id}
								className="flex items-center justify-between text-sm"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								<span className="text-[var(--dark-soft)]">
									{item.product.name}
									<span className="mx-2 text-[var(--gold)]">&times;</span>
									{item.quantity}
								</span>
								<span className="font-medium text-[var(--dark)]">
									{(item.product.price * item.quantity).toFixed(2)}&nbsp;&euro;
								</span>
							</div>
						))}
					</div>

					<div className="mt-6 border-t border-[var(--gold)]/20 pt-6">
						<div className="flex items-center justify-between">
							<span
								className="text-xs font-semibold uppercase tracking-[2px] text-[var(--dark-soft)]"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								Total
							</span>
							<span className="font-[family-name:'Cormorant_Garamond'] text-[32px] font-medium text-[var(--gold)]">
								{getSubtotal().toFixed(2)}&nbsp;&euro;
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Gold Divider */}
			{cartItems.length > 0 && (
				<>
					<div className="my-16 flex items-center justify-center gap-4">
						<div
							className="h-px max-w-[120px] flex-1"
							style={{ background: 'linear-gradient(90deg, transparent, var(--gold))' }}
						/>
						<div className="h-2 w-2 rotate-45 bg-[var(--gold)]" />
						<div
							className="h-px max-w-[120px] flex-1"
							style={{ background: 'linear-gradient(90deg, var(--gold), transparent)' }}
						/>
					</div>

					{/* Common Fields */}
					<div className="mx-auto max-w-2xl">
						<h2 className="mb-8 text-center font-[family-name:'Cormorant_Garamond'] text-[32px] font-medium text-[var(--dark)]">
							Vos coordonn&eacute;es
						</h2>

						<div className="space-y-6">
							<div>
								<label htmlFor="cat_client_name" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
									Nom complet
								</label>
								<input
									type="text"
									id="cat_client_name"
									name="client_name"
									value={common.client_name}
									onChange={handleCommonChange}
									required
									className={inputClassName}
									style={{ fontFamily: "'Josefin Sans', sans-serif" }}
								/>
							</div>

							<div>
								<label htmlFor="cat_client_email" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
									Email
								</label>
								<input
									type="email"
									id="cat_client_email"
									name="client_email"
									value={common.client_email}
									onChange={handleCommonChange}
									required
									className={inputClassName}
									style={{ fontFamily: "'Josefin Sans', sans-serif" }}
								/>
							</div>

							<div>
								<label htmlFor="cat_client_phone" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
									T&eacute;l&eacute;phone
								</label>
								<input
									type="tel"
									id="cat_client_phone"
									name="client_phone"
									value={common.client_phone}
									onChange={handleCommonChange}
									required
									className={inputClassName}
									style={{ fontFamily: "'Josefin Sans', sans-serif" }}
								/>
							</div>

							<div>
								<label htmlFor="cat_delivery_method" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
									Mode de r&eacute;cup&eacute;ration
								</label>
								<select
									id="cat_delivery_method"
									name="delivery_method"
									value={common.delivery_method}
									onChange={handleCommonChange}
									className={inputClassName}
									style={{ fontFamily: "'Josefin Sans', sans-serif" }}
								>
									<option value="pickup">Retrait sur place</option>
									<option value="delivery">Livraison</option>
								</select>
							</div>

							<div>
								<label htmlFor="cat_requested_date" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
									Date souhait&eacute;e
								</label>
								<input
									type="date"
									id="cat_requested_date"
									name="requested_date"
									value={common.requested_date}
									onChange={handleCommonChange}
									required
									className={inputClassName}
									style={{ fontFamily: "'Josefin Sans', sans-serif" }}
								/>
							</div>
						</div>
					</div>

					{/* Error */}
					{error && (
						<div className="mx-auto mt-8 max-w-2xl">
							<div
								className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								{error}
							</div>
						</div>
					)}

					{/* Submit */}
					<div className="mx-auto mt-12 max-w-2xl">
						<div className="mb-8 rounded-2xl border border-[var(--gold)]/20 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
							<div className="flex items-center justify-between">
								<div>
									<span
										className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--dark-soft)]/60"
										style={{ fontFamily: "'Josefin Sans', sans-serif" }}
									>
										Commande catalogue
									</span>
									<p
										className="mt-1 text-sm text-[var(--dark-soft)]"
										style={{ fontFamily: "'Josefin Sans', sans-serif" }}
									>
										{cartItems.length} article{cartItems.length > 1 ? 's' : ''}
									</p>
								</div>
								<span className="font-[family-name:'Cormorant_Garamond'] text-[28px] font-medium text-[var(--gold)]">
									{getSubtotal().toFixed(2)}&nbsp;&euro;
								</span>
							</div>
						</div>

						<div className="text-center">
							<button
								type="submit"
								disabled={submitting || cart.length === 0}
								className="relative inline-flex items-center justify-center gap-3 rounded-lg bg-[var(--gold)] px-12 py-4 text-xs font-semibold uppercase tracking-[3px] text-[var(--dark)] transition-all duration-300 hover:bg-[var(--gold-light)] hover:shadow-[0_8px_24px_rgba(197,165,90,0.3)] disabled:cursor-not-allowed disabled:opacity-40"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								{submitting ? (
									<>
										<svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
										</svg>
										Envoi en cours...
									</>
								) : (
									'Envoyer la commande'
								)}
							</button>
						</div>
					</div>
				</>
			)}
		</form>
	)
}
