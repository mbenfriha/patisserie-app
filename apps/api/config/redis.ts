import { defineConfig } from '@adonisjs/redis'
import { InferConnections } from '@adonisjs/redis/types'
import env from '#start/env'

const host = env.get('REDIS_HOST')
const port = env.get('REDIS_PORT')
const password = env.get('REDIS_PASSWORD') || undefined
const useTls = env.get('REDIS_TLS', host?.includes('upstash.io') ? 'true' : 'false') === 'true'

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
			retryStrategy(times) {
				return times > 10 ? null : Math.min(times * 200, 2000)
			},
			maxRetriesPerRequest: 3,
		},
	},
})

export default redisConfig

declare module '@adonisjs/redis/types' {
	export interface RedisConnections extends InferConnections<typeof redisConfig> {}
}
