import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SectionTitle } from '../components/section-title'
import { getImageUrl } from '@/lib/utils/image-url'
import { CreationsGrid } from './creations-grid'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

type Props = {
	params: Promise<{ slug: string }>
}

async function getProfile(slug: string) {
	const res = await fetch(`${API_URL}/public/${slug}`, { next: { revalidate: 60 } })
	if (!res.ok) return null
	const data = await res.json()
	return data.data
}

async function getCreations(slug: string) {
	const res = await fetch(`${API_URL}/public/${slug}/creations`, { next: { revalidate: 60 } })
	if (!res.ok) return []
	const data = await res.json()
	return data.data || []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const profile = await getProfile(slug)
	if (!profile) return {}

	const heroImage = getImageUrl(profile.heroImageUrl)

	return {
		title: 'Nos Créations',
		description: `Découvrez les créations pâtissières de ${profile.businessName}`,
		openGraph: {
			title: `Nos Créations | ${profile.businessName}`,
			description: `Découvrez les créations pâtissières de ${profile.businessName}`,
			...(heroImage ? { images: [heroImage] } : {}),
		},
		alternates: {
			canonical: `/${slug}/creations`,
		},
	}
}

export default async function CreationsGalleryPage({ params }: Props) {
	const { slug } = await params

	let profile: any = null
	let creations: any[] = []

	try {
		;[profile, creations] = await Promise.all([
			getProfile(slug),
			getCreations(slug),
		])
	} catch {
		return notFound()
	}

	if (!profile) return notFound()

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: `Créations de ${profile.businessName}`,
		numberOfItems: creations.length,
		itemListElement: creations.map((creation: any, index: number) => ({
			'@type': 'ListItem',
			position: index + 1,
			url: `/${slug}/creations/${creation.slug}`,
			name: creation.title || 'Création',
		})),
	}

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			<style>{`
				@keyframes fadeInUp {
					from { opacity: 0; transform: translateY(40px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>

			{/* ── Hero Banner ──────────────────────────────────────────── */}
			<section
				className="relative flex h-[40vh] min-h-[320px] items-center justify-center overflow-hidden text-center"
				style={{
					background:
						'linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(45,30,10,0.90) 50%, rgba(26,26,26,0.95) 100%)',
				}}
			>
				{/* Decorative gold radial accents */}
				<div
					className="pointer-events-none absolute inset-0 opacity-5"
					style={{
						background:
							'radial-gradient(circle at 20% 30%, var(--gold) 0%, transparent 40%), radial-gradient(circle at 80% 70%, var(--gold) 0%, transparent 40%)',
					}}
				/>

				<div
					className="relative z-10 px-6"
					style={{ animation: 'fadeInUp 0.8s ease-out' }}
				>
					<SectionTitle subtitle="galerie" title="Nos Créations" light />
				</div>
			</section>

			{/* ── Interactive grid (client component) ──────────────────── */}
			<CreationsGrid creations={creations} />
		</>
	)
}
