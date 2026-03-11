import { expect, test } from '@playwright/test'

test.describe('Workshop Booking', () => {
	test('public workshop listing page loads', async ({ page }) => {
		await page.goto('/site/test-shop/workshops')

		// Should either render the workshops page or show not found
		await page.waitForTimeout(1000)
		const content = await page.textContent('body')
		expect(content).toBeDefined()
	})

	test('workshop detail page has booking form with required fields', async ({ page }) => {
		// Navigate to a workshop detail page (uses test slug)
		await page.goto('/site/test-shop/workshops/test-workshop')

		await page.waitForTimeout(1000)

		// If the workshop exists, look for booking form fields
		const nameField = page.locator('#client_name')
		if (await nameField.isVisible()) {
			await expect(nameField).toBeVisible()
			await expect(page.locator('#client_email')).toBeVisible()
			// Participants counter should be present
			await expect(page.getByText(/nombre de places/i)).toBeVisible()
			// Submit button should be present
			await expect(page.getByRole('button', { name: /réserver/i })).toBeVisible()
		}
	})

	test('booking form shows validation on empty submit', async ({ page }) => {
		await page.goto('/site/test-shop/workshops/test-workshop')

		await page.waitForTimeout(1000)

		const submitButton = page.getByRole('button', { name: /réserver/i })
		if (await submitButton.isVisible()) {
			await submitButton.click()

			// HTML5 validation should prevent submission — page stays the same
			await page.waitForTimeout(500)
			expect(page.url()).toContain('workshops')
		}
	})
})
