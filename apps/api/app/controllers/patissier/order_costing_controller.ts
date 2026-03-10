import type { HttpContext } from '@adonisjs/core/http'
import Employee from '#models/employee'
import Ingredient from '#models/ingredient'
import Order from '#models/order'
import OrderCostingIngredient from '#models/order_costing_ingredient'
import OrderCostingLabor from '#models/order_costing_labor'
import PatissierProfile from '#models/patissier_profile'
import { saveCostingValidator } from '#validators/order_costing_validator'

export default class OrderCostingController {
	async show({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const ingredients = await OrderCostingIngredient.query()
			.where('orderId', order.id)
			.orderBy('createdAt', 'asc')

		const labor = await OrderCostingLabor.query()
			.where('orderId', order.id)
			.orderBy('createdAt', 'asc')

		return response.ok({
			success: true,
			data: {
				ingredients: ingredients.map((i) => i.serialize()),
				labor: labor.map((l) => l.serialize()),
				marginCoefficient: profile.defaultMarginCoefficient,
			},
		})
	}

	async save({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const order = await Order.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const body = await request.validateUsing(saveCostingValidator)

		// Delete existing costing entries
		await OrderCostingIngredient.query().where('orderId', order.id).delete()
		await OrderCostingLabor.query().where('orderId', order.id).delete()

		// Create ingredient costing entries with snapshots
		const ingredientEntries: { ingredientId: string; quantity: number }[] = body.ingredients || []
		for (const entry of ingredientEntries) {
			const ingredient = await Ingredient.query()
				.where('id', entry.ingredientId)
				.where('patissierId', profile.id)
				.firstOrFail()

			const totalCost =
				Math.round(Number(ingredient.pricePerUnit) * Number(entry.quantity) * 100) / 100

			await OrderCostingIngredient.create({
				orderId: order.id,
				ingredientId: ingredient.id,
				ingredientName: ingredient.name,
				unit: ingredient.unit,
				unitPrice: ingredient.pricePerUnit,
				quantity: entry.quantity,
				totalCost,
			})
		}

		// Create labor costing entries with snapshots
		const laborEntries: { employeeId: string; hours: number }[] = body.labor || []
		for (const entry of laborEntries) {
			const employee = await Employee.query()
				.where('id', entry.employeeId)
				.where('patissierId', profile.id)
				.firstOrFail()

			const totalCost = Math.round(Number(employee.hourlyRate) * Number(entry.hours) * 100) / 100

			await OrderCostingLabor.create({
				orderId: order.id,
				employeeId: employee.id,
				employeeName: employee.name,
				hourlyRate: employee.hourlyRate,
				hours: entry.hours,
				totalCost,
			})
		}

		// Update margin coefficient if changed
		if (
			body.marginCoefficient !== undefined &&
			body.marginCoefficient !== profile.defaultMarginCoefficient
		) {
			profile.defaultMarginCoefficient = body.marginCoefficient
			await profile.save()
		}

		// Return updated costing
		const ingredients = await OrderCostingIngredient.query()
			.where('orderId', order.id)
			.orderBy('createdAt', 'asc')

		const labor = await OrderCostingLabor.query()
			.where('orderId', order.id)
			.orderBy('createdAt', 'asc')

		return response.ok({
			success: true,
			data: {
				ingredients: ingredients.map((i) => i.serialize()),
				labor: labor.map((l) => l.serialize()),
				marginCoefficient: profile.defaultMarginCoefficient,
			},
		})
	}
}
