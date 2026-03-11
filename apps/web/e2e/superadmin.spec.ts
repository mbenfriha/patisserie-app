import { expect, test } from '@playwright/test'

const SUPERADMIN_URL = process.env.SUPERADMIN_URL || 'http://localhost:3002'

test.describe('Superadmin', () => {
	test('superadmin login page loads', async ({ page }) => {
		await page.goto(`${SUPERADMIN_URL}/login`)

		// Should display the admin login page
		await expect(page.getByText('Patissio Admin')).toBeVisible()
		await expect(page.getByLabel(/email/i)).toBeVisible()
		await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
		await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible()
	})

	test('superadmin dashboard requires authentication', async ({ page }) => {
		// Access the dashboard root without a token
		await page.goto(`${SUPERADMIN_URL}/`)

		// Middleware should redirect to /login
		await page.waitForURL(`${SUPERADMIN_URL}/login`)
		await expect(page).toHaveURL(/login/)
	})
})
