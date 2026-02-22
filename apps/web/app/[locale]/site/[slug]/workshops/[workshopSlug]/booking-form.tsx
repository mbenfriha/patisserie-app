'use client'

import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

type WorkshopBookingFormProps = {
	workshopId: string
	price: number
	depositPercent: number
	spotsLeft: number
}

export function WorkshopBookingForm({
	workshopId,
	price,
	depositPercent,
	spotsLeft,
}: WorkshopBookingFormProps) {
	const availableSpots = Math.max(0, spotsLeft)

	const [form, setForm] = useState({
		client_name: '',
		client_email: '',
		client_phone: '',
		nb_participants: 1,
	})
	const [submitting, setSubmitting] = useState(false)
	const [success, setSuccess] = useState(false)
	const [error, setError] = useState('')

	const total = price * form.nb_participants
	const isFullPayment = depositPercent >= 100
	const depositAmount = !isFullPayment && depositPercent > 0
		? ((total * depositPercent) / 100).toFixed(2)
		: null
	const remainingAmount = depositAmount
		? (total - Number(depositAmount)).toFixed(2)
		: null

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = e.target
		setForm((prev) => ({
			...prev,
			[name]: name === 'nb_participants' ? parseInt(value) || 1 : value,
		}))
	}

	function adjustParticipants(delta: number) {
		setForm((prev) => ({
			...prev,
			nb_participants: Math.max(1, Math.min(availableSpots, prev.nb_participants + delta)),
		}))
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setError('')

		try {
			const res = await fetch(`${API_URL}/client/workshops/${workshopId}/book`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
			})

			if (!res.ok) {
				const data = await res.json().catch(() => null)
				throw new Error(data?.message || 'Une erreur est survenue')
			}

			const data = await res.json().catch(() => null)
			if (data?.data?.checkoutUrl) {
				window.location.href = data.data.checkoutUrl
				return
			}

			setSuccess(true)
		} catch (err: any) {
			setError(err.message || 'Une erreur est survenue')
		} finally {
			setSubmitting(false)
		}
	}

	/* ── Success state ── */
	if (success) {
		return (
			<div className="mx-auto max-w-xl rounded-2xl border-2 border-green-200 bg-white p-10 text-center">
				{/* Green checkmark circle */}
				<div
					className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
					style={{ backgroundColor: 'rgba(34,197,94,0.1)' }}
				>
					<svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
				</div>
				<h3 className="font-[family-name:'Cormorant_Garamond'] text-3xl font-medium text-[var(--dark)]">
					Réservation confirmée !
				</h3>
				<p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[var(--dark-soft)]/70">
					Votre demande de réservation a bien été envoyée. Vous recevrez une confirmation par email sous peu.
				</p>
			</div>
		)
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
			style={{ borderTop: '4px solid var(--gold)' }}
		>
			<div className="p-8">
				{/* ── Form fields ── */}
				<div className="space-y-5">
					{/* Nom complet */}
					<div>
						<label
							htmlFor="client_name"
							className="mb-2 block text-[var(--dark-soft)]/60"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								fontSize: '12px',
								letterSpacing: '1px',
								textTransform: 'uppercase',
							}}
						>
							Nom complet *
						</label>
						<input
							type="text"
							id="client_name"
							name="client_name"
							value={form.client_name}
							onChange={handleChange}
							required
							className="block w-full rounded-lg bg-[var(--cream)] px-4 py-3 text-[var(--dark)] outline-none transition-colors"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								border: '2px solid #eee',
							}}
							onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
							onBlur={(e) => (e.target.style.borderColor = '#eee')}
						/>
					</div>

					{/* Email */}
					<div>
						<label
							htmlFor="client_email"
							className="mb-2 block text-[var(--dark-soft)]/60"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								fontSize: '12px',
								letterSpacing: '1px',
								textTransform: 'uppercase',
							}}
						>
							Email *
						</label>
						<input
							type="email"
							id="client_email"
							name="client_email"
							value={form.client_email}
							onChange={handleChange}
							required
							className="block w-full rounded-lg bg-[var(--cream)] px-4 py-3 text-[var(--dark)] outline-none transition-colors"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								border: '2px solid #eee',
							}}
							onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
							onBlur={(e) => (e.target.style.borderColor = '#eee')}
						/>
					</div>

					{/* Téléphone */}
					<div>
						<label
							htmlFor="client_phone"
							className="mb-2 block text-[var(--dark-soft)]/60"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								fontSize: '12px',
								letterSpacing: '1px',
								textTransform: 'uppercase',
							}}
						>
							Téléphone
						</label>
						<input
							type="tel"
							id="client_phone"
							name="client_phone"
							value={form.client_phone}
							onChange={handleChange}
							className="block w-full rounded-lg bg-[var(--cream)] px-4 py-3 text-[var(--dark)] outline-none transition-colors"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								border: '2px solid #eee',
							}}
							onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
							onBlur={(e) => (e.target.style.borderColor = '#eee')}
						/>
					</div>

					{/* Nombre de places - custom counter */}
					<div>
						<label
							className="mb-2 block text-[var(--dark-soft)]/60"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								fontSize: '12px',
								letterSpacing: '1px',
								textTransform: 'uppercase',
							}}
						>
							Nombre de places
						</label>
						<div className="flex items-center gap-4">
							<button
								type="button"
								onClick={() => adjustParticipants(-1)}
								disabled={form.nb_participants <= 1}
								className="flex h-11 w-11 items-center justify-center rounded-lg border-2 text-lg transition-all duration-300 disabled:opacity-30"
								style={{
									borderColor: 'var(--gold)',
									color: 'var(--gold)',
								}}
							>
								&minus;
							</button>
							<span
								className="min-w-[40px] text-center font-[family-name:'Cormorant_Garamond'] text-2xl font-semibold text-[var(--dark)]"
							>
								{form.nb_participants}
							</span>
							<button
								type="button"
								onClick={() => adjustParticipants(1)}
								disabled={form.nb_participants >= availableSpots}
								className="flex h-11 w-11 items-center justify-center rounded-lg border-2 text-lg transition-all duration-300 disabled:opacity-30"
								style={{
									borderColor: 'var(--gold)',
									color: 'var(--gold)',
								}}
							>
								+
							</button>
							<span className="text-sm text-[var(--dark-soft)]/50">
								({availableSpots} disponible{availableSpots > 1 ? 's' : ''})
							</span>
						</div>
					</div>
				</div>

				{/* ── Price summary ── */}
				<div
					className="mt-8 rounded-xl p-5"
					style={{ backgroundColor: 'var(--cream)' }}
				>
					<div className="flex items-center justify-between">
						<span className="text-sm text-[var(--dark-soft)]/70" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							{form.nb_participants} &times; {price}&nbsp;&euro;
						</span>
						<span
							className="font-[family-name:'Cormorant_Garamond'] font-semibold text-[var(--gold)]"
							style={{ fontSize: '32px' }}
						>
							{total}&nbsp;&euro;
						</span>
					</div>
					{isFullPayment ? (
						<div className="mt-2 border-t border-[var(--cream-dark)] pt-3">
							<p className="text-sm text-[var(--dark-soft)]/60" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
								Total à payer : <span className="font-semibold text-[var(--gold)]">{total}&nbsp;&euro;</span>
							</p>
						</div>
					) : depositAmount && (
						<div className="mt-2 border-t border-[var(--cream-dark)] pt-3">
							<p className="text-sm text-[var(--dark-soft)]/60" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
								Acompte à payer : <span className="font-semibold text-[var(--gold)]">{depositAmount}&nbsp;&euro;</span>
							</p>
							<p className="mt-1 text-sm text-[var(--dark-soft)]/60" style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
								Reste à régler sur place : <span className="font-semibold">{remainingAmount}&nbsp;&euro;</span>
							</p>
						</div>
					)}
				</div>

				{/* ── Error message ── */}
				{error && (
					<div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
						{error}
					</div>
				)}

				{/* ── Submit button ── */}
				<button
					type="submit"
					disabled={submitting}
					className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg px-8 py-4 text-xs font-semibold uppercase tracking-[3px] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
					style={{
						fontFamily: "'Josefin Sans', sans-serif",
						backgroundColor: 'var(--gold)',
						color: 'var(--dark)',
					}}
				>
					{submitting ? (
						<>
							<div
								className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
								style={{ borderColor: 'var(--dark)', borderTopColor: 'transparent' }}
							/>
							Réservation en cours...
						</>
					) : (
						<>
							{/* Credit card icon */}
							<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
							</svg>
							Réserver
						</>
					)}
				</button>
			</div>
		</form>
	)
}
