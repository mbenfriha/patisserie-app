import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/user'

export default class UsersController {
	async index({ request, response }: HttpContext) {
		const page = request.input('page', 1)
		const limit = request.input('limit', 20)

		const users = await User.query()
			.orderBy('createdAt', 'desc')
			.paginate(page, limit)

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
		const limit = request.input('limit', 20)

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

		const { reason } = request.only(['reason'])

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
}
