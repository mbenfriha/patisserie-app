import Notification from '#models/notification'
import transmit from '@adonisjs/transmit/services/main'

export default class NotificationService {
	/**
	 * Create a new notification for a user.
	 *
	 * @param userId - The user to notify
	 * @param type - Notification type (e.g. 'order_status', 'new_booking', 'new_order', 'payment_received')
	 * @param title - Short notification title
	 * @param message - Optional longer message
	 * @param data - Optional JSON metadata
	 * @param actionUrl - Optional URL to navigate to when the notification is clicked
	 */
	async create(
		userId: string,
		type: string,
		title: string,
		message?: string | null,
		data?: Record<string, unknown> | null,
		actionUrl?: string | null
	): Promise<Notification> {
		const notification = await Notification.create({
			userId,
			type,
			title,
			message: message || null,
			data: data || null,
			actionUrl: actionUrl || null,
		})

		// Broadcast via SSE to the user's channel
		transmit.broadcast(`users/${userId}/notifications`, {
			id: notification.id,
			type: notification.type,
			title: notification.title,
			message: notification.message,
			data: notification.data as any,
			actionUrl: notification.actionUrl,
			createdAt: notification.createdAt.toISO(),
		} as any)

		return notification
	}

	/**
	 * Mark a notification as read.
	 *
	 * @param id - The notification ID
	 * @param userId - The owner user ID (for authorization)
	 */
	async markAsRead(id: string, userId: string): Promise<Notification | null> {
		const notification = await Notification.query()
			.where('id', id)
			.where('userId', userId)
			.first()

		if (!notification) {
			return null
		}

		const { DateTime } = await import('luxon')
		notification.readAt = DateTime.now()
		await notification.save()

		return notification
	}

	/**
	 * Mark all notifications as read for a user.
	 *
	 * @param userId - The user ID
	 */
	async markAllAsRead(userId: string): Promise<void> {
		const { DateTime } = await import('luxon')

		await Notification.query()
			.where('userId', userId)
			.whereNull('readAt')
			.update({ readAt: DateTime.now().toSQL() })
	}

	/**
	 * Get all unread notifications for a user.
	 *
	 * @param userId - The user ID
	 */
	async getUnread(userId: string): Promise<Notification[]> {
		return Notification.query()
			.where('userId', userId)
			.whereNull('readAt')
			.orderBy('createdAt', 'desc')
	}

	/**
	 * Get all notifications for a user (paginated).
	 *
	 * @param userId - The user ID
	 * @param page - Page number
	 * @param limit - Items per page
	 */
	async getAll(userId: string, page: number = 1, limit: number = 20) {
		return Notification.query()
			.where('userId', userId)
			.orderBy('createdAt', 'desc')
			.paginate(page, limit)
	}

	/**
	 * Get the count of unread notifications for a user.
	 *
	 * @param userId - The user ID
	 */
	async getUnreadCount(userId: string): Promise<number> {
		const result = await Notification.query()
			.where('userId', userId)
			.whereNull('readAt')
			.count('* as total')
			.first()

		return Number(result?.$extras.total || 0)
	}
}
