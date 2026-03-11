import { BasePolicy } from '@adonisjs/bouncer'
import PatissierProfile from '#models/patissier_profile'
import type User from '#models/user'
import type Workshop from '#models/workshop'

export default class WorkshopPolicy extends BasePolicy {
	async view(user: User, workshop: Workshop) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && workshop.patissierId === profile.id
	}

	async update(user: User, workshop: Workshop) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && workshop.patissierId === profile.id
	}

	async delete(user: User, workshop: Workshop) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && workshop.patissierId === profile.id
	}
}
