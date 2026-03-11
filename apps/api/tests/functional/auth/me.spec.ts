import { test } from '@japa/runner'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Auth - Me', (group) => {
	group.each.setup(async () => {
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('returns authenticated user info', async ({ client, assert }) => {
		const user = await User.create({
			email: 'test@example.com',
			password: 'password123',
			fullName: 'Test User',
			role: 'patissier',
		})

		await PatissierProfile.create({
			userId: user.id,
			slug: 'test-shop',
			businessName: 'Test Shop',
		})

		const response = await client.get('/auth/me').loginAs(user)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().user.email, 'test@example.com')
		assert.exists(response.body().user.profile)
		assert.equal(response.body().user.profile.slug, 'test-shop')
	})

	test('rejects unauthenticated request', async ({ client }) => {
		const response = await client.get('/auth/me')

		response.assertStatus(401)
	})
})
