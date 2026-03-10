import type { HttpContext } from '@adonisjs/core/http'
import Ingredient from '#models/ingredient'
import PatissierProfile from '#models/patissier_profile'
import {
	storeIngredientValidator,
	updateIngredientValidator,
} from '#validators/ingredient_validator'

export default class IngredientsController {
	async index({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const ingredients = await Ingredient.query()
			.where('patissierId', profile.id)
			.orderBy('name', 'asc')

		return response.ok({
			success: true,
			data: ingredients.map((i) => i.serialize()),
		})
	}

	async store({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const data = await request.validateUsing(storeIngredientValidator)

		const ingredient = await Ingredient.create({
			patissierId: profile.id,
			name: data.name,
			category: data.category || 'autre',
			unit: data.unit || 'g',
			pricePerUnit: data.pricePerUnit || 0,
			stock: data.stock ?? null,
		})

		return response.created({
			success: true,
			data: ingredient.serialize(),
		})
	}

	async update({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const ingredient = await Ingredient.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const data = await request.validateUsing(updateIngredientValidator)

		ingredient.merge(data)
		await ingredient.save()

		return response.ok({
			success: true,
			data: ingredient.serialize(),
		})
	}

	async destroy({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const ingredient = await Ingredient.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		await ingredient.delete()

		return response.ok({
			success: true,
			message: 'Ingredient deleted',
		})
	}
}
