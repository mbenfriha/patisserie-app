import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SuperadminMiddleware {
	async handle(ctx: HttpContext, next: NextFn) {
		const user = ctx.auth.user!
		if (user.role !== 'superadmin') {
			return ctx.response.forbidden({
				success: false,
				message: 'Access restricted to superadmins',
			})
		}
		return next()
	}
}
