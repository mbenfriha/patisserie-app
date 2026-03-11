import { test } from '@japa/runner'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Auth - Register', (group) => {
	group.each.setup(async () => {
		// Clean up test data
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('registers a new user with valid data', async ({ client, assert }) => {
		const response = await client.post('/auth/register').json({
			email: 'test@example.com',
			password: 'password123',
			fullName: 'Test User',
			slug: 'test-shop',
			businessName: 'Test Shop',
		})

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.exists(response.body().token)
		assert.equal(response.body().user.email, 'test@example.com')
		assert.equal(response.body().user.role, 'patissier')

		// Verify profile was created
		const profile = await PatissierProfile.findBy('slug', 'test-shop')
		assert.isNotNull(profile)
		assert.equal(profile!.businessName, 'Test Shop')
	})

	test('rejects registration with duplicate email', async ({ client }) => {
		await User.create({
			email: 'existing@example.com',
			password: 'password123',
			fullName: 'Existing User',
			role: 'patissier',
		})

		const response = await client.post('/auth/register').json({
			email: 'existing@example.com',
			password: 'password123',
			fullName: 'New User',
			slug: 'new-shop',
			businessName: 'New Shop',
		})

		response.assertStatus(409)
	})

	test('rejects registration with duplicate slug', async ({ client }) => {
		// Create first user with the slug
		await client.post('/auth/register').json({
			email: 'first@example.com',
			password: 'password123',
			fullName: 'First User',
			slug: 'taken-slug',
			businessName: 'First Shop',
		})

		const response = await client.post('/auth/register').json({
			email: 'second@example.com',
			password: 'password123',
			fullName: 'Second User',
			slug: 'taken-slug',
			businessName: 'Second Shop',
		})

		response.assertStatus(409)
	})

	test('rejects registration with invalid email', async ({ client }) => {
		const response = await client.post('/auth/register').json({
			email: 'not-an-email',
			password: 'password123',
			fullName: 'Test User',
			slug: 'test-shop',
			businessName: 'Test Shop',
		})

		response.assertStatus(422)
	})

	test('rejects registration with short password', async ({ client }) => {
		const response = await client.post('/auth/register').json({
			email: 'test@example.com',
			password: '123',
			fullName: 'Test User',
			slug: 'test-shop',
			businessName: 'Test Shop',
		})

		response.assertStatus(422)
	})

	test('rejects registration with invalid slug format', async ({ client }) => {
		const response = await client.post('/auth/register').json({
			email: 'test@example.com',
			password: 'password123',
			fullName: 'Test User',
			slug: 'Invalid Slug!',
			businessName: 'Test Shop',
		})

		response.assertStatus(422)
	})

	test('rejects registration with missing required fields', async ({ client }) => {
		const response = await client.post('/auth/register').json({
			email: 'test@example.com',
		})

		response.assertStatus(422)
	})
})
