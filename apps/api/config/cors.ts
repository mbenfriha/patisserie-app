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
		// Allow localhost in dev
		if (origin.startsWith('http://localhost:')) return true
		// Allow custom domains (premium patissiers) — safe because auth uses
		// Bearer tokens in Authorization header, not cookies, so CSRF is not a risk
		if (origin.startsWith('https://')) return true
		return false
	},
	methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
	headers: true,
	exposeHeaders: [],
	credentials: true,
	maxAge: 90,
})

export default corsConfig
