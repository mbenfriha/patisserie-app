import vine from '@vinejs/vine'

export const storeCreationValidator = vine.compile(
	vine.object({
		title: vine.string().trim().maxLength(200).optional(),
		description: vine.string().trim().maxLength(5000).nullable().optional(),
		categoryId: vine.string().uuid().nullable().optional(),
		price: vine.number().min(0).max(100000).nullable().optional(),
		isVisible: vine.boolean().optional(),
		isFeatured: vine.boolean().optional(),
		tags: vine.array(vine.string().trim().maxLength(50)).maxLength(20).optional(),
	})
)

export const updateCreationValidator = vine.compile(
	vine.object({
		title: vine.string().trim().maxLength(200).optional(),
		description: vine.string().trim().maxLength(5000).nullable().optional(),
		categoryId: vine.string().uuid().nullable().optional(),
		price: vine.number().min(0).max(100000).nullable().optional(),
		isVisible: vine.boolean().optional(),
		isFeatured: vine.boolean().optional(),
		tags: vine.array(vine.string().trim().maxLength(50)).maxLength(20).optional(),
		sortOrder: vine.number().min(0).optional(),
	})
)
