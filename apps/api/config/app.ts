import { defineConfig } from '@adonisjs/core/http'
import env from '#start/env'

export const appKey = env.get('APP_KEY')

export const http = defineConfig({
	generateRequestId: true,
	allowMethodSpoofing: false,
	useAsyncLocalStorage: true,
	cookie: {
		domain: '',
		path: '/',
		maxAge: '2h',
		httpOnly: true,
		secure: env.get('NODE_ENV') === 'production',
		sameSite: 'lax',
	},
})
