import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

export default class VercelService {
	private token: string | undefined
	private projectId: string | undefined
	private teamId: string | undefined

	constructor() {
		this.token = env.get('VERCEL_TOKEN')
		this.projectId = env.get('VERCEL_PROJECT_ID')
		this.teamId = env.get('VERCEL_TEAM_ID')
	}

	get isConfigured(): boolean {
		return !!this.token && !!this.projectId
	}

	private get queryParams(): string {
		return this.teamId ? `?teamId=${this.teamId}` : ''
	}

	private get headers(): Record<string, string> {
		return {
			Authorization: `Bearer ${this.token}`,
			'Content-Type': 'application/json',
		}
	}

	async addDomain(domain: string): Promise<{ success: boolean; error?: string }> {
		if (!this.isConfigured) {
			logger.warn('Vercel service not configured, skipping addDomain')
			return { success: false, error: 'Vercel not configured' }
		}

		try {
			const res = await fetch(
				`https://api.vercel.com/v10/projects/${this.projectId}/domains${this.queryParams}`,
				{
					method: 'POST',
					headers: this.headers,
					body: JSON.stringify({ name: domain }),
				}
			)

			if (!res.ok) {
				const data: any = await res.json()
				// Domain already exists on this project — not an error
				if (data?.error?.code === 'domain_already_in_use' || data?.error?.code === 'domain_already_exists') {
					logger.info({ domain }, 'Domain already exists on Vercel project')
					return { success: true }
				}
				logger.error({ domain, error: data }, 'Vercel addDomain failed')
				return { success: false, error: data?.error?.message || 'Failed to add domain' }
			}

			logger.info({ domain }, 'Domain added to Vercel')
			return { success: true }
		} catch (err) {
			logger.error({ err, domain }, 'Vercel addDomain error')
			return { success: false, error: 'Network error' }
		}
	}

	async removeDomain(domain: string): Promise<{ success: boolean }> {
		if (!this.isConfigured) {
			logger.warn('Vercel service not configured, skipping removeDomain')
			return { success: false }
		}

		try {
			const res = await fetch(
				`https://api.vercel.com/v9/projects/${this.projectId}/domains/${domain}${this.queryParams}`,
				{
					method: 'DELETE',
					headers: { Authorization: `Bearer ${this.token}` },
				}
			)

			if (!res.ok) {
				const data: any = await res.json()
				logger.error({ domain, error: data }, 'Vercel removeDomain failed')
				return { success: false }
			}

			logger.info({ domain }, 'Domain removed from Vercel')
			return { success: true }
		} catch (err) {
			logger.error({ err, domain }, 'Vercel removeDomain error')
			return { success: false }
		}
	}

	async getDomainConfig(domain: string): Promise<{
		verified: boolean
		configured: boolean
		verification?: any
	} | null> {
		if (!this.isConfigured) return null

		try {
			const res = await fetch(
				`https://api.vercel.com/v9/projects/${this.projectId}/domains/${domain}${this.queryParams}`,
				{
					method: 'GET',
					headers: { Authorization: `Bearer ${this.token}` },
				}
			)

			if (!res.ok) return null

			const data: any = await res.json()
			return {
				verified: data.verified === true,
				configured: !data.misconfigured,
				verification: data.verification || null,
			}
		} catch {
			return null
		}
	}

	/**
	 * Provision subdomain for a Pro/Premium patissier.
	 * e.g. "mon-atelier" → "mon-atelier.patissio.com"
	 */
	async addSubdomain(slug: string): Promise<{ success: boolean }> {
		const domain = `${slug}.patissio.com`
		return this.addDomain(domain)
	}

	/**
	 * Remove subdomain when a patissier downgrades.
	 */
	async removeSubdomain(slug: string): Promise<{ success: boolean }> {
		const domain = `${slug}.patissio.com`
		return this.removeDomain(domain)
	}
}
