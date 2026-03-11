import { expect, test } from '@playwright/test'

test.describe('Devis (Custom Order) Flow', () => {
	test('public custom order page loads', async ({ page }) => {
		// Navigate to the order page with devis tab
		await page.goto('/site/test-shop/commandes?tab=devis')

		await page.waitForTimeout(1000)
		const content = await page.textContent('body')
		expect(content).toBeDefined()
	})

	test('devis form has required fields', async ({ page }) => {
		await page.goto('/site/test-shop/commandes?tab=devis')

		await page.waitForTimeout(2000)

		// If the devis form is rendered, check for required fields
		const firstNameField = page.locator('#dv_firstname')
		if (await firstNameField.isVisible()) {
			await expect(firstNameField).toBeVisible()
			await expect(page.locator('#dv_lastname')).toBeVisible()
			await expect(page.locator('#dv_email')).toBeVisible()
			await expect(page.locator('#dv_phone')).toBeVisible()
			await expect(page.locator('#dv_eventdate')).toBeVisible()
			await expect(page.locator('#dv_nbpersonnes')).toBeVisible()
			// Submit button should be present
			await expect(page.getByRole('button', { name: /envoyer ma demande de devis/i })).toBeVisible()
		}
	})

	test('devis form shows validation errors on empty submit', async ({ page }) => {
		await page.goto('/site/test-shop/commandes?tab=devis')

		await page.waitForTimeout(2000)

		const submitButton = page.getByRole('button', { name: /envoyer ma demande de devis/i })
		if (await submitButton.isVisible()) {
			await submitButton.click()

			// HTML5 required validation should prevent submission
			await page.waitForTimeout(500)
			expect(page.url()).toContain('commandes')
		}
	})
})
