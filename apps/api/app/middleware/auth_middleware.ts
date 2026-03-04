import type { Authenticators } from '@adonisjs/auth/types'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthMiddleware {
	redirectTo = '/login'

	async handle(
		ctx: HttpContext,
		next: NextFn,
		options: { guards?: (keyof Authenticators)[] } = {}
	) {
		await ctx.auth.authenticateUsing(options.guards || ['api'])

		// Block suspended users even if they have a valid token
		if (ctx.auth.user?.suspendedAt) {
			return ctx.response.forbidden({
				success: false,
				message: 'Account suspended',
			})
		}

		return next()
	}
}
