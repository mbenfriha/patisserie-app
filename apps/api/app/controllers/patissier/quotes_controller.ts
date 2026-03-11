import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Order from '#models/order'
import OrderQuote from '#models/order_quote'
import PatissierProfile from '#models/patissier_profile'
import EmailService from '#services/email_service'
import StripeService from '#services/stripe_service'
import env from '#start/env'
import {
	saveQuoteDraftValidator,
	sendQuoteValidator,
	updateQuoteStatusValidator,
} from '#validators/quote_validator'

export default class QuotesController {
	/**
	 * List all quotes for an order (newest first)
	 */
	async index({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.orderId)
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.firstOrFail()

		const quotes = await OrderQuote.query().where('orderId', order.id).orderBy('version', 'desc')

		return response.ok({
			success: true,
			data: quotes.map((q) => q.serialize()),
		})
	}

	/**
	 * Save a quote as draft (create or update)
	 */
	async saveDraft({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.orderId)
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.firstOrFail()

		if (order.type !== 'custom') {
			return response.badRequest({
				success: false,
				message: 'Quotes can only be set on custom orders',
			})
		}

		const data = await request.validateUsing(saveQuoteDraftValidator)

		// Find existing draft or create new one
		let quote = await OrderQuote.query().where('orderId', order.id).where('status', 'draft').first()

		if (quote) {
			quote.merge({
				price: data.price,
				depositPercent: data.depositPercent ?? quote.depositPercent,
				confirmedDate: data.confirmedDate ?? quote.confirmedDate,
				message: data.message ?? quote.message,
			})
			await quote.save()
		} else {
			// Get next version number
			const lastQuote = await OrderQuote.query()
				.where('orderId', order.id)
				.orderBy('version', 'desc')
				.first()

			quote = await OrderQuote.create({
				orderId: order.id,
				version: (lastQuote?.version ?? 0) + 1,
				price: data.price,
				depositPercent: data.depositPercent ?? 30,
				confirmedDate: data.confirmedDate ?? null,
				message: data.message ?? null,
				status: 'draft',
			})
		}

		// Also update order.quotedPrice for consistency
		order.quotedPrice = data.price
		await order.save()

		return response.ok({
			success: true,
			data: quote.serialize(),
		})
	}

	/**
	 * Send a quote to the client (saves + sends email + creates Stripe link)
	 */
	async send({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.orderId)
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.firstOrFail()

		if (order.type !== 'custom') {
			return response.badRequest({
				success: false,
				message: 'Quotes can only be set on custom orders',
			})
		}

		const data = await request.validateUsing(sendQuoteValidator)

		// Find existing draft or create new one
		let quote = await OrderQuote.query().where('orderId', order.id).where('status', 'draft').first()

		if (quote) {
			quote.merge({
				price: data.price,
				depositPercent: data.depositPercent ?? quote.depositPercent,
				confirmedDate: data.confirmedDate ?? quote.confirmedDate,
				message: data.message ?? quote.message,
				status: 'sent',
				sentAt: DateTime.now(),
			})
			await quote.save()
		} else {
			const lastQuote = await OrderQuote.query()
				.where('orderId', order.id)
				.orderBy('version', 'desc')
				.first()

			quote = await OrderQuote.create({
				orderId: order.id,
				version: (lastQuote?.version ?? 0) + 1,
				price: data.price,
				depositPercent: data.depositPercent ?? 30,
				confirmedDate: data.confirmedDate ?? null,
				message: data.message ?? null,
				status: 'sent',
				sentAt: DateTime.now(),
			})
		}

		// Update order fields for backward compatibility
		const effectiveDepositPercent = quote.depositPercent
		order.quotedPrice = quote.price
		order.total = quote.price
		order.depositPercent = effectiveDepositPercent
		if (quote.confirmedDate) {
			order.confirmedDate = quote.confirmedDate
		}
		if (quote.message) {
			order.responseMessage = quote.message
		}
		await order.save()

		// Generate Stripe payment link
		let checkoutUrl: string | null = null
		const depositAmount = Math.round(quote.price * (effectiveDepositPercent / 100) * 100) / 100
		let stripeError: string | null = null

		if (depositAmount > 0 && profile.stripeAccountId && profile.stripeOnboardingComplete) {
			try {
				const stripeService = new StripeService()
				const frontendUrl = env.get('FRONTEND_URL', 'https://patissio.com')
				checkoutUrl = await stripeService.createOrderQuoteCheckout(
					depositAmount,
					order.orderNumber,
					order.id,
					order.clientEmail,
					profile.stripeAccountId,
					`${frontendUrl}/${profile.slug}/commandes?payment=success&order=${order.orderNumber}`,
					`${frontendUrl}/${profile.slug}/commandes?payment=cancelled&order=${order.orderNumber}`
				)
			} catch (err: unknown) {
				stripeError = err instanceof Error ? err.message : String(err)
				console.error('Failed to create Stripe checkout for quote:', err)
			}
		}

		// Send email to client
		try {
			const emailService = new EmailService()
			const formattedPrice = Number(quote.price).toFixed(2)
			const formattedDeposit = depositAmount.toFixed(2)

			let body = quote.message
				? `${profile.businessName} vous a envoyé un devis pour votre commande sur-mesure #${order.orderNumber}.<br><br><strong>Message du pâtissier :</strong><br>${quote.message}<br><br>`
				: `${profile.businessName} vous a envoyé un devis de <strong>${formattedPrice} €</strong> pour votre commande sur-mesure #${order.orderNumber}.<br><br>`

			if (effectiveDepositPercent < 100) {
				body += `<strong>Acompte demandé :</strong> ${formattedDeposit} € (${effectiveDepositPercent}% du total de ${formattedPrice} €)`
			} else {
				body += `<strong>Montant à régler :</strong> ${formattedPrice} €`
			}

			await emailService.sendStatusUpdate({
				email: order.clientEmail,
				recipientName: order.clientName,
				subject: `Devis pour votre commande #${order.orderNumber}`,
				title: `Devis reçu : ${formattedPrice} €`,
				body,
				...(checkoutUrl
					? {
							actionUrl: checkoutUrl,
							actionLabel: `Payer ${effectiveDepositPercent < 100 ? "l'acompte" : ''} ${formattedDeposit} €`,
						}
					: {}),
			})
		} catch (err) {
			console.error('Failed to send quote email:', err)
		}

		const warnings: string[] = []
		if (!profile.stripeAccountId || !profile.stripeOnboardingComplete) {
			warnings.push(
				"Stripe Connect non configuré : le lien de paiement n'a pas été inclus dans l'email. Configurez Stripe dans Intégrations pour activer le paiement en ligne."
			)
		} else if (!checkoutUrl) {
			warnings.push(
				`La génération du lien de paiement Stripe a échoué${stripeError ? ` : ${stripeError}` : ''}. Le devis a été envoyé sans lien de paiement.`
			)
		}

		return response.ok({
			success: true,
			data: quote.serialize(),
			...(warnings.length > 0 ? { warnings } : {}),
		})
	}

	/**
	 * Update quote status (accept or reject)
	 */
	async updateStatus({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.orderId)
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.firstOrFail()

		const { status } = await request.validateUsing(updateQuoteStatusValidator)

		const quote = await OrderQuote.query()
			.where('id', params.id)
			.where('orderId', order.id)
			.whereIn('status', ['sent'])
			.firstOrFail()

		quote.status = status
		quote.respondedAt = DateTime.now()
		await quote.save()

		// If accepted, confirm the order
		if (status === 'accepted' && order.status === 'pending') {
			order.status = 'confirmed'
			order.confirmedAt = DateTime.now()
			await order.save()
		}

		return response.ok({
			success: true,
			data: quote.serialize(),
		})
	}

	/**
	 * Revise a quote (marks current as revised, creates new draft)
	 */
	async revise({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.orderId)
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.firstOrFail()

		// Find current active quote (sent or accepted)
		const currentQuote = await OrderQuote.query()
			.where('id', params.id)
			.where('orderId', order.id)
			.whereIn('status', ['sent', 'accepted'])
			.firstOrFail()

		// Mark as revised
		currentQuote.status = 'revised'
		await currentQuote.save()

		// Create new draft based on the old quote
		const newQuote = await OrderQuote.create({
			orderId: order.id,
			version: currentQuote.version + 1,
			price: currentQuote.price,
			depositPercent: currentQuote.depositPercent,
			confirmedDate: currentQuote.confirmedDate,
			message: '',
			status: 'draft',
		})

		return response.ok({
			success: true,
			data: newQuote.serialize(),
		})
	}
}
