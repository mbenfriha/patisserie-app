import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/components'
import env from '#start/env'
import PaymentConfirmationTemplate from '#templates/payment-confirmation'

export default class PaymentConfirmation extends BaseMail {
	public subject: string

	constructor(
		private email: string,
		private data: {
			clientName: string
			workshopTitle: string
			patissierName: string
			date: string
			startTime: string
			location: string | null
			durationMinutes: number
			nbParticipants: number
			amountPaid: number
			totalPrice: number
			remainingAmount: number
		}
	) {
		super()
		this.subject = `Paiement confirmé : ${data.workshopTitle} - ${env.get('APP_NAME')}`
		this.message.from(env.get('MAIL_FROM', 'noreply@patissio.com'), env.get('APP_NAME'))
		this.message.to(this.email)
	}

	private formatDuration(minutes: number): string {
		const hours = Math.floor(minutes / 60)
		const mins = minutes % 60
		if (hours > 0) return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`
		return `${mins} min`
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
		const isFullPayment = this.data.remainingAmount <= 0

		this.message.html(
			await render(
				PaymentConfirmationTemplate({
					clientName: this.data.clientName,
					workshopTitle: this.data.workshopTitle,
					patissierName: this.data.patissierName,
					date: this.formatDate(this.data.date),
					startTime: this.formatTime(this.data.startTime),
					location: this.data.location,
					durationLabel: this.formatDuration(this.data.durationMinutes),
					nbParticipants: this.data.nbParticipants,
					amountPaid: `${this.data.amountPaid.toFixed(2)} €`,
					totalPrice: `${this.data.totalPrice.toFixed(2)} €`,
					remainingAmount: `${this.data.remainingAmount.toFixed(2)} €`,
					isFullPayment,
				})
			)
		)
	}
}
