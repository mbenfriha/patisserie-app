import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import PatissierProfile from '#models/patissier_profile'

export default class TenantResolverMiddleware {
	async handle(ctx: HttpContext, next: NextFn) {
		const slug = ctx.params.slug

		if (!slug) {
			return ctx.response.badRequest({
				success: false,
				message: 'Missing patissier slug',
			})
		}

		const profile = await PatissierProfile.findBy('slug', slug)

		if (!profile) {
			return ctx.response.notFound({
				success: false,
				message: 'Patissier not found',
			})
		}

		// Attach to request context
		ctx.patissierProfile = profile

		return next()
	}
}

declare module '@adonisjs/core/http' {
	export interface HttpContext {
		patissierProfile: PatissierProfile
	}
}
