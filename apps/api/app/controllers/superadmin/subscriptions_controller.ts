import type { HttpContext } from '@adonisjs/core/http'
import Subscription from '#models/subscription'

export default class SubscriptionsController {
	async index({ request, response }: HttpContext) {
		const page = request.input('page', 1)
		const limit = request.input('limit', 20)

		const subscriptions = await Subscription.query()
			.preload('user')
			.orderBy('createdAt', 'desc')
			.paginate(page, limit)

		return response.ok({
			success: true,
			data: subscriptions.serialize(),
		})
	}
}
