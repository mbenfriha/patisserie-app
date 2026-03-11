import { Secret } from '@adonisjs/core/helpers'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { NobleCryptoPlugin, ScureBase32Plugin, TOTP } from 'otplib'
import * as QRCode from 'qrcode'
import User from '#models/user'
import {
	disableTwoFactorValidator,
	loginTwoFactorValidator,
	verifyTwoFactorValidator,
} from '#validators/two_factor_validator'

const totp = new TOTP({
	crypto: new NobleCryptoPlugin(),
	base32: new ScureBase32Plugin(),
})

export default class TwoFactorController {
	/**
	 * Generate a new TOTP secret and return QR code
	 */
	async setup({ auth, response }: HttpContext) {
		const user = auth.user!

		if (user.twoFactorEnabled) {
			return response.badRequest({
				success: false,
				message: 'La double authentification est déjà activée',
			})
		}

		const secret = totp.generateSecret()

		// Store secret temporarily (not enabled yet until verified)
		user.twoFactorSecret = secret
		await user.save()

		const otpauthUrl = totp.toURI({ secret, issuer: 'Patissio Admin', label: user.email })
		const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

		return response.ok({
			success: true,
			secret,
			qrCode: qrCodeDataUrl,
		})
	}

	/**
	 * Verify TOTP code and enable 2FA
	 */
	async verify({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const { code } = await request.validateUsing(verifyTwoFactorValidator)

		if (!user.twoFactorSecret) {
			return response.badRequest({
				success: false,
				message: "Veuillez d'abord configurer la double authentification",
			})
		}

		if (user.twoFactorEnabled) {
			return response.badRequest({
				success: false,
				message: 'La double authentification est déjà activée',
			})
		}

		const result = await totp.verify(code, { secret: user.twoFactorSecret })

		if (!result.valid) {
			return response.badRequest({
				success: false,
				message: 'Code invalide',
			})
		}

		// Generate backup codes
		const backupCodes = Array.from({ length: 8 }, () =>
			Math.random().toString(36).substring(2, 10).toUpperCase()
		)

		user.twoFactorEnabled = true
		user.twoFactorBackupCodes = backupCodes
		await user.save()

		return response.ok({
			success: true,
			message: 'Double authentification activée',
			backupCodes,
		})
	}

	/**
	 * Disable 2FA (requires password)
	 */
	async disable({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const { password } = await request.validateUsing(disableTwoFactorValidator)

		if (!user.twoFactorEnabled) {
			return response.badRequest({
				success: false,
				message: "La double authentification n'est pas activée",
			})
		}

		if (!user.password) {
			return response.badRequest({
				success: false,
				message: 'Aucun mot de passe configuré',
			})
		}

		const isValid = await hash.verify(user.password, password)
		if (!isValid) {
			return response.badRequest({
				success: false,
				message: 'Mot de passe incorrect',
			})
		}

		user.twoFactorEnabled = false
		user.twoFactorSecret = null
		user.twoFactorBackupCodes = null
		await user.save()

		return response.ok({
			success: true,
			message: 'Double authentification désactivée',
		})
	}

	/**
	 * Get 2FA status
	 */
	async status({ auth, response }: HttpContext) {
		const user = auth.user!

		return response.ok({
			success: true,
			enabled: user.twoFactorEnabled,
		})
	}

	/**
	 * Verify TOTP code during login (2FA challenge)
	 */
	async loginVerify({ request, response }: HttpContext) {
		const { tempToken, code } = await request.validateUsing(loginTwoFactorValidator)

		let accessToken: Awaited<ReturnType<typeof User.accessTokens.verify>> | undefined
		try {
			accessToken = await User.accessTokens.verify(new Secret(tempToken))
		} catch {
			return response.unauthorized({
				success: false,
				message: 'Token temporaire invalide ou expiré',
			})
		}

		if (!accessToken) {
			return response.unauthorized({
				success: false,
				message: 'Token temporaire invalide ou expiré',
			})
		}

		if (!accessToken.abilities.includes('two_factor_challenge')) {
			return response.unauthorized({
				success: false,
				message: 'Token invalide',
			})
		}

		const user = await User.find(accessToken.tokenableId)

		if (!user || !user.twoFactorSecret) {
			return response.unauthorized({
				success: false,
				message: 'Utilisateur introuvable',
			})
		}

		// Try TOTP code first
		const result = await totp.verify(code, { secret: user.twoFactorSecret })
		let isValid = result.valid

		// If TOTP fails, try backup codes
		if (!isValid && user.twoFactorBackupCodes) {
			const codeUpper = code.toUpperCase()
			const backupIndex = user.twoFactorBackupCodes.indexOf(codeUpper)
			if (backupIndex !== -1) {
				isValid = true
				// Remove used backup code
				const updatedCodes = [...user.twoFactorBackupCodes]
				updatedCodes.splice(backupIndex, 1)
				user.twoFactorBackupCodes = updatedCodes
				await user.save()
			}
		}

		if (!isValid) {
			return response.badRequest({
				success: false,
				message: 'Code invalide',
			})
		}

		// Delete the temp token
		await User.accessTokens.delete(user, accessToken.identifier)

		// Create a real access token
		const token = await User.accessTokens.create(user)

		return response.ok({
			success: true,
			user: user.serialize(),
			token: token.value!.release(),
		})
	}
}
