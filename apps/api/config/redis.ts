import { defineConfig } from '@adonisjs/redis'
import env from '#start/env'

const host = env.get('REDIS_HOST')

const redisConfig = defineConfig({
	connection: 'main',
	connections: {
		main: {
			host,
			port: env.get('REDIS_PORT'),
			password: env.get('REDIS_PASSWORD') || undefined,
			db: 0,
			keyPrefix: 'patisserie:',
			tls: host?.includes('upstash.io') ? {} : undefined,
		},
	},
})

export default redisConfig
