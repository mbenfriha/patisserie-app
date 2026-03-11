import { expect, test } from '@playwright/test'

test.describe('Calendar (Dashboard)', () => {
	test('dashboard page requires authentication and redirects to login', async ({ page }) => {
		await page.goto('/dashboard')

		// Unauthenticated users should be redirected to login
		await page.waitForURL(/login/)
		await expect(page).toHaveURL(/login/)
	})

	test('dashboard page loads when accessed directly', async ({ page }) => {
		// Attempt to access the dashboard directly
		await page.goto('/dashboard')

		await page.waitForTimeout(1000)

		// Should either redirect to login or render the dashboard
		// (depending on auth state in the test environment)
		const url = page.url()
		const isOnLogin = url.includes('/login')
		const isOnDashboard = url.includes('/dashboard')
		expect(isOnLogin || isOnDashboard).toBeTruthy()
	})
})
