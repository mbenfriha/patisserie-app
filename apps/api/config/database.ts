import { defineConfig } from '@adonisjs/lucid'
import pg from 'pg'
import env from '#start/env'

// Prevent pg from parsing DATE columns into JavaScript Date objects.
// This avoids timezone shifts (e.g. "2026-03-12" becoming "2026-03-11T23:00:00.000Z").
pg.types.setTypeParser(1082, (val: string) => val)

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
