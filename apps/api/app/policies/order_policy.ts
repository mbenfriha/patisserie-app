import { BasePolicy } from '@adonisjs/bouncer'
import type Order from '#models/order'
import PatissierProfile from '#models/patissier_profile'
import type User from '#models/user'

export default class OrderPolicy extends BasePolicy {
	async view(user: User, order: Order) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && order.patissierId === profile.id
	}

	async update(user: User, order: Order) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && order.patissierId === profile.id
	}

	async delete(user: User, order: Order) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		if (!profile || order.patissierId !== profile.id) return false
		return order.status === 'pending'
	}

	async sendQuote(user: User, order: Order) {
		const profile = await PatissierProfile.findBy('userId', user.id)
		if (!profile || order.patissierId !== profile.id) return false
		return order.type === 'custom'
	}
}
