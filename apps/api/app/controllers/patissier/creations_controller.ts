import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import Creation from '#models/creation'
import type { CreationImage } from '#models/creation'
import StorageService from '#services/storage_service'

const storage = new StorageService()

function toSlug(title: string): string {
	return title
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')
}

async function uniqueSlug(title: string, patissierId: string, excludeId?: string): Promise<string> {
	const baseSlug = toSlug(title)
	let slug = baseSlug
	let counter = 1
	while (true) {
		const query = Creation.query()
			.where('patissierId', patissierId)
			.where('slug', slug)
		if (excludeId) query.whereNot('id', excludeId)
		const existing = await query.first()
		if (!existing) break
		slug = `${baseSlug}-${counter++}`
	}
	return slug
}

export default class CreationsController {
	async index({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const page = request.input('page', 1)
		const limit = request.input('limit', 20)
		const categoryId = request.input('category_id')

		const query = Creation.query()
			.where('patissierId', profile.id)
			.orderBy('sortOrder', 'asc')

		if (categoryId) {
			query.where('categoryId', categoryId)
		}

		const creations = await query.paginate(page, limit)

		return response.ok({
			success: true,
			data: creations.serialize(),
		})
	}

	async store({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const data = request.only([
			'title',
			'description',
			'categoryId',
			'price',
			'isVisible',
			'isFeatured',
			'tags',
		])

		const maxSortOrder = await Creation.query()
			.where('patissierId', profile.id)
			.max('sort_order as maxOrder')
			.first()

		const slug = await uniqueSlug(data.title, profile.id)

		const creation = await Creation.create({
			patissierId: profile.id,
			title: data.title,
			slug,
			description: data.description || null,
			categoryId: data.categoryId || null,
			price: data.price ?? null,
			isVisible: data.isVisible ?? true,
			isFeatured: data.isFeatured ?? false,
			tags: data.tags || [],
			images: [],
			sortOrder: ((maxSortOrder as any)?.$extras?.maxOrder ?? -1) + 1,
		})

		return response.created({
			success: true,
			data: creation.serialize(),
		})
	}

	async show({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const creation = await Creation.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		return response.ok({
			success: true,
			data: creation.serialize(),
		})
	}

	async update({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const creation = await Creation.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const data: Record<string, any> = request.only([
			'title',
			'description',
			'categoryId',
			'price',
			'isVisible',
			'isFeatured',
			'tags',
			'sortOrder',
		])

		if (data.title && data.title !== creation.title) {
			data.slug = await uniqueSlug(data.title, profile.id, creation.id)
		}

		creation.merge(data)
		await creation.save()

		return response.ok({
			success: true,
			data: creation.serialize(),
		})
	}

	async destroy({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const creation = await Creation.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		await creation.delete()

		return response.ok({
			success: true,
			message: 'Creation deleted',
		})
	}

	async addImage({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const creation = await Creation.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const file = request.file('image', {
			size: '5mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
		})

		let imageUrl: string

		if (file) {
			if (!file.isValid) {
				return response.badRequest({
					success: false,
					message: 'Invalid file',
					errors: file.errors,
				})
			}
			imageUrl = await storage.uploadImage(file, `creations/${creation.id}`)
		} else {
			imageUrl = request.input('url')
			if (!imageUrl) {
				return response.badRequest({
					success: false,
					message: 'Image file or url is required',
				})
			}
		}

		const image: CreationImage = {
			url: imageUrl,
			alt: request.input('alt', null),
			is_cover: request.input('is_cover', false),
		}

		const images = [...(creation.images || [])]
		images.push(image)
		creation.images = images
		await creation.save()

		return response.ok({
			success: true,
			data: creation.serialize(),
		})
	}

	async removeImage({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const creation = await Creation.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const index = Number(params.idx)
		const images = [...(creation.images || [])]

		if (isNaN(index) || index < 0 || index >= images.length) {
			return response.badRequest({
				success: false,
				message: 'Invalid image index',
			})
		}

		const removed = images[index]
		if (removed.url && !removed.url.startsWith('http')) {
			try {
				await storage.deleteImage(removed.url)
			} catch {
				// Ignore
			}
		}

		images.splice(index, 1)
		creation.images = images
		await creation.save()

		return response.ok({
			success: true,
			data: creation.serialize(),
		})
	}
}
