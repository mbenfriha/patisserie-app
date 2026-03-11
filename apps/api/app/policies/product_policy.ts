import { BasePolicy } from '@adonisjs/bouncer'
import PatissierProfile from '#models/patissier_profile'
import type Product from '#models/product'
import type User from '#models/user'

export default class ProductPolicy extends BasePolicy {
	async view(user: User, product: Product) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && product.patissierId === profile.id
	}

	async update(user: User, product: Product) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && product.patissierId === profile.id
	}

	async delete(user: User, product: Product) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && product.patissierId === profile.id
	}
}
