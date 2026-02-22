import type { Authenticators } from '@adonisjs/auth/types'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class GuestMiddleware {
	async handle(
		ctx: HttpContext,
		next: NextFn,
		options: { guards?: (keyof Authenticators)[] } = {}
	) {
		for (const guard of options.guards || ['api']) {
			if (await ctx.auth.use(guard).check()) {
				return ctx.response.badRequest({
					success: false,
					message: 'Already authenticated',
				})
			}
		}
		return next()
	}
}
