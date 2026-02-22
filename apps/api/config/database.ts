import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

const dbConfig = defineConfig({
	connection: 'postgres',
	connections: {
		postgres: {
			client: 'pg',
			connection: {
				connectionString: env.get('DATABASE_URL'),
			},
			migrations: {
				naturalSort: true,
				paths: ['database/migrations'],
			},
			debug: env.get('NODE_ENV') === 'development',
		},
	},
})

export default dbConfig
