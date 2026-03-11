import vine from '@vinejs/vine'

export const paginationValidator = vine.compile(
	vine.object({
		page: vine.number().min(1).optional(),
		limit: vine.number().min(1).max(100).optional(),
		status: vine
			.enum(['pending', 'confirmed', 'in_progress', 'ready', 'delivered', 'picked_up', 'cancelled'])
			.optional(),
		type: vine.enum(['catalogue', 'custom']).optional(),
	})
)

const orderItemSchema = vine.object({
	product_id: vine.string().uuid(),
	quantity: vine.number().min(1).max(10000),
	special_instructions: vine.string().trim().maxLength(500).nullable().optional(),
})

export const storePatissierOrderValidator = vine.compile(
	vine.object({
		type: vine.enum(['catalogue', 'custom']),
		clientName: vine.string().trim().minLength(1).maxLength(200),
		clientEmail: vine.string().email().normalizeEmail(),
		clientPhone: vine.string().trim().maxLength(30).nullable().optional(),
		deliveryMethod: vine.enum(['pickup', 'delivery']).optional(),
		requestedDate: vine.string().trim().nullable().optional(),
		deliveryAddress: vine.string().trim().maxLength(500).nullable().optional(),
		deliveryNotes: vine.string().trim().maxLength(1000).nullable().optional(),
		patissierNotes: vine.string().trim().maxLength(2000).nullable().optional(),
		items: vine.array(orderItemSchema).optional(),
		customType: vine.string().trim().maxLength(200).nullable().optional(),
		customNbPersonnes: vine.number().min(1).max(10000).nullable().optional(),
		customDateSouhaitee: vine.string().trim().nullable().optional(),
		customTheme: vine.string().trim().maxLength(500).nullable().optional(),
		customAllergies: vine.string().trim().maxLength(500).nullable().optional(),
		customMessage: vine.string().trim().maxLength(5000).nullable().optional(),
		total: vine.number().min(0).max(1000000).nullable().optional(),
		paymentStatus: vine.enum(['pending', 'paid']).optional(),
		depositPercent: vine.number().min(0).max(100).nullable().optional(),
	})
)

export const updateOrderStatusValidator = vine.compile(
	vine.object({
		status: vine.enum([
			'pending',
			'confirmed',
			'in_progress',
			'ready',
			'delivered',
			'picked_up',
			'cancelled',
		]),
		cancellationReason: vine.string().trim().maxLength(1000).nullable().optional(),
		confirmedDate: vine.string().trim().nullable().optional(),
	})
)

export const quoteOrderValidator = vine.compile(
	vine.object({
		quotedPrice: vine.number().min(0).max(1000000),
		responseMessage: vine.string().trim().maxLength(5000).nullable().optional(),
		depositPercent: vine.number().min(0).max(100).optional(),
		confirmedDate: vine.string().trim().nullable().optional(),
	})
)

export const sendMessageValidator = vine.compile(
	vine.object({
		message: vine.string().trim().minLength(1).maxLength(5000),
		attachments: vine.array(vine.string().maxLength(500)).maxLength(10).optional(),
	})
)

export const updateOrderValidator = vine.compile(
	vine.object({
		clientName: vine.string().trim().minLength(1).maxLength(200).optional(),
		clientEmail: vine.string().email().normalizeEmail().optional(),
		clientPhone: vine.string().trim().maxLength(30).nullable().optional(),
		deliveryMethod: vine.enum(['pickup', 'delivery']).optional(),
		deliveryAddress: vine.string().trim().maxLength(500).nullable().optional(),
		deliveryNotes: vine.string().trim().maxLength(1000).nullable().optional(),
		requestedDate: vine.string().trim().nullable().optional(),
		patissierNotes: vine.string().trim().maxLength(2000).nullable().optional(),
		total: vine.number().min(0).max(1000000).nullable().optional(),
		customType: vine.string().trim().maxLength(200).nullable().optional(),
		customNbPersonnes: vine.number().min(1).max(10000).nullable().optional(),
		customDateSouhaitee: vine.string().trim().nullable().optional(),
		customTheme: vine.string().trim().maxLength(500).nullable().optional(),
		customAllergies: vine.string().trim().maxLength(500).nullable().optional(),
		customMessage: vine.string().trim().maxLength(5000).nullable().optional(),
		removePhotos: vine.array(vine.string().maxLength(500)).maxLength(20).optional(),
	})
)
