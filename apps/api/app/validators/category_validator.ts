import vine from '@vinejs/vine'

export const storeCategoryValidator = vine.compile(
	vine.object({
		name: vine.string().trim().minLength(1).maxLength(100),
		slug: vine
			.string()
			.trim()
			.maxLength(100)
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
			.optional(),
		description: vine.string().trim().maxLength(500).nullable().optional(),
		imageUrl: vine.string().maxLength(500).nullable().optional(),
	})
)

export const updateCategoryValidator = vine.compile(
	vine.object({
		name: vine.string().trim().minLength(1).maxLength(100).optional(),
		slug: vine
			.string()
			.trim()
			.maxLength(100)
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
			.optional(),
		description: vine.string().trim().maxLength(500).nullable().optional(),
		imageUrl: vine.string().maxLength(500).nullable().optional(),
		isVisible: vine.boolean().optional(),
	})
)

export const reorderCategoryValidator = vine.compile(
	vine.object({
		items: vine.array(
			vine.object({
				id: vine.string().uuid(),
				sort_order: vine.number().min(0),
			})
		),
	})
)
