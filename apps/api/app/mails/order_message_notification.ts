import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/components'
import env from '#start/env'
import OrderMessageNotificationTemplate from '#templates/order-message-notification'

export default class OrderMessageNotification extends BaseMail {
	public subject: string

	constructor(
		private email: string,
		private data: {
			recipientName: string
			senderName: string
			orderNumber: string
			messagePreview: string
		}
	) {
		super()
		this.subject = `Nouveau message – Commande ${data.orderNumber} - ${env.get('APP_NAME')}`
		this.message.from(env.get('MAIL_FROM', 'noreply@patissio.com'), env.get('APP_NAME'))
		this.message.to(this.email)
	}

	async prepare() {
		this.message.html(
			await render(
				OrderMessageNotificationTemplate({
					recipientName: this.data.recipientName,
					senderName: this.data.senderName,
					orderNumber: this.data.orderNumber,
					messagePreview: this.data.messagePreview,
				})
			)
		)
	}
}
