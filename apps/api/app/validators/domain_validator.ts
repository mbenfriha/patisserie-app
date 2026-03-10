import vine from '@vinejs/vine'

export const setDomainValidator = vine.compile(
	vine.object({
		domain: vine.string().trim().minLength(3).maxLength(253),
	})
)
