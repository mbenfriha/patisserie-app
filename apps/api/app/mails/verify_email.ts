import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/components'
import env from '#start/env'
import VerifyEmailTemplate from '#templates/verify-email'

export default class VerifyEmail extends BaseMail {
	public subject: string

	constructor(
		private email: string,
		private fullName: string | null,
		private verificationUrl: string
	) {
		super()
		this.subject = `Vérifiez votre adresse email - ${env.get('APP_NAME')}`
		this.message.from(env.get('MAIL_FROM', 'noreply@patissio.com'), env.get('APP_NAME'))
		this.message.to(this.email)
	}

	async prepare() {
		this.message.html(
			await render(
				VerifyEmailTemplate({
					fullName: this.fullName,
					verificationUrl: this.verificationUrl,
				})
			)
		)
	}
}
