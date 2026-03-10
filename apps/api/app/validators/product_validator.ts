import vine from '@vinejs/vine'

const productImageSchema = vine.object({
	url: vine.string().maxLength(500),
	alt: vine.string().maxLength(200).nullable().optional(),
})

export const storeProductValidator = vine.compile(
	vine.object({
		name: vine.string().trim().minLength(1).maxLength(200),
		description: vine.string().trim().maxLength(5000).nullable().optional(),
		categoryId: vine.string().uuid().nullable().optional(),
		images: vine.array(productImageSchema).maxLength(10).optional(),
		price: vine.number().min(0).max(100000),
		unit: vine.string().trim().maxLength(50).nullable().optional(),
		minQuantity: vine.number().min(1).max(10000).nullable().optional(),
		maxQuantity: vine.number().min(1).max(10000).nullable().optional(),
		preparationDays: vine.number().min(0).max(365).nullable().optional(),
		isAvailable: vine.boolean().optional(),
		isVisible: vine.boolean().optional(),
		allergens: vine.array(vine.string().trim().maxLength(100)).maxLength(30).optional(),
		tags: vine.array(vine.string().trim().maxLength(50)).maxLength(20).optional(),
	})
)

export const updateProductValidator = vine.compile(
	vine.object({
		name: vine.string().trim().minLength(1).maxLength(200).optional(),
		description: vine.string().trim().maxLength(5000).nullable().optional(),
		categoryId: vine.string().uuid().nullable().optional(),
		images: vine.array(productImageSchema).maxLength(10).optional(),
		price: vine.number().min(0).max(100000).optional(),
		unit: vine.string().trim().maxLength(50).nullable().optional(),
		minQuantity: vine.number().min(1).max(10000).nullable().optional(),
		maxQuantity: vine.number().min(1).max(10000).nullable().optional(),
		preparationDays: vine.number().min(0).max(365).nullable().optional(),
		isAvailable: vine.boolean().optional(),
		isVisible: vine.boolean().optional(),
		sortOrder: vine.number().min(0).optional(),
		allergens: vine.array(vine.string().trim().maxLength(100)).maxLength(30).optional(),
		tags: vine.array(vine.string().trim().maxLength(50)).maxLength(20).optional(),
	})
)
