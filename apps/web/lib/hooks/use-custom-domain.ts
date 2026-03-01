'use client'

import { useState, useEffect } from 'react'

/**
 * Detect if the current page is served from a custom domain
 * (not localhost, not patissio.com).
 *
 * On custom domains, dashboard routes need a `/dashboard` prefix
 * so they don't conflict with the public site routes.
 */
export function useIsCustomDomain() {
	const [isCustomDomain, setIsCustomDomain] = useState(false)

	useEffect(() => {
		const hostname = window.location.hostname
		const isLocal =
			hostname === 'localhost' ||
			hostname === '127.0.0.1' ||
			hostname.endsWith('.localhost')
		const isMainDomain = hostname.endsWith('patissio.com')
		setIsCustomDomain(!isLocal && !isMainDomain)
	}, [])

	return isCustomDomain
}

/**
 * Returns '/dashboard' on custom domains, '' otherwise.
 * Use this to prefix dashboard-internal links so the middleware
 * can distinguish them from public site routes.
 */
export function useDashboardPrefix() {
	const isCustomDomain = useIsCustomDomain()
	return isCustomDomain ? '/dashboard' : ''
}
