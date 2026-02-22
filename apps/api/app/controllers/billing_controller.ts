import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'
import StripeService from '#services/stripe_service'
import env from '#start/env'

const PLANS = [
	{
		id: 'starter',
		name: 'Starter',
		monthlyPrice: 0,
		yearlyPrice: 0,
		features: ['Vitrine en ligne', 'Jusqu\'a 10 creations', 'Commandes manuelles'],
	},
	{
		id: 'pro',
		name: 'Pro',
		monthlyPrice: 1990,
		yearlyPrice: 19900,
		features: [
			'Tout Starter',
			'Creations illimitees',
			'Paiement en ligne',
			'Ateliers',
			'Domaine personnalise',
		],
	},
	{
		id: 'premium',
		name: 'Premium',
		monthlyPrice: 3990,
		yearlyPrice: 39900,
		features: [
			'Tout Pro',
			'Statistiques avancees',
			'Support prioritaire',
			'Multi-langues',
			'API access',
		],
	},
]

export default class BillingController {
	private stripeService = new StripeService()

	async plans({ response }: HttpContext) {
		return response.ok({
			success: true,
			data: PLANS,
		})
	}

	async current({ auth, response }: HttpContext) {
		const user = auth.user!

		const subscription = await Subscription.query()
			.where('userId', user.id)
			.orderBy('createdAt', 'desc')
			.first()

		return response.ok({
			success: true,
			data: subscription ? subscription.serialize() : null,
		})
	}

	async subscribe({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const { plan, interval } = request.only(['plan', 'interval'])

		if (!['pro', 'premium'].includes(plan)) {
			return response.badRequest({ success: false, message: 'Invalid plan. Use pro or premium.' })
		}

		if (!['monthly', 'yearly'].includes(interval)) {
			return response.badRequest({ success: false, message: 'Invalid billing interval' })
		}

		const priceId = this.stripeService.getPriceId(plan, interval)
		if (!priceId) {
			return response.badRequest({ success: false, message: 'Price not configured for this plan' })
		}

		const existingSub = await Subscription.query()
			.where('userId', user.id)
			.where('status', 'active')
			.first()

		// Upgrade/downgrade existing subscription
		if (existingSub?.stripeSubscriptionId) {
			await this.stripeService.updateSubscriptionPlan(existingSub.stripeSubscriptionId, priceId)
			return response.ok({ success: true, data: { upgraded: true } })
		}

		const frontendUrl = env.get('FRONTEND_URL')
		const checkoutUrl = await this.stripeService.createCheckoutSession(
			existingSub?.stripeCustomerId || null,
			user.email,
			priceId,
			`${frontendUrl}/billing?success=true`,
			`${frontendUrl}/billing?cancelled=true`,
			user.id,
		)

		return response.ok({
			success: true,
			data: { url: checkoutUrl },
		})
	}

	async cancel({ auth, response }: HttpContext) {
		const user = auth.user!

		const subscription = await Subscription.query()
			.where('userId', user.id)
			.where('status', 'active')
			.first()

		if (!subscription) {
			return response.notFound({ success: false, message: 'No active subscription found' })
		}

		if (!subscription.stripeSubscriptionId) {
			return response.badRequest({ success: false, message: 'No Stripe subscription to cancel' })
		}

		await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId, true)
		subscription.cancelAtPeriodEnd = true
		await subscription.save()

		return response.ok({
			success: true,
			data: subscription.serialize(),
		})
	}

	async resume({ auth, response }: HttpContext) {
		const user = auth.user!

		const subscription = await Subscription.query()
			.where('userId', user.id)
			.where('cancelAtPeriodEnd', true)
			.first()

		if (!subscription) {
			return response.notFound({
				success: false,
				message: 'No subscription pending cancellation found',
			})
		}

		if (!subscription.stripeSubscriptionId) {
			return response.badRequest({ success: false, message: 'No Stripe subscription to resume' })
		}

		await this.stripeService.resumeSubscription(subscription.stripeSubscriptionId)
		subscription.cancelAtPeriodEnd = false
		await subscription.save()

		return response.ok({
			success: true,
			data: subscription.serialize(),
		})
	}

	async invoices({ auth, response }: HttpContext) {
		const user = auth.user!

		const subscription = await Subscription.query()
			.where('userId', user.id)
			.whereNotNull('stripeCustomerId')
			.orderBy('createdAt', 'desc')
			.first()

		if (!subscription?.stripeCustomerId) {
			return response.ok({ success: true, data: [] })
		}

		const stripeInvoices = await this.stripeService.listInvoices(subscription.stripeCustomerId)

		const invoices = stripeInvoices.data.map((invoice) => ({
			id: invoice.id,
			number: invoice.number,
			status: invoice.status,
			amountPaid: invoice.amount_paid,
			currency: invoice.currency,
			createdAt: invoice.created ? new Date(invoice.created * 1000).toISOString() : null,
			hostedInvoiceUrl: invoice.hosted_invoice_url,
			invoicePdf: invoice.invoice_pdf,
		}))

		return response.ok({
			success: true,
			data: invoices,
		})
	}

	async portal({ auth, response }: HttpContext) {
		const user = auth.user!

		const subscription = await Subscription.query()
			.where('userId', user.id)
			.whereNotNull('stripeCustomerId')
			.orderBy('createdAt', 'desc')
			.first()

		if (!subscription?.stripeCustomerId) {
			return response.badRequest({ success: false, message: 'No Stripe customer found' })
		}

		const frontendUrl = env.get('FRONTEND_URL')
		const portalUrl = await this.stripeService.createBillingPortalSession(
			subscription.stripeCustomerId,
			`${frontendUrl}/billing`,
		)

		return response.ok({
			success: true,
			data: { url: portalUrl },
		})
	}
}
