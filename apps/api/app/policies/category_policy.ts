import { BasePolicy } from '@adonisjs/bouncer'
import type Category from '#models/category'
import PatissierProfile from '#models/patissier_profile'
import type User from '#models/user'

export default class CategoryPolicy extends BasePolicy {
	async update(user: User, category: Category) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && category.patissierId === profile.id
	}

	async delete(user: User, category: Category) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && category.patissierId === profile.id
	}
}
