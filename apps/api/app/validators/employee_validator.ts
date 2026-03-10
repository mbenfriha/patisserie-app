import vine from '@vinejs/vine'

export const storeEmployeeValidator = vine.compile(
	vine.object({
		name: vine.string().trim().minLength(1).maxLength(200),
		role: vine.string().trim().maxLength(100).nullable().optional(),
		hourlyRate: vine.number().min(0).max(10000).optional(),
	})
)

export const updateEmployeeValidator = vine.compile(
	vine.object({
		name: vine.string().trim().minLength(1).maxLength(200).optional(),
		role: vine.string().trim().maxLength(100).nullable().optional(),
		hourlyRate: vine.number().min(0).max(10000).optional(),
	})
)
