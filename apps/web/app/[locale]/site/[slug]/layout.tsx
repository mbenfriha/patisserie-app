import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import type React from 'react'
import { SiteProvider } from './site-provider'
import { getImageUrl } from '@/lib/utils/image-url'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

async function getProfile(slug: string) {
	try {
		const res = await fetch(`${API_URL}/public/${slug}`, { next: { revalidate: 60 } })
		if (!res.ok) return null
		const data = await res.json()
		return data.data
	} catch {
		return null
	}
}

async function getProfileByDomain(domain: string) {
	try {
		const res = await fetch(`${API_URL}/public/domain/${domain}`, { next: { revalidate: 60 } })
		if (!res.ok) return null
		const data = await res.json()
		return data.data
	} catch {
		return null
	}
}

async function resolveProfile(slug: string, domain?: string) {
	if (slug === '_custom-domain' && domain) {
		return getProfileByDomain(domain)
	}
	return getProfile(slug)
}

async function getDomain(): Promise<string | undefined> {
	const headersList = await headers()
	const host = headersList.get('host') || ''
	const hostWithoutPort = host.split(':')[0]
	const mainDomain = 'patissio.com'

	// Custom domain: not localhost, not main domain, not subdomain of main domain
	const isLocalhost = hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1'
	if (!isLocalhost && !hostWithoutPort.endsWith(mainDomain) && hostWithoutPort !== mainDomain) {
		return hostWithoutPort
	}
	return undefined
}

type Props = {
	children: React.ReactNode
	params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params
	const domain = await getDomain()
	const profile = await resolveProfile(slug, domain)
	if (!profile) return {}

	const heroImage = getImageUrl(profile.heroImageUrl)
	const faviconImage = getImageUrl(profile.faviconUrl)

	return {
		title: {
			template: `%s | ${profile.businessName}`,
			default: profile.businessName,
		},
		description: profile.description || undefined,
		openGraph: {
			siteName: profile.businessName,
			...(heroImage ? { images: [heroImage] } : {}),
		},
		...(faviconImage
			? {
					icons: {
						icon: faviconImage,
						apple: faviconImage,
					},
				}
			: {}),
	}
}

export default async function SiteLayout({ children, params }: Props) {
	const { slug } = await params
	const domain = await getDomain()
	const profile = await resolveProfile(slug, domain)

	if (!profile) {
		notFound()
	}

	return (
		<SiteProvider profile={profile} slug={profile.slug}>
			{children}
		</SiteProvider>
	)
}
