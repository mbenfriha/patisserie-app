import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/components'
import env from '#start/env'
import OrderConfirmationTemplate from '#templates/order-confirmation'

export default class OrderConfirmation extends BaseMail {
	public subject: string

	constructor(
		private email: string,
		private data: {
			clientName: string
			orderNumber: string
			patissierName: string
			total: number | null
			type: 'catalogue' | 'custom'
		}
	) {
		super()
		this.subject = `Commande ${data.orderNumber} confirmée - ${env.get('APP_NAME')}`
		this.message.from(env.get('MAIL_FROM', 'noreply@patissio.com'), env.get('APP_NAME'))
		this.message.to(this.email)
	}

	async prepare() {
		this.message.html(
			await render(
				OrderConfirmationTemplate({
					clientName: this.data.clientName,
					orderNumber: this.data.orderNumber,
					patissierName: this.data.patissierName,
					type: this.data.type,
					total: this.data.total ? `${this.data.total.toFixed(2)} €` : 'À confirmer',
				})
			)
		)
	}
}
