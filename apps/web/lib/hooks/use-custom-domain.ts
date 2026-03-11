'use client'

import { useEffect, useState } from 'react'

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'patissio.com'

/**
 * Detect if the current page is served from a "site domain"
 * (subdomain or custom domain — NOT the main domain).
 *
 * On site domains, dashboard routes need a `/dashboard` prefix
 * so they don't conflict with the public site routes.
 *
 * Returns true for:
 *  - latelier-de-zina.localhost (dev subdomain)
 *  - latelier-de-zina.patissio.com (prod subdomain)
 *  - latelierdezina.com (custom domain)
 *
 * Returns false for:
 *  - localhost, patissio.com, www.patissio.com
 *  - patissio.xyz (staging main domain)
 */
export function useIsSiteDomain() {
	const [isSiteDomain, setIsSiteDomain] = useState(false)

	useEffect(() => {
		const hostname = window.location.hostname

		// Dev subdomain: latelier-de-zina.localhost
		const isLocalSubdomain = hostname.endsWith('.localhost')

		// Prod/staging subdomain: latelier-de-zina.patissio.com (not www)
		const isProdSubdomain =
			hostname.endsWith(APP_DOMAIN) &&
			hostname.split('.').length > APP_DOMAIN.split('.').length &&
			!hostname.startsWith('www.')

		// Main domain or localhost
		const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
		const isMainDomain = hostname === APP_DOMAIN || hostname === `www.${APP_DOMAIN}`

		// Custom domain: anything not localhost-related and not the main domain
		const isCustomDomain =
			!isLocal && !isLocalSubdomain && !isMainDomain && !hostname.endsWith(`.${APP_DOMAIN}`)

		setIsSiteDomain(isLocalSubdomain || isProdSubdomain || isCustomDomain)
	}, [])

	return isSiteDomain
}

/**
 * Returns '/dashboard' on site domains, '' on the main domain.
 * Use this to prefix dashboard-internal links so the middleware
 * can distinguish them from public site routes.
 */
export function useDashboardPrefix() {
	const isSiteDomain = useIsSiteDomain()
	return isSiteDomain ? '/dashboard' : ''
}
