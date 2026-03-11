import { test } from '@japa/runner'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'

test.group('Superadmin - Orders', (group) => {
	let superadmin: User
	let patissier: User
	let profile: PatissierProfile
	let orders: Order[]

	group.setup(async () => {
		await OrderItem.query().delete()
		await Order.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		// Create superadmin user
		superadmin = await User.create({
			email: 'admin@patissio.com',
			password: 'password123',
			fullName: 'Super Admin',
			role: 'superadmin',
		})

		// Create a regular patissier with profile
		patissier = await User.create({
			email: 'pat@example.com',
			password: 'password123',
			fullName: 'Regular Patissier',
			role: 'patissier',
		})
		profile = await PatissierProfile.create({
			userId: patissier.id,
			slug: 'regular-pat',
			businessName: 'Regular Shop',
		})

		// Pre-create 3 orders with different statuses
		orders = await Order.createMany([
			{
				orderNumber: 'ORD-001',
				patissierId: profile.id,
				type: 'catalogue',
				clientName: 'Alice Dupont',
				clientEmail: 'alice@example.com',
				status: 'pending',
				paymentStatus: 'pending',
				deliveryMethod: 'pickup',
			},
			{
				orderNumber: 'ORD-002',
				patissierId: profile.id,
				type: 'catalogue',
				clientName: 'Bob Martin',
				clientEmail: 'bob@example.com',
				status: 'confirmed',
				paymentStatus: 'pending',
				deliveryMethod: 'pickup',
			},
			{
				orderNumber: 'ORD-003',
				patissierId: profile.id,
				type: 'catalogue',
				clientName: 'Claire Leroy',
				clientEmail: 'claire@example.com',
				status: 'delivered',
				paymentStatus: 'pending',
				deliveryMethod: 'pickup',
			},
		])

		// Add an item to the first order
		await OrderItem.create({
			orderId: orders[0].id,
			productName: 'Tarte aux fraises',
			unitPrice: 2500,
			quantity: 2,
			total: 5000,
		})
	})

	group.teardown(async () => {
		await OrderItem.query().delete()
		await Order.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('lists all orders as superadmin', async ({ client, assert }) => {
		const response = await client.get('/superadmin/orders').loginAs(superadmin)

		response.assertStatus(200)
		assert.isTrue(response.body().success)

		const { data, meta } = response.body().data
		assert.isArray(data)
		assert.equal(data.length, 3)
		assert.exists(meta)

		const orderNumbers = data.map((o: { orderNumber: string }) => o.orderNumber)
		assert.include(orderNumbers, 'ORD-001')
		assert.include(orderNumbers, 'ORD-002')
		assert.include(orderNumbers, 'ORD-003')
	})

	test('supports pagination params', async ({ client, assert }) => {
		const response = await client
			.get('/superadmin/orders')
			.qs({ page: 1, limit: 2 })
			.loginAs(superadmin)

		response.assertStatus(200)
		assert.isTrue(response.body().success)

		const { data, meta } = response.body().data
		assert.isArray(data)
		assert.equal(data.length, 2)
		assert.equal(meta.perPage, 2)
		assert.equal(meta.currentPage, 1)
		assert.isAtLeast(meta.lastPage, 2)
	})

	test('rejects non-superadmin access', async ({ client }) => {
		const response = await client.get('/superadmin/orders').loginAs(patissier)

		response.assertStatus(403)
	})

	test('rejects unauthenticated access', async ({ client }) => {
		const response = await client.get('/superadmin/orders')

		response.assertStatus(401)
	})

	test('returns orders with preloaded patissier data', async ({ client, assert }) => {
		const response = await client.get('/superadmin/orders').loginAs(superadmin)

		response.assertStatus(200)

		const { data } = response.body().data
		const order = data.find((o: { orderNumber: string }) => o.orderNumber === 'ORD-001')

		assert.exists(order)
		assert.exists(order.patissier)
		assert.equal(order.patissier.businessName, 'Regular Shop')
		assert.equal(order.patissier.slug, 'regular-pat')

		// Verify items are also preloaded
		assert.isArray(order.items)
		assert.equal(order.items.length, 1)
		assert.equal(order.items[0].productName, 'Tarte aux fraises')
	})
})
