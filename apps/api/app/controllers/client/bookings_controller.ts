import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'
import Workshop from '#models/workshop'
import WorkshopBooking from '#models/workshop_booking'
import EmailService from '#services/email_service'
import NotificationService from '#services/notification_service'
import StripeService from '#services/stripe_service'
import env from '#start/env'

export default class BookingsController {
	async store({ request, params, response }: HttpContext) {
		const body = request.only([
			'client_name',
			'client_email',
			'client_phone',
			'nb_participants',
			'message',
		])
		const clientName = body.client_name
		const clientEmail = body.client_email
		const clientPhone = body.client_phone
		const nbParticipants = body.nb_participants
		const message = body.message

		const workshopId = params.id
		const workshop = await Workshop.find(workshopId)
		if (!workshop) {
			return response.notFound({ success: false, message: 'Workshop not found' })
		}

		if (workshop.status !== 'published') {
			return response.badRequest({
				success: false,
				message: 'Workshop is not available for booking',
			})
		}

		const existingBookings = await WorkshopBooking.query()
			.where('workshopId', workshop.id)
			.whereNot('status', 'cancelled')
			.sum('nb_participants as total')

		const totalBooked = Number(existingBookings[0].$extras.total) || 0
		if (totalBooked + nbParticipants > workshop.capacity) {
			return response.badRequest({
				success: false,
				message: 'Not enough capacity for the requested number of participants',
			})
		}

		const totalPrice = workshop.price * nbParticipants
		const depositAmount = Math.round(totalPrice * (workshop.depositPercent / 100))
		const remainingAmount = totalPrice - depositAmount

		const profile = await PatissierProfile.findOrFail(workshop.patissierId)
		const canAcceptOnlinePayment = depositAmount > 0
			&& profile.stripeAccountId
			&& profile.stripeOnboardingComplete

		const booking = await WorkshopBooking.create({
			workshopId: workshop.id,
			clientName,
			clientEmail,
			clientPhone: clientPhone || null,
			nbParticipants,
			message: message || null,
			totalPrice,
			depositAmount,
			remainingAmount,
			status: canAcceptOnlinePayment ? 'pending_payment' : 'confirmed',
			depositPaymentStatus: 'pending',
			remainingPaymentStatus: remainingAmount > 0 ? 'pending' : 'not_required',
		})

		// Create Stripe Checkout session for deposit if possible
		let checkoutUrl: string | null = null
		if (canAcceptOnlinePayment) {
			const stripeService = new StripeService()
			const frontendUrl = env.get('FRONTEND_URL')
			checkoutUrl = await stripeService.createWorkshopDepositCheckout(
				depositAmount,
				workshop.title,
				booking.id,
				clientEmail,
				profile.stripeAccountId!,
				`${frontendUrl}/site/${profile.slug}/workshops/${workshop.slug}?payment=success`,
				`${frontendUrl}/site/${profile.slug}/workshops/${workshop.slug}?payment=cancelled`,
			)
			booking.stripeCheckoutSessionId = checkoutUrl ? booking.id : null
		}

		await booking.load('workshop')

		// Send emails & notification
		const patissierUser = await User.findOrFail(profile.userId)
		const emailService = new EmailService()

		// 1. Email client: booking confirmation
		await emailService.sendBookingConfirmation({
			clientEmail: booking.clientEmail,
			clientName: booking.clientName,
			workshopTitle: workshop.title,
			patissierName: profile.businessName,
			date: workshop.date,
			startTime: workshop.startTime,
			nbParticipants: booking.nbParticipants,
			totalPrice: booking.totalPrice,
			depositAmount: booking.depositAmount,
		})

		// 2. Email patissier: new booking notification
		await emailService.sendNewBookingNotification({
			patissierEmail: patissierUser.email,
			patissierName: profile.businessName,
			clientName: booking.clientName,
			clientEmail: booking.clientEmail,
			workshopTitle: workshop.title,
			date: workshop.date,
			startTime: workshop.startTime,
			nbParticipants: booking.nbParticipants,
			depositAmount: booking.depositAmount,
		})

		// 3. In-app notification to patissier
		const notificationService = new NotificationService()
		await notificationService.create(
			patissierUser.id,
			'new_booking',
			`Nouvelle réservation : ${workshop.title}`,
			`${booking.clientName} a réservé ${booking.nbParticipants} place(s)`,
			{ bookingId: booking.id, workshopId: workshop.id },
		)

		return response.created({
			success: true,
			data: {
				...booking.serialize(),
				checkoutUrl,
			},
		})
	}

	async show({ params, response }: HttpContext) {
		const booking = await WorkshopBooking.query()
			.where('id', params.id)
			.preload('workshop')
			.first()

		if (!booking) {
			return response.notFound({ success: false, message: 'Booking not found' })
		}

		return response.ok({
			success: true,
			data: booking.serialize(),
		})
	}

	async cancel({ params, request, response }: HttpContext) {
		const booking = await WorkshopBooking.query()
			.where('id', params.id)
			.preload('workshop')
			.first()

		if (!booking) {
			return response.notFound({ success: false, message: 'Booking not found' })
		}

		const { clientEmail, cancellationReason } = request.only(['clientEmail', 'cancellationReason'])

		// Verify ownership via clientEmail
		if (booking.clientEmail !== clientEmail) {
			return response.forbidden({ success: false, message: 'Unauthorized' })
		}

		if (booking.status === 'cancelled') {
			return response.badRequest({ success: false, message: 'Booking is already cancelled' })
		}

		const { DateTime } = await import('luxon')
		booking.status = 'cancelled'
		booking.cancellationReason = cancellationReason || null
		booking.cancelledAt = DateTime.now()
		await booking.save()

		// Notify patissier by email
		const workshop = booking.workshop
		const profile = await PatissierProfile.findOrFail(workshop.patissierId)
		const patissierUser = await User.findOrFail(profile.userId)
		const emailService = new EmailService()

		await emailService.sendBookingCancellationNotification({
			patissierEmail: patissierUser.email,
			patissierName: profile.businessName,
			clientName: booking.clientName,
			workshopTitle: workshop.title,
			date: workshop.date,
			nbParticipants: booking.nbParticipants,
			reason: booking.cancellationReason,
		})

		return response.ok({
			success: true,
			data: booking.serialize(),
		})
	}
}
