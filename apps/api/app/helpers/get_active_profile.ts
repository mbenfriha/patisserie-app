import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'

/**
 * Returns the active patissier profile for the current request.
 * If a superadmin is in support mode (X-Support-Slug header),
 * returns the target profile. Otherwise, returns the auth user's profile.
 */
export async function getActiveProfile(ctx: HttpContext): Promise<PatissierProfile> {
	const supportProfile = (ctx as any).supportProfile as PatissierProfile | undefined
	if (supportProfile) return supportProfile
	return PatissierProfile.findByOrFail('userId', ctx.auth.user!.id)
}
