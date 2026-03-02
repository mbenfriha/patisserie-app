import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

export default class PlausibleService {
	private apiKey: string | undefined
	private apiUrl: string

	constructor() {
		this.apiKey = env.get('PLAUSIBLE_API_KEY')
		this.apiUrl = env.get('PLAUSIBLE_API_URL') || 'https://plausible.io'
	}

	get isConfigured(): boolean {
		return !!this.apiKey
	}

	private get headers(): Record<string, string> {
		return {
			Authorization: `Bearer ${this.apiKey}`,
			'Content-Type': 'application/json',
		}
	}

	async createSite(domain: string): Promise<{ success: boolean; error?: string }> {
		if (!this.isConfigured) {
			logger.warn('Plausible service not configured, skipping createSite')
			return { success: false, error: 'Plausible not configured' }
		}

		try {
			const res = await fetch(`${this.apiUrl}/api/v1/sites`, {
				method: 'POST',
				headers: this.headers,
				body: JSON.stringify({ domain }),
			})

			if (!res.ok) {
				const data: any = await res.json()
				// Site already exists — not an error
				if (res.status === 400 && data?.error?.includes('already exists')) {
					logger.info({ domain }, 'Plausible site already exists')
					return { success: true }
				}
				logger.error({ domain, error: data }, 'Plausible createSite failed')
				return { success: false, error: data?.error || 'Failed to create site' }
			}

			logger.info({ domain }, 'Plausible site created')
			return { success: true }
		} catch (err) {
			logger.error({ err, domain }, 'Plausible createSite error')
			return { success: false, error: 'Network error' }
		}
	}

	async getAggregateStats(
		siteId: string,
		period: string
	): Promise<{
		visitors: number
		pageviews: number
		bounceRate: number
		visitDuration: number
	} | null> {
		if (!this.isConfigured) return null

		try {
			const url = `${this.apiUrl}/api/v1/stats/aggregate?site_id=${encodeURIComponent(siteId)}&period=${encodeURIComponent(period)}&metrics=visitors,pageviews,bounce_rate,visit_duration`
			const res = await fetch(url, {
				method: 'GET',
				headers: { Authorization: `Bearer ${this.apiKey}` },
			})

			if (!res.ok) {
				logger.error({ siteId, status: res.status }, 'Plausible getAggregateStats failed')
				return null
			}

			const data: any = await res.json()
			const results = data.results || {}
			return {
				visitors: results.visitors?.value ?? 0,
				pageviews: results.pageviews?.value ?? 0,
				bounceRate: results.bounce_rate?.value ?? 0,
				visitDuration: results.visit_duration?.value ?? 0,
			}
		} catch (err) {
			logger.error({ err, siteId }, 'Plausible getAggregateStats error')
			return null
		}
	}

	async getRealtimeVisitors(siteId: string): Promise<number | null> {
		if (!this.isConfigured) return null

		try {
			const url = `${this.apiUrl}/api/v1/stats/realtime/visitors?site_id=${encodeURIComponent(siteId)}`
			const res = await fetch(url, {
				method: 'GET',
				headers: { Authorization: `Bearer ${this.apiKey}` },
			})

			if (!res.ok) {
				logger.error({ siteId, status: res.status }, 'Plausible getRealtimeVisitors failed')
				return null
			}

			const count = await res.json()
			return typeof count === 'number' ? count : 0
		} catch (err) {
			logger.error({ err, siteId }, 'Plausible getRealtimeVisitors error')
			return null
		}
	}
}
