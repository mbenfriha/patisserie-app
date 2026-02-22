import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
	commands: [
		() => import('@adonisjs/core/commands'),
		() => import('@adonisjs/lucid/commands'),
		() => import('@adonisjs/mail/commands'),
	],
	providers: [
		() => import('@adonisjs/core/providers/app_provider'),
		() => import('@adonisjs/core/providers/hash_provider'),
		() => import('@adonisjs/core/providers/vinejs_provider'),
		() => import('@adonisjs/core/providers/repl_provider'),
		() => import('@adonisjs/cors/cors_provider'),
		() => import('@adonisjs/session/session_provider'),
		() => import('@adonisjs/shield/shield_provider'),
		() => import('@adonisjs/lucid/database_provider'),
		() => import('@adonisjs/auth/auth_provider'),
		() => import('@adonisjs/mail/mail_provider'),
		() => import('@adonisjs/redis/redis_provider'),
		() => import('@adonisjs/drive/drive_provider'),
		() => import('@adonisjs/limiter/limiter_provider'),
		() => import('@adonisjs/bouncer/bouncer_provider'),
		() => import('@adonisjs/transmit/transmit_provider'),
	],
	preloads: [
		() => import('#start/routes'),
		() => import('#start/kernel'),
	],
	metaFiles: [
		{
			pattern: 'resources/templates/**/*.{ts,tsx,js}',
			reloadServer: false,
		},
	],
	assetsBundler: false,
	tests: {
		suites: [
			{
				files: ['tests/unit/**/*.spec.ts'],
				name: 'unit',
				timeout: 60000,
			},
			{
				files: ['tests/functional/**/*.spec.ts'],
				name: 'functional',
				timeout: 60000,
			},
		],
		forceExit: true,
	},
})
