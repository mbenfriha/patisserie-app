import vine from '@vinejs/vine'

export const saveCostingValidator = vine.compile(
	vine.object({
		ingredients: vine
			.array(
				vine.object({
					ingredientId: vine.string().uuid(),
					quantity: vine.number().min(0).max(1000000),
				})
			)
			.optional(),
		labor: vine
			.array(
				vine.object({
					employeeId: vine.string().uuid(),
					hours: vine.number().min(0).max(10000),
				})
			)
			.optional(),
		marginCoefficient: vine.number().min(0).max(100).optional(),
	})
)
