import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import OrderMessage from '#models/order_message'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import User from '#models/user'
import EmailService from '#services/email_service'
import StorageService from '#services/storage_service'
import env from '#start/env'

export default class OrdersController {
	private async verifyTurnstile(token: string | null): Promise<boolean> {
		const secret = env.get('TURNSTILE_SECRET_KEY')
		if (!secret) return true // Skip if not configured

		if (!token) return true // No token = widget didn't render (e.g. custom domain)

		try {
			const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ secret, response: token }),
			})
			const data: any = await res.json()
			return data.success === true
		} catch (err) {
			logger.error({ err }, 'Turnstile verification failed')
			return false
		}
	}

	async store({ request, response }: HttpContext) {
		// Turnstile anti-spam verification
		const turnstileToken = request.input('cf-turnstile-response')
		const turnstileValid = await this.verifyTurnstile(turnstileToken)
		if (!turnstileValid) {
			return response.forbidden({ success: false, message: 'Vérification de sécurité échouée. Veuillez réessayer.' })
		}

		const slug = request.input('slug')
		const type = request.input('type')
		const clientName = request.input('clientName')
		const clientEmail = request.input('clientEmail')
		const clientPhone = request.input('clientPhone')
		const deliveryMethod = request.input('deliveryMethod')
		const requestedDate = request.input('requestedDate')
		const deliveryAddress = request.input('deliveryAddress')
		const deliveryNotes = request.input('deliveryNotes')
		const items = request.input('items')
		const customType = request.input('customType')
		const customNbPersonnes = request.input('customNbPersonnes')
		const customDateSouhaitee = request.input('customDateSouhaitee')
		const customTheme = request.input('customTheme')
		const customAllergies = request.input('customAllergies')
		const customMessage = request.input('customMessage')

		const patissier = await PatissierProfile.findBy('slug', slug)
		if (!patissier) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		// Handle photo upload if present
		let customPhotoInspirationUrl: string | null = null
		const photoFile = request.file('customPhotoInspiration', {
			size: '5mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
		})
		if (photoFile) {
			const storageService = new StorageService()
			const key = await storageService.uploadImage(photoFile, 'orders/inspirations')
			customPhotoInspirationUrl = storageService.getPublicUrl(key)
		}

		const now = DateTime.now()
		const datePart = now.toFormat('yyyyMMdd')
		const randomPart = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
		const orderNumber = `PAT-${datePart}-${randomPart}`

		let subtotal = 0

		if (type === 'catalogue' && items && items.length > 0) {
			const parsedItems = typeof items === 'string' ? JSON.parse(items) : items
			for (const item of parsedItems) {
				const product = await Product.find(item.product_id)
				if (!product) {
					return response.notFound({
						success: false,
						message: `Product ${item.product_id} not found`,
					})
				}
				subtotal += product.price * item.quantity
			}
		}

		const order = await Order.create({
			orderNumber,
			patissierId: patissier.id,
			type,
			clientName,
			clientEmail,
			clientPhone: clientPhone || null,
			deliveryMethod: deliveryMethod || 'pickup',
			requestedDate: requestedDate || null,
			deliveryAddress: deliveryAddress || null,
			deliveryNotes: deliveryNotes || null,
			subtotal: type === 'catalogue' ? subtotal : null,
			total: type === 'catalogue' ? subtotal : null,
			status: 'pending',
			paymentStatus: 'pending',
			customType: type === 'custom' ? customType : null,
			customNbPersonnes: type === 'custom' ? customNbPersonnes : null,
			customDateSouhaitee: type === 'custom' ? customDateSouhaitee : null,
			customTheme: type === 'custom' ? customTheme : null,
			customAllergies: type === 'custom' ? customAllergies : null,
			customPhotoInspirationUrl: type === 'custom' ? customPhotoInspirationUrl : null,
			customMessage: type === 'custom' ? customMessage : null,
		})

		if (type === 'catalogue' && items) {
			const parsedItems = typeof items === 'string' ? JSON.parse(items) : items
			for (const item of parsedItems) {
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

	async show({ params, request, response }: HttpContext) {
		const { orderNumber } = params
		const email = request.input('email')

		const query = Order.query().where('orderNumber', orderNumber)

		if (email) {
			query.where('clientEmail', email)
		}

		const order = await query.preload('items').preload('patissier').first()

		if (!order) {
			return response.notFound({ success: false, message: 'Order not found' })
		}

		return response.ok({
			success: true,
			data: order.serialize(),
		})
	}

	async messages({ params, response }: HttpContext) {
		const { orderNumber } = params

		const order = await Order.findBy('orderNumber', orderNumber)
		if (!order) {
			return response.notFound({ success: false, message: 'Order not found' })
		}

		const messages = await OrderMessage.query()
			.where('orderId', order.id)
			.orderBy('createdAt', 'asc')

		return response.ok({
			success: true,
			data: messages.map((m) => m.serialize()),
		})
	}

	async sendMessage({ params, request, response }: HttpContext) {
		const { orderNumber } = params
		const { message, senderName } = request.only(['message', 'senderName'])

		const order = await Order.findBy('orderNumber', orderNumber)
		if (!order) {
			return response.notFound({ success: false, message: 'Order not found' })
		}

		const orderMessage = await OrderMessage.create({
			orderId: order.id,
			senderType: 'client',
			senderId: null,
			message,
		})

		// Send email notification to patissier
		try {
			const profile = await PatissierProfile.findOrFail(order.patissierId)
			const patissierUser = await User.findOrFail(profile.userId)

			const emailService = new EmailService()
			await emailService.sendOrderMessageNotification({
				recipientEmail: patissierUser.email,
				recipientName: profile.businessName,
				senderName: senderName || order.clientName,
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
