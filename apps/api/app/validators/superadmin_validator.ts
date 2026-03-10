import vine from '@vinejs/vine'

export const suspendUserValidator = vine.compile(
	vine.object({
		reason: vine.string().trim().maxLength(1000).nullable().optional(),
	})
)
