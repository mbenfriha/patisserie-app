import { defineConfig, stores } from '@adonisjs/session'
import env from '#start/env'

const sessionConfig = defineConfig({
	enabled: true,
	cookieName: 'patisserie_session',
	clearWithBrowser: false,
	age: '2h',
	cookie: {
		path: '/',
		httpOnly: true,
		secure: env.get('NODE_ENV') === 'production',
		sameSite: 'lax',
	},
	store: env.get('SESSION_DRIVER', 'cookie'),
	stores: {
		cookie: stores.cookie(),
	},
})

export default sessionConfig

declare module '@adonisjs/session/types' {
	interface SessionStoresList {
		cookie: ReturnType<(typeof stores)['cookie']>
	}
}
