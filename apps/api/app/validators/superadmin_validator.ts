import vine from '@vinejs/vine'

export const suspendUserValidator = vine.compile(
	vine.object({
		reason: vine.string().trim().maxLength(1000).nullable().optional(),
	})
)

export const auditLogFilterValidator = vine.compile(
	vine.object({
		page: vine.number().min(1).optional(),
		limit: vine.number().min(1).max(100).optional(),
		action: vine.string().trim().maxLength(200).optional(),
		userId: vine.string().uuid().optional(),
		resourceType: vine.string().trim().maxLength(100).optional(),
		from: vine.string().trim().optional(),
		to: vine.string().trim().optional(),
	})
)
