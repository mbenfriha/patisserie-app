import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

/**
 * Manages Cloudflare Turnstile widget hostnames via the Cloudflare API.
 * Used to dynamically add/remove custom domains so Turnstile works on
 * premium patissier sites with custom domains.
 */
export default class TurnstileService {
	private accountId = env.get('CLOUDFLARE_ACCOUNT_ID')
	private apiToken = env.get('CLOUDFLARE_API_TOKEN')
	private siteKey = env.get('TURNSTILE_SITE_KEY')

	get isConfigured(): boolean {
		return !!(this.accountId && this.apiToken && this.siteKey)
	}

	/**
	 * Get current widget hostnames from Cloudflare
	 */
	private async getWidgetDomains(): Promise<string[]> {
		if (!this.isConfigured) return []

		try {
			const res = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/challenges/widgets/${this.siteKey}`,
				{
					headers: { Authorization: `Bearer ${this.apiToken}` },
				}
			)
			const data: any = await res.json()
			return data.result?.domains || []
		} catch (err) {
			logger.error({ err }, 'Failed to get Turnstile widget domains')
			return []
		}
	}

	/**
	 * Update widget hostnames on Cloudflare
	 */
	private async updateWidgetDomains(domains: string[]): Promise<boolean> {
		if (!this.isConfigured) return false

		try {
			const res = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/challenges/widgets/${this.siteKey}`,
				{
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${this.apiToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ domains }),
				}
			)
			const data: any = await res.json()
			if (!data.success) {
				logger.error({ errors: data.errors }, 'Failed to update Turnstile widget domains')
				return false
			}
			return true
		} catch (err) {
			logger.error({ err }, 'Failed to update Turnstile widget domains')
			return false
		}
	}

	/**
	 * Add a hostname to the Turnstile widget
	 */
	async addHostname(domain: string): Promise<boolean> {
		if (!this.isConfigured) {
			logger.warn('Turnstile API not configured, skipping hostname add')
			return false
		}

		const domains = await this.getWidgetDomains()
		if (domains.includes(domain)) {
			logger.info({ domain }, 'Domain already in Turnstile widget')
			return true
		}

		domains.push(domain)
		// Also add www variant
		const wwwDomain = `www.${domain}`
		if (!domains.includes(wwwDomain)) {
			domains.push(wwwDomain)
		}

		const success = await this.updateWidgetDomains(domains)
		if (success) {
			logger.info({ domain }, 'Added domain to Turnstile widget')
		}
		return success
	}

	/**
	 * Remove a hostname from the Turnstile widget
	 */
	async removeHostname(domain: string): Promise<boolean> {
		if (!this.isConfigured) {
			logger.warn('Turnstile API not configured, skipping hostname remove')
			return false
		}

		const domains = await this.getWidgetDomains()
		const wwwDomain = `www.${domain}`
		const filtered = domains.filter((d) => d !== domain && d !== wwwDomain)

		if (filtered.length === domains.length) {
			logger.info({ domain }, 'Domain not in Turnstile widget, nothing to remove')
			return true
		}

		const success = await this.updateWidgetDomains(filtered)
		if (success) {
			logger.info({ domain }, 'Removed domain from Turnstile widget')
		}
		return success
	}
}
