import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Main domains that should NOT be treated as subdomains
const MAIN_DOMAIN = 'patissio.com'

const LOCALES = ['fr', 'en']
const DEFAULT_LOCALE = 'fr'

// Routes that should NOT be interpreted as a patissier slug
const RESERVED_PATHS = new Set([
	'dashboard',
	'login',
	'register',
	'forgot-password',
	'reset-password',
	'settings',
	'billing',
	'creations',
	'categories',
	'products',
	'orders',
	'workshops',
	'tracking',
	'site',
	'instagram',
	'privacy',
	'data-deletion',
	'api',
	'_next',
	'favicon.ico',
])

// Auth/standalone pages that should work directly on custom domains (no /dashboard prefix needed)
const CUSTOM_DOMAIN_AUTH_PATHS = new Set([
	'login',
	'register',
	'forgot-password',
	'reset-password',
	'privacy',
	'data-deletion',
])

/**
 * Detect locale from the pathname or fallback to default.
 * e.g. /en/latelier-de-zina → 'en', /latelier-de-zina → 'fr'
 */
function detectLocale(pathname: string): string {
	const first = pathname.split('/')[1]
	return LOCALES.includes(first) ? first : DEFAULT_LOCALE
}

/**
 * Strip locale prefix from pathname if present.
 * e.g. /en/latelier-de-zina → /latelier-de-zina
 */
function stripLocale(pathname: string): string {
	const first = pathname.split('/')[1]
	if (LOCALES.includes(first)) {
		return '/' + pathname.split('/').slice(2).join('/') || '/'
	}
	return pathname
}

export default function middleware(request: NextRequest) {
	const hostname = request.headers.get('host') || ''
	const hostWithoutPort = hostname.split(':')[0]
	const isLocalhost =
		hostWithoutPort === 'localhost' ||
		hostWithoutPort === '127.0.0.1' ||
		hostWithoutPort.endsWith('.localhost')
	const pathname = request.nextUrl.pathname

	// Skip static/internal paths
	if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/favicon')) {
		return NextResponse.next()
	}

	// Instagram OAuth callback → rewrite to API route (bypasses i18n/React)
	const cleanPath = stripLocale(pathname)
	if (cleanPath === '/instagram/callback') {
		const url = request.nextUrl.clone()
		url.pathname = '/api/instagram/callback'
		return NextResponse.rewrite(url)
	}

	// ──────────────────────────────────────────────────
	// 1. Subdomain on localhost (dev) → rewrite to /[locale]/site/[slug]
	//    e.g., latelier-de-zina.localhost:3000
	// ──────────────────────────────────────────────────
	if (hostWithoutPort.endsWith('.localhost')) {
		const slug = hostWithoutPort.replace('.localhost', '')
		if (slug && slug !== 'www') {
			const locale = detectLocale(pathname)
			const cleanPath = stripLocale(pathname)
			const firstSegment = cleanPath.split('/').filter(Boolean)[0]

			// Auth pages: pass through to intlMiddleware
			if (firstSegment && CUSTOM_DOMAIN_AUTH_PATHS.has(firstSegment)) {
				return intlMiddleware(request)
			}

			// Dashboard routes: /dashboard/workshops → /[locale]/workshops
			if (firstSegment === 'dashboard') {
				const rest = cleanPath.split('/').filter(Boolean).slice(1).join('/')
				const newPath = rest ? `/${rest}` : '/dashboard'
				const url = request.nextUrl.clone()
				url.pathname = `/${locale}${newPath}`
				return NextResponse.rewrite(url)
			}

			// Public site
			const url = request.nextUrl.clone()
			url.pathname = `/${locale}/site/${slug}${cleanPath === '/' ? '' : cleanPath}`
			return NextResponse.rewrite(url)
		}
	}

	// ──────────────────────────────────────────────────
	// 2. Custom domain (Premium) → rewrite to /[locale]/site/_custom-domain
	//    Any domain that is NOT main domain or localhost
	// ──────────────────────────────────────────────────
	if (!isLocalhost && !hostWithoutPort.endsWith(MAIN_DOMAIN) && hostWithoutPort !== MAIN_DOMAIN) {
		const locale = detectLocale(pathname)
		const cleanPath = stripLocale(pathname)
		const firstSegment = cleanPath.split('/').filter(Boolean)[0]

		// Auth pages: pass through to intlMiddleware so login/register work on custom domains
		if (firstSegment && CUSTOM_DOMAIN_AUTH_PATHS.has(firstSegment)) {
			return intlMiddleware(request)
		}

		// Dashboard routes: /dashboard/workshops → rewrite to /[locale]/workshops
		// This lets the back-office work on custom domains via /dashboard prefix
		if (firstSegment === 'dashboard') {
			const rest = cleanPath.split('/').filter(Boolean).slice(1).join('/')
			const newPath = rest ? `/${rest}` : '/dashboard'
			const url = request.nextUrl.clone()
			url.pathname = `/${locale}${newPath}`
			return NextResponse.rewrite(url)
		}

		// Everything else → public site
		const url = request.nextUrl.clone()
		url.pathname = `/${locale}/site/_custom-domain${cleanPath === '/' ? '' : cleanPath}`
		url.searchParams.set('domain', hostWithoutPort)
		return NextResponse.rewrite(url)
	}

	// ──────────────────────────────────────────────────
	// 3. Subdomain on production (Pro) → rewrite to /[locale]/site/[slug]
	//    e.g., latelier-de-zina.patissio.com
	// ──────────────────────────────────────────────────
	const hostParts = hostWithoutPort.split('.')
	if (!isLocalhost && hostParts.length > 2 && hostParts[0] !== 'www') {
		const slug = hostParts[0]
		const locale = detectLocale(pathname)
		const cleanPath = stripLocale(pathname)
		const firstSegment = cleanPath.split('/').filter(Boolean)[0]

		// Auth pages: pass through to intlMiddleware
		if (firstSegment && CUSTOM_DOMAIN_AUTH_PATHS.has(firstSegment)) {
			return intlMiddleware(request)
		}

		// Dashboard routes: /dashboard/workshops → /[locale]/workshops
		if (firstSegment === 'dashboard') {
			const rest = cleanPath.split('/').filter(Boolean).slice(1).join('/')
			const newPath = rest ? `/${rest}` : '/dashboard'
			const url = request.nextUrl.clone()
			url.pathname = `/${locale}${newPath}`
			return NextResponse.rewrite(url)
		}

		// Public site
		const url = request.nextUrl.clone()
		url.pathname = `/${locale}/site/${slug}${cleanPath === '/' ? '' : cleanPath}`
		return NextResponse.rewrite(url)
	}

	// ──────────────────────────────────────────────────
	// 4. Main domain — Starter path-based sites
	//    e.g., patissio.com/latelier-de-zina
	//    or localhost:3000/latelier-de-zina
	// ──────────────────────────────────────────────────
	const segments = pathname.split('/').filter(Boolean)
	const firstSegment = LOCALES.includes(segments[0]) ? segments[1] : segments[0]

	if (firstSegment && !RESERVED_PATHS.has(firstSegment) && /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(firstSegment)) {
		const locale = detectLocale(pathname)
		const restSegments = LOCALES.includes(segments[0]) ? segments.slice(2) : segments.slice(1)
		const restPath = restSegments.length > 0 ? '/' + restSegments.join('/') : ''
		const url = request.nextUrl.clone()
		url.pathname = `/${locale}/site/${firstSegment}${restPath}`
		return NextResponse.rewrite(url)
	}

	// Default: i18n middleware for main site pages (dashboard, login, etc.)
	return intlMiddleware(request)
}

export const config = {
	matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
