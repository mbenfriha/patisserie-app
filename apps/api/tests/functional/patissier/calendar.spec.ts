import { test } from '@japa/runner'
import Order from '#models/order'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'
import Workshop from '#models/workshop'

test.group('Patissier - Calendar', (group) => {
	let patissier: User
	let profile: PatissierProfile

	group.setup(async () => {
		await Workshop.query().delete()
		await Order.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissier = await User.create({
			email: 'calendar-test@example.com',
			password: 'password123',
			fullName: 'Calendar Tester',
			role: 'patissier',
		})

		profile = await PatissierProfile.create({
			userId: patissier.id,
			slug: 'calendar-test-shop',
			businessName: 'Calendar Test Shop',
			plan: 'pro',
		})
	})

	group.each.setup(async () => {
		await Workshop.query().delete()
		await Order.query().delete()
	})

	group.teardown(async () => {
		await Workshop.query().delete()
		await Order.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('returns empty events for date range with no data', async ({ client, assert }) => {
		const response = await client
			.get('/patissier/calendar')
			.qs({ start: '2026-01-01', end: '2026-01-31' })
			.loginAs(patissier)

		response.assertStatus(200)
		const events = response.body().data
		assert.isArray(events)
		assert.lengthOf(events, 0)
	})

	test('returns order events in range', async ({ client, assert }) => {
		await Order.create({
			orderNumber: 'PAT-20260115-001',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Client Calendar',
			clientEmail: 'cal@example.com',
			status: 'confirmed',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
			requestedDate: '2026-01-15',
		})

		const response = await client
			.get('/patissier/calendar')
			.qs({ start: '2026-01-01', end: '2026-01-31' })
			.loginAs(patissier)

		response.assertStatus(200)
		const events = response.body().data
		assert.isArray(events)
		assert.lengthOf(events, 1)
		assert.equal(events[0].kind, 'order')
		assert.equal(events[0].date, '2026-01-15')
		assert.equal(events[0].title, 'Commande #PAT-20260115-001')
		assert.equal(events[0].status, 'confirmed')
		assert.equal(events[0].meta.orderNumber, 'PAT-20260115-001')
		assert.equal(events[0].meta.clientName, 'Client Calendar')
		assert.equal(events[0].meta.deliveryMethod, 'pickup')
	})

	test('returns workshop events in range', async ({ client, assert }) => {
		await Workshop.create({
			patissierId: profile.id,
			title: 'Atelier Janvier',
			slug: 'atelier-janvier',
			price: 80,
			capacity: 10,
			durationMinutes: 120,
			date: '2026-01-20',
			startTime: '14:00',
			status: 'published',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		const response = await client
			.get('/patissier/calendar')
			.qs({ start: '2026-01-01', end: '2026-01-31' })
			.loginAs(patissier)

		response.assertStatus(200)
		const events = response.body().data
		assert.isArray(events)
		assert.lengthOf(events, 1)
		assert.equal(events[0].kind, 'workshop')
		assert.equal(events[0].date, '2026-01-20')
		assert.equal(events[0].title, 'Atelier Janvier')
		assert.equal(events[0].status, 'published')
		assert.include(events[0].meta.startTime, '14:00')
		assert.equal(events[0].meta.capacity, 10)
		assert.equal(events[0].meta.durationMinutes, 120)
	})

	test('returns mixed order and workshop events', async ({ client, assert }) => {
		await Order.create({
			orderNumber: 'PAT-20260110-001',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Client Mix',
			clientEmail: 'mix@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'delivery',
			requestedDate: '2026-01-10',
		})

		await Order.create({
			orderNumber: 'PAT-20260125-001',
			patissierId: profile.id,
			type: 'custom',
			clientName: 'Client Devis',
			clientEmail: 'devis@example.com',
			status: 'pending',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
			requestedDate: '2026-01-25',
		})

		await Workshop.create({
			patissierId: profile.id,
			title: 'Atelier Mix',
			slug: 'atelier-mix',
			price: 60,
			capacity: 8,
			durationMinutes: 90,
			date: '2026-01-18',
			startTime: '10:00',
			status: 'published',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		const response = await client
			.get('/patissier/calendar')
			.qs({ start: '2026-01-01', end: '2026-01-31' })
			.loginAs(patissier)

		response.assertStatus(200)
		const events = response.body().data
		assert.isArray(events)
		assert.lengthOf(events, 3)

		const kinds = events.map((e: { kind: string }) => e.kind)
		assert.includeMembers(kinds, ['order', 'devis', 'workshop'])

		const workshopEvent = events.find((e: { kind: string }) => e.kind === 'workshop')
		assert.equal(workshopEvent.title, 'Atelier Mix')

		const orderEvent = events.find((e: { kind: string }) => e.kind === 'order')
		assert.equal(orderEvent.meta.orderNumber, 'PAT-20260110-001')

		const devisEvent = events.find((e: { kind: string }) => e.kind === 'devis')
		assert.equal(devisEvent.title, 'Devis #PAT-20260125-001')
	})

	test('excludes cancelled orders and workshops', async ({ client, assert }) => {
		// Cancelled order — should be excluded
		await Order.create({
			orderNumber: 'PAT-20260112-001',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Client Cancelled',
			clientEmail: 'cancelled@example.com',
			status: 'cancelled',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
			requestedDate: '2026-01-12',
		})

		// Non-cancelled order — should be included
		await Order.create({
			orderNumber: 'PAT-20260114-001',
			patissierId: profile.id,
			type: 'catalogue',
			clientName: 'Client Active',
			clientEmail: 'active@example.com',
			status: 'confirmed',
			paymentStatus: 'pending',
			deliveryMethod: 'pickup',
			requestedDate: '2026-01-14',
		})

		// Cancelled workshop — should be excluded
		await Workshop.create({
			patissierId: profile.id,
			title: 'Cancelled Workshop',
			slug: 'cancelled-workshop',
			price: 50,
			capacity: 6,
			durationMinutes: 60,
			date: '2026-01-22',
			startTime: '10:00',
			status: 'cancelled',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		// Non-cancelled workshop — should be included
		await Workshop.create({
			patissierId: profile.id,
			title: 'Active Workshop',
			slug: 'active-workshop',
			price: 70,
			capacity: 10,
			durationMinutes: 120,
			date: '2026-01-28',
			startTime: '14:00',
			status: 'published',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		const response = await client
			.get('/patissier/calendar')
			.qs({ start: '2026-01-01', end: '2026-01-31' })
			.loginAs(patissier)

		response.assertStatus(200)
		const events = response.body().data
		assert.isArray(events)
		assert.lengthOf(events, 2)

		const statuses = events.map((e: { status: string }) => e.status)
		assert.notInclude(statuses, 'cancelled')

		const titles = events.map((e: { title: string }) => e.title)
		assert.include(titles, 'Active Workshop')
		assert.include(titles, 'Commande #PAT-20260114-001')
	})

	test('rejects unauthenticated access', async ({ client }) => {
		const response = await client
			.get('/patissier/calendar')
			.qs({ start: '2026-01-01', end: '2026-01-31' })

		response.assertStatus(401)
	})
})
