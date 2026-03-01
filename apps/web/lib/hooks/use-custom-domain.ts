'use client'

import { useState, useEffect } from 'react'

/**
 * Detect if the current page is served from a "site domain"
 * (subdomain or custom domain — NOT the main patissio.com domain).
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
 */
export function useIsSiteDomain() {
	const [isSiteDomain, setIsSiteDomain] = useState(false)

	useEffect(() => {
		const hostname = window.location.hostname

		// Dev subdomain: latelier-de-zina.localhost
		const isLocalSubdomain = hostname.endsWith('.localhost')

		// Prod subdomain: latelier-de-zina.patissio.com (not www)
		const isProdSubdomain =
			hostname.endsWith('patissio.com') &&
			hostname.split('.').length > 2 &&
			!hostname.startsWith('www.')

		// Custom domain: anything not localhost-related and not patissio.com
		const isLocal =
			hostname === 'localhost' || hostname === '127.0.0.1'
		const isCustomDomain =
			!isLocal &&
			!isLocalSubdomain &&
			!hostname.endsWith('patissio.com')

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
