import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/components'
import env from '#start/env'
import BookingCancellationTemplate from '#templates/booking-cancellation'

export default class BookingCancellation extends BaseMail {
	public subject: string

	constructor(
		private email: string,
		private data: {
			patissierName: string
			clientName: string
			workshopTitle: string
			date: string
			nbParticipants: number
			reason: string | null
		}
	) {
		super()
		this.subject = `Annulation de réservation : ${data.workshopTitle} - ${env.get('APP_NAME')}`
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

	async prepare() {
		this.message.html(
			await render(
				BookingCancellationTemplate({
					patissierName: this.data.patissierName,
					clientName: this.data.clientName,
					workshopTitle: this.data.workshopTitle,
					date: this.formatDate(this.data.date),
					nbParticipants: this.data.nbParticipants,
					reason: this.data.reason,
				})
			)
		)
	}
}
