import { BaseMail } from '@adonisjs/mail'
import { render } from '@react-email/components'
import env from '#start/env'
import ForgotPasswordTemplate from '#templates/forgot-password'

export default class ForgotPassword extends BaseMail {
	public subject: string

	constructor(
		private email: string,
		private fullName: string | null,
		private resetUrl: string
	) {
		super()
		this.subject = `Réinitialiser votre mot de passe - ${env.get('APP_NAME')}`
		this.message.from(env.get('MAIL_FROM', 'noreply@patissio.com'), env.get('APP_NAME'))
		this.message.to(this.email)
	}

	async prepare() {
		this.message.html(
			await render(
				ForgotPasswordTemplate({
					fullName: this.fullName,
					resetUrl: this.resetUrl,
				})
			)
		)
	}
}
