import { test } from '@japa/runner'
import User from '#models/user'

test.group('Auth - Login', (group) => {
	group.each.setup(async () => {
		await User.query().delete()
	})

	test('logs in with valid credentials', async ({ client, assert }) => {
		await User.create({
			email: 'test@example.com',
			password: 'password123',
			fullName: 'Test User',
			role: 'patissier',
		})

		const response = await client.post('/auth/login').json({
			email: 'test@example.com',
			password: 'password123',
		})

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.exists(response.body().token)
		assert.equal(response.body().user.email, 'test@example.com')
	})

	test('rejects login with wrong password', async ({ client }) => {
		await User.create({
			email: 'test@example.com',
			password: 'password123',
			fullName: 'Test User',
			role: 'patissier',
		})

		const response = await client.post('/auth/login').json({
			email: 'test@example.com',
			password: 'wrongpassword',
		})

		response.assertStatus(400)
	})

	test('rejects login with non-existent email', async ({ client }) => {
		const response = await client.post('/auth/login').json({
			email: 'nonexistent@example.com',
			password: 'password123',
		})

		response.assertStatus(400)
	})

	test('rejects login for suspended user', async ({ client }) => {
		const { DateTime } = await import('luxon')

		await User.create({
			email: 'suspended@example.com',
			password: 'password123',
			fullName: 'Suspended User',
			role: 'patissier',
			suspendedAt: DateTime.now(),
			suspendReason: 'Violation of terms',
		})

		const response = await client.post('/auth/login').json({
			email: 'suspended@example.com',
			password: 'password123',
		})

		response.assertStatus(403)
	})

	test('rejects login with invalid email format', async ({ client }) => {
		const response = await client.post('/auth/login').json({
			email: 'invalid',
			password: 'password123',
		})

		response.assertStatus(422)
	})
})
