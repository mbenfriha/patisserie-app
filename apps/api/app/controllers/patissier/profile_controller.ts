import type { HttpContext } from '@adonisjs/core/http'
import PatissierProfile from '#models/patissier_profile'
import StorageService from '#services/storage_service'

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

	async update({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

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
			extnames: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
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

	async updateSite({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

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

	async uploadHeroImage({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const image = request.file('image', {
			size: '5mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp'],
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

	async uploadStoryImage({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const image = request.file('image', {
			size: '2mb',
			extnames: ['jpg', 'jpeg', 'png', 'webp'],
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
}
