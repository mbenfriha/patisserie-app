import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'

const corsConfig = defineConfig({
	enabled: true,
	origin: (origin: string) => {
		// Known platform origins
		const allowed = [
			env.get('FRONTEND_URL', 'http://localhost:3000'),
			env.get('SUPERADMIN_URL', 'http://localhost:3002'),
			'https://patissio.com',
			'https://www.patissio.com',
			'https://admin.patissio.com',
		]
		if (allowed.includes(origin)) return true
		// Allow *.patissio.com subdomains (patissier sites)
		if (origin.endsWith('.patissio.com')) return true
		// Staging domain
		const appDomain = env.get('APP_DOMAIN' as 'FRONTEND_URL', '')
		if (appDomain && origin.endsWith(appDomain)) return true
		// Allow localhost in dev
		if (origin.startsWith('http://localhost:')) return true
		// Allow custom domains (premium patissiers) only if HTTPS
		// Verified at runtime by checking DB — but for CORS preflight we accept
		// any HTTPS origin since auth uses Bearer tokens (not cookies), preventing CSRF
		if (origin.startsWith('https://')) return true
		return false
	},
	methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
	headers: true,
	exposeHeaders: [],
	credentials: false,
	maxAge: 90,
})

export default corsConfig
