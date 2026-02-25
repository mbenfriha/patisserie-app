import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import PatissierProfile from '#models/patissier_profile'

/**
 * Allowed routes for superadmin support mode.
 * Only site editing endpoints - no access to orders, workshops, financials, etc.
 */
const SUPPORT_ALLOWED_ROUTES: Array<{ method: string; pattern: RegExp }> = [
	{ method: 'PATCH', pattern: /^\/patissier\/profile$/ },
	{ method: 'PUT', pattern: /^\/patissier\/site$/ },
	{ method: 'PUT', pattern: /^\/patissier\/site-design$/ },
	{ method: 'POST', pattern: /^\/patissier\/hero-image$/ },
	{ method: 'POST', pattern: /^\/patissier\/story-image$/ },
	{ method: 'POST', pattern: /^\/patissier\/logo$/ },
	{ method: 'POST', pattern: /^\/patissier\/page-hero\/.+$/ },
	{ method: 'GET', pattern: /^\/patissier\/profile$/ },
]

export default class PatissierMiddleware {
	async handle(ctx: HttpContext, next: NextFn) {
		const user = ctx.auth.user!

		if (user.role === 'patissier') {
			return next()
		}

		// Allow superadmin in support mode via X-Support-Slug header
		if (user.role === 'superadmin') {
			const supportSlug = ctx.request.header('x-support-slug')
			if (supportSlug) {
				// Check route is allowed in support mode
				const method = ctx.request.method()
				const url = ctx.request.url()
				const isAllowed = SUPPORT_ALLOWED_ROUTES.some(
					(route) => route.method === method && route.pattern.test(url)
				)

				if (!isAllowed) {
					return ctx.response.forbidden({
						success: false,
						message: 'This endpoint is not available in support mode',
					})
				}

				const profile = await PatissierProfile.findBy('slug', supportSlug)
				if (profile && profile.allowSupportAccess) {
					;(ctx as any).supportProfile = profile
					return next()
				}
			}
		}

		return ctx.response.forbidden({
			success: false,
			message: 'Access restricted to patissiers',
		})
	}
}
