import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/components'
import env from '#start/env'
import BookingConfirmationTemplate from '#templates/booking-confirmation'

export default class BookingConfirmation extends BaseMail {
	public subject: string

	constructor(
		private email: string,
		private data: {
			clientName: string
			workshopTitle: string
			patissierName: string
			date: string
			startTime: string
			nbParticipants: number
			totalPrice: number
			depositAmount: number
		}
	) {
		super()
		this.subject = `Réservation confirmée : ${data.workshopTitle} - ${env.get('APP_NAME')}`
		this.message.from(env.get('MAIL_FROM', 'noreply@patissio.com'), env.get('APP_NAME'))
		this.message.to(this.email)
	}

	private formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		})
	}

	private formatTime(time: string): string {
		const parts = String(time).split(':')
		return `${parts[0]}h${parts[1]}`
	}

	async prepare() {
		const remaining = this.data.totalPrice - this.data.depositAmount

		this.message.html(
			await render(
				BookingConfirmationTemplate({
					clientName: this.data.clientName,
					workshopTitle: this.data.workshopTitle,
					patissierName: this.data.patissierName,
					date: this.formatDate(this.data.date),
					startTime: this.formatTime(this.data.startTime),
					nbParticipants: this.data.nbParticipants,
					totalPrice: `${this.data.totalPrice.toFixed(2)} €`,
					depositAmount: `${this.data.depositAmount.toFixed(2)} €`,
					remainingAmount: `${remaining.toFixed(2)} €`,
				})
			)
		)
	}
}
