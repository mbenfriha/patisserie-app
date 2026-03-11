import vine from '@vinejs/vine'

export const publicCreationsQueryValidator = vine.compile(
	vine.object({
		category_id: vine.string().uuid().optional(),
		featured: vine.string().trim().optional(),
		limit: vine.number().min(1).max(100).optional(),
	})
)
