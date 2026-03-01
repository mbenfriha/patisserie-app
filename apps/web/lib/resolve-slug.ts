import { headers } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

/**
 * Resolve the actual patissier slug from route params.
 * For custom domains, params.slug is "_custom-domain" — we need to look up
 * the real slug by reading the Host header and querying the API.
 */
export async function resolveSlug(slug: string): Promise<string> {
	if (slug !== '_custom-domain') return slug

	const headersList = await headers()
	const host = headersList.get('host') || ''
	const hostWithoutPort = host.split(':')[0]
	const mainDomain = 'patissio.com'

	const isLocalhost =
		hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1'
	if (
		!isLocalhost &&
		!hostWithoutPort.endsWith(mainDomain) &&
		hostWithoutPort !== mainDomain
	) {
		try {
			const res = await fetch(
				`${API_URL}/public/domain/${hostWithoutPort}`,
				{ next: { revalidate: 60 } },
			)
			if (res.ok) {
				const data = await res.json()
				return data.data?.slug || slug
			}
		} catch {
			// Fall through to return original slug
		}
	}

	return slug
}
