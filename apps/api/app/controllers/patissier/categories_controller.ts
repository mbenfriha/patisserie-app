import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import Category from '#models/category'

export default class CategoriesController {
	async index({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const categories = await Category.query()
			.where('patissierId', profile.id)
			.orderBy('sortOrder', 'asc')

		return response.ok({
			success: true,
			data: categories.map((c) => c.serialize()),
		})
	}

	async store({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const data = request.only(['name', 'slug', 'description', 'imageUrl'])

		const slug =
			data.slug ||
			data.name
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.toLowerCase()
				.replace(/['']/g, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '')

		const existingSlug = await Category.query()
			.where('patissierId', profile.id)
			.where('slug', slug)
			.first()

		if (existingSlug) {
			return response.conflict({
				success: false,
				message: 'A category with this slug already exists',
			})
		}

		const maxSortOrder = await Category.query()
			.where('patissierId', profile.id)
			.max('sort_order as maxOrder')
			.first()

		const category = await Category.create({
			patissierId: profile.id,
			name: data.name,
			slug,
			description: data.description || null,
			imageUrl: data.imageUrl || null,
			sortOrder: ((maxSortOrder as any)?.$extras?.maxOrder ?? -1) + 1,
		})

		return response.created({
			success: true,
			data: category.serialize(),
		})
	}

	async update({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const category = await Category.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const data = request.only(['name', 'slug', 'description', 'imageUrl', 'isVisible'])

		if (data.slug && data.slug !== category.slug) {
			const existingSlug = await Category.query()
				.where('patissierId', profile.id)
				.where('slug', data.slug)
				.whereNot('id', category.id)
				.first()

			if (existingSlug) {
				return response.conflict({
					success: false,
					message: 'A category with this slug already exists',
				})
			}
		}

		category.merge(data)
		await category.save()

		return response.ok({
			success: true,
			data: category.serialize(),
		})
	}

	async destroy({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const category = await Category.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		await category.delete()

		return response.ok({
			success: true,
			message: 'Category deleted',
		})
	}

	async reorder({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const items: { id: string; sort_order: number }[] = request.input('items', [])

		for (const item of items) {
			await Category.query()
				.where('id', item.id)
				.where('patissierId', profile.id)
				.update({ sort_order: item.sort_order })
		}

		const categories = await Category.query()
			.where('patissierId', profile.id)
			.orderBy('sortOrder', 'asc')

		return response.ok({
			success: true,
			data: categories.map((c) => c.serialize()),
		})
	}
}
