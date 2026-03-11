import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import OrderMessage from '#models/order_message'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import User from '#models/user'
import EmailService from '#services/email_service'
import StorageService from '#services/storage_service'
import env from '#start/env'
import {
	clientSendMessageValidator,
	storeClientOrderValidator,
} from '#validators/client_order_validator'

export default class OrdersController {
	private async verifyTurnstile(token: string | null): Promise<boolean> {
		const secret = env.get('TURNSTILE_SECRET_KEY')
		if (!secret) return true // Skip if not configured in dev

		if (!token) return false // Reject if no token provided

		try {
			const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ secret, response: token }),
			})
			const data = (await res.json()) as { success?: boolean }
			return data.success === true
		} catch (err) {
			logger.error({ err }, 'Turnstile verification failed')
			return false
		}
	}

	/**
	 * Check if the request originates from a verified custom domain.
	 * If so, Turnstile may not be loaded yet (hostname not added to widget),
	 * so we allow the request through.
	 */
	private async isFromVerifiedCustomDomain(request: HttpContext['request']): Promise<boolean> {
		const origin = request.header('origin') || request.header('referer') || ''
		if (!origin) return false

		try {
			const url = new URL(origin)
			const hostname = url.hostname.replace(/^www\./, '')

			// Not a custom domain if it's patissio.com or localhost
			if (hostname.endsWith('patissio.com') || hostname === 'localhost') return false

			const profile = await PatissierProfile.query()
				.where('customDomain', hostname)
				.where('customDomainVerified', true)
				.first()

			return !!profile
		} catch {
			return false
		}
	}

	async store({ request, response }: HttpContext) {
		// Turnstile anti-spam verification
		const turnstileToken = request.input('cf-turnstile-response')
		const turnstileValid = await this.verifyTurnstile(turnstileToken)
		if (!turnstileValid) {
			// Allow verified custom domains where Turnstile widget may not be configured yet
			const isCustomDomain = await this.isFromVerifiedCustomDomain(request)
			if (!isCustomDomain) {
				return response.forbidden({
					success: false,
					message: 'Vérification de sécurité échouée. Veuillez réessayer.',
				})
			}
		}

		const data = await request.validateUsing(storeClientOrderValidator)
		const {
			slug,
			type,
			clientName,
			clientEmail,
			clientPhone,
			deliveryMethod,
			requestedDate,
			deliveryAddress,
			deliveryNotes,
			items,
			customType,
			customNbPersonnes,
			customDateSouhaitee,
			customTheme,
			customAllergies,
			customMessage,
		} = data

		const patissier = await PatissierProfile.findBy('slug', slug)
		if (!patissier) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		// Handle photo uploads if present
		const customPhotoUrls: string[] = []
		const photoFiles = request.files('customPhotos', {
			size: '5mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
		})
		if (photoFiles.length > 10) {
			return response.badRequest({ success: false, message: 'Maximum 10 photos allowed' })
		}
		if (photoFiles.length > 0) {
			const storageService = new StorageService()
			for (const photoFile of photoFiles) {
				const key = await storageService.uploadImage(photoFile, 'orders/inspirations')
				customPhotoUrls.push(storageService.getPublicUrl(key))
			}
		}

		const now = DateTime.now()
		const datePart = now.toFormat('yyyyMMdd')
		const randomPart = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
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
			customPhotoUrls: type === 'custom' ? customPhotoUrls : [],
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

		if (!email) {
			return response.badRequest({ success: false, message: 'Email is required' })
		}

		const order = await Order.query()
			.where('orderNumber', orderNumber)
			.where('clientEmail', email)
			.whereNull('deletedAt')
			.preload('items')
			.preload('patissier')
			.first()

		if (!order) {
			return response.notFound({ success: false, message: 'Order not found' })
		}

		return response.ok({
			success: true,
			data: order.serialize(),
		})
	}

	async messages({ params, request, response }: HttpContext) {
		const { orderNumber } = params
		const email = request.input('email')

		if (!email) {
			return response.badRequest({ success: false, message: 'Email is required' })
		}

		const order = await Order.query()
			.where('orderNumber', orderNumber)
			.where('clientEmail', email)
			.whereNull('deletedAt')
			.first()
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
		const { message, senderName, clientEmail } = await request.validateUsing(
			clientSendMessageValidator
		)

		const order = await Order.query()
			.where('orderNumber', orderNumber)
			.where('clientEmail', clientEmail)
			.whereNull('deletedAt')
			.first()
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
