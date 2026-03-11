import { test } from '@japa/runner'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import OrderMessage from '#models/order_message'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import User from '#models/user'

test.group('Client - Orders', (group) => {
	let patissier: User
	let profile: PatissierProfile
	let product: Product

	group.setup(async () => {
		await OrderMessage.query().delete()
		await OrderItem.query().delete()
		await Order.query().delete()
		await Product.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissier = await User.create({
			email: 'client-orders-patissier@example.com',
			password: 'password123',
			fullName: 'Client Orders Patissier',
			role: 'patissier',
		})

		profile = await PatissierProfile.create({
			userId: patissier.id,
			slug: 'client-orders-shop',
			businessName: 'Client Orders Shop',
			plan: 'pro',
		})

		product = await Product.create({
			patissierId: profile.id,
			name: 'Eclair',
			price: 8,
			images: [],
			sortOrder: 0,
			isVisible: true,
		})
	})

	group.each.setup(async () => {
		await OrderMessage.query().delete()
		await OrderItem.query().delete()
		await Order.query().delete()
	})

	group.teardown(async () => {
		await OrderMessage.query().delete()
		await OrderItem.query().delete()
		await Order.query().delete()
		await Product.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('shows an order by orderNumber and email', async ({ client, assert }) => {
		const order = await Order.create({
			orderNumber: 'PAT-20260307-100',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Alice Dupont',
			clientEmail: 'alice@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client.get(`/client/orders/${order.orderNumber}?email=alice@example.com`)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.orderNumber, 'PAT-20260307-100')
		assert.equal(response.body().data.clientName, 'Alice Dupont')
		assert.equal(response.body().data.clientEmail, 'alice@example.com')
	})

	test('returns 404 for wrong email on show', async ({ client, assert }) => {
		await Order.create({
			orderNumber: 'PAT-20260307-101',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Bob Martin',
			clientEmail: 'bob@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client.get('/client/orders/PAT-20260307-101?email=wrong@example.com')

		response.assertStatus(404)
		assert.isFalse(response.body().success)
	})

	test('returns 404 for non-existent orderNumber', async ({ client, assert }) => {
		const response = await client.get('/client/orders/PAT-00000000-999?email=nobody@example.com')

		response.assertStatus(404)
		assert.isFalse(response.body().success)
	})

	test('lists messages for an order', async ({ client, assert }) => {
		const order = await Order.create({
			orderNumber: 'PAT-20260307-102',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Charlie Leclerc',
			clientEmail: 'charlie@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		await OrderMessage.create({
			orderId: order.id,
			senderType: 'client',
			senderId: null,
			message: 'Bonjour, une question sur ma commande.',
		})
		await OrderMessage.create({
			orderId: order.id,
			senderType: 'patissier',
			senderId: patissier.id,
			message: 'Bien sur, je vous ecoute.',
		})

		const response = await client.get(
			`/client/orders/${order.orderNumber}/messages?email=charlie@example.com`
		)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.isArray(response.body().data)
		assert.lengthOf(response.body().data, 2)
		assert.equal(response.body().data[0].message, 'Bonjour, une question sur ma commande.')
		assert.equal(response.body().data[1].message, 'Bien sur, je vous ecoute.')
	})

	test('sends a message on an order', async ({ client, assert }) => {
		const order = await Order.create({
			orderNumber: 'PAT-20260307-103',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Diana Prince',
			clientEmail: 'diana@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client.post(`/client/orders/${order.orderNumber}/messages`).json({
			message: 'Quand sera prete ma commande ?',
			senderName: 'Diana Prince',
			clientEmail: 'diana@example.com',
		})

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.message, 'Quand sera prete ma commande ?')
		assert.equal(response.body().data.senderType, 'client')

		// Verify message was persisted
		const messages = await OrderMessage.query().where('orderId', order.id)
		assert.lengthOf(messages, 1)
	})

	test('rejects showing order with missing email param', async ({ client }) => {
		await Order.create({
			orderNumber: 'PAT-20260307-104',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Eve Adams',
			clientEmail: 'eve@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client.get('/client/orders/PAT-20260307-104')

		response.assertStatus(422)
	})

	test('create order returns 201 or 403 depending on Turnstile', async ({ client, assert }) => {
		const response = await client.post('/client/orders').json({
			slug: profile.slug,
			type: 'catalogue',
			clientName: 'Frank Castle',
			clientEmail: 'frank@example.com',
			deliveryMethod: 'pickup',
			items: [{ product_id: product.id, quantity: 2 }],
		})

		// Turnstile is not configured in test env, so expect 403.
		// If Turnstile is bypassed (e.g. via env flag), expect 201.
		assert.includeMembers([201, 403], [response.status()])

		if (response.status() === 201) {
			assert.isTrue(response.body().success)
			assert.equal(response.body().data.type, 'catalogue')
			assert.equal(response.body().data.clientName, 'Frank Castle')
			assert.match(response.body().data.orderNumber, /^PAT-\d{8}-\d{6}$/)
		} else {
			assert.isFalse(response.body().success)
		}
	})
})
