import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import Order from '#models/order'
import Workshop from '#models/workshop'
import WorkshopBooking from '#models/workshop_booking'

export default class StatsController {
	async index({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		// Total orders
		const totalOrders = await Order.query()
			.where('patissierId', profile.id)
			.count('* as total')
			.first()

		// Revenue (sum of total for paid orders)
		const revenue = await Order.query()
			.where('patissierId', profile.id)
			.where('paymentStatus', 'paid')
			.sum('total as total')
			.first()

		// Orders by status
		const pendingOrders = await Order.query()
			.where('patissierId', profile.id)
			.where('status', 'pending')
			.count('* as total')
			.first()

		const confirmedOrders = await Order.query()
			.where('patissierId', profile.id)
			.where('status', 'confirmed')
			.count('* as total')
			.first()

		const inProgressOrders = await Order.query()
			.where('patissierId', profile.id)
			.where('status', 'in_progress')
			.count('* as total')
			.first()

		// Total workshops
		const totalWorkshops = await Workshop.query()
			.where('patissierId', profile.id)
			.count('* as total')
			.first()

		// Published workshops
		const publishedWorkshops = await Workshop.query()
			.where('patissierId', profile.id)
			.where('status', 'published')
			.count('* as total')
			.first()

		// Total bookings (across all workshops)
		const workshopIds = await Workshop.query()
			.where('patissierId', profile.id)
			.select('id')

		let totalBookings = 0
		let confirmedBookings = 0

		if (workshopIds.length > 0) {
			const ids = workshopIds.map((w) => w.id)

			const totalBookingsResult = await WorkshopBooking.query()
				.whereIn('workshopId', ids)
				.count('* as total')
				.first()
			totalBookings = Number((totalBookingsResult as any)?.$extras?.total ?? 0)

			const confirmedBookingsResult = await WorkshopBooking.query()
				.whereIn('workshopId', ids)
				.where('status', 'confirmed')
				.count('* as total')
				.first()
			confirmedBookings = Number((confirmedBookingsResult as any)?.$extras?.total ?? 0)
		}

		return response.ok({
			success: true,
			data: {
				orders: {
					total: Number((totalOrders as any)?.$extras?.total ?? 0),
					pending: Number((pendingOrders as any)?.$extras?.total ?? 0),
					confirmed: Number((confirmedOrders as any)?.$extras?.total ?? 0),
					inProgress: Number((inProgressOrders as any)?.$extras?.total ?? 0),
				},
				revenue: {
					total: Number((revenue as any)?.$extras?.total ?? 0),
				},
				workshops: {
					total: Number((totalWorkshops as any)?.$extras?.total ?? 0),
					published: Number((publishedWorkshops as any)?.$extras?.total ?? 0),
				},
				bookings: {
					total: totalBookings,
					confirmed: confirmedBookings,
				},
			},
		})
	}
}
