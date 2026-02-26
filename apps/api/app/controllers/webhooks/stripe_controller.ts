import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import PatissierProfile from '#models/patissier_profile'
import Subscription from '#models/subscription'
import WorkshopBooking from '#models/workshop_booking'
import Workshop from '#models/workshop'
import Order from '#models/order'
import EmailService from '#services/email_service'
import StripeService from '#services/stripe_service'
import env from '#start/env'

function toDateTime(value: any): DateTime {
	if (!value) return DateTime.now()
	if (typeof value === 'number') return DateTime.fromSeconds(value)
	if (typeof value === 'string') return DateTime.fromISO(value).isValid ? DateTime.fromISO(value) : DateTime.fromSeconds(Number(value))
	return DateTime.now()
}

export default class StripeController {
	private stripeService = new StripeService()
	private emailService = new EmailService()

	async handle({ request, response }: HttpContext) {
		const signature = request.header('stripe-signature')
		const webhookSecret = env.get('STRIPE_WEBHOOK_SECRET')

		if (!signature || !webhookSecret) {
			return response.badRequest({ success: false, message: 'Missing signature or webhook secret' })
		}

		let event: any

		try {
			const rawBody = request.raw()
			event = this.stripeService.constructWebhookEvent(rawBody!, signature, webhookSecret)
		} catch (err: any) {
			console.error('[Stripe Webhook] Signature verification failed:', err.message)
			return response.badRequest({ success: false, message: `Webhook signature verification failed: ${err.message}` })
		}

		console.log(`[Stripe Webhook] ← ${event.type}`)

		try {
			switch (event.type) {
				case 'checkout.session.completed':
					await this.handleCheckoutCompleted(event.data.object)
					break
				case 'customer.subscription.updated':
					await this.handleSubscriptionUpdated(event.data.object)
					break
				case 'customer.subscription.deleted':
					await this.handleSubscriptionDeleted(event.data.object)
					break
				case 'invoice.paid':
					await this.handleInvoicePaid(event.data.object)
					break
				case 'invoice.payment_failed':
					await this.handleInvoicePaymentFailed(event.data.object)
					break
				case 'account.updated':
					await this.handleAccountUpdated(event.data.object)
					break
				default:
					break
			}
		} catch (err: any) {
			console.error(`[Stripe Webhook] Error handling ${event.type}:`, err.message)
		}

		return response.ok({ received: true })
	}

	private async handleCheckoutCompleted(session: any) {
		if (session.mode === 'subscription') {
			await this.handleSubscriptionCheckout(session)
		} else if (session.mode === 'payment') {
			await this.handlePaymentCheckout(session)
		}
	}

	private async handleSubscriptionCheckout(session: any) {
		const userId = session.metadata?.userId
		if (!userId) {
			console.error('[Stripe Webhook] No userId in checkout session metadata')
			return
		}

		const stripeSubscription = await this.stripeService.getSubscription(session.subscription) as any
		const priceId = stripeSubscription.items.data[0]?.price?.id
		if (!priceId) {
			console.error('[Stripe Webhook] No priceId found on subscription')
			return
		}

		const planInfo = this.stripeService.getPlanFromPriceId(priceId)
		if (!planInfo) {
			console.error('[Stripe Webhook] Unknown priceId:', priceId)
			return
		}

		const periodStart = toDateTime(stripeSubscription.current_period_start)
		const periodEnd = toDateTime(stripeSubscription.current_period_end)

		const existingSub = await Subscription.query()
			.where('userId', userId)
			.orderBy('createdAt', 'desc')
			.first()

		if (existingSub) {
			existingSub.merge({
				plan: planInfo.plan,
				billingInterval: planInfo.interval,
				stripeCustomerId: session.customer,
				stripeSubscriptionId: session.subscription,
				status: 'active',
				currentPeriodStart: periodStart,
				currentPeriodEnd: periodEnd,
				cancelAtPeriodEnd: false,
				canceledAt: null,
			})
			await existingSub.save()
		} else {
			await Subscription.create({
				userId,
				plan: planInfo.plan,
				billingInterval: planInfo.interval,
				stripeCustomerId: session.customer,
				stripeSubscriptionId: session.subscription,
				status: 'active',
				currentPeriodStart: periodStart,
				currentPeriodEnd: periodEnd,
				cancelAtPeriodEnd: false,
			})
		}

		const profile = await PatissierProfile.findBy('userId', userId)
		if (profile) {
			profile.plan = planInfo.plan
			await profile.save()
		}

		console.log(`[Stripe Webhook] Subscription activated for user ${userId}: ${planInfo.plan} (${planInfo.interval})`)
	}

	private async handlePaymentCheckout(session: any) {
		const bookingId = session.metadata?.booking_id
		const orderId = session.metadata?.order_id

		if (bookingId) {
			await this.handleBookingPayment(session, bookingId)
		} else if (orderId) {
			await this.handleOrderPayment(session, orderId)
		} else {
			console.error('[Stripe Webhook] No booking_id or order_id in payment session metadata')
		}
	}

	private async handleBookingPayment(session: any, bookingId: string) {
		const booking = await WorkshopBooking.find(bookingId)
		if (!booking) {
			console.error('[Stripe Webhook] Booking not found:', bookingId)
			return
		}

		// Idempotency: skip if already confirmed (Stripe can retry webhooks)
		if (booking.status === 'confirmed') {
			console.log(`[Stripe Webhook] Booking ${bookingId} already confirmed, skipping`)
			return
		}

		booking.merge({
			status: 'confirmed',
			depositPaymentStatus: 'paid',
			depositPaidAt: DateTime.now(),
			stripeCheckoutSessionId: session.id,
			stripePaymentIntentId: session.payment_intent,
		})
		await booking.save()

		console.log(`[Stripe Webhook] Booking ${bookingId} confirmed (payment received)`)

		// Send payment confirmation email with workshop recap
		try {
			const workshop = await Workshop.query()
				.where('id', booking.workshopId)
				.preload('patissier')
				.firstOrFail()

			await this.emailService.sendPaymentConfirmation({
				clientEmail: booking.clientEmail,
				clientName: booking.clientName,
				workshopTitle: workshop.title,
				patissierName: workshop.patissier.businessName,
				date: workshop.date,
				startTime: workshop.startTime,
				location: workshop.location,
				durationMinutes: workshop.durationMinutes,
				nbParticipants: booking.nbParticipants,
				amountPaid: Number(booking.depositAmount),
				totalPrice: Number(booking.totalPrice),
				remainingAmount: Number(booking.remainingAmount),
			})
		} catch (err: any) {
			console.error(`[Stripe Webhook] Failed to send payment confirmation email for booking ${bookingId}:`, err.message)
		}
	}

	private async handleOrderPayment(session: any, orderId: string) {
		const order = await Order.query()
			.where('id', orderId)
			.preload('patissier')
			.first()

		if (!order) {
			console.error('[Stripe Webhook] Order not found:', orderId)
			return
		}

		// Idempotency
		if (order.paymentStatus === 'paid') {
			console.log(`[Stripe Webhook] Order ${orderId} already paid, skipping`)
			return
		}

		order.merge({
			paymentStatus: 'paid',
			paidAt: DateTime.now(),
			stripePaymentIntentId: session.payment_intent,
			status: order.status === 'pending' ? 'confirmed' : order.status,
			confirmedAt: order.status === 'pending' ? DateTime.now() : order.confirmedAt,
		})
		await order.save()

		console.log(`[Stripe Webhook] Order ${orderId} payment received`)

		const amountPaid = session.amount_total ? (session.amount_total / 100) : Number(order.quotedPrice)

		// Send payment confirmation email to client
		try {
			await this.emailService.sendStatusUpdate({
				email: order.clientEmail,
				recipientName: order.clientName,
				subject: `Paiement confirmé - Commande #${order.orderNumber}`,
				title: 'Paiement confirmé',
				body: `Votre paiement de <strong>${amountPaid.toFixed(2)} €</strong> pour la commande #${order.orderNumber} a bien été reçu. ${order.patissier.businessName} va prendre en charge votre commande.`,
			})
		} catch (err: any) {
			console.error(`[Stripe Webhook] Failed to send payment confirmation to client for order ${orderId}:`, err.message)
		}

		// Send notification email to patissier
		try {
			const patissierUser = await import('#models/user').then((m) => m.default.find(order.patissier.userId))
			if (patissierUser) {
				await this.emailService.sendStatusUpdate({
					email: patissierUser.email,
					recipientName: order.patissier.businessName,
					subject: `Acompte reçu - Commande #${order.orderNumber}`,
					title: 'Acompte reçu',
					body: `${order.clientName} a payé l'acompte de <strong>${amountPaid.toFixed(2)} €</strong> pour la commande #${order.orderNumber}. La commande est maintenant confirmée.`,
					actionUrl: `${env.get('FRONTEND_URL', 'https://patissio.com')}/orders/${order.id}`,
					actionLabel: 'Voir la commande',
				})
			}
		} catch (err: any) {
			console.error(`[Stripe Webhook] Failed to send payment notification to patissier for order ${orderId}:`, err.message)
		}
	}

	private async handleSubscriptionUpdated(subscription: any) {
		const sub = await Subscription.findBy('stripeSubscriptionId', subscription.id)
		if (!sub) return

		const statusMap: Record<string, 'active' | 'past_due'> = {
			active: 'active',
			past_due: 'past_due',
		}

		sub.merge({
			status: statusMap[subscription.status] || sub.status,
			cancelAtPeriodEnd: subscription.cancel_at_period_end,
			currentPeriodStart: toDateTime(subscription.current_period_start),
			currentPeriodEnd: toDateTime(subscription.current_period_end),
		})

		const priceId = subscription.items?.data?.[0]?.price?.id
		if (priceId) {
			const planInfo = this.stripeService.getPlanFromPriceId(priceId)
			if (planInfo && planInfo.plan !== sub.plan) {
				sub.plan = planInfo.plan
				sub.billingInterval = planInfo.interval

				const profile = await PatissierProfile.findBy('userId', sub.userId)
				if (profile) {
					profile.plan = planInfo.plan
					await profile.save()
				}
			}
		}

		await sub.save()
		console.log(`[Stripe Webhook] Subscription ${subscription.id} updated: status=${sub.status}`)
	}

	private async handleSubscriptionDeleted(subscription: any) {
		const sub = await Subscription.findBy('stripeSubscriptionId', subscription.id)
		if (!sub) return

		sub.merge({
			status: 'canceled',
			canceledAt: DateTime.now(),
		})
		await sub.save()

		const profile = await PatissierProfile.findBy('userId', sub.userId)
		if (profile) {
			profile.plan = 'starter'
			await profile.save()
		}

		console.log(`[Stripe Webhook] Subscription ${subscription.id} deleted, user ${sub.userId} downgraded to starter`)
	}

	private async handleInvoicePaid(invoice: any) {
		if (!invoice.subscription) return

		const sub = await Subscription.findBy('stripeSubscriptionId', invoice.subscription)
		if (!sub) return

		if (invoice.lines?.data?.[0]?.period) {
			const period = invoice.lines.data[0].period
			sub.merge({
				currentPeriodStart: toDateTime(period.start),
				currentPeriodEnd: toDateTime(period.end),
				status: 'active',
			})
			await sub.save()
		}

		console.log(`[Stripe Webhook] Invoice paid for subscription ${invoice.subscription}`)
	}

	private async handleInvoicePaymentFailed(invoice: any) {
		if (!invoice.subscription) return

		const sub = await Subscription.findBy('stripeSubscriptionId', invoice.subscription)
		if (!sub) return

		sub.status = 'past_due'
		await sub.save()

		console.log(`[Stripe Webhook] Invoice payment failed for subscription ${invoice.subscription}`)
	}

	private async handleAccountUpdated(account: any) {
		const profile = await PatissierProfile.findBy('stripeAccountId', account.id)
		if (!profile) return

		const transfersActive = account.capabilities?.transfers === 'active'
		if (account.charges_enabled && account.details_submitted && transfersActive) {
			profile.stripeOnboardingComplete = true
			await profile.save()
			console.log(`[Stripe Webhook] Connect account ${account.id} onboarding complete (transfers active)`)
		}
	}
}
