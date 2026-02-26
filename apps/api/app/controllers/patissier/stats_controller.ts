import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import Workshop from '#models/workshop'
import db from '@adonisjs/lucid/services/db'

export default class StatsController {
	async index({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		// Use raw queries via db for reliable aggregate results
		const ordersStats = await db
			.from('orders')
			.where('patissier_id', profile.id)
			.select(
				db.raw("count(*) filter (where status != 'cancelled')::int as total"),
				db.raw("count(*) filter (where status = 'pending')::int as pending"),
				db.raw("count(*) filter (where status = 'confirmed')::int as confirmed"),
				db.raw("count(*) filter (where status = 'in_progress')::int as in_progress")
			)
			.first()

		const revenueResult = await db
			.from('orders')
			.where('patissier_id', profile.id)
			.where('payment_status', 'paid')
			.select(db.raw('coalesce(sum(total), 0)::float as total'))
			.first()

		const workshopsStats = await db
			.from('workshops')
			.where('patissier_id', profile.id)
			.select(
				db.raw('count(*)::int as total'),
				db.raw("count(*) filter (where status = 'published')::int as published")
			)
			.first()

		// Bookings
		const workshopIds = await Workshop.query()
			.where('patissierId', profile.id)
			.select('id')

		let totalBookings = 0
		let confirmedBookings = 0

		if (workshopIds.length > 0) {
			const ids = workshopIds.map((w) => w.id)
			const bookingsStats = await db
				.from('workshop_bookings')
				.whereIn('workshop_id', ids)
				.select(
					db.raw('count(*)::int as total'),
					db.raw("count(*) filter (where status = 'confirmed')::int as confirmed")
				)
				.first()
			totalBookings = bookingsStats?.total ?? 0
			confirmedBookings = bookingsStats?.confirmed ?? 0
		}

		return response.ok({
			success: true,
			data: {
				orders: {
					total: ordersStats?.total ?? 0,
					pending: ordersStats?.pending ?? 0,
					confirmed: ordersStats?.confirmed ?? 0,
					inProgress: ordersStats?.in_progress ?? 0,
				},
				revenue: {
					total: revenueResult?.total ?? 0,
				},
				workshops: {
					total: workshopsStats?.total ?? 0,
					published: workshopsStats?.published ?? 0,
				},
				bookings: {
					total: totalBookings,
					confirmed: confirmedBookings,
				},
			},
		})
	}
}
