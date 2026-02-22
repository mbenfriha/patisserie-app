import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SectionTitle } from '../components/section-title'
import { WorkshopsGrid } from './workshops-grid'

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

async function getWorkshops(slug: string) {
	const res = await fetch(`${API_URL}/public/${slug}/workshops`, { next: { revalidate: 60 } })
	if (!res.ok) return []
	const data = await res.json()
	return data.data || []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params
	const profile = await getProfile(slug)
	if (!profile) return {}

	return {
		title: 'Nos Ateliers',
		description: `Découvrez les ateliers pâtisserie de ${profile.businessName}. Apprenez à réaliser vos propres créations.`,
		openGraph: {
			title: `Nos Ateliers | ${profile.businessName}`,
			description: `Découvrez les ateliers pâtisserie de ${profile.businessName}. Apprenez à réaliser vos propres créations.`,
		},
		alternates: {
			canonical: `/${slug}/workshops`,
		},
	}
}

export default async function WorkshopsPage({ params }: Props) {
	const { slug } = await params

	let profile: any = null
	let workshops: any[] = []

	try {
		;[profile, workshops] = await Promise.all([
			getProfile(slug),
			getWorkshops(slug),
		])
	} catch {
		return notFound()
	}

	if (!profile) return notFound()

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: `Ateliers de ${profile.businessName}`,
		numberOfItems: workshops.length,
		itemListElement: workshops.map((workshop: any, index: number) => ({
			'@type': 'ListItem',
			position: index + 1,
			item: {
				'@type': 'Event',
				name: workshop.title,
				url: `/${slug}/workshops/${workshop.slug}`,
				...(workshop.date ? { startDate: workshop.date } : {}),
				...(workshop.location ? { location: { '@type': 'Place', name: workshop.location } } : {}),
				...(workshop.price != null
					? {
							offers: {
								'@type': 'Offer',
								price: String(workshop.price),
								priceCurrency: 'EUR',
								availability: workshop.status === 'full'
									? 'https://schema.org/SoldOut'
									: 'https://schema.org/InStock',
							},
						}
					: {}),
			},
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

			{/* ── Hero Banner ── */}
			<section
				className="relative flex h-[40vh] min-h-[320px] items-center justify-center overflow-hidden text-center"
				style={{
					background:
						'linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(45,30,10,0.90) 50%, rgba(26,26,26,0.95) 100%)',
				}}
			>
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
					<SectionTitle subtitle="créer sans limite" title="Nos Ateliers" light />
				</div>
			</section>

			{/* ── Interactive grid (client component) ── */}
			<WorkshopsGrid workshops={workshops} />
		</>
	)
}
