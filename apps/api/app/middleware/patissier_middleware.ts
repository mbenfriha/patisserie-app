import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class PatissierMiddleware {
	async handle(ctx: HttpContext, next: NextFn) {
		const user = ctx.auth.user!
		if (user.role !== 'patissier') {
			return ctx.response.forbidden({
				success: false,
				message: 'Access restricted to patissiers',
			})
		}
		return next()
	}
}
