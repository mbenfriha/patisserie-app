import vine from '@vinejs/vine'

const workshopImageSchema = vine.object({
	url: vine.string().maxLength(500),
	alt: vine.string().maxLength(200).nullable().optional(),
})

export const storeWorkshopValidator = vine.compile(
	vine.object({
		title: vine.string().trim().minLength(1).maxLength(200),
		description: vine.string().trim().maxLength(5000).nullable().optional(),
		images: vine.array(workshopImageSchema).maxLength(10).optional(),
		price: vine.number().min(0).max(100000),
		depositPercent: vine.number().min(0).max(100).optional(),
		capacity: vine.number().min(1).max(1000),
		durationMinutes: vine.number().min(1).max(10080),
		location: vine.string().trim().maxLength(500).nullable().optional(),
		date: vine.string().trim(),
		startTime: vine.string().trim(),
		status: vine.enum(['draft', 'published', 'full', 'cancelled', 'completed']).optional(),
		whatIncluded: vine.string().trim().maxLength(2000).nullable().optional(),
		level: vine.enum(['tous_niveaux', 'debutant', 'intermediaire', 'avance']).optional(),
		categoryId: vine.string().uuid().nullable().optional(),
		isVisible: vine.boolean().optional(),
	})
)

export const updateWorkshopValidator = vine.compile(
	vine.object({
		title: vine.string().trim().minLength(1).maxLength(200).optional(),
		description: vine.string().trim().maxLength(5000).nullable().optional(),
		images: vine.array(workshopImageSchema).maxLength(10).optional(),
		price: vine.number().min(0).max(100000).optional(),
		depositPercent: vine.number().min(0).max(100).optional(),
		capacity: vine.number().min(1).max(1000).optional(),
		durationMinutes: vine.number().min(1).max(10080).optional(),
		location: vine.string().trim().maxLength(500).nullable().optional(),
		date: vine.string().trim().optional(),
		startTime: vine.string().trim().optional(),
		whatIncluded: vine.string().trim().maxLength(2000).nullable().optional(),
		level: vine.enum(['tous_niveaux', 'debutant', 'intermediaire', 'avance']).optional(),
		categoryId: vine.string().uuid().nullable().optional(),
		isVisible: vine.boolean().optional(),
	})
)

export const updateWorkshopStatusValidator = vine.compile(
	vine.object({
		status: vine.enum(['draft', 'published', 'full', 'cancelled', 'completed']),
		reason: vine.string().trim().maxLength(1000).optional(),
	})
)

export const createBookingValidator = vine.compile(
	vine.object({
		client_name: vine.string().trim().minLength(1).maxLength(200),
		client_email: vine.string().email().normalizeEmail().optional(),
		client_phone: vine.string().trim().maxLength(30).nullable().optional(),
		nb_participants: vine.number().min(1).max(100),
		message: vine.string().trim().maxLength(2000).nullable().optional(),
	})
)

export const updateBookingStatusValidator = vine.compile(
	vine.object({
		status: vine.enum(['pending_payment', 'confirmed', 'cancelled', 'completed']),
		cancellationReason: vine.string().trim().maxLength(1000).nullable().optional(),
		refundType: vine.enum(['none', 'deposit', 'full']).optional(),
	})
)
