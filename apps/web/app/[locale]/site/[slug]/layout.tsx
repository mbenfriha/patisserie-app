import type { Metadata } from 'next'
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

type Props = {
	children: React.ReactNode
	params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params
	const profile = await getProfile(slug)
	if (!profile) return {}

	const heroImage = getImageUrl(profile.heroImageUrl)

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
	}
}

export default async function SiteLayout({ children, params }: Props) {
	const { slug } = await params
	const profile = await getProfile(slug)

	if (!profile) {
		notFound()
	}

	return (
		<SiteProvider profile={profile} slug={slug}>
			{children}
		</SiteProvider>
	)
}
