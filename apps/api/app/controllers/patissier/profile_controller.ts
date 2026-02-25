import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import StorageService from '#services/storage_service'
import { getActiveProfile } from '#helpers/get_active_profile'

const storage = new StorageService()

export default class ProfileController {
	async show({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async update(ctx: HttpContext) {
		const { request, response } = ctx
		const profile = await getActiveProfile(ctx)

		const data = request.only([
			'businessName',
			'description',
			'phone',
			'addressStreet',
			'addressCity',
			'addressZip',
			'addressCountry',
			'socialLinks',
			'operatingHours',
			'acceptsCustomOrders',
			'defaultDepositPercent',
			'allowSupportAccess',
		])

		profile.merge(data)
		await profile.save()

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async updateDesign({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const data = request.only([
			'primaryColor',
			'secondaryColor',
			'fontFamily',
			'heroImageUrl',
		])

		profile.merge(data)
		await profile.save()

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async uploadLogo({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const logo = request.file('logo', {
			size: '2mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif', 'svg'],
		})

		if (!logo) {
			return response.badRequest({
				success: false,
				message: 'No logo file provided',
			})
		}

		if (!logo.isValid) {
			return response.badRequest({
				success: false,
				message: 'Invalid file',
				errors: logo.errors,
			})
		}

		// Delete old logo if stored in R2
		if (profile.logoUrl && !profile.logoUrl.startsWith('http')) {
			try {
				await storage.deleteImage(profile.logoUrl)
			} catch {
				// Ignore if file doesn't exist
			}
		}

		const key = await storage.uploadImage(logo, `logos/${profile.id}`)
		profile.logoUrl = key
		await profile.save()

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async deleteLogo({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		if (profile.logoUrl && !profile.logoUrl.startsWith('http')) {
			try {
				await storage.deleteImage(profile.logoUrl)
			} catch {
				// Ignore
			}
		}

		profile.logoUrl = null
		await profile.save()

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async updateSite(ctx: HttpContext) {
		const { request, response } = ctx
		const profile = await getActiveProfile(ctx)

		const data = request.only([
			'primaryColor',
			'secondaryColor',
			'fontFamily',
			'heroImageUrl',
			'siteConfig',
			'storyImageUrl',
			'ordersEnabled',
			'workshopsEnabled',
		])

		profile.merge(data)
		await profile.save()

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async uploadHeroImage(ctx: HttpContext) {
		const { request, response } = ctx
		const profile = await getActiveProfile(ctx)

		const image = request.file('image', {
			size: '20mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
		})

		if (!image) {
			return response.badRequest({
				success: false,
				message: 'No image file provided',
			})
		}

		if (!image.isValid) {
			return response.badRequest({
				success: false,
				message: 'Invalid file',
				errors: image.errors,
			})
		}

		if (profile.heroImageUrl && !profile.heroImageUrl.startsWith('http')) {
			try {
				await storage.deleteImage(profile.heroImageUrl)
			} catch {
				// Ignore
			}
		}

		const key = await storage.uploadImage(image, `hero/${profile.id}`)
		profile.heroImageUrl = key
		await profile.save()

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async deleteHeroImage({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		if (profile.heroImageUrl && !profile.heroImageUrl.startsWith('http')) {
			try {
				await storage.deleteImage(profile.heroImageUrl)
			} catch {
				// Ignore
			}
		}

		profile.heroImageUrl = null
		await profile.save()

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async uploadStoryImage(ctx: HttpContext) {
		const { request, response } = ctx
		const profile = await getActiveProfile(ctx)

		const image = request.file('image', {
			size: '2mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
		})

		if (!image) {
			return response.badRequest({
				success: false,
				message: 'No image file provided',
			})
		}

		if (!image.isValid) {
			return response.badRequest({
				success: false,
				message: 'Invalid file',
				errors: image.errors,
			})
		}

		// Delete old story image if stored in R2
		if (profile.storyImageUrl && !profile.storyImageUrl.startsWith('http')) {
			try {
				await storage.deleteImage(profile.storyImageUrl)
			} catch {
				// Ignore
			}
		}

		const key = await storage.uploadImage(image, `story/${profile.id}`)
		profile.storyImageUrl = key
		await profile.save()

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	async deleteStoryImage({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		if (profile.storyImageUrl && !profile.storyImageUrl.startsWith('http')) {
			try {
				await storage.deleteImage(profile.storyImageUrl)
			} catch {
				// Ignore
			}
		}

		profile.storyImageUrl = null
		await profile.save()

		return response.ok({
			success: true,
			data: profile.serialize(),
		})
	}

	private static pageHeroFields = {
		creations: 'creationsHeroImageUrl',
		workshops: 'workshopsHeroImageUrl',
		products: 'productsHeroImageUrl',
		orders: 'ordersHeroImageUrl',
	} as const

	async uploadPageHeroImage({ auth, request, response, params }: HttpContext) {
		const page = params.page as string
		const field = ProfileController.pageHeroFields[page as keyof typeof ProfileController.pageHeroFields]
		if (!field) {
			return response.badRequest({ success: false, message: 'Invalid page' })
		}

		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const image = request.file('image', {
			size: '20mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
		})

		if (!image) {
			return response.badRequest({ success: false, message: 'No image file provided' })
		}

		if (!image.isValid) {
			return response.badRequest({ success: false, message: 'Invalid file', errors: image.errors })
		}

		const currentUrl = profile[field]
		if (currentUrl && !currentUrl.startsWith('http')) {
			try {
				await storage.deleteImage(currentUrl)
			} catch {
				// Ignore
			}
		}

		const key = await storage.uploadImage(image, `hero-${page}/${profile.id}`)
		profile[field] = key
		await profile.save()

		return response.ok({ success: true, data: profile.serialize() })
	}

	async deletePageHeroImage({ auth, response, params }: HttpContext) {
		const page = params.page as string
		const field = ProfileController.pageHeroFields[page as keyof typeof ProfileController.pageHeroFields]
		if (!field) {
			return response.badRequest({ success: false, message: 'Invalid page' })
		}

		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const currentUrl = profile[field]
		if (currentUrl && !currentUrl.startsWith('http')) {
			try {
				await storage.deleteImage(currentUrl)
			} catch {
				// Ignore
			}
		}

		profile[field] = null
		await profile.save()

		return response.ok({ success: true, data: profile.serialize() })
	}
}
