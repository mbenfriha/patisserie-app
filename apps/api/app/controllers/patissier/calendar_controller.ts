import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import PatissierProfile from '#models/patissier_profile'
import Workshop from '#models/workshop'

export default class CalendarController {
	async index({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const start = request.input('start')
		const end = request.input('end')

		if (!start || !end) {
			return response.badRequest({ message: 'start and end are required' })
		}

		// Orders (non-cancelled)
		const orders = await Order.query()
			.where('patissierId', profile.id)
			.whereNot('status', 'cancelled')
			.where((q) => {
				q.whereBetween('requestedDate', [start, end])
					.orWhereBetween('confirmedDate', [start, end])
					.orWhereBetween('customDateSouhaitee', [start, end])
					.orWhereBetween('createdAt', [`${start}T00:00:00`, `${end}T23:59:59`])
			})

		// Workshops (non-cancelled)
		const workshops = await Workshop.query()
			.where('patissierId', profile.id)
			.whereNot('status', 'cancelled')
			.whereBetween('date', [start, end])

		const events: {
			id: string
			kind: 'order' | 'devis' | 'workshop'
			date: string
			title: string
			status: string
			meta: Record<string, string | number | null | undefined>
		}[] = []

		for (const order of orders) {
			let date: string
			if (order.type === 'custom') {
				date =
					order.confirmedDate || order.customDateSouhaitee || order.createdAt.toFormat('yyyy-MM-dd')
			} else {
				date = order.confirmedDate || order.requestedDate || order.createdAt.toFormat('yyyy-MM-dd')
			}

			// Only include if the resolved date falls in range
			if (date < start || date > end) continue

			const isDevis = order.type === 'custom'

			events.push({
				id: order.id,
				kind: isDevis ? 'devis' : 'order',
				date,
				title: isDevis ? `Devis #${order.orderNumber}` : `Commande #${order.orderNumber}`,
				status: order.status,
				meta: {
					orderNumber: order.orderNumber,
					clientName: order.clientName,
					total: order.total,
					type: order.type,
					deliveryMethod: order.deliveryMethod,
				},
			})
		}

		for (const workshop of workshops) {
			events.push({
				id: workshop.id,
				kind: 'workshop',
				date: workshop.date,
				title: workshop.title,
				status: workshop.status,
				meta: {
					startTime: workshop.startTime,
					capacity: workshop.capacity,
					durationMinutes: workshop.durationMinutes,
					location: workshop.location,
				},
			})
		}

		return response.ok({ data: events })
	}
}
