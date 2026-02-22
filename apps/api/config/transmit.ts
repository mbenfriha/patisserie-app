import { defineConfig } from '@adonisjs/transmit'
import { redis } from '@adonisjs/transmit/transports'
import env from '#start/env'

const transmitConfig = defineConfig({
	pingInterval: '30s',
	transport: {
		driver: redis({
			host: env.get('REDIS_HOST'),
			port: env.get('REDIS_PORT'),
			password: env.get('REDIS_PASSWORD'),
			keyPrefix: 'patisserie:transmit',
		}),
	},
})

export default transmitConfig
