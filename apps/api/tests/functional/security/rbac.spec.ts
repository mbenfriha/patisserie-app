import { test } from '@japa/runner'
import Category from '#models/category'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Security - RBAC', (group) => {
	let patissierA: User
	let patissierB: User
	let profileB: PatissierProfile

	group.setup(async () => {
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissierA = await User.create({
			email: 'patissier-a@example.com',
			password: 'password123',
			fullName: 'Patissier A',
			role: 'patissier',
		})
		await PatissierProfile.create({
			userId: patissierA.id,
			slug: 'patissier-a',
			businessName: 'Shop A',
		})

		patissierB = await User.create({
			email: 'patissier-b@example.com',
			password: 'password123',
			fullName: 'Patissier B',
			role: 'patissier',
		})
		profileB = await PatissierProfile.create({
			userId: patissierB.id,
			slug: 'patissier-b',
			businessName: 'Shop B',
		})
	})

	group.teardown(async () => {
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('patissier A cannot see patissier B categories', async ({ client, assert }) => {
		// Create a category for patissier B
		await Category.create({
			patissierId: profileB.id,
			name: 'Secret Category',
			slug: 'secret',
		})

		// Patissier A lists categories — should only see their own
		const response = await client.get('/patissier/categories').loginAs(patissierA)

		response.assertStatus(200)
		const categories = response.body().data
		assert.isArray(categories)
		// None of patissier B's categories should appear
		for (const cat of categories) {
			assert.notEqual(cat.name, 'Secret Category')
		}
	})

	test('patissier A cannot update patissier B category', async ({ client, assert }) => {
		const categoryB = await Category.create({
			patissierId: profileB.id,
			name: 'B Category',
			slug: 'b-cat',
		})

		const response = await client
			.put(`/patissier/categories/${categoryB.id}`)
			.loginAs(patissierA)
			.json({ name: 'Hacked!' })

		// Should get 404 (SQL scoping) or 403 (bouncer)
		assert.includeMembers([403, 404], [response.status()])
	})

	test('patissier A cannot delete patissier B category', async ({ client, assert }) => {
		const categoryB = await Category.create({
			patissierId: profileB.id,
			name: 'To Delete',
			slug: 'to-delete',
		})

		const response = await client
			.delete(`/patissier/categories/${categoryB.id}`)
			.loginAs(patissierA)

		assert.includeMembers([403, 404], [response.status()])
	})
})
