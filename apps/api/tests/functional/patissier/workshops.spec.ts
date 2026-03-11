import { test } from '@japa/runner'
import PatissierProfile from '#models/patissier_profile'
import User from '#models/user'
import Workshop from '#models/workshop'

test.group('Patissier - Workshops', (group) => {
	let patissier: User
	let profile: PatissierProfile

	group.setup(async () => {
		await Workshop.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()

		patissier = await User.create({
			email: 'workshop-test@example.com',
			password: 'password123',
			fullName: 'Workshop Tester',
			role: 'patissier',
		})
		profile = await PatissierProfile.create({
			userId: patissier.id,
			slug: 'workshop-shop',
			businessName: 'Workshop Shop',
			plan: 'pro',
		})
	})

	group.each.setup(async () => {
		await Workshop.query().delete()
	})

	group.teardown(async () => {
		await Workshop.query().delete()
		await PatissierProfile.query().delete()
		await User.query().delete()
	})

	test('creates a workshop with valid data', async ({ client, assert }) => {
		const response = await client.post('/patissier/workshops').loginAs(patissier).json({
			title: 'Atelier Macarons',
			price: 80,
			capacity: 10,
			durationMinutes: 120,
			date: '2026-06-15',
			startTime: '14:00',
		})

		response.assertStatus(201)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.title, 'Atelier Macarons')
		assert.equal(response.body().data.slug, 'atelier-macarons')
		assert.equal(response.body().data.price, 80)
		assert.equal(response.body().data.capacity, 10)
		assert.equal(response.body().data.durationMinutes, 120)
		assert.equal(response.body().data.startTime, '14:00')
		assert.equal(response.body().data.status, 'draft')
		assert.equal(response.body().data.patissierId, profile.id)
	})

	test('lists workshops (empty, then with data)', async ({ client, assert }) => {
		// Empty list
		const emptyResponse = await client.get('/patissier/workshops').loginAs(patissier)

		emptyResponse.assertStatus(200)
		assert.isTrue(emptyResponse.body().success)

		// Create a workshop
		await Workshop.create({
			patissierId: profile.id,
			title: 'Atelier Eclairs',
			slug: 'atelier-eclairs',
			price: 60,
			capacity: 8,
			durationMinutes: 90,
			date: '2026-07-01',
			startTime: '10:00',
			status: 'draft',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		// List with data
		const response = await client.get('/patissier/workshops').loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
	})

	test('shows a single workshop', async ({ client, assert }) => {
		const workshop = await Workshop.create({
			patissierId: profile.id,
			title: 'Atelier Croissants',
			slug: 'atelier-croissants',
			price: 70,
			capacity: 6,
			durationMinutes: 150,
			date: '2026-08-10',
			startTime: '09:00',
			status: 'draft',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		const response = await client.get(`/patissier/workshops/${workshop.id}`).loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.id, workshop.id)
		assert.equal(response.body().data.title, 'Atelier Croissants')
	})

	test('updates a workshop title', async ({ client, assert }) => {
		const workshop = await Workshop.create({
			patissierId: profile.id,
			title: 'Old Title',
			slug: 'old-title',
			price: 50,
			capacity: 10,
			durationMinutes: 60,
			date: '2026-09-01',
			startTime: '15:00',
			status: 'draft',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		const response = await client
			.put(`/patissier/workshops/${workshop.id}`)
			.loginAs(patissier)
			.json({ title: 'New Title' })

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.title, 'New Title')
		assert.equal(response.body().data.slug, 'new-title')
	})

	test('updates workshop status to published', async ({ client, assert }) => {
		const workshop = await Workshop.create({
			patissierId: profile.id,
			title: 'Draft Workshop',
			slug: 'draft-workshop',
			price: 55,
			capacity: 12,
			durationMinutes: 90,
			date: '2026-10-01',
			startTime: '11:00',
			status: 'draft',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		const response = await client
			.put(`/patissier/workshops/${workshop.id}/status`)
			.loginAs(patissier)
			.json({ status: 'published' })

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().data.status, 'published')
	})

	test('deletes a workshop', async ({ client, assert }) => {
		const workshop = await Workshop.create({
			patissierId: profile.id,
			title: 'To Delete',
			slug: 'to-delete',
			price: 40,
			capacity: 5,
			durationMinutes: 60,
			date: '2026-11-01',
			startTime: '16:00',
			status: 'draft',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		const response = await client.delete(`/patissier/workshops/${workshop.id}`).loginAs(patissier)

		response.assertStatus(200)
		assert.isTrue(response.body().success)
		assert.equal(response.body().message, 'Workshop deleted')

		const deleted = await Workshop.find(workshop.id)
		assert.isNull(deleted)
	})

	test('rejects creating workshop without required fields', async ({ client }) => {
		const response = await client
			.post('/patissier/workshops')
			.loginAs(patissier)
			.json({ title: 'Missing Fields' })

		response.assertStatus(422)
	})

	test('rejects creating workshop with invalid date format', async ({ client }) => {
		const response = await client.post('/patissier/workshops').loginAs(patissier).json({
			title: 'Bad Date',
			price: 80,
			capacity: 10,
			durationMinutes: 120,
			date: '15/06/2026',
			startTime: '14:00',
		})

		response.assertStatus(422)
	})

	test("cannot update another patissier's workshop", async ({ client, assert }) => {
		const otherUser = await User.create({
			email: 'other-workshop@example.com',
			password: 'password123',
			fullName: 'Other Patissier',
			role: 'patissier',
		})
		const otherProfile = await PatissierProfile.create({
			userId: otherUser.id,
			slug: 'other-workshop-shop',
			businessName: 'Other Workshop Shop',
			plan: 'pro',
		})
		const otherWorkshop = await Workshop.create({
			patissierId: otherProfile.id,
			title: 'Secret Workshop',
			slug: 'secret-workshop',
			price: 100,
			capacity: 8,
			durationMinutes: 120,
			date: '2026-12-01',
			startTime: '10:00',
			status: 'draft',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		const response = await client
			.put(`/patissier/workshops/${otherWorkshop.id}`)
			.loginAs(patissier)
			.json({ title: 'Hacked!' })

		assert.includeMembers([403, 404], [response.status()])
	})

	test("cannot delete another patissier's workshop", async ({ client, assert }) => {
		const otherUser = await User.create({
			email: 'other-delete-workshop@example.com',
			password: 'password123',
			fullName: 'Other Deleter',
			role: 'patissier',
		})
		const otherProfile = await PatissierProfile.create({
			userId: otherUser.id,
			slug: 'other-delete-shop',
			businessName: 'Other Delete Shop',
			plan: 'pro',
		})
		const otherWorkshop = await Workshop.create({
			patissierId: otherProfile.id,
			title: 'Not Yours',
			slug: 'not-yours',
			price: 90,
			capacity: 6,
			durationMinutes: 60,
			date: '2026-12-15',
			startTime: '14:00',
			status: 'draft',
			images: [],
			level: 'tous_niveaux',
			depositPercent: 30,
			isVisible: true,
		})

		const response = await client
			.delete(`/patissier/workshops/${otherWorkshop.id}`)
			.loginAs(patissier)

		assert.includeMembers([403, 404], [response.status()])
	})
})
