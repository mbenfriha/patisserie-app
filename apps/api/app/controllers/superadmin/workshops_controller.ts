import type { HttpContext } from '@adonisjs/core/http'
import Workshop from '#models/workshop'

export default class WorkshopsController {
	async index({ request, response }: HttpContext) {
		const page = request.input('page', 1)
		const limit = request.input('limit', 20)

		const workshops = await Workshop.query()
			.preload('patissier')
			.preload('bookings')
			.orderBy('createdAt', 'desc')
			.paginate(page, limit)

		return response.ok({
			success: true,
			data: workshops.serialize(),
		})
	}
}
