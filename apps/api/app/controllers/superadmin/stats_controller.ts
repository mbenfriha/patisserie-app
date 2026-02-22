import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import PatissierProfile from '#models/patissier_profile'
import Subscription from '#models/subscription'
import User from '#models/user'
import Workshop from '#models/workshop'

export default class StatsController {
	async dashboard({ response }: HttpContext) {
		const [usersResult, patissiersResult, ordersResult, workshopsResult, subscriptionsResult] =
			await Promise.all([
				User.query().count('* as total'),
				PatissierProfile.query().count('* as total'),
				Order.query().count('* as total'),
				Workshop.query().count('* as total'),
				Subscription.query().where('status', 'active').count('* as total'),
			])

		return response.ok({
			success: true,
			data: {
				users: Number(usersResult[0].$extras.total) || 0,
				patissiers: Number(patissiersResult[0].$extras.total) || 0,
				orders: Number(ordersResult[0].$extras.total) || 0,
				workshops: Number(workshopsResult[0].$extras.total) || 0,
				activeSubscriptions: Number(subscriptionsResult[0].$extras.total) || 0,
			},
		})
	}

	async revenue({ response }: HttpContext) {
		// TODO: Implement revenue aggregation from Stripe or local records
		return response.ok({
			success: true,
			data: {
				totalRevenue: 0,
				monthlyRevenue: 0,
				message: 'Revenue tracking not yet implemented',
			},
		})
	}

	async userGrowth({ response }: HttpContext) {
		// TODO: Implement user growth over time (e.g., registrations per month)
		return response.ok({
			success: true,
			data: {
				growth: [],
				message: 'User growth tracking not yet implemented',
			},
		})
	}
}
