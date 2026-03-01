'use client'

import { useParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { PhoneInput } from 'react-international-phone'
import 'react-international-phone/style.css'
import { PlanGate } from '@/components/auth/plan-gate'
import { api } from '@/lib/api/client'

interface Booking {
	id: string
	clientName: string
	clientEmail: string
	clientPhone: string | null
	nbParticipants: number
	message: string | null
	totalPrice: number
	depositAmount: number
	remainingAmount: number
	status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'
	stripePaymentIntentId: string | null
	depositPaymentStatus: 'pending' | 'paid' | 'refunded'
	depositPaidAt: string | null
	remainingPaymentStatus: 'pending' | 'paid' | 'not_required'
	remainingPaidAt: string | null
	cancellationReason: string | null
	cancelledAt: string | null
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

	// Cancel modal
	const [cancelBooking, setCancelBooking] = useState<Booking | null>(null)
	const [cancelRefundType, setCancelRefundType] = useState<'none' | 'deposit' | 'full'>('none')
	const [cancelReason, setCancelReason] = useState('')
	const [isCancelling, setIsCancelling] = useState(false)
	const [cancelError, setCancelError] = useState('')
	const cancelModalRef = useRef<HTMLDivElement>(null)

	// Detail panel
	const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)

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
			showToast(
				status === 'completed' ? 'Reservation marquee comme terminee.' : 'Statut mis a jour.'
			)
		} catch (err: any) {
			showToast(err.message || 'Erreur lors de la mise a jour de la reservation')
		} finally {
			setUpdatingBookingId(null)
		}
	}

	const handleOpenCancelModal = (booking: Booking) => {
		setCancelBooking(booking)
		setCancelError('')
		setCancelReason('')
		// Default refund type based on what's been paid
		if (booking.depositPaymentStatus === 'paid' && booking.stripePaymentIntentId) {
			setCancelRefundType('deposit')
		} else {
			setCancelRefundType('none')
		}
	}

	const handleConfirmCancel = async () => {
		if (!cancelBooking) return
		setIsCancelling(true)
		setCancelError('')
		try {
			await api.put(`/patissier/workshops/${workshopId}/bookings/${cancelBooking.id}/status`, {
				status: 'cancelled',
				cancellationReason: cancelReason.trim() || undefined,
				refundType: cancelRefundType,
			})
			setCancelBooking(null)
			fetchBookings()
			const refundMsg =
				cancelRefundType === 'full'
					? ' Le remboursement integral a ete effectue.'
					: cancelRefundType === 'deposit'
						? " L'acompte a ete rembourse."
						: ''
			showToast(`Reservation annulee.${refundMsg}`)
		} catch (err: any) {
			setCancelError(err.message || "Erreur lors de l'annulation")
		} finally {
			setIsCancelling(false)
		}
	}

	const handleCancelBackdropClick = (e: React.MouseEvent) => {
		if (e.target === cancelModalRef.current) {
			setCancelBooking(null)
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
		<PlanGate minPlan="pro">
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
							<label
								htmlFor="workshopStatus"
								className="block text-sm font-medium text-muted-foreground"
							>
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
					{workshopStatusError && (
						<p className="mt-2 text-sm text-red-600">{workshopStatusError}</p>
					)}
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
							<span>
								{totalBooked} participant{totalBooked !== 1 ? 's' : ''} inscrits
							</span>
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
						<div className="mt-4 space-y-0 divide-y">
							{bookings.map((booking) => {
								const isExpanded = expandedBookingId === booking.id
								const hasPaid = booking.depositPaymentStatus === 'paid'

								return (
									<div key={booking.id} className="py-4 first:pt-0 last:pb-0">
										{/* Main row */}
										<div className="flex items-center gap-4">
											<button
												type="button"
												onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
												className="shrink-0 text-muted-foreground hover:text-foreground"
												title={isExpanded ? 'Masquer les details' : 'Voir les details'}
											>
												<svg
													className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													strokeWidth={2}
													role="img"
													aria-label="Chevron"
												>
													<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
												</svg>
											</button>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<span className="font-medium text-sm">{booking.clientName}</span>
													<span
														className={`rounded-full px-2 py-0.5 text-xs font-medium ${bookingStatusColors[booking.status] || 'bg-gray-100'}`}
													>
														{bookingStatusLabels[booking.status] || booking.status}
													</span>
													{hasPaid && (
														<span
															className={`rounded-full px-2 py-0.5 text-xs font-medium ${depositStatusColors[booking.depositPaymentStatus]}`}
														>
															Acompte {depositStatusLabels[booking.depositPaymentStatus]}
														</span>
													)}
													{booking.depositPaymentStatus === 'refunded' && (
														<span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
															Rembourse
														</span>
													)}
												</div>
												<div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
													{booking.clientEmail && <span>{booking.clientEmail}</span>}
													{booking.clientPhone && <span>{booking.clientPhone}</span>}
													<span>
														{booking.nbParticipants} participant
														{booking.nbParticipants !== 1 ? 's' : ''}
													</span>
													<span>{booking.totalPrice} &euro;</span>
												</div>
											</div>
											<div className="flex shrink-0 items-center gap-2">
												{booking.status === 'confirmed' && (
													<>
														<button
															type="button"
															onClick={() => handleUpdateBookingStatus(booking.id, 'completed')}
															disabled={updatingBookingId === booking.id}
															className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
														>
															Terminer
														</button>
														<button
															type="button"
															onClick={() => handleOpenCancelModal(booking)}
															className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
														>
															Annuler
														</button>
													</>
												)}
												{booking.status === 'pending_payment' && (
													<button
														type="button"
														onClick={() => handleOpenCancelModal(booking)}
														className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
													>
														Annuler
													</button>
												)}
											</div>
										</div>

										{/* Expanded details */}
										{isExpanded && (
											<div className="ml-8 mt-3 rounded-md bg-muted/50 p-4">
												<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
													<div>
														<p className="text-xs text-muted-foreground">Nom</p>
														<p className="text-sm font-medium">{booking.clientName}</p>
													</div>
													<div>
														<p className="text-xs text-muted-foreground">Email</p>
														<p className="text-sm">{booking.clientEmail || '—'}</p>
													</div>
													<div>
														<p className="text-xs text-muted-foreground">Telephone</p>
														<p className="text-sm">{booking.clientPhone || '—'}</p>
													</div>
													<div>
														<p className="text-xs text-muted-foreground">Participants</p>
														<p className="text-sm">{booking.nbParticipants}</p>
													</div>
													<div>
														<p className="text-xs text-muted-foreground">Prix total</p>
														<p className="text-sm font-medium">{booking.totalPrice} &euro;</p>
													</div>
													<div>
														<p className="text-xs text-muted-foreground">Acompte</p>
														<p className="text-sm">
															{booking.depositAmount} &euro;
															<span
																className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${depositStatusColors[booking.depositPaymentStatus]}`}
															>
																{depositStatusLabels[booking.depositPaymentStatus]}
															</span>
														</p>
													</div>
													<div>
														<p className="text-xs text-muted-foreground">Reste a payer</p>
														<p className="text-sm">{booking.remainingAmount} &euro;</p>
													</div>
													<div>
														<p className="text-xs text-muted-foreground">Date de reservation</p>
														<p className="text-sm">
															{new Date(booking.createdAt).toLocaleDateString('fr-FR', {
																day: 'numeric',
																month: 'long',
																year: 'numeric',
																hour: '2-digit',
																minute: '2-digit',
															})}
														</p>
													</div>
													{booking.depositPaidAt && (
														<div>
															<p className="text-xs text-muted-foreground">Acompte paye le</p>
															<p className="text-sm">
																{new Date(booking.depositPaidAt).toLocaleDateString('fr-FR', {
																	day: 'numeric',
																	month: 'long',
																	year: 'numeric',
																})}
															</p>
														</div>
													)}
												</div>
												{booking.message && (
													<div className="mt-3 border-t pt-3">
														<p className="text-xs text-muted-foreground">Message du client</p>
														<p className="mt-1 text-sm">{booking.message}</p>
													</div>
												)}
												{booking.cancellationReason && (
													<div className="mt-3 border-t pt-3">
														<p className="text-xs text-muted-foreground">Raison d'annulation</p>
														<p className="mt-1 text-sm text-red-600">
															{booking.cancellationReason}
														</p>
													</div>
												)}
											</div>
										)}
									</div>
								)
							})}
						</div>
					)}
				</div>

				{/* Cancel booking modal */}
				{cancelBooking && (
					<div
						ref={cancelModalRef}
						onClick={handleCancelBackdropClick}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
					>
						<div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">Annuler la reservation</h2>
								<button
									type="button"
									onClick={() => setCancelBooking(null)}
									className="text-muted-foreground hover:text-foreground"
								>
									&times;
								</button>
							</div>

							{/* Booking recap */}
							<div className="mt-4 rounded-md bg-muted/50 p-4">
								<div className="grid gap-2 sm:grid-cols-2">
									<div>
										<p className="text-xs text-muted-foreground">Client</p>
										<p className="text-sm font-medium">{cancelBooking.clientName}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Participants</p>
										<p className="text-sm">{cancelBooking.nbParticipants}</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Prix total</p>
										<p className="text-sm font-medium">{cancelBooking.totalPrice} &euro;</p>
									</div>
									<div>
										<p className="text-xs text-muted-foreground">Acompte</p>
										<p className="text-sm">
											{cancelBooking.depositAmount} &euro;
											{cancelBooking.depositPaymentStatus === 'paid' && (
												<span className="ml-1 text-xs text-green-600">(paye)</span>
											)}
										</p>
									</div>
									{cancelBooking.remainingPaymentStatus === 'paid' && (
										<div>
											<p className="text-xs text-muted-foreground">Reste</p>
											<p className="text-sm">
												{cancelBooking.remainingAmount} &euro;
												<span className="ml-1 text-xs text-green-600">(paye)</span>
											</p>
										</div>
									)}
								</div>
							</div>

							<div className="mt-4 space-y-4">
								{/* Refund options - only if something was paid via Stripe */}
								{cancelBooking.stripePaymentIntentId &&
									cancelBooking.depositPaymentStatus === 'paid' && (
										<div>
											<label className="block text-sm font-medium">Remboursement</label>
											<div className="mt-2 space-y-2">
												<label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
													<input
														type="radio"
														name="refundType"
														value="none"
														checked={cancelRefundType === 'none'}
														onChange={() => setCancelRefundType('none')}
														className="mt-0.5"
													/>
													<div>
														<p className="text-sm font-medium">Aucun remboursement</p>
														<p className="text-xs text-muted-foreground">
															Le client ne sera pas rembourse
														</p>
													</div>
												</label>
												<label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
													<input
														type="radio"
														name="refundType"
														value="deposit"
														checked={cancelRefundType === 'deposit'}
														onChange={() => setCancelRefundType('deposit')}
														className="mt-0.5"
													/>
													<div>
														<p className="text-sm font-medium">
															Rembourser l'acompte ({cancelBooking.depositAmount} &euro;)
														</p>
														<p className="text-xs text-muted-foreground">
															Seul l'acompte verse sera rembourse
														</p>
													</div>
												</label>
												{cancelBooking.remainingPaymentStatus === 'paid' && (
													<label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
														<input
															type="radio"
															name="refundType"
															value="full"
															checked={cancelRefundType === 'full'}
															onChange={() => setCancelRefundType('full')}
															className="mt-0.5"
														/>
														<div>
															<p className="text-sm font-medium">
																Remboursement integral ({cancelBooking.totalPrice} &euro;)
															</p>
															<p className="text-xs text-muted-foreground">
																La totalite du montant paye sera remboursee
															</p>
														</div>
													</label>
												)}
											</div>
										</div>
									)}

								{/* Cancellation reason */}
								<div>
									<label htmlFor="cancelReason" className="block text-sm font-medium">
										Raison de l'annulation
									</label>
									<textarea
										id="cancelReason"
										value={cancelReason}
										onChange={(e) => setCancelReason(e.target.value)}
										rows={3}
										className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
										placeholder="Raison optionnelle..."
									/>
								</div>

								{cancelError && <p className="text-sm text-red-600">{cancelError}</p>}

								<div className="flex justify-end gap-3 pt-2">
									<button
										type="button"
										onClick={() => setCancelBooking(null)}
										className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
									>
										Retour
									</button>
									<button
										type="button"
										onClick={handleConfirmCancel}
										disabled={isCancelling}
										className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
									>
										{isCancelling ? 'Annulation...' : "Confirmer l'annulation"}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

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
										{remainingCapacity} place{remainingCapacity !== 1 ? 's' : ''} restante
										{remainingCapacity !== 1 ? 's' : ''}
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
											<span className="font-medium">
												{workshop.price * bookingForm.nbParticipants} &euro;
											</span>
										</div>
										{workshop.depositPercent > 0 && (
											<div className="mt-1 flex justify-between text-muted-foreground">
												<span>Acompte ({workshop.depositPercent}%)</span>
												<span>
													{Math.round(
														workshop.price *
															bookingForm.nbParticipants *
															(workshop.depositPercent / 100)
													)}{' '}
													&euro;
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
		</PlanGate>
	)
}
