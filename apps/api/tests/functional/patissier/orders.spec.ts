import { test } from '@japa/runner'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import PatissierProfile from '#models/patissier_profile'
import Product from '#models/product'
import User from '#models/user'

test.group('Patissier - Orders', (group) => {
	let patissier: User
	let profile: PatissierProfile
	let product: Product

	group.setup(async () => {
		await OrderItem.query().delete()
		await Order.query().delete()
		await Product.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissier = await User.create({
			email: 'orders-test@example.com',
			password: 'password123',
			fullName: 'Orders Tester',
			role: 'patissier',
		})

		profile = await PatissierProfile.create({
			userId: patissier.id,
			slug: 'orders-test-shop',
			businessName: 'Orders Test Shop',
			plan: 'pro',
		})

		product = await Product.create({
			patissierId: profile.id,
			name: 'Tarte',
			price: 25,
			images: [],
			sortOrder: 0,
			isVisible: true,
		})
	})

	group.each.setup(async () => {
		await OrderItem.query().delete()
		await Order.query().delete()
	})

	group.teardown(async () => {
		await OrderItem.query().delete()
		await Order.query().delete()
		await Product.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('creates a custom order', async ({ client, assert }) => {
		const response = await client.post('/patissier/orders').loginAs(patissier).json({
			type: 'custom',
			clientName: 'Jean Dupont',
			clientEmail: 'jean@example.com',
			customType: 'Gateau anniversaire',
			customNbPersonnes: 10,
			customMessage: 'Thème licorne',
		})

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.type, 'custom')
		assert.equal(response.body().data.clientName, 'Jean Dupont')
		assert.equal(response.body().data.clientEmail, 'jean@example.com')
		assert.equal(response.body().data.status, 'pending')
		assert.match(response.body().data.orderNumber, /^PAT-\d{8}-\d{6}$/)
	})

	test('creates a catalogue order with product items', async ({ client, assert }) => {
		const response = await client
			.post('/patissier/orders')
			.loginAs(patissier)
			.json({
				type: 'catalogue',
				clientName: 'Marie Martin',
				clientEmail: 'marie@example.com',
				items: [{ product_id: product.id, quantity: 3 }],
			})

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.type, 'catalogue')
		assert.equal(response.body().data.subtotal, 75)
		assert.equal(response.body().data.total, 75)
		assert.isArray(response.body().data.items)
		assert.lengthOf(response.body().data.items, 1)
		assert.equal(response.body().data.items[0].productName, 'Tarte')
		assert.equal(response.body().data.items[0].quantity, 3)
		assert.equal(response.body().data.items[0].unitPrice, 25)
	})

	test('lists orders', async ({ client, assert }) => {
		await Order.create({
			orderNumber: 'PAT-20260307-001',
			patissierId: profile.id,
			type: 'custom',
			clientName: 'Client A',
			clientEmail: 'a@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})
		await Order.create({
			orderNumber: 'PAT-20260307-002',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Client B',
			clientEmail: 'b@example.com',
			status: 'confirmed',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client.get('/patissier/orders').loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.isArray(response.body().data.data)
		assert.lengthOf(response.body().data.data, 2)
	})

	test('shows a single order', async ({ client, assert }) => {
		const order = await Order.create({
			orderNumber: 'PAT-20260307-010',
			patissierId: profile.id,
			type: 'custom',
			clientName: 'Client Show',
			clientEmail: 'show@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client.get(`/patissier/orders/${order.id}`).loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.id, order.id)
		assert.equal(response.body().data.clientName, 'Client Show')
	})

	test('updates order status to confirmed', async ({ client, assert }) => {
		const order = await Order.create({
			orderNumber: 'PAT-20260307-020',
			patissierId: profile.id,
			type: 'custom',
			clientName: 'Client Confirm',
			clientEmail: 'confirm@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client
			.put(`/patissier/orders/${order.id}/status`)
			.loginAs(patissier)
			.json({ status: 'confirmed' })

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.status, 'confirmed')
		assert.isNotNull(response.body().data.confirmedAt)
	})

	test('updates order status to cancelled with reason', async ({ client, assert }) => {
		const order = await Order.create({
			orderNumber: 'PAT-20260307-030',
			patissierId: profile.id,
			type: 'custom',
			clientName: 'Client Cancel',
			clientEmail: 'cancel@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client
			.put(`/patissier/orders/${order.id}/status`)
			.loginAs(patissier)
			.json({ status: 'cancelled', cancellationReason: "Client a changé d'avis" })

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.status, 'cancelled')
		assert.isNotNull(response.body().data.cancelledAt)
		assert.equal(response.body().data.cancellationReason, "Client a changé d'avis")
	})

	test('rejects invalid status value', async ({ client }) => {
		const order = await Order.create({
			orderNumber: 'PAT-20260307-040',
			patissierId: profile.id,
			type: 'custom',
			clientName: 'Client Invalid',
			clientEmail: 'invalid@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client
			.put(`/patissier/orders/${order.id}/status`)
			.loginAs(patissier)
			.json({ status: 'nonexistent_status' })

		response.assertStatus(422)
	})

	test('deletes a pending order', async ({ client, assert }) => {
		const order = await Order.create({
			orderNumber: 'PAT-20260307-050',
			patissierId: profile.id,
			type: 'custom',
			clientName: 'Client Delete',
			clientEmail: 'delete@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client.delete(`/patissier/orders/${order.id}`).loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)

		// Verify soft delete
		const deleted = await Order.find(order.id)
		assert.isNotNull(deleted)
		assert.isNotNull(deleted!.deletedAt)
	})

	test('soft-deletes a confirmed order', async ({ client, assert }) => {
		const order = await Order.create({
			orderNumber: 'PAT-20260307-060',
			patissierId: profile.id,
			type: 'custom',
			clientName: 'Client Delete Confirmed',
			clientEmail: 'deleteconfirmed@example.com',
			status: 'confirmed',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const response = await client.delete(`/patissier/orders/${order.id}`).loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)

		// Verify soft delete
		const deleted = await Order.find(order.id)
		assert.isNotNull(deleted)
		assert.isNotNull(deleted!.deletedAt)
	})

	test("cannot access another patissier's order", async ({ client, assert }) => {
		const otherUser = await User.create({
			email: 'other-orders@example.com',
			password: 'password123',
			fullName: 'Other Patissier',
			role: 'patissier',
		})
		const otherProfile = await PatissierProfile.create({
			userId: otherUser.id,
			slug: 'other-orders-shop',
			businessName: 'Other Orders Shop',
			plan: 'pro',
		})
		const otherOrder = await Order.create({
			orderNumber: 'PAT-20260307-070',
			patissierId: otherProfile.id,
			type: 'custom',
			clientName: 'Secret Client',
			clientEmail: 'secret@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		// Try to show another patissier's order
		const showResponse = await client.get(`/patissier/orders/${otherOrder.id}`).loginAs(patissier)

		assert.includeMembers([403, 404], [showResponse.status()])

		// Try to update status of another patissier's order
		const updateResponse = await client
			.put(`/patissier/orders/${otherOrder.id}/status`)
			.loginAs(patissier)
			.json({ status: 'confirmed' })

		assert.includeMembers([403, 404], [updateResponse.status()])

		// Try to delete another patissier's order
		const deleteResponse = await client
			.delete(`/patissier/orders/${otherOrder.id}`)
			.loginAs(patissier)

		assert.includeMembers([403, 404], [deleteResponse.status()])

		// Clean up
		await Order.query().where('patissierId', otherProfile.id).delete()
		await PatissierProfile.query().where('id', otherProfile.id).delete()
		await User.query().where('id', otherUser.id).delete()
	})
})
