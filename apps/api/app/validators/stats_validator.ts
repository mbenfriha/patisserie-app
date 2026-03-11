import vine from '@vinejs/vine'

export const analyticsQueryValidator = vine.compile(
	vine.object({
		period: vine
			.string()
			.trim()
			.regex(/^\d+[dwmy]$/)
			.optional(),
	})
)
