import { BasePolicy } from '@adonisjs/bouncer'
import type Creation from '#models/creation'
import PatissierProfile from '#models/patissier_profile'
import type User from '#models/user'

export default class CreationPolicy extends BasePolicy {
	async view(user: User, creation: Creation) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && creation.patissierId === profile.id
	}

	async update(user: User, creation: Creation) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && creation.patissierId === profile.id
	}

	async delete(user: User, creation: Creation) {
		if (user.role === 'superadmin') return true
		const profile = await PatissierProfile.findBy('userId', user.id)
		return !!profile && creation.patissierId === profile.id
	}
}
