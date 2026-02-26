import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import Creation from '#models/creation'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import Workshop from '#models/workshop'

export default class PublicController {
	async checkSlug({ params, response }: HttpContext) {
		const slug = params.slug?.toLowerCase().trim()

		if (!slug || slug.length < 3) {
			return response.ok({ data: { available: false, reason: 'too_short' } })
		}

		const existing = await PatissierProfile.findBy('slug', slug)

		return response.ok({
			data: { available: !existing, slug },
		})
	}

	async profileByDomain({ params, response }: HttpContext) {
		const domain = params.domain

		const profile = await PatissierProfile.query()
			.where('customDomain', domain)
			.where('customDomainVerified', true)
			.preload('categories', (query) => {
				query.where('isVisible', true).orderBy('sortOrder', 'asc')
			})
			.first()

		if (!profile) {
			return response.notFound({ success: false, message: 'No patissier found for this domain' })
		}

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async profile({ params, response }: HttpContext) {
		const profile = await PatissierProfile.query()
			.where('slug', params.slug)
			.preload('categories', (query) => {
				query.where('isVisible', true).orderBy('sortOrder', 'asc')
			})
			.first()

		if (!profile) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async categories({ params, response }: HttpContext) {
		const profile = await PatissierProfile.findBy('slug', params.slug)
		if (!profile) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		const categories = await Category.query()
			.where('patissierId', profile.id)
			.where('isVisible', true)
			.orderBy('sortOrder', 'asc')

		return response.ok({
			success: true,
			data: categories.map((c) => c.serialize()),
		})
	}

	async creations({ params, request, response }: HttpContext) {
		const profile = await PatissierProfile.findBy('slug', params.slug)
		if (!profile) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		const categoryId = request.input('category_id')
		const featured = request.input('featured')
		const limit = request.input('limit')

		const query = Creation.query()
			.where('patissierId', profile.id)
			.where('isVisible', true)
			.preload('category')
			.orderBy('sortOrder', 'asc')

		if (categoryId) {
			query.where('categoryId', categoryId)
		}

		if (featured === 'true') {
			query.where('isFeatured', true)
		}

		if (limit) {
			query.limit(Number(limit))
		}

		const creations = await query

		return response.ok({
			success: true,
			data: creations.map((c) => c.serialize()),
		})
	}

	async creationDetail({ params, response }: HttpContext) {
		const profile = await PatissierProfile.findBy('slug', params.slug)
		if (!profile) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		const creation = await Creation.query()
			.where('slug', params.creationSlug)
			.where('patissierId', profile.id)
			.where('isVisible', true)
			.preload('category')
			.first()

		if (!creation) {
			return response.notFound({ success: false, message: 'Creation not found' })
		}

		return response.ok({
			success: true,
			data: creation.serialize(),
		})
	}

	async products({ params, response }: HttpContext) {
		const profile = await PatissierProfile.findBy('slug', params.slug)
		if (!profile) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		const products = await Product.query()
			.where('patissierId', profile.id)
			.where('isVisible', true)
			.preload('category')
			.orderBy('sortOrder', 'asc')

		return response.ok({
			success: true,
			data: products.map((p) => p.serialize()),
		})
	}

	async workshops({ params, response }: HttpContext) {
		const profile = await PatissierProfile.findBy('slug', params.slug)
		if (!profile) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		const workshops = await Workshop.query()
			.where('patissierId', profile.id)
			.where('status', 'published')
			.where('isVisible', true)
			.preload('category')
			.orderBy('date', 'asc')

		return response.ok({
			success: true,
			data: workshops.map((w) => w.serialize()),
		})
	}

	async instagramFeed({ params, response }: HttpContext) {
		const profile = await PatissierProfile.findBy('slug', params.slug)
		if (!profile) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		if (!profile.instagramAccessToken) {
			return response.ok({ success: true, data: [] })
		}

		try {
			const igResponse = await fetch(
				`https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=${profile.instagramAccessToken}`
			)

			if (!igResponse.ok) {
				const error: any = await igResponse.json()
				// Token expired or invalid
				if (error?.error?.code === 190) {
					return response.ok({ success: true, data: [], error: 'token_expired' })
				}
				return response.ok({ success: true, data: [] })
			}

			const igData: any = await igResponse.json()
			const posts = (igData.data || [])
				.filter((post: any) => post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM')
				.slice(0, 9)
				.map((post: any) => ({
					id: post.id,
					mediaUrl: post.media_url,
					thumbnailUrl: post.thumbnail_url || post.media_url,
					permalink: post.permalink,
					caption: post.caption?.slice(0, 100) || '',
					mediaType: post.media_type,
				}))

			return response.ok({ success: true, data: posts })
		} catch {
			return response.ok({ success: true, data: [] })
		}
	}

	async workshopDetail({ params, response }: HttpContext) {
		const profile = await PatissierProfile.findBy('slug', params.slug)
		if (!profile) {
			return response.notFound({ success: false, message: 'Patissier not found' })
		}

		const workshop = await Workshop.query()
			.where('slug', params.workshopSlug)
			.where('patissierId', profile.id)
			.preload('category')
			.preload('bookings', (query) => {
				query.whereNot('status', 'cancelled').select('id', 'nbParticipants')
			})
			.first()

		if (!workshop) {
			return response.notFound({ success: false, message: 'Workshop not found' })
		}

		const totalBooked = workshop.bookings.reduce((sum, b) => sum + b.nbParticipants, 0)

		return response.ok({
			success: true,
			data: {
				...workshop.serialize(),
				spotsLeft: workshop.capacity - totalBooked,
				slug: profile.slug,
			},
		})
	}
}
