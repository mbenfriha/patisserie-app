import vine from '@vinejs/vine'

export const subscribeValidator = vine.compile(
	vine.object({
		plan: vine.enum(['pro', 'premium']),
		interval: vine.enum(['monthly', 'yearly']),
	})
)
