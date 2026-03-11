import { test } from '@japa/runner'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import User from '#models/user'

test.group('Patissier - Products', (group) => {
	let patissierA: User
	let profileA: PatissierProfile
	let patissierB: User
	let profileB: PatissierProfile

	group.setup(async () => {
		await Product.query().delete()
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
			plan: 'pro',
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
			plan: 'pro',
		})
	})

	group.each.setup(async () => {
		await Product.query().delete()
	})

	group.teardown(async () => {
		await Product.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('lists products (empty initially)', async ({ client, assert }) => {
		const response = await client.get('/patissier/products').loginAs(patissierA)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.isArray(response.body().data.data)
		assert.lengthOf(response.body().data.data, 0)
	})

	test('creates a product with valid data', async ({ client, assert }) => {
		const response = await client
			.post('/patissier/products')
			.loginAs(patissierA)
			.json({ name: 'Tarte aux pommes', price: 25, images: [] })

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.name, 'Tarte aux pommes')
		assert.equal(response.body().data.price, 25)
		assert.equal(response.body().data.patissierId, profileA.id)
	})

	test('creates a product with all optional fields', async ({ client, assert }) => {
		const response = await client
			.post('/patissier/products')
			.loginAs(patissierA)
			.json({
				name: 'Croissant premium',
				description: 'Un croissant artisanal au beurre',
				price: 3.5,
				images: [{ url: 'https://example.com/croissant.jpg', alt: 'Croissant' }],
				unit: 'piece',
				minQuantity: 1,
				maxQuantity: 50,
				preparationDays: 2,
				isAvailable: true,
				isVisible: true,
				allergens: ['gluten', 'lait'],
				tags: ['viennoiserie', 'petit-dejeuner'],
			})

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.name, 'Croissant premium')
		assert.equal(response.body().data.description, 'Un croissant artisanal au beurre')
		assert.equal(response.body().data.price, 3.5)
		assert.equal(response.body().data.unit, 'piece')
		assert.equal(response.body().data.minQuantity, 1)
		assert.equal(response.body().data.maxQuantity, 50)
		assert.equal(response.body().data.preparationDays, 2)
		assert.deepEqual(response.body().data.allergens, ['gluten', 'lait'])
		assert.deepEqual(response.body().data.tags, ['viennoiserie', 'petit-dejeuner'])
	})

	test('rejects creating product without name', async ({ client }) => {
		const response = await client
			.post('/patissier/products')
			.loginAs(patissierA)
			.json({ price: 10, images: [] })

		response.assertStatus(422)
	})

	test('rejects creating product with negative price', async ({ client }) => {
		const response = await client
			.post('/patissier/products')
			.loginAs(patissierA)
			.json({ name: 'Bad product', price: -5, images: [] })

		response.assertStatus(422)
	})

	test('shows a single product', async ({ client, assert }) => {
		const product = await Product.create({
			patissierId: profileA.id,
			name: 'Eclair chocolat',
			price: 5,
			images: [],
			sortOrder: 0,
			isVisible: true,
		})

		const response = await client.get(`/patissier/products/${product.id}`).loginAs(patissierA)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.id, product.id)
		assert.equal(response.body().data.name, 'Eclair chocolat')
	})

	test('updates a product name', async ({ client, assert }) => {
		const product = await Product.create({
			patissierId: profileA.id,
			name: 'Old Name',
			price: 10,
			images: [],
			sortOrder: 0,
			isVisible: true,
		})

		const response = await client
			.put(`/patissier/products/${product.id}`)
			.loginAs(patissierA)
			.json({ name: 'New Name' })

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.name, 'New Name')
	})

	test('deletes a product', async ({ client, assert }) => {
		const product = await Product.create({
			patissierId: profileA.id,
			name: 'To Delete',
			price: 15,
			images: [],
			sortOrder: 0,
			isVisible: true,
		})

		const response = await client.delete(`/patissier/products/${product.id}`).loginAs(patissierA)

		response.assertStatus(200)
		assert.isTrue(response.body().success)

		const deleted = await Product.find(product.id)
		assert.isNull(deleted)
	})

	test('cannot update another patissier product', async ({ client, assert }) => {
		const productB = await Product.create({
			patissierId: profileB.id,
			name: 'B Product',
			price: 20,
			images: [],
			sortOrder: 0,
			isVisible: true,
		})

		const response = await client
			.put(`/patissier/products/${productB.id}`)
			.loginAs(patissierA)
			.json({ name: 'Hacked!' })

		assert.includeMembers([403, 404], [response.status()])
	})

	test('cannot delete another patissier product', async ({ client, assert }) => {
		const productB = await Product.create({
			patissierId: profileB.id,
			name: 'B To Delete',
			price: 20,
			images: [],
			sortOrder: 0,
			isVisible: true,
		})

		const response = await client.delete(`/patissier/products/${productB.id}`).loginAs(patissierA)

		assert.includeMembers([403, 404], [response.status()])
	})
})
