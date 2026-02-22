import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/components'
import env from '#start/env'
import NewBookingNotificationTemplate from '#templates/new-booking-notification'

export default class NewBookingNotification extends BaseMail {
	public subject: string

	constructor(
		private email: string,
		private data: {
			patissierName: string
			clientName: string
			clientEmail: string
			workshopTitle: string
			date: string
			startTime: string
			nbParticipants: number
			depositAmount: number
		}
	) {
		super()
		this.subject = `Nouvelle réservation : ${data.workshopTitle} - ${env.get('APP_NAME')}`
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
		this.message.html(
			await render(
				NewBookingNotificationTemplate({
					patissierName: this.data.patissierName,
					clientName: this.data.clientName,
					clientEmail: this.data.clientEmail,
					workshopTitle: this.data.workshopTitle,
					date: this.formatDate(this.data.date),
					startTime: this.formatTime(this.data.startTime),
					nbParticipants: this.data.nbParticipants,
					depositAmount: `${this.data.depositAmount.toFixed(2)} €`,
				})
			)
		)
	}
}
