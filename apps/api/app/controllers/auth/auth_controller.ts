import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

export default class AuthController {
	async register({ request, response }: HttpContext) {
		const { email, password, fullName, role, slug, businessName } = request.only([
			'email',
			'password',
			'fullName',
			'role',
			'slug',
			'businessName',
		])

		const existingUser = await User.findBy('email', email)
		if (existingUser) {
			return response.conflict({ success: false, message: 'Email already taken' })
		}

		const user = await User.create({
			email,
			password,
			fullName,
			role: role || 'patissier',
		})

		// Create patissier profile if role is patissier
		if (user.role === 'patissier') {
			if (!slug || !businessName) {
				return response.badRequest({
					success: false,
					message: 'slug and businessName are required for patissier registration',
				})
			}

			const existingSlug = await PatissierProfile.findBy('slug', slug)
			if (existingSlug) {
				return response.conflict({ success: false, message: 'Slug already taken' })
			}

			await PatissierProfile.create({
				userId: user.id,
				slug,
				businessName,
			})
		}

		const token = await User.accessTokens.create(user)

		return response.created({
			success: true,
			user: user.serialize(),
			token: token.value!.release(),
		})
	}

	async login({ request, response }: HttpContext) {
		const { email, password } = request.only(['email', 'password'])

		const user = await User.verifyCredentials(email, password)

		if (user.suspendedAt) {
			return response.forbidden({
				success: false,
				message: 'Account suspended',
				reason: user.suspendReason,
			})
		}

		const token = await User.accessTokens.create(user)

		return response.ok({
			success: true,
			user: user.serialize(),
			token: token.value!.release(),
		})
	}

	async logout({ auth, response }: HttpContext) {
		const user = auth.user!
		await User.accessTokens.delete(user, user.currentAccessToken.identifier)
		return response.ok({ success: true, message: 'Logged out' })
	}

	async me({ auth, response }: HttpContext) {
		const user = auth.user!

		if (user.role === 'patissier') {
			await user.load('patissierProfile')
		}

		return response.ok({
			success: true,
			user: {
				...user.serialize(),
				profile: user.role === 'patissier' ? user.patissierProfile?.serialize() : undefined,
			},
		})
	}
}
