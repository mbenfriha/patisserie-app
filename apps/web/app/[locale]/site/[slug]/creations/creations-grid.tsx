'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSiteBasePath } from '../site-provider'
import { getImageUrl } from '@/lib/utils/image-url'

interface CreationImage {
	url: string
	alt: string | null
	isCover: boolean
}

interface Creation {
	id: string
	title: string
	slug: string
	description: string | null
	category: { id: string; name: string } | null
	tags: string[] | null
	price: number | null
	images: CreationImage[]
	isFeatured: boolean
}

function getCreationImage(creation: Creation): string | null {
	if (!creation.images || creation.images.length === 0) return null
	const cover = creation.images.find((img) => img.isCover)
	const url = (cover || creation.images[0])?.url || null
	return getImageUrl(url)
}

interface CreationsGridProps {
	creations: Creation[]
}

export function CreationsGrid({ creations }: CreationsGridProps) {
	const basePath = useSiteBasePath()
	const [activeCategory, setActiveCategory] = useState<string | null>(null)

	const categories = useMemo(() => {
		const cats = new Set<string>()
		creations.forEach((c) => {
			if (c.category?.name) cats.add(c.category.name)
		})
		return Array.from(cats)
	}, [creations])

	const filteredCreations = useMemo(() => {
		if (!activeCategory) return creations
		return creations.filter((c) => c.category?.name === activeCategory)
	}, [creations, activeCategory])

	return (
		<>
			{/* ── Category filter pills ────────────────────────────────── */}
			{categories.length > 0 && (
				<div className="border-b border-[var(--gold)]/10 bg-white/60 backdrop-blur-sm">
					<div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-3 px-6 py-5">
						<button
							onClick={() => setActiveCategory(null)}
							className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[2px] transition-all duration-300"
							style={{
								fontFamily: "'Josefin Sans', sans-serif",
								backgroundColor: activeCategory === null ? 'var(--gold)' : 'transparent',
								color: activeCategory === null ? 'var(--dark)' : 'var(--dark-soft)',
								border: `1.5px solid ${activeCategory === null ? 'var(--gold)' : 'var(--gold)'}`,
							}}
						>
							Toutes
						</button>
						{categories.map((cat) => (
							<button
								key={cat}
								onClick={() => setActiveCategory(cat)}
								className="rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[2px] transition-all duration-300"
								style={{
									fontFamily: "'Josefin Sans', sans-serif",
									backgroundColor: activeCategory === cat ? 'var(--gold)' : 'transparent',
									color: activeCategory === cat ? 'var(--dark)' : 'var(--dark-soft)',
									border: `1.5px solid ${activeCategory === cat ? 'var(--gold)' : 'var(--gold)'}`,
								}}
							>
								{cat}
							</button>
						))}
					</div>
				</div>
			)}

			{/* ── Content ──────────────────────────────────────────────── */}
			<section className="mx-auto max-w-[1200px] px-6 py-16">
				{filteredCreations.length === 0 ? (
					<div className="py-24 text-center">
						<div
							className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
							style={{ backgroundColor: 'var(--gold)', opacity: 0.1 }}
						/>
						<h3
							className="font-[family-name:'Cormorant_Garamond'] text-2xl text-[var(--dark)]"
						>
							Aucune création pour le moment
						</h3>
						<p
							className="mx-auto mt-3 max-w-md text-sm leading-relaxed"
							style={{ color: 'var(--dark-soft)', fontFamily: "'Josefin Sans', sans-serif" }}
						>
							Nos créations seront bientôt disponibles. Revenez nous rendre visite prochainement.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{filteredCreations.map((creation, i) => {
							const imageUrl = getCreationImage(creation)
							return (
								<Link
									key={creation.id}
									href={`${basePath}/creations/${creation.slug}`}
									className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(197,165,90,0.15)]"
									style={{
										animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both`,
									}}
								>
									{/* Image */}
									<div
										className="relative overflow-hidden"
										style={{ aspectRatio: '4/3' }}
									>
										{imageUrl ? (
											<img
												src={imageUrl}
												alt={creation.title || ''}
												className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-[1.08]"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--cream)] to-[var(--cream-dark)]">
												{creation.title && (
													<span className="font-[family-name:'Cormorant_Garamond'] text-2xl text-[var(--gold)]/40">
														{creation.title}
													</span>
												)}
											</div>
										)}
										{/* Category badge */}
										{creation.category && (
											<div className="absolute top-4 left-4">
												<span
													className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[2px] backdrop-blur-sm"
													style={{
														fontFamily: "'Josefin Sans', sans-serif",
														backgroundColor: 'rgba(26,26,26,0.75)',
														color: 'var(--gold-light)',
													}}
												>
													{creation.category.name}
												</span>
											</div>
										)}
									</div>

									{/* Content */}
									{(creation.title || creation.description || creation.price != null) && (
									<div className="p-6">
										{creation.title && (
											<h3 className="font-[family-name:'Cormorant_Garamond'] text-[24px] font-medium text-[var(--dark)]">
												{creation.title}
											</h3>
										)}
										{creation.description && (
											<div
												className={`line-clamp-2 text-sm leading-relaxed text-[var(--dark-soft)]/70${creation.title ? ' mt-2' : ''}`}
												dangerouslySetInnerHTML={{ __html: creation.description }}
											/>
										)}
										{creation.price != null && (
											<p className={`font-[family-name:'Josefin_Sans'] text-sm font-semibold text-[var(--gold)]${creation.title || creation.description ? ' mt-3' : ''}`}>
												{creation.price}&nbsp;&euro;
											</p>
										)}
									</div>
									)}
								</Link>
							)
						})}
					</div>
				)}
			</section>
		</>
	)
}
