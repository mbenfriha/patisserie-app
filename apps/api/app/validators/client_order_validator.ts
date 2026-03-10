import vine from '@vinejs/vine'

const orderItemSchema = vine.object({
	product_id: vine.string().uuid(),
	quantity: vine.number().min(1).max(10000),
	special_instructions: vine.string().trim().maxLength(500).nullable().optional(),
})

export const storeClientOrderValidator = vine.compile(
	vine.object({
		slug: vine.string().trim().minLength(1).maxLength(100),
		type: vine.enum(['catalogue', 'custom']),
		clientName: vine.string().trim().minLength(1).maxLength(200),
		clientEmail: vine.string().email().normalizeEmail(),
		clientPhone: vine.string().trim().maxLength(30).nullable().optional(),
		deliveryMethod: vine.enum(['pickup', 'delivery']).optional(),
		requestedDate: vine.string().trim().nullable().optional(),
		deliveryAddress: vine.string().trim().maxLength(500).nullable().optional(),
		deliveryNotes: vine.string().trim().maxLength(1000).nullable().optional(),
		items: vine.array(orderItemSchema).optional(),
		customType: vine.string().trim().maxLength(200).nullable().optional(),
		customNbPersonnes: vine.number().min(1).max(10000).nullable().optional(),
		customDateSouhaitee: vine.string().trim().nullable().optional(),
		customTheme: vine.string().trim().maxLength(500).nullable().optional(),
		customAllergies: vine.string().trim().maxLength(500).nullable().optional(),
		customMessage: vine.string().trim().maxLength(5000).nullable().optional(),
	})
)

export const clientSendMessageValidator = vine.compile(
	vine.object({
		message: vine.string().trim().minLength(1).maxLength(5000),
		senderName: vine.string().trim().maxLength(200).optional(),
		clientEmail: vine.string().email(),
	})
)
