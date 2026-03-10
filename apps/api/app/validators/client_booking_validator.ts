import vine from '@vinejs/vine'

export const storeClientBookingValidator = vine.compile(
	vine.object({
		client_name: vine.string().trim().minLength(1).maxLength(200),
		client_email: vine.string().email().normalizeEmail(),
		client_phone: vine.string().trim().maxLength(30).nullable().optional(),
		nb_participants: vine.number().min(1).max(100),
		message: vine.string().trim().maxLength(2000).nullable().optional(),
	})
)

export const cancelBookingValidator = vine.compile(
	vine.object({
		clientEmail: vine.string().email(),
		cancellationReason: vine.string().trim().maxLength(1000).nullable().optional(),
	})
)
