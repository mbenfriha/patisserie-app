import { test } from '@japa/runner'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Auth - Logout', (group) => {
	group.each.setup(async () => {
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('logs out authenticated user', async ({ client }) => {
		const user = await User.create({
			email: 'logout@example.com',
			password: 'password123',
			fullName: 'Logout User',
			role: 'patissier',
		})

		const response = await client.post('/auth/logout').loginAs(user)

		response.assertStatus(200)
	})

	test('rejects logout for unauthenticated user', async ({ client }) => {
		const response = await client.post('/auth/logout')

		response.assertStatus(401)
	})
})
