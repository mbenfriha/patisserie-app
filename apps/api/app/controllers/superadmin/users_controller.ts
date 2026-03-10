import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'
import TurnstileService from '#services/turnstile_service'
import { suspendUserValidator } from '#validators/superadmin_validator'

export default class UsersController {
	async index({ request, response }: HttpContext) {
		const page = request.input('page', 1)
		const limit = Math.min(Number(request.input('limit', 20)) || 20, 100)

		const users = await User.query().orderBy('createdAt', 'desc').paginate(page, limit)

		return response.ok({
			success: true,
			data: users.serialize(),
		})
	}

	async show({ params, response }: HttpContext) {
		const user = await User.find(params.id)

		if (!user) {
			return response.notFound({ success: false, message: 'User not found' })
		}

		if (user.role === 'patissier') {
			await user.load('patissierProfile')
		}

		return response.ok({
			success: true,
			data: user.serialize(),
		})
	}

	async patissiers({ request, response }: HttpContext) {
		const page = request.input('page', 1)
		const limit = Math.min(Number(request.input('limit', 20)) || 20, 100)

		const users = await User.query()
			.where('role', 'patissier')
			.preload('patissierProfile')
			.orderBy('createdAt', 'desc')
			.paginate(page, limit)

		return response.ok({
			success: true,
			data: users.serialize(),
		})
	}

	async suspend({ params, request, response }: HttpContext) {
		const user = await User.find(params.id)

		if (!user) {
			return response.notFound({ success: false, message: 'User not found' })
		}

		if (user.suspendedAt) {
			return response.badRequest({ success: false, message: 'User is already suspended' })
		}

		const { reason } = await request.validateUsing(suspendUserValidator)

		user.suspendedAt = DateTime.now()
		user.suspendReason = reason || null
		await user.save()

		return response.ok({
			success: true,
			data: user.serialize(),
		})
	}

	async unsuspend({ params, response }: HttpContext) {
		const user = await User.find(params.id)

		if (!user) {
			return response.notFound({ success: false, message: 'User not found' })
		}

		if (!user.suspendedAt) {
			return response.badRequest({ success: false, message: 'User is not suspended' })
		}

		user.suspendedAt = null
		user.suspendReason = null
		await user.save()

		return response.ok({
			success: true,
			data: user.serialize(),
		})
	}

	async syncTurnstile({ params, response }: HttpContext) {
		const profile = await PatissierProfile.find(params.profileId)

		if (!profile) {
			return response.notFound({ success: false, message: 'Profile not found' })
		}

		if (!profile.customDomain || !profile.customDomainVerified) {
			return response.badRequest({
				success: false,
				message: 'No verified custom domain on this profile',
			})
		}

		const turnstile = new TurnstileService()

		if (!turnstile.isConfigured) {
			return response.serviceUnavailable({
				success: false,
				message: 'Turnstile API not configured',
			})
		}

		const success = await turnstile.addHostname(profile.customDomain)

		if (!success) {
			return response.internalServerError({
				success: false,
				message: 'Failed to add domain to Turnstile',
			})
		}

		return response.ok({
			success: true,
			message: `Domain ${profile.customDomain} added to Turnstile`,
		})
	}
}
