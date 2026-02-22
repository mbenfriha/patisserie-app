import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import Workshop from '#models/workshop'
import WorkshopBooking from '#models/workshop_booking'
import EmailService from '#services/email_service'
import NotificationService from '#services/notification_service'
import StorageService from '#services/storage_service'
import StripeService from '#services/stripe_service'
import env from '#start/env'

function toSlug(title: string): string {
	return title
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')
}

async function uniqueSlug(title: string, patissierId: string, excludeId?: string): Promise<string> {
	const baseSlug = toSlug(title)
	let slug = baseSlug
	let counter = 1
	while (true) {
		const query = Workshop.query()
			.where('patissierId', patissierId)
			.where('slug', slug)
		if (excludeId) query.whereNot('id', excludeId)
		const existing = await query.first()
		if (!existing) break
		slug = `${baseSlug}-${counter++}`
	}
	return slug
}

export default class WorkshopsController {
	async index({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const page = request.input('page', 1)
		const limit = request.input('limit', 20)
		const status = request.input('status')

		const query = Workshop.query()
			.where('patissierId', profile.id)
			.preload('category')
			.orderBy('date', 'asc')

		if (status) {
			query.where('status', status)
		}

		const workshops = await query.paginate(page, limit)

		return response.ok({
			success: true,
			data: workshops.serialize(),
		})
	}

	async store({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const data = request.only([
			'title',
			'description',
			'images',
			'price',
			'depositPercent',
			'capacity',
			'durationMinutes',
			'location',
			'date',
			'startTime',
			'status',
			'whatIncluded',
			'level',
			'categoryId',
			'isVisible',
		])

		const slug = await uniqueSlug(data.title, profile.id)

		const workshop = await Workshop.create({
			patissierId: profile.id,
			title: data.title,
			slug,
			description: data.description || null,
			images: data.images || [],
			price: data.price,
			depositPercent: data.depositPercent ?? profile.defaultDepositPercent,
			capacity: data.capacity,
			durationMinutes: data.durationMinutes,
			location: data.location || null,
			date: data.date,
			startTime: data.startTime,
			status: data.status || 'draft',
			whatIncluded: data.whatIncluded || null,
			level: data.level || 'tous_niveaux',
			categoryId: data.categoryId || null,
			isVisible: data.isVisible ?? true,
		})

		return response.created({
			success: true,
			data: workshop.serialize(),
		})
	}

	async show({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const workshop = await Workshop.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.preload('bookings')
			.preload('category')
			.firstOrFail()

		return response.ok({
			success: true,
			data: workshop.serialize(),
		})
	}

	async update({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const workshop = await Workshop.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const data: Record<string, any> = request.only([
			'title',
			'description',
			'images',
			'price',
			'depositPercent',
			'capacity',
			'durationMinutes',
			'location',
			'date',
			'startTime',
			'whatIncluded',
			'level',
			'categoryId',
			'isVisible',
		])

		if (data.title && data.title !== workshop.title) {
			data.slug = await uniqueSlug(data.title, profile.id, workshop.id)
		}

		workshop.merge(data)
		await workshop.save()

		return response.ok({
			success: true,
			data: workshop.serialize(),
		})
	}

	async destroy({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const workshop = await Workshop.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		await workshop.delete()

		return response.ok({
			success: true,
			message: 'Workshop deleted',
		})
	}

	async updateStatus({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const workshop = await Workshop.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const { status, reason } = request.only(['status', 'reason'])

		const validStatuses: Workshop['status'][] = [
			'draft',
			'published',
			'full',
			'cancelled',
			'completed',
		]

		if (!validStatuses.includes(status)) {
			return response.badRequest({
				success: false,
				message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
			})
		}

		workshop.status = status
		await workshop.save()

		// When cancelling, notify all active bookings
		if (status === 'cancelled') {
			const bookings = await WorkshopBooking.query()
				.where('workshopId', workshop.id)
				.whereNot('status', 'cancelled')

			const emailService = new EmailService()
			const reasonText = reason || "Le pâtissier a annulé cet atelier."

			for (const booking of bookings) {
				await emailService.sendStatusUpdate({
					email: booking.clientEmail,
					recipientName: booking.clientName,
					subject: `Atelier annulé : ${workshop.title}`,
					title: 'Atelier annulé',
					body: reasonText,
					actionUrl: undefined,
					actionLabel: undefined,
				})
			}
		}

		return response.ok({
			success: true,
			data: workshop.serialize(),
		})
	}

	async bookings({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		// Ensure the workshop belongs to this patissier
		await Workshop.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const page = request.input('page', 1)
		const limit = request.input('limit', 20)
		const status = request.input('status')

		const query = WorkshopBooking.query()
			.where('workshopId', params.id)
			.orderBy('createdAt', 'desc')

		if (status) {
			query.where('status', status)
		}

		const bookings = await query.paginate(page, limit)

		return response.ok({
			success: true,
			data: bookings.serialize(),
		})
	}

	async updateBookingStatus({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		// Ensure the workshop belongs to this patissier
		const workshop = await Workshop.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const booking = await WorkshopBooking.query()
			.where('id', params.bookingId)
			.where('workshopId', workshop.id)
			.firstOrFail()

		const { status, cancellationReason } = request.only(['status', 'cancellationReason'])

		const validStatuses: WorkshopBooking['status'][] = [
			'pending_payment',
			'confirmed',
			'cancelled',
			'completed',
		]

		if (!validStatuses.includes(status)) {
			return response.badRequest({
				success: false,
				message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
			})
		}

		booking.status = status

		if (status === 'cancelled' && cancellationReason) {
			booking.cancellationReason = cancellationReason
		}

		await booking.save()

		return response.ok({
			success: true,
			data: booking.serialize(),
		})
	}

	async createBooking({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const workshop = await Workshop.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const body = request.only([
			'client_name',
			'client_email',
			'client_phone',
			'nb_participants',
			'message',
		])

		const clientName = body.client_name
		const clientEmail = body.client_email || null
		const clientPhone = body.client_phone || null
		const nbParticipants = body.nb_participants
		const message = body.message || null

		if (!clientName || !nbParticipants) {
			return response.badRequest({
				success: false,
				message: 'client_name and nb_participants are required',
			})
		}

		// Check capacity
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

		// Calculate prices
		const totalPrice = workshop.price * nbParticipants
		const depositAmount = Math.round(totalPrice * (workshop.depositPercent / 100))
		const remainingAmount = totalPrice - depositAmount

		const canAcceptOnlinePayment = clientEmail
			&& depositAmount > 0
			&& profile.stripeAccountId
			&& profile.stripeOnboardingComplete

		const booking = await WorkshopBooking.create({
			workshopId: workshop.id,
			clientName,
			clientEmail: clientEmail || '',
			clientPhone,
			nbParticipants,
			message,
			totalPrice,
			depositAmount,
			remainingAmount,
			status: canAcceptOnlinePayment ? 'pending_payment' : 'confirmed',
			depositPaymentStatus: 'pending',
			remainingPaymentStatus: remainingAmount > 0 ? 'pending' : 'not_required',
		})

		// Create Stripe Checkout session for deposit if applicable
		let checkoutUrl: string | null = null
		if (canAcceptOnlinePayment) {
			const stripeService = new StripeService()
			const frontendUrl = env.get('FRONTEND_URL')
			checkoutUrl = await stripeService.createWorkshopDepositCheckout(
				depositAmount,
				workshop.title,
				booking.id,
				clientEmail!,
				profile.stripeAccountId!,
				`${frontendUrl}/site/${profile.slug}/workshops/${workshop.slug}?payment=success`,
				`${frontendUrl}/site/${profile.slug}/workshops/${workshop.slug}?payment=cancelled`,
			)
		}

		// Send booking confirmation email if client email provided
		if (clientEmail) {
			const emailService = new EmailService()
			await emailService.sendBookingConfirmation({
				clientEmail,
				clientName,
				workshopTitle: workshop.title,
				patissierName: profile.businessName,
				date: workshop.date,
				startTime: workshop.startTime,
				nbParticipants,
				totalPrice,
				depositAmount,
			})
		}

		// In-app notification to patissier
		const notificationService = new NotificationService()
		await notificationService.create(
			user.id,
			'new_booking',
			`Nouvelle réservation : ${workshop.title}`,
			`${clientName} — ${nbParticipants} place(s) (réservé par vous)`,
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

	async uploadIllustration({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const workshop = await Workshop.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const file = request.file('image', {
			size: '5mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp'],
		})

		if (!file) {
			return response.badRequest({ success: false, message: 'Image file is required' })
		}

		if (!file.isValid) {
			return response.badRequest({ success: false, message: 'Invalid file', errors: file.errors })
		}

		const storage = new StorageService()

		// Delete previous illustration if exists
		const currentImages = workshop.images || []
		if (currentImages.length > 0 && currentImages[0]?.url) {
			const key = currentImages[0].url
			if (!key.startsWith('http')) {
				await storage.deleteImage(key).catch(() => {})
			}
		}

		const imageUrl = await storage.uploadImage(file, `workshops/${workshop.id}`)
		workshop.images = [{ url: imageUrl, alt: workshop.title }]
		await workshop.save()

		return response.ok({
			success: true,
			data: workshop.serialize(),
		})
	}

	async deleteIllustration({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const workshop = await Workshop.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const currentImages = workshop.images || []
		if (currentImages.length > 0 && currentImages[0]?.url) {
			const key = currentImages[0].url
			if (!key.startsWith('http')) {
				const storage = new StorageService()
				await storage.deleteImage(key).catch(() => {})
			}
		}

		workshop.images = []
		await workshop.save()

		return response.ok({
			success: true,
			data: workshop.serialize(),
		})
	}
}
