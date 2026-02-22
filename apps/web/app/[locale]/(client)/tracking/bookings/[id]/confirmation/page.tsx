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
}

interface Booking {
	id: string
	clientName: string
	clientEmail: string
	nbParticipants: number
	totalPrice: number
	depositAmount: number
	remainingAmount: number
	status: string
	depositPaymentStatus: string
	createdAt: string
	workshop: Workshop
}

export default function BookingConfirmationPage() {
	const params = useParams()
	const bookingId = params.id as string
	const locale = params.locale as string

	const [booking, setBooking] = useState<Booking | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		api
			.get(`/client/bookings/${bookingId}`)
			.then((res) => setBooking(res.data.data))
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [bookingId])

	if (isLoading) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-8">
				<p className="text-muted-foreground">Chargement...</p>
			</div>
		)
	}

	if (!booking) {
		return (
			<div className="mx-auto max-w-2xl px-4 py-8">
				<div className="rounded-lg border border-dashed p-12 text-center">
					<p className="text-muted-foreground">Reservation introuvable</p>
				</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-2xl px-4 py-8">
			{/* Success header */}
			<div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
					<svg
						className="h-8 w-8 text-green-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 className="mt-4 text-2xl font-bold text-green-900">Reservation confirmee !</h1>
				<p className="mt-2 text-green-700">
					Votre reservation pour l&apos;atelier a bien ete enregistree.
				</p>
			</div>

			{/* Booking summary */}
			<div className="mt-8 rounded-lg border bg-card p-6">
				<h2 className="text-lg font-semibold">Recapitulatif</h2>
				<div className="mt-4 space-y-3">
					<div className="flex justify-between">
						<p className="text-sm text-muted-foreground">Atelier</p>
						<p className="text-sm font-medium">{booking.workshop.title}</p>
					</div>
					<div className="flex justify-between">
						<p className="text-sm text-muted-foreground">Date</p>
						<p className="text-sm font-medium">{booking.workshop.date}</p>
					</div>
					<div className="flex justify-between">
						<p className="text-sm text-muted-foreground">Heure</p>
						<p className="text-sm font-medium">{booking.workshop.startTime}</p>
					</div>
					<div className="flex justify-between">
						<p className="text-sm text-muted-foreground">Duree</p>
						<p className="text-sm font-medium">{booking.workshop.durationMinutes} min</p>
					</div>
					{booking.workshop.location && (
						<div className="flex justify-between">
							<p className="text-sm text-muted-foreground">Lieu</p>
							<p className="text-sm font-medium">{booking.workshop.location}</p>
						</div>
					)}
					<div className="flex justify-between">
						<p className="text-sm text-muted-foreground">Participants</p>
						<p className="text-sm font-medium">{booking.nbParticipants}</p>
					</div>
					<div className="flex justify-between">
						<p className="text-sm text-muted-foreground">Nom</p>
						<p className="text-sm font-medium">{booking.clientName}</p>
					</div>
					<div className="flex justify-between">
						<p className="text-sm text-muted-foreground">Email</p>
						<p className="text-sm font-medium">{booking.clientEmail}</p>
					</div>
					<div className="border-t pt-3">
						<div className="flex justify-between">
							<p className="text-sm text-muted-foreground">Acompte verse</p>
							<p className="text-sm font-medium">{booking.depositAmount} &euro;</p>
						</div>
						<div className="mt-2 flex justify-between">
							<p className="text-sm text-muted-foreground">Reste a payer</p>
							<p className="text-sm font-medium">{booking.remainingAmount} &euro;</p>
						</div>
						<div className="mt-2 flex justify-between">
							<p className="text-sm font-medium">Total</p>
							<p className="text-lg font-bold">{booking.totalPrice} &euro;</p>
						</div>
					</div>
				</div>
			</div>

			{/* Action link */}
			<div className="mt-6 text-center">
				<Link
					href={`/${locale}/bookings/${booking.id}`}
					className="inline-block rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Suivre ma reservation
				</Link>
			</div>
		</div>
	)
}
