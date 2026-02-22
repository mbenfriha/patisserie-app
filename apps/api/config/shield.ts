import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
	csp: {
		enabled: false,
	},
	csrf: {
		enabled: false,
	},
	hsts: {
		enabled: true,
		maxAge: '180 days',
		includeSubDomains: true,
	},
	contentTypeSniffing: {
		enabled: true,
	},
})

export default shieldConfig
