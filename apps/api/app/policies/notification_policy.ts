import { BasePolicy } from '@adonisjs/bouncer'
import type Notification from '#models/notification'
import type User from '#models/user'

export default class NotificationPolicy extends BasePolicy {
	view(user: User, notification: Notification) {
		return notification.userId === user.id
	}

	update(user: User, notification: Notification) {
		return notification.userId === user.id
	}
}
