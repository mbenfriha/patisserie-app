import type { HttpContext } from '@adonisjs/core/http'
import Employee from '#models/employee'
import PatissierProfile from '#models/patissier_profile'
import { storeEmployeeValidator, updateEmployeeValidator } from '#validators/employee_validator'

export default class EmployeesController {
	async index({ auth, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const employees = await Employee.query().where('patissierId', profile.id).orderBy('name', 'asc')

		return response.ok({
			success: true,
			data: employees.map((e) => e.serialize()),
		})
	}

	async store({ auth, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const data = await request.validateUsing(storeEmployeeValidator)

		const employee = await Employee.create({
			patissierId: profile.id,
			name: data.name,
			role: data.role || null,
			hourlyRate: data.hourlyRate || 0,
		})

		return response.created({
			success: true,
			data: employee.serialize(),
		})
	}

	async update({ auth, params, request, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const employee = await Employee.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		const data = await request.validateUsing(updateEmployeeValidator)

		employee.merge(data)
		await employee.save()

		return response.ok({
			success: true,
			data: employee.serialize(),
		})
	}

	async destroy({ auth, params, response }: HttpContext) {
		const user = auth.user!
		const profile = await PatissierProfile.findByOrFail('userId', user.id)

		const employee = await Employee.query()
			.where('id', params.id)
			.where('patissierId', profile.id)
			.firstOrFail()

		await employee.delete()

		return response.ok({
			success: true,
			message: 'Employee deleted',
		})
	}
}
