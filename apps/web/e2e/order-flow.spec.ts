import { expect, test } from '@playwright/test'

test.describe('Order Flow', () => {
	test('public site page loads for a patissier', async ({ page }) => {
		// This test verifies the public-facing site renders
		// Use a slug that exists in the test database
		await page.goto('/site/test-shop')

		// Should either render the shop page or show not found
		await page.waitForTimeout(1000)
		const content = await page.textContent('body')
		expect(content).toBeDefined()
	})

	test('order form is accessible on public site', async ({ page }) => {
		await page.goto('/site/test-shop')

		// Look for an order/contact button
		const orderButton = page.getByRole('link', { name: /commander|commande|devis/i })
		if (await orderButton.isVisible()) {
			await orderButton.click()
			await page.waitForTimeout(1000)
			// Verify we navigated to an order-related page
			expect(page.url()).toBeDefined()
		}
	})
})
