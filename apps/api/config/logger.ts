import { defineConfig, targets } from '@adonisjs/core/logger'
import env from '#start/env'

const loggerConfig = defineConfig({
	default: 'app',
	loggers: {
		app: {
			enabled: true,
			name: env.get('APP_NAME', 'patissio'),
			level: env.get('LOG_LEVEL', 'info'),
			transport: {
				targets: targets()
					.pushIf(env.get('NODE_ENV') === 'development', targets.pretty())
					.pushIf(env.get('NODE_ENV') === 'production', targets.file())
					.toArray(),
			},
		},
	},
})

export default loggerConfig

declare module '@adonisjs/core/types' {
	interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
