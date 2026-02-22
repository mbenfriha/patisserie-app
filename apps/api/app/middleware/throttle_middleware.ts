import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import limiter from '@adonisjs/limiter/services/main'

const LIMITS = {
	auth: { requests: 10, duration: '1 minute', blockDuration: '15 minutes' },
	authStrict: { requests: 5, duration: '1 minute', blockDuration: '30 minutes' },
	api: { requests: 100, duration: '1 minute', blockDuration: '1 minute' },
	publicSubmit: { requests: 10, duration: '1 minute', blockDuration: '5 minutes' },
	uploads: { requests: 20, duration: '1 hour', blockDuration: '30 minutes' },
	webhooks: { requests: 100, duration: '1 minute', blockDuration: '1 minute' },
	global: { requests: 1000, duration: '1 minute', blockDuration: '1 minute' },
} as const

type LimitType = keyof typeof LIMITS

function getClientKey(ctx: HttpContext): string {
	const forwardedFor = ctx.request.header('x-forwarded-for')
	const realIp = ctx.request.header('x-real-ip')
	const cfConnectingIp = ctx.request.header('cf-connecting-ip')
	const ip =
		cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim() || ctx.request.ip()
	return ip || 'unknown'
}

export function throttle(type: LimitType = 'global') {
	const config = LIMITS[type]

	return async (ctx: HttpContext, next: NextFn) => {
		const key = `${type}:${getClientKey(ctx)}`

		const rateLimiter = limiter.use({
			requests: config.requests,
			duration: config.duration,
			blockDuration: config.blockDuration,
		})

		try {
			const response = await rateLimiter.consume(key)
			ctx.response.header('X-RateLimit-Limit', String(config.requests))
			ctx.response.header('X-RateLimit-Remaining', String(response.remaining))
			ctx.response.header('X-RateLimit-Reset', String(Math.ceil(response.availableIn / 1000)))
			return next()
		} catch (error) {
			const retryAfter =
				error && typeof error === 'object' && 'response' in error
					? (error as { response?: { availableIn?: number } }).response?.availableIn || 60000
					: 60000

			ctx.response.header('X-RateLimit-Limit', String(config.requests))
			ctx.response.header('X-RateLimit-Remaining', '0')
			ctx.response.header('X-RateLimit-Reset', String(Math.ceil(retryAfter / 1000)))
			ctx.response.header('Retry-After', String(Math.ceil(retryAfter / 1000)))

			return ctx.response.tooManyRequests({
				success: false,
				message: 'Too many requests. Please try again later.',
				retryAfter: Math.ceil(retryAfter / 1000),
			})
		}
	}
}

export default throttle
