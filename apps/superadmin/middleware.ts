import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login']

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl
	const token = request.cookies.get('superadmin_token')?.value

	const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path))

	if (!token && !isPublicPath) {
		const loginUrl = new URL('/login', request.url)
		return NextResponse.redirect(loginUrl)
	}

	if (token && pathname === '/login') {
		const dashboardUrl = new URL('/', request.url)
		return NextResponse.redirect(dashboardUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!api|_next|_vercel|favicon.ico|.*\\..*).*)'],
}
