import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Notification from '#models/notification'

export default class NotificationsController {
	async index({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const page = request.input('page', 1)
		const limit = request.input('limit', 20)

		const notifications = await Notification.query()
			.where('userId', user.id)
			.orderBy('createdAt', 'desc')
			.paginate(page, limit)

		return response.ok({
			success: true,
			data: notifications.serialize(),
		})
	}

	async unreadCount({ auth, response }: HttpContext) {
		const user = auth.user!

		const result = await Notification.query()
			.where('userId', user.id)
			.whereNull('readAt')
			.count('* as total')

		const count = Number(result[0].$extras.total) || 0

		return response.ok({
			success: true,
			data: { count },
		})
	}

	async markRead({ auth, params, response }: HttpContext) {
		const user = auth.user!

		const notification = await Notification.query()
			.where('id', params.id)
			.where('userId', user.id)
			.first()

		if (!notification) {
			return response.notFound({ success: false, message: 'Notification not found' })
		}

		notification.readAt = DateTime.now()
		await notification.save()

		return response.ok({
			success: true,
			data: notification.serialize(),
		})
	}

	async markAllRead({ auth, response }: HttpContext) {
		const user = auth.user!

		await Notification.query()
			.where('userId', user.id)
			.whereNull('readAt')
			.update({ readAt: DateTime.now().toSQL() })

		return response.ok({
			success: true,
			message: 'All notifications marked as read',
		})
	}
}
