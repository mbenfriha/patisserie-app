import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'

export default class OrdersController {
	async index({ request, response }: HttpContext) {
		const page = request.input('page', 1)
		const limit = Math.min(Number(request.input('limit', 20)) || 20, 100)

		const orders = await Order.query()
			.whereNull('deletedAt')
			.preload('items')
			.preload('patissier')
			.orderBy('createdAt', 'desc')
			.paginate(page, limit)

		return response.ok({
			success: true,
			data: orders.serialize(),
		})
	}
}
