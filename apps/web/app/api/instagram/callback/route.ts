import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get('code')
	const error = request.nextUrl.searchParams.get('error')
	const baseUrl = request.nextUrl.origin

	if (error || !code) {
		return NextResponse.redirect(new URL('/site?instagram=error', baseUrl))
	}

	// Pass the code to the site page which has the auth token to do the exchange
	return NextResponse.redirect(new URL(`/site?instagram_code=${encodeURIComponent(code)}`, baseUrl))
}
