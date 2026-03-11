import { test } from '@japa/runner'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Patissier - Profile', (group) => {
	let patissier: User
	let profile: PatissierProfile

	group.setup(async () => {
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissier = await User.create({
			email: 'profile-test@example.com',
			password: 'password123',
			fullName: 'Profile Tester',
			role: 'patissier',
		})
		profile = await PatissierProfile.create({
			userId: patissier.id,
			slug: 'profile-test-shop',
			businessName: 'Test Patisserie',
		})
	})

	group.teardown(async () => {
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('returns authenticated patissier profile', async ({ client, assert }) => {
		const response = await client.get('/patissier/profile').loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.slug, 'profile-test-shop')
		assert.equal(response.body().data.businessName, 'Test Patisserie')
	})

	test('rejects unauthenticated access to profile', async ({ client }) => {
		const response = await client.get('/patissier/profile')
		response.assertStatus(401)
	})

	test('updates profile business name', async ({ client, assert }) => {
		const response = await client
			.patch('/patissier/profile')
			.loginAs(patissier)
			.json({ businessName: 'Updated Patisserie' })

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.businessName, 'Updated Patisserie')

		// Restore original
		await profile.merge({ businessName: 'Test Patisserie' }).save()
	})

	test('updates profile with optional fields', async ({ client, assert }) => {
		const response = await client.patch('/patissier/profile').loginAs(patissier).json({
			description: 'Best pastries in town',
			phone: '+33612345678',
			addressCity: 'Paris',
			acceptsCustomOrders: true,
		})

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.description, 'Best pastries in town')
		assert.equal(response.body().data.addressCity, 'Paris')
	})

	test('updates profile social links', async ({ client, assert }) => {
		const response = await client
			.patch('/patissier/profile')
			.loginAs(patissier)
			.json({
				socialLinks: {
					instagram: 'https://instagram.com/test',
					facebook: 'https://facebook.com/test',
				},
			})

		response.assertStatus(200)
		assert.isTrue(response.body().success)
	})

	test('rejects businessName too short', async ({ client }) => {
		const response = await client
			.patch('/patissier/profile')
			.loginAs(patissier)
			.json({ businessName: 'A' })

		response.assertStatus(422)
	})

	test('rejects businessName too long', async ({ client }) => {
		const response = await client
			.patch('/patissier/profile')
			.loginAs(patissier)
			.json({ businessName: 'A'.repeat(101) })

		response.assertStatus(422)
	})

	test('rejects invalid defaultDepositPercent', async ({ client }) => {
		const response = await client
			.patch('/patissier/profile')
			.loginAs(patissier)
			.json({ defaultDepositPercent: 150 })

		response.assertStatus(422)
	})

	test('patissier A cannot see patissier B profile', async ({ client, assert }) => {
		const patissierB = await User.create({
			email: 'other-patissier@example.com',
			password: 'password123',
			fullName: 'Other Patissier',
			role: 'patissier',
		})
		await PatissierProfile.create({
			userId: patissierB.id,
			slug: 'other-shop',
			businessName: 'Other Shop',
		})

		// Patissier A sees their own profile, not B's
		const response = await client.get('/patissier/profile').loginAs(patissier)

		response.assertStatus(200)
		assert.equal(response.body().data.slug, 'profile-test-shop')
		assert.notEqual(response.body().data.slug, 'other-shop')
	})
})
