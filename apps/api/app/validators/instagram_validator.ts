import vine from '@vinejs/vine'

export const exchangeCodeValidator = vine.compile(
	vine.object({
		code: vine.string().trim().minLength(1).maxLength(500),
	})
)
