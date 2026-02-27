import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
// Links use <a> to ensure middleware rewrites work on custom domains
import { GoldDivider } from '../../components/gold-divider'
import { getImageUrl } from '@/lib/utils/image-url'
import { stripHtml } from '@/lib/utils/strip-html'
import { ImageGallery } from './image-gallery'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

type Props = {
	params: Promise<{ slug: string; id: string }>
}

async function getProfile(slug: string) {
	const res = await fetch(`${API_URL}/public/${slug}`, { next: { revalidate: 60 } })
	if (!res.ok) return null
	const data = await res.json()
	return data.data
}

async function getCreation(slug: string, creationSlug: string) {
	const res = await fetch(`${API_URL}/public/${slug}/creations/${creationSlug}`, { next: { revalidate: 60 } })
	if (!res.ok) return null
	const data = await res.json()
	return data.data || null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug, id } = await params
	const [profile, creation] = await Promise.all([
		getProfile(slug),
		getCreation(slug, id),
	])
	if (!profile || !creation) return {}

	const description = stripHtml(creation.description)
	const truncatedDescription = description ? description.slice(0, 160) : undefined

	const coverImage = creation.images?.find((img: any) => img.isCover) || creation.images?.[0]
	const coverUrl = coverImage ? getImageUrl(coverImage.url) : null

	const displayTitle = creation.title || 'Création'

	return {
		title: displayTitle,
		description: truncatedDescription,
		openGraph: {
			title: `${displayTitle} | ${profile.businessName}`,
			description: truncatedDescription,
			type: 'article',
			...(coverUrl ? { images: [coverUrl] } : {}),
		},
		alternates: {
			canonical: `/${slug}/creations/${creation.slug}`,
		},
	}
}

export default async function CreationDetailPage({ params }: Props) {
	const { slug, id } = await params

	let profile: any = null
	let creation: any = null

	try {
		;[profile, creation] = await Promise.all([
			getProfile(slug),
			getCreation(slug, id),
		])
	} catch {
		return notFound()
	}

	if (!profile || !creation) return notFound()

	const basePath = `/${slug}`
	const images = creation.images || []

	// JSON-LD Product structured data
	const jsonLd: any = {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: creation.title || 'Création',
		description: stripHtml(creation.description) || undefined,
		image: images.map((img: any) => getImageUrl(img.url)).filter(Boolean),
		category: creation.category?.name || undefined,
		brand: {
			'@type': 'Brand',
			name: profile.businessName,
		},
	}

	if (creation.price != null) {
		jsonLd.offers = {
			'@type': 'Offer',
			price: String(creation.price),
			priceCurrency: 'EUR',
			availability: 'https://schema.org/InStock',
		}
	}

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			<div className="mx-auto max-w-[1100px] px-6 pt-28 pb-20">
				{/* ── Back link ────────────────────────────────────────────── */}
				<a
					href={`${basePath}/creations`}
					className="mb-10 inline-flex items-center gap-2 text-sm tracking-[1px] uppercase transition-colors duration-300 hover:opacity-80"
					style={{ color: 'var(--gold)', fontFamily: "'Josefin Sans', sans-serif" }}
				>
					&larr; Retour aux cr&eacute;ations
				</a>

				{/* ── Two-column layout ────────────────────────────────────── */}
				<div className="grid gap-12 lg:grid-cols-2">
					{/* ── Left: Image gallery (client component) ──────────── */}
					<ImageGallery images={images} title={creation.title || ''} />

					{/* ── Right: Details ───────────────────────────────────── */}
					<div>
						{/* Category */}
						{creation.category && (
							<span
								className="mb-4 inline-block text-xs uppercase tracking-[3px]"
								style={{ color: 'var(--gold)', fontFamily: "'Josefin Sans', sans-serif" }}
							>
								{creation.category.name}
							</span>
						)}

						{/* Title */}
						{creation.title && (
							<h1
								className="font-[family-name:'Cormorant_Garamond'] text-[36px] font-medium leading-[1.2] text-[var(--dark)]"
							>
								{creation.title}
							</h1>
						)}

						{/* Price */}
						{creation.price != null && (
							<p
								className="mt-3 font-[family-name:'Cormorant_Garamond'] text-[28px] font-medium"
								style={{ color: 'var(--gold)' }}
							>
								{creation.price}&nbsp;&euro;
							</p>
						)}

						<div className="my-6">
							<GoldDivider />
						</div>

						{/* Description */}
						{creation.description && (
							<div
								className="prose mb-8 max-w-none leading-[1.9] text-[var(--dark-soft)]"
								style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px' }}
								dangerouslySetInnerHTML={{ __html: creation.description }}
							/>
						)}

						{/* Tags */}
						{creation.tags && creation.tags.length > 0 && (
							<div className="mb-8 flex flex-wrap gap-2">
								{creation.tags.map((tag: string, index: number) => (
									<span
										key={index}
										className="rounded-full px-4 py-1.5 text-xs font-medium tracking-[1px]"
										style={{
											fontFamily: "'Josefin Sans', sans-serif",
											backgroundColor: 'color-mix(in srgb, var(--gold) 12%, transparent)',
											color: 'var(--gold-dark)',
											border: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)',
										}}
									>
										{tag}
									</span>
								))}
							</div>
						)}

						{/* CTA Button */}
						{profile.ordersEnabled && (
							<a
								href={`${basePath}/commandes`}
								className="inline-block bg-[var(--gold)] px-12 py-4 text-xs font-semibold uppercase tracking-[4px] text-[var(--dark)] transition-all duration-400 hover:-translate-y-0.5 hover:bg-[var(--gold-light)]"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								Commander
							</a>
						)}
					</div>
				</div>
			</div>
		</>
	)
}
