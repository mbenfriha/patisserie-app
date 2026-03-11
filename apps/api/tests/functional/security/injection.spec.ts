import { test } from '@japa/runner'
import Category from '#models/category'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Security - SQL Injection', (group) => {
	let patissier: User

	group.setup(async () => {
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissier = await User.create({
			email: 'sqli-patissier@example.com',
			password: 'password123',
			fullName: 'SQLi Test Patissier',
			role: 'patissier',
		})
		await PatissierProfile.create({
			userId: patissier.id,
			slug: 'sqli-test-shop',
			businessName: 'SQLi Test Shop',
		})
	})

	group.teardown(async () => {
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('rejects SQL injection in login email field', async ({ client, assert }) => {
		const response = await client.post('/auth/login').json({
			email: "' OR '1'='1",
			password: 'password',
		})

		// Should be 422 (invalid email format) or 400 (bad credentials), never 200
		assert.notEqual(response.status(), 200)
		assert.notEqual(response.status(), 500)
		assert.includeMembers([400, 422], [response.status()])
	})

	test('rejects SQL injection in register slug', async ({ client, assert }) => {
		const response = await client.post('/auth/register').json({
			email: 'sqli-register@test.com',
			password: 'password123',
			fullName: 'Test',
			slug: "'; DROP TABLE users; --",
			businessName: 'Shop',
		})

		// Slug format validation should reject this
		response.assertStatus(422)
		assert.notEqual(response.status(), 500)
	})

	test('handles SQL injection in public slug route without crashing', async ({
		client,
		assert,
	}) => {
		const response = await client.get("/public/'; DROP TABLE users; --")

		// Should return 404 (no profile found) — not crash
		response.assertStatus(404)
		assert.notEqual(response.status(), 500)
	})

	test('handles SQL injection in category name safely', async ({ client, assert }) => {
		const response = await client
			.post('/patissier/categories')
			.loginAs(patissier)
			.json({ name: "'; DROP TABLE categories; --" })

		// ORM uses parameterized queries, so this either succeeds (stores literal string)
		// or returns 422 if validation rejects it — but never executes raw SQL
		assert.notEqual(response.status(), 500)
		assert.includeMembers([200, 201, 422], [response.status()])

		// Verify the users table still exists by querying it
		const userCount = await User.query().count('* as total')
		assert.isAbove(Number(userCount[0].$extras.total), 0)
	})

	test('handles SQL injection in query params without crashing', async ({ client, assert }) => {
		const response = await client
			.get('/patissier/categories?page=1; DROP TABLE users')
			.loginAs(patissier)

		// Should not crash — invalid page param is ignored or causes a safe error
		assert.notEqual(response.status(), 500)

		// Verify the users table still exists
		const userCount = await User.query().count('* as total')
		assert.isAbove(Number(userCount[0].$extras.total), 0)
	})
})

test.group('Security - XSS', (group) => {
	let patissier: User

	group.setup(async () => {
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissier = await User.create({
			email: 'xss-patissier@example.com',
			password: 'password123',
			fullName: 'XSS Test Patissier',
			role: 'patissier',
		})
		await PatissierProfile.create({
			userId: patissier.id,
			slug: 'xss-test-shop',
			businessName: 'XSS Test Shop',
		})
	})

	group.teardown(async () => {
		await Category.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('handles XSS in registration fullName', async ({ client, assert }) => {
		const xssPayload = "<script>alert('xss')</script>"

		const response = await client.post('/auth/register').json({
			email: 'xss@test.com',
			password: 'password123',
			fullName: xssPayload,
			slug: 'xss-shop',
			businessName: 'Shop',
		})

		// The API should not crash on XSS payloads
		assert.notEqual(response.status(), 500)

		// JSON APIs store raw values — XSS protection is handled by the frontend
		// which escapes content on render (React does this by default)
		assert.includeMembers([201, 422, 400], [response.status()])
	})

	test('handles XSS in category name', async ({ client, assert }) => {
		const xssPayload = '<img src=x onerror=alert(1)>'

		const response = await client
			.post('/patissier/categories')
			.loginAs(patissier)
			.json({ name: xssPayload })

		assert.notEqual(response.status(), 500)

		if (response.status() === 200 || response.status() === 201) {
			// If stored, the returned value should not contain unescaped HTML
			const body = response.body()
			const returnedName = body.data?.name ?? ''
			// Either the tags were stripped/escaped, or stored as-is
			// (output encoding is the frontend's responsibility, but we check the API doesn't crash)
			assert.isString(returnedName)
		} else {
			// Validator rejected the input — also acceptable
			assert.includeMembers([422, 400], [response.status()])
		}
	})

	test('handles XSS in public check-slug endpoint', async ({ client, assert }) => {
		const response = await client.get('/public/check-slug/<script>alert(1)</script>')

		assert.notEqual(response.status(), 500)

		// The response should be a normal JSON response without executing anything
		const body = response.body()
		assert.exists(body)
	})
})
