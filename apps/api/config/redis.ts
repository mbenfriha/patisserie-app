import { defineConfig } from '@adonisjs/redis'
import env from '#start/env'

const host = env.get('REDIS_HOST')
const port = env.get('REDIS_PORT')
const password = env.get('REDIS_PASSWORD') || undefined
const useTls = env.get('REDIS_TLS', host?.includes('upstash.io') ? 'true' : 'false') === 'true'

console.log(`[Redis] Connecting to ${host}:${port} (TLS: ${useTls})`)

const redisConfig = defineConfig({
	connection: 'main',
	connections: {
		main: {
			host,
			port,
			password,
			db: 0,
			keyPrefix: 'patisserie:',
			family: 4,
			tls: useTls ? {} : undefined,
		},
	},
})

export default redisConfig
