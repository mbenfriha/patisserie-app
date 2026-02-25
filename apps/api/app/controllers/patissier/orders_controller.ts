import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import PatissierProfile from '#models/patissier_profile'
import Order from '#models/order'
import OrderMessage from '#models/order_message'
import EmailService from '#services/email_service'

export default class OrdersController {
	async index({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const page = request.input('page', 1)
		const limit = request.input('limit', 20)
		const status = request.input('status')
		const type = request.input('type')

		const query = Order.query()
			.where('patissierId', profile.id)
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

		const { quotedPrice, responseMessage } = request.only(['quotedPrice', 'responseMessage'])

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

		await order.save()

		return response.ok({
			success: true,
			data: order.serialize(),
		})
	}

	async messages({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		// Ensure order belongs to this patissier
		await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

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
