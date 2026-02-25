'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSiteBasePath } from '../site-provider'
import { getImageUrl } from '@/lib/utils/image-url'

interface Workshop {
	id: string
	slug: string
	title: string
	description: string | null
	images: { url: string; alt?: string }[]
	price: number | null
	capacity: number | null
	durationMinutes: number | null
	date: string | null
	startTime: string | null
	status: string | null
	level: string | null
	categoryId: string | null
	category: { id: string; name: string } | null
}

interface WorkshopsGridProps {
	workshops: Workshop[]
}

export function WorkshopsGrid({ workshops }: WorkshopsGridProps) {
	const basePath = useSiteBasePath()
	const [activeCategory, setActiveCategory] = useState<string | null>(null)

	const categories = useMemo(() => {
		const cats = new Set<string>()
		workshops.forEach((w) => {
			if (w.category?.name) cats.add(w.category.name)
		})
		return Array.from(cats)
	}, [workshops])

	const filteredWorkshops = useMemo(() => {
		if (!activeCategory) return workshops
		return workshops.filter((w) => w.category?.name === activeCategory)
	}, [workshops, activeCategory])

	return (
		<>
			{/* ── Category filter pills ── */}
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
								border: `1.5px solid var(--gold)`,
							}}
						>
							Tous
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
									border: `1.5px solid var(--gold)`,
								}}
							>
								{cat}
							</button>
						))}
					</div>
				</div>
			)}

			{/* ── Workshop cards grid ── */}
			<section className="mx-auto max-w-[1200px] px-6 py-16">
				{filteredWorkshops.length === 0 ? (
					<div className="py-24 text-center">
						<div
							className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
							style={{ backgroundColor: 'var(--gold)', opacity: 0.1 }}
						/>
						<h3 className="font-[family-name:'Cormorant_Garamond'] text-2xl text-[var(--dark)]">
							Aucun atelier disponible
						</h3>
						<p
							className="mx-auto mt-3 max-w-md text-sm leading-relaxed"
							style={{ color: 'var(--dark-soft)', fontFamily: "'Josefin Sans', sans-serif" }}
						>
							Nos ateliers seront bientôt disponibles. Revenez nous rendre visite prochainement.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{filteredWorkshops.map((workshop, i) => {
							const imageUrl = getImageUrl(workshop.images?.[0]?.url)
							return (
								<Link
									key={workshop.id}
									href={`${basePath}/workshops/${workshop.slug}`}
									className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(197,165,90,0.15)]"
									style={{
										animation: `fadeInUp 0.6s ease-out ${i * 0.1}s both`,
									}}
								>
									{/* Image */}
									<div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
										{imageUrl ? (
											<img
												src={imageUrl}
												alt={workshop.title}
												className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-[1.08]"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--cream)] to-[var(--cream-dark)]">
												<span className="font-[family-name:'Cormorant_Garamond'] text-2xl text-[var(--gold)]/40">
													{workshop.title}
												</span>
											</div>
										)}

										{/* Category badge */}
										{workshop.category && (
											<div className="absolute top-4 left-4">
												<span
													className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[2px] backdrop-blur-sm"
													style={{
														fontFamily: "'Josefin Sans', sans-serif",
														backgroundColor: 'rgba(26,26,26,0.75)',
														color: 'var(--gold-light)',
													}}
												>
													{workshop.category.name}
												</span>
											</div>
										)}

										{/* Full badge */}
										{workshop.status === 'full' && (
											<span
												className="absolute top-4 right-4 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
												style={{
													backgroundColor: 'rgba(220,38,38,0.85)',
													color: 'white',
													fontFamily: "'Josefin Sans', sans-serif",
												}}
											>
												Complet
											</span>
										)}
									</div>

									{/* Content */}
									<div className="p-6">
										<h3 className="font-[family-name:'Cormorant_Garamond'] text-[24px] font-medium text-[var(--dark)]">
											{workshop.title}
										</h3>

										{workshop.description && (
											<div
												className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--dark-soft)]/70"
												dangerouslySetInnerHTML={{ __html: workshop.description }}
											/>
										)}

										{/* Info row */}
										<div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-[var(--dark-soft)]/60">
											{workshop.date && (
												<span className="flex items-center gap-1.5">
													<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
														<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
													</svg>
													{new Date(workshop.date).toLocaleDateString('fr-FR', {
														day: 'numeric',
														month: 'short',
													})}
												</span>
											)}
											{workshop.startTime && (
												<span className="flex items-center gap-1.5">
													<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
														<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													{workshop.startTime}
												</span>
											)}
										</div>

										{/* Bottom row: price + button */}
										<div className="mt-5 flex items-center justify-between border-t border-[var(--cream-dark)] pt-5">
											{workshop.price != null ? (
												<span className="font-[family-name:'Cormorant_Garamond'] text-[28px] font-semibold text-[var(--gold)]">
													{workshop.price}&nbsp;&euro;
												</span>
											) : (
												<span />
											)}

											<span
												className="rounded-full px-5 py-2 text-[11px] font-semibold uppercase tracking-[2px] transition-all duration-300"
												style={{
													fontFamily: "'Josefin Sans', sans-serif",
													backgroundColor: workshop.status === 'full' ? '#e5e7eb' : 'var(--gold)',
													color: workshop.status === 'full' ? '#9ca3af' : 'var(--dark)',
												}}
											>
												{workshop.status === 'full' ? 'Complet' : 'Réserver'}
											</span>
										</div>
									</div>
								</Link>
							)
						})}
					</div>
				)}
			</section>
		</>
	)
}
