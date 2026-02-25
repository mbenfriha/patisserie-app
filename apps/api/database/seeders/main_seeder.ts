import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import User from '#models/user'
import env from '#start/env'

export default class MainSeeder extends BaseSeeder {
	async run() {
		const email = env.get('SUPERADMIN_EMAIL')
		const password = env.get('SUPERADMIN_PASSWORD')

		if (!email || !password) {
			console.error('❌ SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD env variables are required')
			return
		}

		const existing = await User.findBy('email', email)
		if (existing) {
			console.log('⚠️  Superadmin already exists:', email)
			return
		}

		const superadmin = await User.create({
			email,
			password,
			role: 'superadmin',
			fullName: 'Super Admin',
			emailVerifiedAt: DateTime.now(),
		})

		console.log('✅ Superadmin created:', superadmin.email)
	}
}
