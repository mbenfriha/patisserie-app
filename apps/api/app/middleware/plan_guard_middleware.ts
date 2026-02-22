import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import PatissierProfile from '#models/patissier_profile'

const PLAN_LEVELS: Record<string, number> = {
	starter: 1,
	pro: 2,
	premium: 3,
}

export default class PlanGuardMiddleware {
	async handle(
		ctx: HttpContext,
		next: NextFn,
		options: { minPlan: 'starter' | 'pro' | 'premium' }
	) {
		const user = ctx.auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)
		const userLevel = PLAN_LEVELS[profile.plan] || 0
		const requiredLevel = PLAN_LEVELS[options.minPlan] || 0

		if (userLevel < requiredLevel) {
			return ctx.response.forbidden({
				success: false,
				message: `This feature requires the ${options.minPlan} plan or higher`,
				requiredPlan: options.minPlan,
				currentPlan: profile.plan,
			})
		}

		return next()
	}
}
