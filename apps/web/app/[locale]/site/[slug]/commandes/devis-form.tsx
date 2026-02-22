'use client'

import { useState } from 'react'
import { StepHeader } from './devis-form/step-header'
import { FlavorsSelector } from './devis-form/flavors-selector'
import { PhotoUpload } from './devis-form/photo-upload'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface DevisFormProps {
	slug: string
	onSuccess: () => void
}

const inputClassName =
	'mt-2 block w-full rounded-lg border-2 border-[var(--cream-dark)] bg-white px-4 py-3 text-sm text-[var(--dark)] outline-none transition-colors duration-200 focus:border-[var(--gold)]'

const labelClassName =
	'block text-[12px] font-semibold uppercase tracking-[1px] text-[var(--dark-soft)]'

export function DevisForm({ slug, onSuccess }: DevisFormProps) {
	// Section 1 — Personal info
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [eventDate, setEventDate] = useState('')

	// Section 2 — Cake details
	const [nbPersonnes, setNbPersonnes] = useState('')
	const [flavors, setFlavors] = useState<string[]>([])
	const [photoFile, setPhotoFile] = useState<File | null>(null)
	const [customMessage, setCustomMessage] = useState('')

	// Section 4 — Delivery
	const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
	const [deliveryAddress, setDeliveryAddress] = useState('')
	const [deliveryNotes, setDeliveryNotes] = useState('')

	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState('')

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setSubmitting(true)
		setError('')

		if (flavors.length === 0) {
			setError('Veuillez sélectionner au moins un parfum.')
			setSubmitting(false)
			return
		}

		try {
			const formData = new FormData()
			formData.append('slug', slug)
			formData.append('type', 'custom')
			formData.append('clientName', `${firstName} ${lastName}`)
			formData.append('clientEmail', email)
			formData.append('clientPhone', phone)
			formData.append('requestedDate', eventDate)
			formData.append('customNbPersonnes', nbPersonnes)
			formData.append('customTheme', flavors.join(', '))
			formData.append('customType', 'cake design')
			formData.append('deliveryMethod', deliveryMethod)

			if (customMessage) {
				formData.append('customMessage', customMessage)
			}
			if (deliveryMethod === 'delivery' && deliveryAddress) {
				formData.append('deliveryAddress', deliveryAddress)
			}
			if (deliveryMethod === 'delivery' && deliveryNotes) {
				formData.append('deliveryNotes', deliveryNotes)
			}
			if (photoFile) {
				formData.append('customPhotoInspiration', photoFile)
			}

			const res = await fetch(`${API_URL}/client/orders`, {
				method: 'POST',
				body: formData,
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

	return (
		<form
			onSubmit={handleSubmit}
			className="mx-auto max-w-2xl"
			style={{ animation: 'fadeInUp 0.5s ease-out' }}
		>
			{/* ── Section 1 — Informations personnelles ──────────── */}
			<div className="mb-12">
				<StepHeader number={1} title="Informations personnelles" />

				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<div>
						<label htmlFor="dv_firstname" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							Pr&eacute;nom
						</label>
						<input
							type="text"
							id="dv_firstname"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							required
							className={inputClassName}
							style={{ fontFamily: "'Josefin Sans', sans-serif" }}
						/>
					</div>
					<div>
						<label htmlFor="dv_lastname" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							Nom
						</label>
						<input
							type="text"
							id="dv_lastname"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							required
							className={inputClassName}
							style={{ fontFamily: "'Josefin Sans', sans-serif" }}
						/>
					</div>
					<div>
						<label htmlFor="dv_email" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							Email
						</label>
						<input
							type="email"
							id="dv_email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className={inputClassName}
							style={{ fontFamily: "'Josefin Sans', sans-serif" }}
						/>
					</div>
					<div>
						<label htmlFor="dv_phone" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							T&eacute;l&eacute;phone
						</label>
						<input
							type="tel"
							id="dv_phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							required
							className={inputClassName}
							style={{ fontFamily: "'Josefin Sans', sans-serif" }}
						/>
					</div>
					<div className="sm:col-span-2">
						<label htmlFor="dv_eventdate" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							Date de l&apos;&eacute;v&eacute;nement
						</label>
						<input
							type="date"
							id="dv_eventdate"
							value={eventDate}
							onChange={(e) => setEventDate(e.target.value)}
							required
							className={inputClassName}
							style={{ fontFamily: "'Josefin Sans', sans-serif" }}
						/>
					</div>
				</div>
			</div>

			{/* ── Section 2 — Détails du gâteau ──────────────────── */}
			<div className="mb-12">
				<StepHeader number={2} title="Détails du gâteau" />

				<div className="space-y-6">
					<div>
						<label htmlFor="dv_nbpersonnes" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							Nombre de parts
						</label>
						<input
							type="number"
							id="dv_nbpersonnes"
							value={nbPersonnes}
							onChange={(e) => setNbPersonnes(e.target.value)}
							min={1}
							required
							className={inputClassName}
							style={{ fontFamily: "'Josefin Sans', sans-serif" }}
						/>
					</div>

					<div>
						<label className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							Parfums <span className="normal-case tracking-normal font-normal text-[var(--dark-soft)]/50">(s&eacute;lectionnez un ou plusieurs)</span>
						</label>
						<div className="mt-3">
							<FlavorsSelector selected={flavors} onChange={setFlavors} />
						</div>
					</div>

					<div>
						<label className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							Photo d&apos;inspiration <span className="normal-case tracking-normal font-normal text-[var(--dark-soft)]/50">(optionnel)</span>
						</label>
						<div className="mt-3">
							<PhotoUpload file={photoFile} onChange={setPhotoFile} />
						</div>
					</div>

					<div>
						<label htmlFor="dv_message" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
							Description / Message <span className="normal-case tracking-normal font-normal text-[var(--dark-soft)]/50">(optionnel)</span>
						</label>
						<textarea
							id="dv_message"
							value={customMessage}
							onChange={(e) => setCustomMessage(e.target.value)}
							rows={4}
							placeholder="D&eacute;crivez votre g&acirc;teau id&eacute;al : couleurs, d&eacute;corations, inscriptions..."
							className={inputClassName}
							style={{ fontFamily: "'Josefin Sans', sans-serif", resize: 'vertical' }}
						/>
					</div>
				</div>
			</div>

			{/* ── Section 3 — Paiement (informatif) ──────────────── */}
			<div className="mb-12">
				<StepHeader number={3} title="Paiement" />

				<div
					className="rounded-xl border border-[var(--gold)]/20 bg-[var(--gold)]/5 p-6"
				>
					<div className="flex items-start gap-4">
						<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/10">
							<svg className="h-4 w-4 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
							</svg>
						</div>
						<div>
							<p
								className="text-sm font-medium text-[var(--dark)]"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								Acompte de 30% obligatoire
							</p>
							<p
								className="mt-1 text-sm text-[var(--dark-soft)]/70"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								Un acompte de 30% sera demand&eacute; pour confirmer votre commande. Le solde sera &agrave; r&eacute;gler &agrave; la r&eacute;cup&eacute;ration.
							</p>
							<p
								className="mt-3 text-sm font-medium text-[var(--gold)]"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								D&eacute;gustation gratuite offerte apr&egrave;s validation
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* ── Section 4 — Livraison ──────────────────────────── */}
			<div className="mb-12">
				<StepHeader number={4} title="Livraison" />

				<div className="space-y-6">
					{/* Toggle cards */}
					<div className="grid grid-cols-2 gap-4">
						<button
							type="button"
							onClick={() => setDeliveryMethod('pickup')}
							className="rounded-xl border-2 p-5 text-center transition-all duration-200"
							style={{
								borderColor: deliveryMethod === 'pickup' ? 'var(--gold)' : 'var(--cream-dark)',
								backgroundColor: deliveryMethod === 'pickup' ? 'rgba(197,165,90,0.05)' : 'transparent',
							}}
						>
							<svg
								className="mx-auto mb-2 h-6 w-6"
								style={{ color: deliveryMethod === 'pickup' ? 'var(--gold)' : 'var(--dark-soft)' }}
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0c0-.18.081-.353.229-.466L5.25 7.5h13.5l2.021 1.383a.6.6 0 01.229.466M6.75 7.5V4.125c0-.621.504-1.125 1.125-1.125h8.25c.621 0 1.125.504 1.125 1.125V7.5" />
							</svg>
							<span
								className="text-xs font-semibold uppercase tracking-[1px]"
								style={{
									fontFamily: "'Josefin Sans', sans-serif",
									color: deliveryMethod === 'pickup' ? 'var(--gold)' : 'var(--dark-soft)',
								}}
							>
								Retrait
							</span>
						</button>
						<button
							type="button"
							onClick={() => setDeliveryMethod('delivery')}
							className="rounded-xl border-2 p-5 text-center transition-all duration-200"
							style={{
								borderColor: deliveryMethod === 'delivery' ? 'var(--gold)' : 'var(--cream-dark)',
								backgroundColor: deliveryMethod === 'delivery' ? 'rgba(197,165,90,0.05)' : 'transparent',
							}}
						>
							<svg
								className="mx-auto mb-2 h-6 w-6"
								style={{ color: deliveryMethod === 'delivery' ? 'var(--gold)' : 'var(--dark-soft)' }}
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25h-.375a3 3 0 01-3-3V8.25m9.75 6h3.75m-3.75 0V8.25m0 6h-.375a3 3 0 01-3-3V8.25m6.75 6V8.25m0 0H6.75m7.5 0v-1.5a1.5 1.5 0 011.5-1.5h2.25a1.5 1.5 0 011.5 1.5v1.5m-6.75 0h6.75" />
							</svg>
							<span
								className="text-xs font-semibold uppercase tracking-[1px]"
								style={{
									fontFamily: "'Josefin Sans', sans-serif",
									color: deliveryMethod === 'delivery' ? 'var(--gold)' : 'var(--dark-soft)',
								}}
							>
								Livraison
							</span>
						</button>
					</div>

					{/* Conditional delivery fields */}
					{deliveryMethod === 'delivery' && (
						<div className="space-y-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
							<div>
								<label htmlFor="dv_address" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
									Adresse de livraison
								</label>
								<textarea
									id="dv_address"
									value={deliveryAddress}
									onChange={(e) => setDeliveryAddress(e.target.value)}
									rows={2}
									required
									placeholder="Adresse compl&egrave;te"
									className={inputClassName}
									style={{ fontFamily: "'Josefin Sans', sans-serif", resize: 'vertical' }}
								/>
							</div>
							<div>
								<label htmlFor="dv_deliverynotes" className={labelClassName} style={{ fontFamily: "'Josefin Sans', sans-serif" }}>
									Notes <span className="normal-case tracking-normal font-normal text-[var(--dark-soft)]/50">(optionnel)</span>
								</label>
								<input
									type="text"
									id="dv_deliverynotes"
									value={deliveryNotes}
									onChange={(e) => setDeliveryNotes(e.target.value)}
									placeholder="Digicode, &eacute;tage, instructions..."
									className={inputClassName}
									style={{ fontFamily: "'Josefin Sans', sans-serif" }}
								/>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* ── Error ──────────────────────────────────────────── */}
			{error && (
				<div className="mb-8">
					<div
						className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
						style={{ fontFamily: "'Josefin Sans', sans-serif" }}
					>
						{error}
					</div>
				</div>
			)}

			{/* ── Submit ─────────────────────────────────────────── */}
			<div className="mb-8 rounded-2xl border border-[var(--gold)]/20 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
				<span
					className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--dark-soft)]/60"
					style={{ fontFamily: "'Josefin Sans', sans-serif" }}
				>
					Demande de devis sur-mesure
				</span>
				<p
					className="mt-1 text-sm text-[var(--dark-soft)]"
					style={{ fontFamily: "'Josefin Sans', sans-serif" }}
				>
					Devis personnalis&eacute; apr&egrave;s &eacute;tude de votre demande
				</p>
			</div>

			<div className="text-center">
				<button
					type="submit"
					disabled={submitting}
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
						'Envoyer ma demande de devis'
					)}
				</button>
			</div>
		</form>
	)
}
