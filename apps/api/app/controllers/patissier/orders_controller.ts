import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import OrderMessage from '#models/order_message'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import EmailService from '#services/email_service'
import StripeService from '#services/stripe_service'
import env from '#start/env'

export default class OrdersController {
	async index({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const page = request.input('page', 1)
		const limit = request.input('limit', 20)
		const status = request.input('status')
		const type = request.input('type')

		const query = Order.query().where('patissierId', profile.id).orderBy('createdAt', 'desc')

		if (status) {
			query.where('status', status)
		}

		if (type) {
			query.where('type', type)
		}

		const orders = await query.paginate(page, limit)

		return response.ok({
			success: true,
			data: orders.serialize(),
		})
	}

	async store({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const type = request.input('type')
		const clientName = request.input('clientName')
		const clientEmail = request.input('clientEmail')

		if (!clientName || !clientEmail) {
			return response.badRequest({
				success: false,
				message: 'Le nom et l\'email du client sont requis.',
			})
		}

		if (!type || !['catalogue', 'custom'].includes(type)) {
			return response.badRequest({
				success: false,
				message: 'Le type de commande est requis (catalogue ou custom).',
			})
		}

		const clientPhone = request.input('clientPhone')
		const deliveryMethod = request.input('deliveryMethod')
		const requestedDate = request.input('requestedDate')
		const deliveryAddress = request.input('deliveryAddress')
		const deliveryNotes = request.input('deliveryNotes')
		const patissierNotes = request.input('patissierNotes')
		const items = request.input('items')
		const customType = request.input('customType')
		const customNbPersonnes = request.input('customNbPersonnes')
		const customDateSouhaitee = request.input('customDateSouhaitee')
		const customTheme = request.input('customTheme')
		const customAllergies = request.input('customAllergies')
		const customMessage = request.input('customMessage')

		// Generate order number
		const now = DateTime.now()
		const datePart = now.toFormat('yyyyMMdd')
		const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
		const orderNumber = `PAT-${datePart}-${randomPart}`

		let subtotal = 0

		// Validate catalogue items
		if (type === 'catalogue') {
			if (!items || !Array.isArray(items) || items.length === 0) {
				return response.badRequest({
					success: false,
					message: 'Au moins un article est requis pour une commande catalogue.',
				})
			}

			for (const item of items) {
				const product = await Product.find(item.product_id)
				if (!product || product.patissierId !== profile.id) {
					return response.notFound({
						success: false,
						message: `Produit ${item.product_id} introuvable.`,
					})
				}
				subtotal += product.price * item.quantity
			}
		}

		const order = await Order.create({
			orderNumber,
			patissierId: profile.id,
			type,
			clientName,
			clientEmail,
			clientPhone: clientPhone || null,
			deliveryMethod: deliveryMethod || 'pickup',
			requestedDate: requestedDate || null,
			deliveryAddress: deliveryAddress || null,
			deliveryNotes: deliveryNotes || null,
			patissierNotes: patissierNotes || null,
			subtotal: type === 'catalogue' ? subtotal : null,
			total: type === 'catalogue' ? subtotal : null,
			status: 'pending',
			paymentStatus: 'pending',
			customType: type === 'custom' ? customType || null : null,
			customNbPersonnes: type === 'custom' ? customNbPersonnes || null : null,
			customDateSouhaitee: type === 'custom' ? customDateSouhaitee || null : null,
			customTheme: type === 'custom' ? customTheme || null : null,
			customAllergies: type === 'custom' ? customAllergies || null : null,
			customMessage: type === 'custom' ? customMessage || null : null,
		})

		// Create order items for catalogue orders
		if (type === 'catalogue' && items) {
			for (const item of items) {
				const product = await Product.find(item.product_id)
				if (product) {
					await OrderItem.create({
						orderId: order.id,
						productId: product.id,
						productName: product.name,
						unitPrice: product.price,
						quantity: item.quantity,
						total: product.price * item.quantity,
						specialInstructions: item.special_instructions || null,
					})
				}
			}
		}

		await order.load('items')

		return response.created({
			success: true,
			data: order.serialize(),
		})
	}

	async show({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.preload('items')
			.preload('messages', (q) => q.orderBy('createdAt', 'asc'))
			.firstOrFail()

		return response.ok({
			success: true,
			data: order.serialize(),
		})
	}

	async updateStatus({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const { status, cancellationReason } = request.only(['status', 'cancellationReason'])

		const validStatuses: Order['status'][] = [
			'pending',
			'confirmed',
			'in_progress',
			'ready',
			'delivered',
			'picked_up',
			'cancelled',
		]

		if (!validStatuses.includes(status)) {
			return response.badRequest({
				success: false,
				message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
			})
		}

		order.status = status

		if (status === 'confirmed') {
			order.confirmedAt = DateTime.now()
			const confirmedDate = request.input('confirmedDate')
			if (confirmedDate) {
				order.confirmedDate = confirmedDate
			}
		}

		if (status === 'delivered' || status === 'picked_up') {
			order.completedAt = DateTime.now()
		}

		if (status === 'cancelled') {
			order.cancelledAt = DateTime.now()
			if (cancellationReason) {
				order.cancellationReason = cancellationReason
			}
		}

		await order.save()

		return response.ok({
			success: true,
			data: order.serialize(),
		})
	}

	async quote({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		if (order.type !== 'custom') {
			return response.badRequest({
				success: false,
				message: 'Quotes can only be set on custom orders',
			})
		}

		const { quotedPrice, responseMessage, depositPercent, confirmedDate } = request.only([
			'quotedPrice',
			'responseMessage',
			'depositPercent',
			'confirmedDate',
		])

		if (quotedPrice === undefined || quotedPrice === null) {
			return response.badRequest({
				success: false,
				message: 'quotedPrice is required',
			})
		}

		order.quotedPrice = quotedPrice
		order.total = quotedPrice

		if (responseMessage) {
			order.responseMessage = responseMessage
		}

		if (confirmedDate) {
			order.confirmedDate = confirmedDate
		}

		await order.save()

		// Generate Stripe payment link if patissier has Stripe Connect
		let checkoutUrl: string | null = null
		const effectiveDepositPercent = depositPercent ?? 100
		const depositAmount = Math.round(quotedPrice * (effectiveDepositPercent / 100) * 100) / 100

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
			} catch (err: any) {
				stripeError = err?.message || String(err)
				console.error('Failed to create Stripe checkout for order quote:', err)
			}
		}

		// Send quote email to client
		try {
			const emailService = new EmailService()
			const formattedPrice = Number(quotedPrice).toFixed(2)
			const formattedDeposit = depositAmount.toFixed(2)

			let body = responseMessage
				? `${profile.businessName} vous a envoyé un devis pour votre commande sur-mesure #${order.orderNumber}.<br><br><strong>Message du pâtissier :</strong><br>${responseMessage}<br><br>`
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
			data: order.serialize(),
			...(warnings.length > 0 ? { warnings } : {}),
		})
	}

	async messages({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		// Ensure order belongs to this patissier
		await Order.query().where('id', params.id).where('patissierId', profile.id).firstOrFail()

		const page = request.input('page', 1)
		const limit = request.input('limit', 50)

		const messages = await OrderMessage.query()
			.where('orderId', params.id)
			.orderBy('createdAt', 'asc')
			.paginate(page, limit)

		return response.ok({
			success: true,
			data: messages.serialize(),
		})
	}

	async sendMessage({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		// Ensure order belongs to this patissier
		const order = await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const { message, attachments } = request.only(['message', 'attachments'])

		if (!message) {
			return response.badRequest({
				success: false,
				message: 'Message content is required',
			})
		}

		const orderMessage = await OrderMessage.create({
			orderId: params.id,
			senderType: 'patissier',
			senderId: user.id,
			message,
			attachments: attachments || [],
		})

		// Send email notification to client
		try {
			const emailService = new EmailService()
			await emailService.sendOrderMessageNotification({
				recipientEmail: order.clientEmail,
				recipientName: order.clientName,
				senderName: profile.businessName,
				orderNumber: order.orderNumber,
				messagePreview: message.length > 200 ? `${message.substring(0, 200)}…` : message,
			})
		} catch (error) {
			console.error('Failed to send order message notification email:', error)
		}

		return response.created({
			success: true,
			data: orderMessage.serialize(),
		})
	}
}
