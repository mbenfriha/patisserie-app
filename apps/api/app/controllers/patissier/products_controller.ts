import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import StorageService from '#services/storage_service'

export default class ProductsController {
	async index({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const page = request.input('page', 1)
		const limit = request.input('limit', 20)
		const categoryId = request.input('category_id')

		const query = Product.query()
			.where('patissierId', profile.id)
			.orderBy('sortOrder', 'asc')

		if (categoryId) {
			query.where('categoryId', categoryId)
		}

		const products = await query.paginate(page, limit)

		return response.ok({
			success: true,
			data: products.serialize(),
		})
	}

	async store({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const data = request.only([
			'name',
			'description',
			'categoryId',
			'images',
			'price',
			'unit',
			'minQuantity',
			'maxQuantity',
			'preparationDays',
			'isAvailable',
			'isVisible',
			'allergens',
			'tags',
		])

		const maxSortOrder = await Product.query()
			.where('patissierId', profile.id)
			.max('sort_order as maxOrder')
			.first()

		const product = await Product.create({
			patissierId: profile.id,
			name: data.name,
			description: data.description || null,
			categoryId: data.categoryId || null,
			images: data.images || [],
			price: data.price,
			unit: data.unit || null,
			minQuantity: data.minQuantity ?? 1,
			maxQuantity: data.maxQuantity ?? null,
			preparationDays: data.preparationDays ?? 2,
			isAvailable: data.isAvailable ?? true,
			isVisible: data.isVisible ?? true,
			allergens: data.allergens || [],
			tags: data.tags || [],
			sortOrder: ((maxSortOrder as any)?.$extras?.maxOrder ?? -1) + 1,
		})

		return response.created({
			success: true,
			data: product.serialize(),
		})
	}

	async show({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const product = await Product.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		return response.ok({
			success: true,
			data: product.serialize(),
		})
	}

	async update({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const product = await Product.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const data = request.only([
			'name',
			'description',
			'categoryId',
			'images',
			'price',
			'unit',
			'minQuantity',
			'maxQuantity',
			'preparationDays',
			'isAvailable',
			'isVisible',
			'sortOrder',
			'allergens',
			'tags',
		])

		product.merge(data)
		await product.save()

		return response.ok({
			success: true,
			data: product.serialize(),
		})
	}

	async destroy({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const product = await Product.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		await product.delete()

		return response.ok({
			success: true,
			message: 'Product deleted',
		})
	}

	async uploadIllustration({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const product = await Product.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const file = request.file('image', {
			size: '5mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
		})

		if (!file) {
			return response.badRequest({ success: false, message: 'Image file is required' })
		}

		if (!file.isValid) {
			return response.badRequest({ success: false, message: 'Invalid file', errors: file.errors })
		}

		const storage = new StorageService()

		// Delete previous illustration if exists
		const currentImages = product.images || []
		if (currentImages.length > 0 && currentImages[0]?.url) {
			const key = currentImages[0].url
			if (!key.startsWith('http')) {
				await storage.deleteImage(key).catch(() => {})
			}
		}

		const imageUrl = await storage.uploadImage(file, `products/${product.id}`)
		product.images = [{ url: imageUrl, alt: product.name }]
		await product.save()

		return response.ok({
			success: true,
			data: product.serialize(),
		})
	}

	async deleteIllustration({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const product = await Product.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const currentImages = product.images || []
		if (currentImages.length > 0 && currentImages[0]?.url) {
			const key = currentImages[0].url
			if (!key.startsWith('http')) {
				const storage = new StorageService()
				await storage.deleteImage(key).catch(() => {})
			}
		}

		product.images = []
		await product.save()

		return response.ok({
			success: true,
			data: product.serialize(),
		})
	}
}
