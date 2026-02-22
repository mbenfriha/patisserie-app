import { defineConfig, transports } from '@adonisjs/mail'
import env from '#start/env'

const mailConfig = defineConfig({
	default: env.get('MAIL_MAILER', 'smtp') as 'smtp' | 'resend',
	mailers: {
		smtp: transports.smtp({
			host: env.get('MAIL_HOST') || 'localhost',
			port: env.get('MAIL_PORT') || 1025,
		}),
		resend: transports.resend({
			key: env.get('RESEND_API_KEY') || '',
			baseUrl: 'https://api.resend.com',
		}),
	},
	from: {
		address: env.get('MAIL_FROM'),
		name: env.get('APP_NAME'),
	},
})

export default mailConfig
