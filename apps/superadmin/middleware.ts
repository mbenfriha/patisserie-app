import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login']

const securityHeaders = {
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
	'X-XSS-Protection': '1; mode=block',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

function applySecurityHeaders(response: NextResponse) {
	for (const [key, value] of Object.entries(securityHeaders)) {
		response.headers.set(key, value)
	}
	return response
}

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const token = request.cookies.get('superadmin_token')?.value

	const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path))

	if (!token && !isPublicPath) {
		const loginUrl = new URL('/login', request.url)
		return applySecurityHeaders(NextResponse.redirect(loginUrl))
	}

	if (token && pathname === '/login') {
		const dashboardUrl = new URL('/', request.url)
		return applySecurityHeaders(NextResponse.redirect(dashboardUrl))
	}

	return applySecurityHeaders(NextResponse.next())
}

export const config = {
	matcher: ['/((?!api|_next|_vercel|favicon.ico|.*\\..*).*)'],
}
