import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import OrderMessage from '#models/order_message'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import EmailService from '#services/email_service'
import StorageService from '#services/storage_service'
import StripeService from '#services/stripe_service'
import env from '#start/env'
import {
	quoteOrderValidator,
	sendMessageValidator,
	storePatissierOrderValidator,
	updateOrderStatusValidator,
	updateOrderValidator,
} from '#validators/order_validator'

export default class OrdersController {
	async index({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const page = request.input('page', 1)
		const limit = Math.min(Number(request.input('limit', 20)) || 20, 100)
		const status = request.input('status')
		const type = request.input('type')

		const query = Order.query()
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.orderBy('createdAt', 'desc')

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

		const data = await request.validateUsing(storePatissierOrderValidator)
		const {
			type,
			clientName,
			clientEmail,
			clientPhone,
			deliveryMethod,
			requestedDate,
			deliveryAddress,
			deliveryNotes,
			patissierNotes,
			items,
			customType,
			customNbPersonnes,
			customDateSouhaitee,
			customTheme,
			customAllergies,
			customMessage,
		} = data
		const manualTotal = data.total
		const manualPaymentStatus = data.paymentStatus
		const depositPercent = data.depositPercent

		// Handle photo uploads if present
		const customPhotoUrls: string[] = []
		const photoFiles = request.files('customPhotos', {
			size: '5mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
		})
		if (photoFiles.length > 0) {
			const storageService = new StorageService()
			for (const photoFile of photoFiles) {
				const key = await storageService.uploadImage(photoFile, 'orders/inspirations')
				customPhotoUrls.push(storageService.getPublicUrl(key))
			}
		}

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

		// Determine total: manual total overrides, then catalogue subtotal, then null
		const computedTotal =
			manualTotal != null ? Number(manualTotal) : type === 'catalogue' ? subtotal : null

		// Determine payment status and paidAt
		const effectivePaymentStatus =
			manualPaymentStatus && ['pending', 'paid'].includes(manualPaymentStatus)
				? manualPaymentStatus
				: 'pending'
		const effectivePaidAt = effectivePaymentStatus === 'paid' ? DateTime.now() : null

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
			subtotal: type === 'catalogue' ? subtotal : computedTotal,
			total: computedTotal,
			status: 'pending',
			paymentStatus: effectivePaymentStatus,
			paidAt: effectivePaidAt,
			depositPercent: depositPercent != null ? Number(depositPercent) : null,
			customType: type === 'custom' ? customType || null : null,
			customNbPersonnes: type === 'custom' ? customNbPersonnes || null : null,
			customDateSouhaitee: type === 'custom' ? customDateSouhaitee || null : null,
			customTheme: type === 'custom' ? customTheme || null : null,
			customAllergies: type === 'custom' ? customAllergies || null : null,
			customMessage: type === 'custom' ? customMessage || null : null,
			customPhotoUrls: type === 'custom' ? customPhotoUrls : [],
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
			.whereNull('deletedAt')
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
			.whereNull('deletedAt')
			.firstOrFail()

		const {
			status,
			cancellationReason,
			confirmedDate: statusConfirmedDate,
		} = await request.validateUsing(updateOrderStatusValidator)

		order.status = status

		if (status === 'confirmed') {
			order.confirmedAt = DateTime.now()
			if (statusConfirmedDate) {
				order.confirmedDate = statusConfirmedDate
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

	async markPaid({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.firstOrFail()

		order.paymentStatus = 'paid'
		order.paidAt = DateTime.now()
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
			.whereNull('deletedAt')
			.firstOrFail()

		if (order.type !== 'custom') {
			return response.badRequest({
				success: false,
				message: 'Quotes can only be set on custom orders',
			})
		}

		const { quotedPrice, responseMessage, depositPercent, confirmedDate } =
			await request.validateUsing(quoteOrderValidator)

		order.quotedPrice = quotedPrice
		order.total = quotedPrice

		if (responseMessage) {
			order.responseMessage = responseMessage
		}

		if (confirmedDate) {
			order.confirmedDate = confirmedDate
		}

		order.depositPercent = depositPercent ?? 100

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
		await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.firstOrFail()

		const page = request.input('page', 1)
		const limit = Math.min(Number(request.input('limit', 50)) || 50, 100)

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
			.whereNull('deletedAt')
			.firstOrFail()

		const { message, attachments } = await request.validateUsing(sendMessageValidator)

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

	async update({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.firstOrFail()

		const data = await request.validateUsing(updateOrderValidator)

		if (data.clientName) order.clientName = data.clientName
		if (data.clientEmail) order.clientEmail = data.clientEmail
		if (data.clientPhone !== undefined) order.clientPhone = data.clientPhone || null

		if (data.deliveryMethod) order.deliveryMethod = data.deliveryMethod
		if (data.deliveryAddress !== undefined) order.deliveryAddress = data.deliveryAddress || null
		if (data.deliveryNotes !== undefined) order.deliveryNotes = data.deliveryNotes || null
		if (data.requestedDate !== undefined) order.requestedDate = data.requestedDate || null

		if (data.patissierNotes !== undefined) order.patissierNotes = data.patissierNotes || null

		if (data.total !== undefined) {
			order.total = data.total
		}

		if (order.type === 'custom') {
			if (data.customType !== undefined) order.customType = data.customType || null
			if (data.customNbPersonnes !== undefined)
				order.customNbPersonnes = data.customNbPersonnes || null
			if (data.customDateSouhaitee !== undefined)
				order.customDateSouhaitee = data.customDateSouhaitee || null
			if (data.customTheme !== undefined) order.customTheme = data.customTheme || null
			if (data.customAllergies !== undefined) order.customAllergies = data.customAllergies || null
			if (data.customMessage !== undefined) order.customMessage = data.customMessage || null

			// Handle photo uploads (add new photos)
			const photoFiles = request.files('customPhotos', {
				size: '5mb',
				extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
			})
			if (photoFiles.length > 0) {
				const storageService = new StorageService()
				const newUrls = [...(order.customPhotoUrls || [])]
				for (const photoFile of photoFiles) {
					const key = await storageService.uploadImage(photoFile, 'orders/inspirations')
					newUrls.push(storageService.getPublicUrl(key))
				}
				order.customPhotoUrls = newUrls
			}
			// Allow removing specific photos by URL
			if (data.removePhotos) {
				order.customPhotoUrls = (order.customPhotoUrls || []).filter(
					(url: string) => !data.removePhotos!.includes(url)
				)
			}
		}

		await order.save()
		await order.load('items')
		await order.load('messages', (q) => q.orderBy('createdAt', 'asc'))

		return response.ok({
			success: true,
			data: order.serialize(),
		})
	}

	async destroy({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.whereNull('deletedAt')
			.firstOrFail()

		order.deletedAt = DateTime.now()
		await order.save()

		return response.ok({
			success: true,
			message: 'Commande supprimée avec succès.',
		})
	}
}
