import { Bouncer } from '@adonisjs/bouncer'
import type User from '#models/user'

export const isSuperAdmin = Bouncer.ability((user: User) => {
	return user.role === 'superadmin'
})

export const isPatissier = Bouncer.ability((user: User) => {
	return user.role === 'patissier'
})
