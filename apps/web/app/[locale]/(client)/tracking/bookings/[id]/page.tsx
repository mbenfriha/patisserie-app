'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api/client'

interface Workshop {
	id: string
	title: string
	date: string
	startTime: string
	durationMinutes: number
	location: string | null
	price: number
}

interface Booking {
	id: string
	workshopId: string
	clientName: string
	clientEmail: string
	clientPhone: string | null
	nbParticipants: number
	message: string | null
	totalPrice: number
	depositAmount: number
	remainingAmount: number
	status: 'pending_payment' | 'confirmed' | 'cancelled' | 'completed'
	depositPaymentStatus: 'pending' | 'paid' | 'refunded'
	depositPaidAt: string | null
	remainingPaymentStatus: 'pending' | 'paid' | 'not_required'
	remainingPaidAt: string | null
	cancellationReason: string | null
	createdAt: string
	workshop: Workshop
}

const statusColors: Record<string, string> = {
	pending_payment: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-blue-100 text-blue-800',
	cancelled: 'bg-red-100 text-red-800',
	completed: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
	pending_payment: 'En attente de paiement',
	confirmed: 'Confirmee',
	cancelled: 'Annulee',
	completed: 'Terminee',
}

const paymentStatusColors: Record<string, string> = {
	pending: 'bg-yellow-100 text-yellow-800',
	paid: 'bg-green-100 text-green-800',
	refunded: 'bg-red-100 text-red-800',
	not_required: 'bg-gray-100 text-gray-800',
}

const paymentStatusLabels: Record<string, string> = {
	pending: 'En attente',
	paid: 'Paye',
	refunded: 'Rembourse',
	not_required: 'Non requis',
}

export default function ClientBookingTrackingPage() {
	const params = useParams()
	const bookingId = params.id as string

	const [booking, setBooking] = useState<Booking | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		api
			.get(`/client/bookings/${bookingId}`)
			.then((res) => setBooking(res.data.data))
			.catch((err: any) => setError(err.message || 'Reservation introuvable'))
			.finally(() => setIsLoading(false))
	}, [bookingId])

	if (isLoading) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-8">
				<p className="text-muted-foreground">Chargement...</p>
			</div>
		)
	}

	if (error || !booking) {
		return (
			<div className="mx-auto max-w-3xl px-4 py-8">
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">{error || 'Reservation introuvable'}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-8">
			<h1 className="text-3xl font-bold">Suivi de reservation</h1>
			<p className="mt-1 text-muted-foreground">Atelier: {booking.workshop.title}</p>

			<div className="mt-8 space-y-6">
				{/* Status banner */}
				<div className="rounded-lg border bg-card p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Statut</p>
							<span
								className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium ${statusColors[booking.status] || 'bg-gray-100'}`}
							>
								{statusLabels[booking.status] || booking.status}
							</span>
						</div>
						{booking.cancellationReason && (
							<div className="text-right">
								<p className="text-sm text-muted-foreground">Raison d&apos;annulation</p>
								<p className="mt-1 text-sm text-red-600">{booking.cancellationReason}</p>
							</div>
						)}
					</div>
				</div>

				{/* Workshop info */}
				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold">Informations de l&apos;atelier</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<div>
							<p className="text-sm text-muted-foreground">Atelier</p>
							<p className="text-sm font-medium">{booking.workshop.title}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Date</p>
							<p className="text-sm font-medium">{booking.workshop.date}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Heure</p>
							<p className="text-sm font-medium">{booking.workshop.startTime}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Duree</p>
							<p className="text-sm font-medium">{booking.workshop.durationMinutes} min</p>
						</div>
						{booking.workshop.location && (
							<div>
								<p className="text-sm text-muted-foreground">Lieu</p>
								<p className="text-sm font-medium">{booking.workshop.location}</p>
							</div>
						)}
						<div>
							<p className="text-sm text-muted-foreground">Nombre de participants</p>
							<p className="text-sm font-medium">{booking.nbParticipants}</p>
						</div>
					</div>
				</div>

				{/* Payment details */}
				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold">Paiement</h2>
					<div className="mt-4 space-y-4">
						<div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
							<div>
								<p className="text-sm font-medium">Acompte</p>
								<p className="text-xl font-bold">{booking.depositAmount} &euro;</p>
							</div>
							<span
								className={`rounded-full px-3 py-1 text-sm font-medium ${paymentStatusColors[booking.depositPaymentStatus] || 'bg-gray-100'}`}
							>
								{paymentStatusLabels[booking.depositPaymentStatus] || booking.depositPaymentStatus}
							</span>
						</div>

						<div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
							<div>
								<p className="text-sm font-medium">Reste a payer</p>
								<p className="text-xl font-bold">{booking.remainingAmount} &euro;</p>
							</div>
							<span
								className={`rounded-full px-3 py-1 text-sm font-medium ${paymentStatusColors[booking.remainingPaymentStatus] || 'bg-gray-100'}`}
							>
								{paymentStatusLabels[booking.remainingPaymentStatus] || booking.remainingPaymentStatus}
							</span>
						</div>

						<div className="flex items-center justify-between border-t pt-4">
							<p className="text-sm font-medium">Prix total</p>
							<p className="text-xl font-bold">{booking.totalPrice} &euro;</p>
						</div>
					</div>
				</div>

				{/* Booking details */}
				<div className="rounded-lg border bg-card p-6">
					<h2 className="text-lg font-semibold">Vos informations</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<div>
							<p className="text-sm text-muted-foreground">Nom</p>
							<p className="text-sm font-medium">{booking.clientName}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Email</p>
							<p className="text-sm font-medium">{booking.clientEmail}</p>
						</div>
						{booking.clientPhone && (
							<div>
								<p className="text-sm text-muted-foreground">Telephone</p>
								<p className="text-sm font-medium">{booking.clientPhone}</p>
							</div>
						)}
						<div>
							<p className="text-sm text-muted-foreground">Reserve le</p>
							<p className="text-sm font-medium">
								{new Date(booking.createdAt).toLocaleDateString('fr-FR')}
							</p>
						</div>
					</div>
					{booking.message && (
						<div className="mt-4">
							<p className="text-sm text-muted-foreground">Message</p>
							<p className="mt-1 text-sm">{booking.message}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
