'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { api } from '@/lib/api/client'

interface Booking {
	id: string
	clientName: string
	clientEmail: string
	clientPhone: string | null
	nbParticipants: number
	totalPrice: number
	depositAmount: number
	remainingAmount: number
	status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'
	depositPaymentStatus: 'pending' | 'paid' | 'refunded'
	remainingPaymentStatus: 'pending' | 'paid' | 'not_required'
	createdAt: string
}

interface Workshop {
	id: string
	title: string
	description: string | null
	price: number
	depositPercent: number
	capacity: number
	minParticipants: number
	durationMinutes: number
	location: string | null
	date: string
	startTime: string
	status: 'draft' | 'published' | 'full' | 'cancelled' | 'completed'
	whatIncluded: string | null
	level: string
	tags: string[]
	isVisible: boolean
	createdAt: string
	bookings: Booking[]
}

const workshopStatusColors: Record<string, string> = {
	draft: 'bg-gray-100 text-gray-800',
	published: 'bg-green-100 text-green-800',
	full: 'bg-blue-100 text-blue-800',
	cancelled: 'bg-red-100 text-red-800',
	completed: 'bg-purple-100 text-purple-800',
}

const workshopStatusLabels: Record<string, string> = {
	draft: 'Brouillon',
	published: 'Publie',
	full: 'Complet',
	cancelled: 'Annule',
	completed: 'Termine',
}

const bookingStatusColors: Record<string, string> = {
	pending_payment: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-blue-100 text-blue-800',
	cancelled: 'bg-red-100 text-red-800',
	completed: 'bg-green-100 text-green-800',
}

const bookingStatusLabels: Record<string, string> = {
	pending_payment: 'En attente',
	confirmed: 'Confirmee',
	cancelled: 'Annulee',
	completed: 'Terminee',
}

const depositStatusColors: Record<string, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	paid: 'bg-green-100 text-green-800',
	refunded: 'bg-red-100 text-red-800',
}

const depositStatusLabels: Record<string, string> = {
	pending: 'En attente',
	paid: 'Paye',
	refunded: 'Rembourse',
}

const allWorkshopStatuses = ['draft', 'published', 'full', 'cancelled', 'completed']
const allBookingStatuses = ['pending_payment', 'confirmed', 'cancelled', 'completed']

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function PatissierWorkshopDetailPage() {
	const params = useParams()
	const workshopId = params.id as string

	const [workshop, setWorkshop] = useState<Workshop | null>(null)
	const [bookings, setBookings] = useState<Booking[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	// Workshop status update
	const [newWorkshopStatus, setNewWorkshopStatus] = useState('')
	const [isUpdatingWorkshopStatus, setIsUpdatingWorkshopStatus] = useState(false)
	const [workshopStatusError, setWorkshopStatusError] = useState('')

	// Booking status update
	const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null)

	// Booking modal
	const [showBookingModal, setShowBookingModal] = useState(false)
	const [bookingForm, setBookingForm] = useState({
		clientName: '',
		nbParticipants: 1,
		clientEmail: '',
		clientPhone: '',
		message: '',
	})
	const [bookingFormError, setBookingFormError] = useState('')
	const [emailError, setEmailError] = useState('')
	const [isSubmittingBooking, setIsSubmittingBooking] = useState(false)
	const bookingModalRef = useRef<HTMLDivElement>(null)

	// Toast
	const [toast, setToast] = useState('')

	const showToast = (msg: string) => {
		setToast(msg)
		setTimeout(() => setToast(''), 4000)
	}

	const fetchWorkshop = () => {
		api
			.get(`/patissier/workshops/${workshopId}`)
			.then((res) => {
				const data = res.data.data
				setWorkshop(data)
				setNewWorkshopStatus(data.status)
			})
			.catch((err: any) => setError(err.message || 'Atelier introuvable'))
			.finally(() => setIsLoading(false))
	}

	const fetchBookings = () => {
		api
			.get(`/patissier/workshops/${workshopId}/bookings`)
			.then((res) => {
				const data = res.data.data
				setBookings(data.data || data || [])
			})
			.catch(console.error)
	}

	useEffect(() => {
		fetchWorkshop()
		fetchBookings()
	}, [workshopId])

	const handleUpdateWorkshopStatus = async () => {
		if (!newWorkshopStatus || !workshop) return
		setIsUpdatingWorkshopStatus(true)
		setWorkshopStatusError('')
		try {
			const res = await api.put(`/patissier/workshops/${workshopId}/status`, {
				status: newWorkshopStatus,
			})
			setWorkshop({ ...workshop, ...res.data.data })
		} catch (err: any) {
			setWorkshopStatusError(err.message || 'Erreur lors de la mise a jour')
		} finally {
			setIsUpdatingWorkshopStatus(false)
		}
	}

	const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
		setUpdatingBookingId(bookingId)
		try {
			await api.put(`/patissier/workshops/${workshopId}/bookings/${bookingId}/status`, {
				status,
			})
			fetchBookings()
		} catch (err: any) {
			alert(err.message || 'Erreur lors de la mise a jour de la reservation')
		} finally {
			setUpdatingBookingId(null)
		}
	}

	const handleOpenBookingModal = () => {
		setBookingForm({
			clientName: '',
			nbParticipants: 1,
			clientEmail: '',
			clientPhone: '',
			message: '',
		})
		setBookingFormError('')
		setEmailError('')
		setShowBookingModal(true)
	}

	const handleBookingEmailChange = (value: string) => {
		setBookingForm((f) => ({ ...f, clientEmail: value }))
		if (value && !EMAIL_REGEX.test(value)) {
			setEmailError('Format email invalide')
		} else {
			setEmailError('')
		}
	}

	const handleSubmitBooking = async () => {
		if (!workshop) return
		setBookingFormError('')

		if (!bookingForm.clientName.trim()) {
			setBookingFormError('Le nom du client est requis')
			return
		}
		if (bookingForm.nbParticipants < 1) {
			setBookingFormError('Le nombre de participants doit etre au moins 1')
			return
		}
		if (bookingForm.clientEmail && !EMAIL_REGEX.test(bookingForm.clientEmail)) {
			setBookingFormError("Le format de l'email est invalide")
			return
		}

		setIsSubmittingBooking(true)
		try {
			const payload: Record<string, any> = {
				client_name: bookingForm.clientName.trim(),
				nb_participants: bookingForm.nbParticipants,
			}
			if (bookingForm.clientEmail.trim()) {
				payload.client_email = bookingForm.clientEmail.trim()
			}
			if (bookingForm.clientPhone.trim() && bookingForm.clientPhone.trim() !== '+33') {
				payload.client_phone = bookingForm.clientPhone.trim()
			}
			if (bookingForm.message.trim()) {
				payload.message = bookingForm.message.trim()
			}

			const res = await api.post(`/patissier/workshops/${workshopId}/bookings`, payload)
			const checkoutUrl = res.data.data?.checkoutUrl

			setShowBookingModal(false)
			fetchBookings()

			if (checkoutUrl && bookingForm.clientEmail) {
				showToast('Reservation creee. Un lien de paiement a ete envoye par email au client.')
			} else {
				showToast('Reservation confirmee avec succes.')
			}
		} catch (err: any) {
			setBookingFormError(err.message || 'Erreur lors de la reservation')
		} finally {
			setIsSubmittingBooking(false)
		}
	}

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === bookingModalRef.current) {
			setShowBookingModal(false)
		}
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<p className="text-muted-foreground">Chargement...</p>
			</div>
		)
	}

	if (error || !workshop) {
		return (
			<div className="space-y-6">
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">{error || 'Atelier introuvable'}</p>
				</div>
			</div>
		)
	}

	const totalBooked = bookings
		.filter((b) => b.status !== 'cancelled')
		.reduce((sum, b) => sum + b.nbParticipants, 0)

	const remainingCapacity = workshop.capacity - totalBooked

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">{workshop.title}</h1>
					<p className="mt-1 text-muted-foreground">
						{workshop.date} a {workshop.startTime} &mdash; {workshop.durationMinutes} min
					</p>
				</div>
				<span
					className={`rounded-full px-3 py-1 text-sm font-medium ${workshopStatusColors[workshop.status] || 'bg-gray-100'}`}
				>
					{workshopStatusLabels[workshop.status] || workshop.status}
				</span>
			</div>

			{/* Workshop status update */}
			<div className="rounded-lg border bg-card p-6">
				<h2 className="text-lg font-semibold">Mettre a jour le statut</h2>
				<div className="mt-4 flex items-end gap-3">
					<div className="flex-1">
						<label htmlFor="workshopStatus" className="block text-sm font-medium text-muted-foreground">
							Nouveau statut
						</label>
						<select
							id="workshopStatus"
							value={newWorkshopStatus}
							onChange={(e) => setNewWorkshopStatus(e.target.value)}
							className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
						>
							{allWorkshopStatuses.map((s) => (
								<option key={s} value={s}>
									{workshopStatusLabels[s] || s}
								</option>
							))}
						</select>
					</div>
					<button
						type="button"
						onClick={handleUpdateWorkshopStatus}
						disabled={isUpdatingWorkshopStatus || newWorkshopStatus === workshop.status}
						className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{isUpdatingWorkshopStatus ? 'Mise a jour...' : 'Mettre a jour'}
					</button>
				</div>
				{workshopStatusError && <p className="mt-2 text-sm text-red-600">{workshopStatusError}</p>}
			</div>

			{/* Workshop info */}
			<div className="rounded-lg border bg-card p-6">
				<h2 className="text-lg font-semibold">Informations</h2>
				<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div>
						<p className="text-sm text-muted-foreground">Prix</p>
						<p className="text-sm font-medium">{workshop.price} &euro;/pers</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Acompte</p>
						<p className="text-sm font-medium">{workshop.depositPercent}%</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Capacite</p>
						<p className="text-sm font-medium">
							{totalBooked} / {workshop.capacity} places
						</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Minimum participants</p>
						<p className="text-sm font-medium">{workshop.minParticipants}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Niveau</p>
						<p className="text-sm font-medium capitalize">{workshop.level.replace('_', ' ')}</p>
					</div>
					{workshop.location && (
						<div>
							<p className="text-sm text-muted-foreground">Lieu</p>
							<p className="text-sm font-medium">{workshop.location}</p>
						</div>
					)}
					<div>
						<p className="text-sm text-muted-foreground">Visible</p>
						<p className="text-sm font-medium">{workshop.isVisible ? 'Oui' : 'Non'}</p>
					</div>
				</div>
				{workshop.description && (
					<div className="mt-4">
						<p className="text-sm text-muted-foreground">Description</p>
						<p className="mt-1 text-sm">{workshop.description}</p>
					</div>
				)}
				{workshop.whatIncluded && (
					<div className="mt-4">
						<p className="text-sm text-muted-foreground">Ce qui est inclus</p>
						<p className="mt-1 text-sm">{workshop.whatIncluded}</p>
					</div>
				)}
				{workshop.tags && workshop.tags.length > 0 && (
					<div className="mt-4">
						<p className="text-sm text-muted-foreground">Tags</p>
						<div className="mt-1 flex flex-wrap gap-1">
							{workshop.tags.map((tag) => (
								<span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">
									{tag}
								</span>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Capacity bar */}
			<div className="rounded-lg border bg-card p-6">
				<h2 className="text-lg font-semibold">Remplissage</h2>
				<div className="mt-4">
					<div className="flex items-center justify-between text-sm">
						<span>{totalBooked} participant{totalBooked !== 1 ? 's' : ''} inscrits</span>
						<span>{workshop.capacity} places au total</span>
					</div>
					<div className="mt-2 h-3 w-full rounded-full bg-muted">
						<div
							className="h-3 rounded-full bg-primary transition-all"
							style={{ width: `${Math.min((totalBooked / workshop.capacity) * 100, 100)}%` }}
						/>
					</div>
				</div>
			</div>

			{/* Bookings table */}
			<div className="rounded-lg border bg-card p-6">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Reservations ({bookings.length})</h2>
					{remainingCapacity > 0 && (
						<button
							type="button"
							onClick={handleOpenBookingModal}
							className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
						>
							Reserver pour un client
						</button>
					)}
				</div>
				{bookings.length === 0 ? (
					<p className="mt-4 text-sm text-muted-foreground">Aucune reservation</p>
				) : (
					<div className="mt-4 overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b bg-muted/50">
									<th className="px-4 py-3 text-left text-sm font-medium">Client</th>
									<th className="px-4 py-3 text-left text-sm font-medium">Email</th>
									<th className="px-4 py-3 text-center text-sm font-medium">Participants</th>
									<th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
									<th className="px-4 py-3 text-left text-sm font-medium">Acompte</th>
									<th className="px-4 py-3 text-right text-sm font-medium">Total</th>
									<th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{bookings.map((booking) => (
									<tr key={booking.id} className="border-b last:border-0">
										<td className="px-4 py-3 text-sm">{booking.clientName}</td>
										<td className="px-4 py-3 text-sm">{booking.clientEmail || '—'}</td>
										<td className="px-4 py-3 text-center text-sm">{booking.nbParticipants}</td>
										<td className="px-4 py-3">
											<span
												className={`rounded-full px-2 py-1 text-xs font-medium ${bookingStatusColors[booking.status] || 'bg-gray-100'}`}
											>
												{bookingStatusLabels[booking.status] || booking.status}
											</span>
										</td>
										<td className="px-4 py-3">
											<span
												className={`rounded-full px-2 py-1 text-xs font-medium ${depositStatusColors[booking.depositPaymentStatus] || 'bg-gray-100'}`}
											>
												{depositStatusLabels[booking.depositPaymentStatus] || booking.depositPaymentStatus}
											</span>
										</td>
										<td className="px-4 py-3 text-right text-sm">{booking.totalPrice} &euro;</td>
										<td className="px-4 py-3 text-center">
											<select
												value={booking.status}
												onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
												disabled={updatingBookingId === booking.id}
												className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
											>
												{allBookingStatuses.map((s) => (
													<option key={s} value={s}>
														{bookingStatusLabels[s] || s}
													</option>
												))}
											</select>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Booking modal */}
			{showBookingModal && (
				<div
					ref={bookingModalRef}
					onClick={handleBackdropClick}
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
				>
					<div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold">Reserver pour un client</h2>
							<button
								type="button"
								onClick={() => setShowBookingModal(false)}
								className="text-muted-foreground hover:text-foreground"
							>
								&times;
							</button>
						</div>

						<div className="mt-4 space-y-4">
							{/* Client name */}
							<div>
								<label htmlFor="bookingClientName" className="block text-sm font-medium">
									Nom du client <span className="text-red-500">*</span>
								</label>
								<input
									id="bookingClientName"
									type="text"
									value={bookingForm.clientName}
									onChange={(e) => setBookingForm((f) => ({ ...f, clientName: e.target.value }))}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									placeholder="Nom complet"
								/>
							</div>

							{/* Nb participants */}
							<div>
								<label htmlFor="bookingNbParticipants" className="block text-sm font-medium">
									Nombre de participants <span className="text-red-500">*</span>
								</label>
								<input
									id="bookingNbParticipants"
									type="number"
									min={1}
									max={remainingCapacity}
									value={bookingForm.nbParticipants}
									onChange={(e) =>
										setBookingForm((f) => ({ ...f, nbParticipants: Number(e.target.value) }))
									}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
								/>
								<p className="mt-1 text-xs text-muted-foreground">
									{remainingCapacity} place{remainingCapacity !== 1 ? 's' : ''} restante{remainingCapacity !== 1 ? 's' : ''}
								</p>
							</div>

							{/* Client email */}
							<div>
								<label htmlFor="bookingClientEmail" className="block text-sm font-medium">
									Email du client
								</label>
								<input
									id="bookingClientEmail"
									type="email"
									value={bookingForm.clientEmail}
									onChange={(e) => handleBookingEmailChange(e.target.value)}
									className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${emailError ? 'border-red-500' : ''}`}
									placeholder="client@example.com"
								/>
								{emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
								<p className="mt-1 text-xs text-muted-foreground">
									Si renseigne, le client recevra un email de confirmation
								</p>
							</div>

							{/* Phone */}
							<div>
								<label htmlFor="bookingClientPhone" className="block text-sm font-medium">
									Telephone
								</label>
								<PhoneInput
									defaultCountry="fr"
									value={bookingForm.clientPhone}
									onChange={(phone) => setBookingForm((f) => ({ ...f, clientPhone: phone }))}
									inputClassName="!w-full !rounded-md !border !bg-background !px-3 !py-2 !text-sm focus:!outline-none focus:!ring-2 focus:!ring-primary"
									className="mt-1"
								/>
							</div>

							{/* Message */}
							<div>
								<label htmlFor="bookingMessage" className="block text-sm font-medium">
									Message
								</label>
								<textarea
									id="bookingMessage"
									value={bookingForm.message}
									onChange={(e) => setBookingForm((f) => ({ ...f, message: e.target.value }))}
									rows={3}
									className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									placeholder="Note ou commentaire..."
								/>
							</div>

							{/* Price preview */}
							{bookingForm.nbParticipants > 0 && (
								<div className="rounded-md bg-muted/50 p-3 text-sm">
									<div className="flex justify-between">
										<span>Total</span>
										<span className="font-medium">{workshop.price * bookingForm.nbParticipants} &euro;</span>
									</div>
									{workshop.depositPercent > 0 && (
										<div className="mt-1 flex justify-between text-muted-foreground">
											<span>Acompte ({workshop.depositPercent}%)</span>
											<span>
												{Math.round(workshop.price * bookingForm.nbParticipants * (workshop.depositPercent / 100))} &euro;
											</span>
										</div>
									)}
								</div>
							)}

							{bookingFormError && <p className="text-sm text-red-600">{bookingFormError}</p>}

							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={() => setShowBookingModal(false)}
									className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
								>
									Annuler
								</button>
								<button
									type="button"
									onClick={handleSubmitBooking}
									disabled={isSubmittingBooking}
									className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
								>
									{isSubmittingBooking ? 'Reservation...' : 'Confirmer la reservation'}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Toast */}
			{toast && (
				<div className="fixed bottom-6 right-6 z-50 rounded-lg border bg-card px-4 py-3 text-sm shadow-lg">
					{toast}
				</div>
			)}
		</div>
	)
}
