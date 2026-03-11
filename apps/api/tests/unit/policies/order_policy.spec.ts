import { test } from '@japa/runner'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'
import OrderPolicy from '#policies/order_policy'

test.group('OrderPolicy', (group) => {
	let ownerUser: User
	let ownerProfile: PatissierProfile
	let otherUser: User
	let policy: OrderPolicy

	group.setup(async () => {
		await OrderItem.query().delete()
		await Order.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		ownerUser = await User.create({
			email: 'policy-owner@example.com',
			password: 'password123',
			fullName: 'Policy Owner',
			role: 'patissier',
		})

		ownerProfile = await PatissierProfile.create({
			userId: ownerUser.id,
			slug: 'policy-owner-shop',
			businessName: 'Policy Owner Shop',
			plan: 'pro',
		})

		otherUser = await User.create({
			email: 'policy-other@example.com',
			password: 'password123',
			fullName: 'Policy Other',
			role: 'patissier',
		})

		await PatissierProfile.create({
			userId: otherUser.id,
			slug: 'policy-other-shop',
			businessName: 'Policy Other Shop',
			plan: 'pro',
		})

		policy = new OrderPolicy()
	})

	group.each.setup(async () => {
		await OrderItem.query().delete()
		await Order.query().delete()
	})

	group.teardown(async () => {
		await OrderItem.query().delete()
		await Order.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('allows owner to view their order', async ({ assert }) => {
		const order = await Order.create({
			orderNumber: 'POL-20260307-001',
			patissierId: ownerProfile.id,
			type: 'custom',
			clientName: 'Client View',
			clientEmail: 'view@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const result = await policy.view(ownerUser, order)
		assert.isTrue(result)
	})

	test('denies non-owner from viewing order', async ({ assert }) => {
		const order = await Order.create({
			orderNumber: 'POL-20260307-002',
			patissierId: ownerProfile.id,
			type: 'custom',
			clientName: 'Client Deny',
			clientEmail: 'deny@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const result = await policy.view(otherUser, order)
		assert.isFalse(result)
	})

	test('allows owner to update their order', async ({ assert }) => {
		const order = await Order.create({
			orderNumber: 'POL-20260307-003',
			patissierId: ownerProfile.id,
			type: 'custom',
			clientName: 'Client Update',
			clientEmail: 'update@example.com',
			status: 'confirmed',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const result = await policy.update(ownerUser, order)
		assert.isTrue(result)
	})

	test('allows owner to delete pending order', async ({ assert }) => {
		const order = await Order.create({
			orderNumber: 'POL-20260307-004',
			patissierId: ownerProfile.id,
			type: 'custom',
			clientName: 'Client Delete',
			clientEmail: 'delete@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const result = await policy.delete(ownerUser, order)
		assert.isTrue(result)
	})

	test('denies owner from deleting non-pending order', async ({ assert }) => {
		const order = await Order.create({
			orderNumber: 'POL-20260307-005',
			patissierId: ownerProfile.id,
			type: 'custom',
			clientName: 'Client No Delete',
			clientEmail: 'nodelete@example.com',
			status: 'confirmed',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
		})

		const result = await policy.delete(ownerUser, order)
		assert.isFalse(result)
	})
})
