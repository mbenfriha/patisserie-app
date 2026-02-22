import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
	TZ: Env.schema.string(),
	PORT: Env.schema.number(),
	HOST: Env.schema.string({ format: 'host' }),
	LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),

	APP_KEY: Env.schema.string(),
	APP_NAME: Env.schema.string(),
	NODE_ENV: Env.schema.enum(['development', 'production', 'test']),
	API_PUBLIC_URL: Env.schema.string(),

	// Database
	DATABASE_URL: Env.schema.string(),

	// Redis
	REDIS_HOST: Env.schema.string({ format: 'host' }),
	REDIS_PORT: Env.schema.number(),
	REDIS_PASSWORD: Env.schema.string.optional(),

	// Session
	SESSION_DRIVER: Env.schema.enum(['cookie', 'redis'] as const),

	// Mail
	MAIL_MAILER: Env.schema.enum.optional(['smtp', 'resend'] as const),
	MAIL_HOST: Env.schema.string.optional(),
	MAIL_PORT: Env.schema.number.optional(),
	MAIL_FROM: Env.schema.string(),
	RESEND_API_KEY: Env.schema.string.optional(),

	// Storage (R2/MinIO)
	DRIVE_DISK: Env.schema.enum(['r2', 'r2_public'] as const),
	R2_KEY: Env.schema.string(),
	R2_SECRET: Env.schema.string(),
	R2_REGION: Env.schema.string.optional(),
	R2_BUCKET: Env.schema.string(),
	R2_PUBLIC_BUCKET: Env.schema.string.optional(),
	R2_ENDPOINT: Env.schema.string(),
	R2_PUBLIC_URL: Env.schema.string.optional(),

	// Stripe
	STRIPE_SECRET_KEY: Env.schema.string.optional(),
	STRIPE_WEBHOOK_SECRET: Env.schema.string.optional(),
	STRIPE_PRICE_PRO_MONTHLY: Env.schema.string.optional(),
	STRIPE_PRICE_PRO_YEARLY: Env.schema.string.optional(),
	STRIPE_PRICE_PREMIUM_MONTHLY: Env.schema.string.optional(),
	STRIPE_PRICE_PREMIUM_YEARLY: Env.schema.string.optional(),
	STRIPE_PLATFORM_FEE_PERCENT: Env.schema.number.optional(),

	// Frontend URLs
	FRONTEND_URL: Env.schema.string(),
	SUPERADMIN_URL: Env.schema.string.optional(),

	// Superadmin seeder
	SUPERADMIN_EMAIL: Env.schema.string.optional(),
	SUPERADMIN_PASSWORD: Env.schema.string.optional(),
})
