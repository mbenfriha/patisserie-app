import { Secret } from '@adonisjs/core/helpers'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'
import EmailService from '#services/email_service'
import env from '#start/env'
import {
	changePasswordValidator,
	forgotPasswordValidator,
	loginValidator,
	registerValidator,
	resetPasswordValidator,
} from '#validators/auth_validator'

export default class AuthController {
	private emailService = new EmailService()

	async register({ request, response }: HttpContext) {
		const { email, password, fullName, slug, businessName } =
			await request.validateUsing(registerValidator)

		const existingUser = await User.findBy('email', email)
		if (existingUser) {
			return response.conflict({ success: false, message: 'Email already taken' })
		}

		const user = await User.create({
			email,
			password,
			fullName,
			role: 'patissier',
		})

		// Create patissier profile if role is patissier
		if (user.role === 'patissier') {
			const existingSlug = await PatissierProfile.findBy('slug', slug)
			if (existingSlug) {
				return response.conflict({ success: false, message: 'Slug already taken' })
			}

			await PatissierProfile.create({
				userId: user.id,
				slug,
				businessName,
				plausibleSiteId: `${slug}.patissio.com`,
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
		const { email, password } = await request.validateUsing(loginValidator)

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

	async forgotPassword({ request, response }: HttpContext) {
		const { email } = await request.validateUsing(forgotPasswordValidator)

		const user = await User.findBy('email', email)

		// Always return success to prevent email enumeration
		if (user) {
			// Delete existing reset tokens
			const tokens = await User.accessTokens.all(user)
			await Promise.all(
				tokens.map(async (token) => {
					if (token.abilities.includes('reset_password')) {
						await User.accessTokens.delete(user, token.identifier)
					}
				})
			)

			// Generate reset token (expires in 1 hour)
			const resetToken = await User.accessTokens.create(user, ['reset_password'], {
				expiresIn: '1 hour',
			})

			const resetUrl = `${env.get('FRONTEND_URL')}/reset-password?token=${resetToken.value!.release()}`

			await this.emailService.sendForgotPasswordEmail({
				email: user.email,
				fullName: user.fullName,
				resetUrl,
			})
		}

		return response.ok({
			success: true,
			message: 'If an account with that email exists, a password reset link has been sent',
		})
	}

	async resetPassword({ request, response }: HttpContext) {
		const { token, password } = await request.validateUsing(resetPasswordValidator)

		let accessToken: Awaited<ReturnType<typeof User.accessTokens.verify>> | undefined
		try {
			accessToken = await User.accessTokens.verify(new Secret(token))
		} catch {
			return response.badRequest({
				success: false,
				message: 'Lien invalide ou expiré',
			})
		}

		if (!accessToken) {
			return response.badRequest({
				success: false,
				message: 'Lien invalide ou expiré',
			})
		}

		if (!accessToken.abilities.includes('reset_password')) {
			return response.badRequest({
				success: false,
				message: 'Lien invalide',
			})
		}

		const user = await User.find(accessToken.tokenableId)

		if (!user) {
			return response.badRequest({
				success: false,
				message: 'Utilisateur introuvable',
			})
		}

		user.password = password
		await user.save()

		// Revoke ALL tokens (reset token + any active sessions)
		const allTokens = await User.accessTokens.all(user)
		await Promise.all(allTokens.map((t) => User.accessTokens.delete(user, t.identifier)))

		return response.ok({
			success: true,
			message: 'Mot de passe réinitialisé avec succès',
		})
	}

	async changePassword({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const { currentPassword, newPassword } = await request.validateUsing(changePasswordValidator)

		// Verify current password
		if (!user.password) {
			return response.badRequest({
				success: false,
				message: 'Aucun mot de passe configuré',
			})
		}

		const isValid = await hash.verify(user.password, currentPassword)
		if (!isValid) {
			return response.badRequest({
				success: false,
				message: 'Mot de passe actuel incorrect',
			})
		}

		user.password = newPassword
		await user.save()

		// Revoke all existing tokens and issue a new one
		const allTokens = await User.accessTokens.all(user)
		await Promise.all(allTokens.map((t) => User.accessTokens.delete(user, t.identifier)))
		const newToken = await User.accessTokens.create(user)

		return response.ok({
			success: true,
			message: 'Mot de passe modifié avec succès',
			token: newToken.value!.release(),
		})
	}
}
