import { test } from '@japa/runner'
import Category from '#models/category'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Patissier - Categories', (group) => {
	let patissierA: User
	let profileA: PatissierProfile
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
		profileA = await PatissierProfile.create({
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

	group.each.setup(async () => {
		await Category.query().delete()
	})

	group.teardown(async () => {
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('lists categories (empty initially)', async ({ client, assert }) => {
		const response = await client.get('/patissier/categories').loginAs(patissierA)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.isArray(response.body().data)
		assert.lengthOf(response.body().data, 0)
	})

	test('creates a category with name and auto-slug', async ({ client, assert }) => {
		const response = await client
			.post('/patissier/categories')
			.loginAs(patissierA)
			.json({ name: 'Tartes aux fruits' })

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.name, 'Tartes aux fruits')
		assert.equal(response.body().data.slug, 'tartes-aux-fruits')
		assert.equal(response.body().data.patissierId, profileA.id)
	})

	test('creates a category with explicit slug', async ({ client, assert }) => {
		const response = await client
			.post('/patissier/categories')
			.loginAs(patissierA)
			.json({ name: 'Mes Gateaux', slug: 'custom-slug' })

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.name, 'Mes Gateaux')
		assert.equal(response.body().data.slug, 'custom-slug')
	})

	test('rejects creating category with duplicate slug', async ({ client }) => {
		await Category.create({
			patissierId: profileA.id,
			name: 'Existing',
			slug: 'existing-slug',
			sortOrder: 0,
		})

		const response = await client
			.post('/patissier/categories')
			.loginAs(patissierA)
			.json({ name: 'Another', slug: 'existing-slug' })

		response.assertStatus(409)
	})

	test('updates a category name', async ({ client, assert }) => {
		const category = await Category.create({
			patissierId: profileA.id,
			name: 'Old Name',
			slug: 'old-name',
			sortOrder: 0,
		})

		const response = await client
			.put(`/patissier/categories/${category.id}`)
			.loginAs(patissierA)
			.json({ name: 'New Name' })

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.name, 'New Name')
	})

	test('rejects update with duplicate slug', async ({ client }) => {
		await Category.create({
			patissierId: profileA.id,
			name: 'First',
			slug: 'first-slug',
			sortOrder: 0,
		})
		const second = await Category.create({
			patissierId: profileA.id,
			name: 'Second',
			slug: 'second-slug',
			sortOrder: 1,
		})

		const response = await client
			.put(`/patissier/categories/${second.id}`)
			.loginAs(patissierA)
			.json({ slug: 'first-slug' })

		response.assertStatus(409)
	})

	test('deletes a category', async ({ client, assert }) => {
		const category = await Category.create({
			patissierId: profileA.id,
			name: 'To Delete',
			slug: 'to-delete',
			sortOrder: 0,
		})

		const response = await client.delete(`/patissier/categories/${category.id}`).loginAs(patissierA)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().message, 'Category deleted')

		// Verify it was actually deleted
		const deleted = await Category.find(category.id)
		assert.isNull(deleted)
	})

	test('returns 404 when trying to update another patissier category', async ({
		client,
		assert,
	}) => {
		const categoryB = await Category.create({
			patissierId: profileB.id,
			name: 'B Category',
			slug: 'b-category',
			sortOrder: 0,
		})

		const response = await client
			.put(`/patissier/categories/${categoryB.id}`)
			.loginAs(patissierA)
			.json({ name: 'Hacked!' })

		assert.includeMembers([403, 404], [response.status()])
	})

	test('returns 404 when trying to delete another patissier category', async ({
		client,
		assert,
	}) => {
		const categoryB = await Category.create({
			patissierId: profileB.id,
			name: 'B To Delete',
			slug: 'b-to-delete',
			sortOrder: 0,
		})

		const response = await client
			.delete(`/patissier/categories/${categoryB.id}`)
			.loginAs(patissierA)

		assert.includeMembers([403, 404], [response.status()])
	})
})
