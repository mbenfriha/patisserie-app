import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
	vine.object({
		businessName: vine.string().trim().minLength(2).maxLength(200).optional(),
		description: vine.string().trim().maxLength(5000).nullable().optional(),
		phone: vine.string().trim().maxLength(30).nullable().optional(),
		addressStreet: vine.string().trim().maxLength(200).nullable().optional(),
		addressCity: vine.string().trim().maxLength(100).nullable().optional(),
		addressZip: vine.string().trim().maxLength(20).nullable().optional(),
		addressCountry: vine.string().trim().maxLength(100).nullable().optional(),
		socialLinks: vine
			.object({
				instagram: vine.string().maxLength(500).optional(),
				facebook: vine.string().maxLength(500).optional(),
				tiktok: vine.string().maxLength(500).optional(),
				snapchat: vine.string().maxLength(500).optional(),
				linkedin: vine.string().maxLength(500).optional(),
				youtube: vine.string().maxLength(500).optional(),
				customUrl: vine.string().maxLength(500).optional(),
				customLabel: vine.string().maxLength(100).optional(),
			})
			.optional(),
		operatingHours: vine.any().optional(),
		acceptsCustomOrders: vine.boolean().optional(),
		defaultDepositPercent: vine.number().min(0).max(100).optional(),
		allowSupportAccess: vine.boolean().optional(),
	})
)

export const updateDesignValidator = vine.compile(
	vine.object({
		primaryColor: vine
			.string()
			.trim()
			.regex(/^#[0-9a-fA-F]{6}$/)
			.optional(),
		secondaryColor: vine
			.string()
			.trim()
			.regex(/^#[0-9a-fA-F]{6}$/)
			.optional(),
		fontFamily: vine.string().trim().maxLength(100).optional(),
		heroImageUrl: vine.string().maxLength(500).nullable().optional(),
	})
)

export const updateSiteValidator = vine.compile(
	vine.object({
		primaryColor: vine
			.string()
			.trim()
			.regex(/^#[0-9a-fA-F]{6}$/)
			.optional(),
		secondaryColor: vine
			.string()
			.trim()
			.regex(/^#[0-9a-fA-F]{6}$/)
			.optional(),
		fontFamily: vine.string().trim().maxLength(100).optional(),
		heroImageUrl: vine.string().maxLength(500).nullable().optional(),
		siteConfig: vine
			.object({
				heroSubtitle: vine.string().maxLength(200).optional(),
				heroCtaLabel: vine.string().maxLength(100).optional(),
				heroCtaHref: vine.string().maxLength(200).optional(),
				storyTitle: vine.string().maxLength(200).optional(),
				storySubtitle: vine.string().maxLength(200).optional(),
				storyText: vine.string().maxLength(10000).optional(),
				marqueeItems: vine.array(vine.string().maxLength(100)).maxLength(20).optional(),
				creationsTitle: vine.string().maxLength(200).optional(),
				creationsSubtitle: vine.string().maxLength(200).optional(),
				workshopsCtaTitle: vine.string().maxLength(200).optional(),
				workshopsCtaSubtitle: vine.string().maxLength(200).optional(),
				workshopsCtaDescription: vine.string().maxLength(2000).optional(),
				workshopsCtaLabel: vine.string().maxLength(100).optional(),
				showStorySection: vine.boolean().optional(),
				showMarquee: vine.boolean().optional(),
				showCreationsOnHomepage: vine.boolean().optional(),
				showWorkshopsCta: vine.boolean().optional(),
				showCatalogueTab: vine.boolean().optional(),
				showCustomOrderTab: vine.boolean().optional(),
				showInstagramSection: vine.boolean().optional(),
				instagramSectionTitle: vine.string().maxLength(200).optional(),
				instagramSectionSubtitle: vine.string().maxLength(200).optional(),
				fontPreset: vine.enum(['classic', 'modern', 'elegant', 'playful']).optional(),
				logoSize: vine.number().min(10).max(200).optional(),
			})
			.optional(),
		storyImageUrl: vine.string().maxLength(500).nullable().optional(),
		ordersEnabled: vine.boolean().optional(),
		workshopsEnabled: vine.boolean().optional(),
	})
)
