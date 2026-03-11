import { test } from '@japa/runner'
import Category from '#models/category'
import Creation from '#models/creation'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Patissier - Creations', (group) => {
	let patissier: User
	let profile: PatissierProfile
	let category: Category

	group.setup(async () => {
		await Creation.query().delete()
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissier = await User.create({
			email: 'creation-test@example.com',
			password: 'password123',
			fullName: 'Creation Tester',
			role: 'patissier',
		})
		profile = await PatissierProfile.create({
			userId: patissier.id,
			slug: 'creation-shop',
			businessName: 'Creation Shop',
		})
		category = await Category.create({
			patissierId: profile.id,
			name: 'Cakes',
			slug: 'cakes',
		})
	})

	group.teardown(async () => {
		await Creation.query().delete()
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('lists creations (empty initially)', async ({ client, assert }) => {
		const response = await client.get('/patissier/creations').loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
	})

	test('creates a creation with title', async ({ client, assert }) => {
		const response = await client.post('/patissier/creations').loginAs(patissier).json({
			title: 'Tarte aux fraises',
			description: 'A delicious strawberry tart',
			categoryId: category.id,
			price: 35,
		})

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.title, 'Tarte aux fraises')
		assert.equal(response.body().data.price, 35)
	})

	test('creates a creation with minimal data', async ({ client, assert }) => {
		const response = await client
			.post('/patissier/creations')
			.loginAs(patissier)
			.json({ title: 'Simple Creation' })

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.title, 'Simple Creation')
	})

	test('creates a creation without title (title is optional)', async ({ client, assert }) => {
		const response = await client
			.post('/patissier/creations')
			.loginAs(patissier)
			.json({ description: 'No title creation' })

		response.assertStatus(201)
		assert.isTrue(response.body().success)
	})

	test('rejects creation with too long title', async ({ client }) => {
		const response = await client
			.post('/patissier/creations')
			.loginAs(patissier)
			.json({ title: 'A'.repeat(201) })

		response.assertStatus(422)
	})

	test('rejects creation with negative price', async ({ client }) => {
		const response = await client
			.post('/patissier/creations')
			.loginAs(patissier)
			.json({ title: 'Negative price', price: -10 })

		response.assertStatus(422)
	})

	test('rejects creation with invalid categoryId', async ({ client }) => {
		const response = await client
			.post('/patissier/creations')
			.loginAs(patissier)
			.json({ title: 'Bad Category', categoryId: 'not-a-uuid' })

		response.assertStatus(422)
	})

	test('updates a creation', async ({ client, assert }) => {
		const creation = await Creation.create({
			patissierId: profile.id,
			title: 'To Update',
			slug: 'to-update',
			images: [],
		})

		const response = await client
			.put(`/patissier/creations/${creation.id}`)
			.loginAs(patissier)
			.json({ title: 'Updated Title', price: 50 })

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.title, 'Updated Title')
		assert.equal(response.body().data.price, 50)
	})

	test('deletes a creation', async ({ client, assert }) => {
		const creation = await Creation.create({
			patissierId: profile.id,
			title: 'To Delete',
			slug: 'to-delete',
			images: [],
		})

		const response = await client.delete(`/patissier/creations/${creation.id}`).loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
	})

	test('cannot access another patissier creations', async ({ client, assert }) => {
		const otherUser = await User.create({
			email: 'other-creation@example.com',
			password: 'password123',
			fullName: 'Other User',
			role: 'patissier',
		})
		const otherProfile = await PatissierProfile.create({
			userId: otherUser.id,
			slug: 'other-creation-shop',
			businessName: 'Other Shop',
		})
		const otherCreation = await Creation.create({
			patissierId: otherProfile.id,
			title: 'Secret Creation',
			slug: 'secret-creation',
			images: [],
		})

		// Try to update another patissier's creation
		const updateResponse = await client
			.put(`/patissier/creations/${otherCreation.id}`)
			.loginAs(patissier)
			.json({ title: 'Hacked!' })

		assert.includeMembers([403, 404], [updateResponse.status()])

		// Try to delete another patissier's creation
		const deleteResponse = await client
			.delete(`/patissier/creations/${otherCreation.id}`)
			.loginAs(patissier)

		assert.includeMembers([403, 404], [deleteResponse.status()])
	})
})
