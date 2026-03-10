import vine from '@vinejs/vine'

export const storeIngredientValidator = vine.compile(
	vine.object({
		name: vine.string().trim().minLength(1).maxLength(200),
		category: vine.string().trim().maxLength(100).optional(),
		unit: vine.string().trim().maxLength(20).optional(),
		pricePerUnit: vine.number().min(0).max(100000).optional(),
		stock: vine.number().min(0).max(1000000).nullable().optional(),
	})
)

export const updateIngredientValidator = vine.compile(
	vine.object({
		name: vine.string().trim().minLength(1).maxLength(200).optional(),
		category: vine.string().trim().maxLength(100).optional(),
		unit: vine.string().trim().maxLength(20).optional(),
		pricePerUnit: vine.number().min(0).max(100000).optional(),
		stock: vine.number().min(0).max(1000000).nullable().optional(),
	})
)
