import vine from '@vinejs/vine'

export const saveQuoteDraftValidator = vine.compile(
	vine.object({
		price: vine.number().min(0).max(1000000),
		depositPercent: vine.number().min(0).max(100).optional(),
		confirmedDate: vine.string().trim().nullable().optional(),
		message: vine.string().trim().maxLength(5000).nullable().optional(),
	})
)

export const sendQuoteValidator = vine.compile(
	vine.object({
		price: vine.number().positive().max(1000000),
		depositPercent: vine.number().min(0).max(100).optional(),
		confirmedDate: vine.string().trim().nullable().optional(),
		message: vine.string().trim().maxLength(5000).nullable().optional(),
	})
)

export const updateQuoteStatusValidator = vine.compile(
	vine.object({
		status: vine.enum(['accepted', 'rejected'] as const),
	})
)
