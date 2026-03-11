import { test } from '@japa/runner'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Superadmin - Users', (group) => {
	let superadmin: User
	let patissier: User

	group.setup(async () => {
		await PatissierProfile.query().delete()
		await User.query().delete()

		// Create superadmin user
		superadmin = await User.create({
			email: 'admin@patissio.com',
			password: 'password123',
			fullName: 'Super Admin',
			role: 'superadmin',
		})

		// Create a regular patissier
		patissier = await User.create({
			email: 'pat@example.com',
			password: 'password123',
			fullName: 'Regular Patissier',
			role: 'patissier',
		})
		await PatissierProfile.create({
			userId: patissier.id,
			slug: 'regular-pat',
			businessName: 'Regular Shop',
		})
	})

	group.teardown(async () => {
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('lists all users as superadmin', async ({ client, assert }) => {
		const response = await client.get('/superadmin/users').loginAs(superadmin)

		response.assertStatus(200)
		assert.isTrue(response.body().success)

		const { data } = response.body().data
		assert.isArray(data)
		assert.isAtLeast(data.length, 2)

		const emails = data.map((u: { email: string }) => u.email)
		assert.include(emails, 'admin@patissio.com')
		assert.include(emails, 'pat@example.com')
	})

	test('shows a single user by id', async ({ client, assert }) => {
		const response = await client.get(`/superadmin/users/${patissier.id}`).loginAs(superadmin)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.email, 'pat@example.com')
		assert.equal(response.body().data.fullName, 'Regular Patissier')
		assert.exists(response.body().data.patissierProfile)
	})

	test('suspends a user', async ({ client, assert }) => {
		const response = await client
			.post(`/superadmin/users/${patissier.id}/suspend`)
			.loginAs(superadmin)
			.json({ reason: 'Violation of terms' })

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.isNotNull(response.body().data.suspendedAt)
		assert.equal(response.body().data.suspendReason, 'Violation of terms')

		// Verify in database
		await patissier.refresh()
		assert.isNotNull(patissier.suspendedAt)
		assert.equal(patissier.suspendReason, 'Violation of terms')
	})

	test('unsuspends a user', async ({ client, assert }) => {
		// Ensure the user is suspended first (from previous test or explicitly)
		await patissier.refresh()
		if (!patissier.suspendedAt) {
			const { DateTime } = await import('luxon')
			patissier.suspendedAt = DateTime.now()
			patissier.suspendReason = 'Test suspension'
			await patissier.save()
		}

		const response = await client
			.post(`/superadmin/users/${patissier.id}/unsuspend`)
			.loginAs(superadmin)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.isNull(response.body().data.suspendedAt)
		assert.isNull(response.body().data.suspendReason)

		// Verify in database
		await patissier.refresh()
		assert.isNull(patissier.suspendedAt)
		assert.isNull(patissier.suspendReason)
	})

	test('rejects access from non-superadmin user', async ({ client }) => {
		const response = await client.get('/superadmin/users').loginAs(patissier)

		response.assertStatus(403)
	})

	test('rejects unauthenticated access to superadmin routes', async ({ client }) => {
		const response = await client.get('/superadmin/users')

		response.assertStatus(401)
	})

	test('rejects suspending a non-existent user', async ({ client }) => {
		const fakeId = '00000000-0000-0000-0000-000000000000'

		const response = await client
			.post(`/superadmin/users/${fakeId}/suspend`)
			.loginAs(superadmin)
			.json({ reason: 'Does not exist' })

		response.assertStatus(404)
	})
})
