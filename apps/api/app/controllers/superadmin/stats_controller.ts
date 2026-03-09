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
				Order.query().whereNull('deletedAt').count('* as total'),
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
		// Aggregate subscription revenue from the subscriptions table
		const subscriptions = await Subscription.query()
			.where('status', 'active')
			.select('plan', 'billingInterval', 'createdAt')

		const planPrices: Record<string, number> = {
			pro: 30,
			premium: 50,
		}

		// Calculate total MRR (monthly recurring revenue)
		let mrr = 0
		for (const sub of subscriptions) {
			const price = planPrices[sub.plan] ?? 0
			mrr += sub.billingInterval === 'yearly' ? (price * 12) / 12 : price
		}

		// Monthly revenue over last 12 months based on subscription creation dates
		const months: { month: string; revenue: number }[] = []
		const now = new Date()
		for (let i = 11; i >= 0; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
			const monthStr = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

			// Count active subscriptions that existed in this month
			let monthRevenue = 0
			for (const sub of subscriptions) {
				const createdMonth = `${sub.createdAt.year}-${String(sub.createdAt.month).padStart(2, '0')}`
				if (createdMonth <= monthKey) {
					monthRevenue += planPrices[sub.plan] ?? 0
				}
			}
			months.push({ month: monthStr, revenue: monthRevenue })
		}

		return response.ok({
			success: true,
			data: {
				totalRevenue: mrr,
				monthlyRevenue: months,
			},
		})
	}

	async userGrowth({ response }: HttpContext) {
		const totalResult = await User.query().count('* as total')
		const totalUsers = Number(totalResult[0].$extras.total) || 0

		// Registrations per month over last 12 months
		const users = await User.query().select('createdAt').orderBy('createdAt', 'asc')

		const months: { month: string; users: number }[] = []
		const now = new Date()
		for (let i = 11; i >= 0; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
			const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
			const monthStr = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })

			const count = users.filter((u) => {
				const created = u.createdAt.toJSDate()
				return created >= date && created < nextDate
			}).length

			months.push({ month: monthStr, users: count })
		}

		return response.ok({
			success: true,
			data: {
				totalUsers,
				monthlyGrowth: months,
			},
		})
	}
}
