import { test } from '@japa/runner'
import Category from '#models/category'
import Creation from '#models/creation'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Public - Site', (group) => {
	let user: User
	let profile: PatissierProfile
	let category: Category
	group.setup(async () => {
		await Creation.query().delete()
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		user = await User.create({
			email: 'patissier@example.com',
			password: 'password123',
			fullName: 'Test Patissier',
			role: 'patissier',
		})

		profile = await PatissierProfile.create({
			userId: user.id,
			slug: 'ma-patisserie',
			businessName: 'Ma Patisserie',
		})

		category = await Category.create({
			patissierId: profile.id,
			name: 'Gateaux',
			slug: 'gateaux',
			isVisible: true,
			sortOrder: 1,
		})

		await Creation.create({
			patissierId: profile.id,
			categoryId: category.id,
			title: 'Tarte aux fraises',
			slug: 'tarte-aux-fraises',
			description: 'Une belle tarte',
			isVisible: true,
			isFeatured: false,
			images: [],
			sortOrder: 1,
		})
	})

	group.teardown(async () => {
		await Creation.query().delete()
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('check-slug returns available for non-existing slug', async ({ client, assert }) => {
		const response = await client.get('/public/check-slug/some-new-slug')

		response.assertStatus(200)
		assert.isTrue(response.body().data.available)
		assert.equal(response.body().data.slug, 'some-new-slug')
	})

	test('check-slug returns unavailable for existing slug', async ({ client, assert }) => {
		const response = await client.get('/public/check-slug/ma-patisserie')

		response.assertStatus(200)
		assert.isFalse(response.body().data.available)
	})

	test('check-slug returns unavailable with reason for too-short slug', async ({
		client,
		assert,
	}) => {
		const response = await client.get('/public/check-slug/ab')

		response.assertStatus(200)
		assert.isFalse(response.body().data.available)
		assert.equal(response.body().data.reason, 'too_short')
	})

	test('public profile returns data for valid slug', async ({ client, assert }) => {
		const response = await client.get('/public/ma-patisserie')

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.slug, 'ma-patisserie')
		assert.equal(response.body().data.businessName, 'Ma Patisserie')
	})

	test('public profile returns 404 for non-existing slug', async ({ client, assert }) => {
		const response = await client.get('/public/non-existing-slug')

		response.assertStatus(404)
		assert.isFalse(response.body().success)
		assert.equal(response.body().message, 'Patissier not found')
	})

	test('public categories returns categories for valid slug', async ({ client, assert }) => {
		const response = await client.get('/public/ma-patisserie/categories')

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.isArray(response.body().data)
		assert.isAbove(response.body().data.length, 0)
		assert.equal(response.body().data[0].name, 'Gateaux')
	})

	test('public creations returns creations for valid slug', async ({ client, assert }) => {
		const response = await client.get('/public/ma-patisserie/creations')

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.isArray(response.body().data)
		assert.isAbove(response.body().data.length, 0)
		assert.equal(response.body().data[0].title, 'Tarte aux fraises')
	})
})
