import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SectionTitle } from '../../components/section-title'
import { GoldDivider } from '../../components/gold-divider'
import { getImageUrl } from '@/lib/utils/image-url'
import { WorkshopBookingForm } from './booking-form'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

type Props = {
	params: Promise<{ slug: string; workshopSlug: string }>
	searchParams: Promise<{ payment?: string }>
}

async function getProfile(slug: string) {
	const res = await fetch(`${API_URL}/public/${slug}`, { next: { revalidate: 60 } })
	if (!res.ok) return null
	const data = await res.json()
	return data.data
}

async function getWorkshop(slug: string, workshopSlug: string) {
	const res = await fetch(`${API_URL}/public/${slug}/workshops/${workshopSlug}`, { next: { revalidate: 60 } })
	if (!res.ok) return null
	const data = await res.json()
	return data.data || null
}

function getLevelBadge(level: string) {
	const levels: Record<string, { label: string; bg: string; text: string }> = {
		debutant: { label: 'Débutant', bg: 'rgba(34,197,94,0.12)', text: '#16a34a' },
		intermediaire: { label: 'Intermédiaire', bg: 'rgba(234,179,8,0.12)', text: '#ca8a04' },
		avance: { label: 'Avancé', bg: 'rgba(239,68,68,0.12)', text: '#dc2626' },
		tous_niveaux: { label: 'Tous niveaux', bg: 'rgba(99,102,241,0.12)', text: '#6366f1' },
	}
	return levels[level] || { label: level, bg: 'rgba(0,0,0,0.06)', text: '#666' }
}

function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60)
	const mins = minutes % 60
	if (hours > 0) return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`
	return `${mins} min`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug, workshopSlug } = await params
	const [profile, workshop] = await Promise.all([
		getProfile(slug),
		getWorkshop(slug, workshopSlug),
	])
	if (!profile || !workshop) return {}

	const description = workshop.description
		? workshop.description.slice(0, 160)
		: `Atelier ${workshop.title} par ${profile.businessName}`

	const imageUrl = workshop.images?.[0]?.url ? getImageUrl(workshop.images[0].url) : null

	return {
		title: workshop.title,
		description,
		openGraph: {
			title: `${workshop.title} | ${profile.businessName}`,
			description,
			type: 'article',
			...(imageUrl ? { images: [imageUrl] } : {}),
		},
		alternates: {
			canonical: `/${slug}/workshops/${workshopSlug}`,
		},
	}
}

export default async function WorkshopDetailPage({ params, searchParams }: Props) {
	const { slug, workshopSlug } = await params
	const { payment } = await searchParams

	let profile: any = null
	let workshop: any = null

	try {
		;[profile, workshop] = await Promise.all([
			getProfile(slug),
			getWorkshop(slug, workshopSlug),
		])
	} catch {
		return notFound()
	}

	if (!profile || !workshop) return notFound()

	const basePath = `/${slug}`
	const imageUrl = getImageUrl(workshop.images?.[0]?.url)
	const levelBadge = workshop.level ? getLevelBadge(workshop.level) : null
	const spotsLeft = workshop.spotsLeft ?? null
	const isFull = spotsLeft !== null && spotsLeft <= 0
	const depositAmount =
		workshop.depositPercent && workshop.price
			? ((workshop.price * workshop.depositPercent) / 100).toFixed(2)
			: null
	const duration = workshop.durationMinutes ? formatDuration(workshop.durationMinutes) : null

	// JSON-LD Event structured data
	const jsonLd: any = {
		'@context': 'https://schema.org',
		'@type': 'Event',
		name: workshop.title,
		description: workshop.description || undefined,
		...(imageUrl ? { image: imageUrl } : {}),
		...(workshop.date ? { startDate: workshop.date } : {}),
		...(workshop.location
			? { location: { '@type': 'Place', name: workshop.location } }
			: {}),
		organizer: {
			'@type': 'Organization',
			name: profile.businessName,
		},
	}

	if (workshop.price != null) {
		jsonLd.offers = {
			'@type': 'Offer',
			price: String(workshop.price),
			priceCurrency: 'EUR',
			availability: isFull
				? 'https://schema.org/SoldOut'
				: 'https://schema.org/InStock',
		}
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

			<div className="mx-auto max-w-[1200px] px-6 pt-28 pb-24">
				{/* ── Back link ── */}
				<Link
					href={`${basePath}/workshops`}
					className="inline-flex items-center gap-2 text-sm text-[var(--gold)] transition-colors hover:text-[var(--gold-dark)]"
					style={{ fontFamily: "'Josefin Sans', sans-serif" }}
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
					</svg>
					Retour aux ateliers
				</Link>

				{/* ── Payment success banner ── */}
				{payment === 'success' && (
					<div
						className="mt-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-6 py-4"
						style={{ animation: 'fadeInUp 0.6s ease-out' }}
					>
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
							<svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
						</div>
						<div>
							<p
								className="font-[family-name:'Cormorant_Garamond'] text-lg font-semibold text-green-800"
							>
								Paiement confirmé !
							</p>
							<p
								className="text-sm text-green-700"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								Votre réservation a bien été enregistrée. Vous recevrez un email de confirmation sous peu.
							</p>
						</div>
					</div>
				)}

				{/* ── Two-column layout ── */}
				<div
					className="mt-10 grid gap-12 lg:grid-cols-2"
					style={{ animation: 'fadeInUp 0.8s ease-out' }}
				>
					{/* ── LEFT: Image ── */}
					<div>
						<div className="overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3' }}>
							{imageUrl ? (
								<img
									src={imageUrl}
									alt={workshop.title}
									className="h-full w-full object-cover"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--cream)] to-[var(--cream-dark)]">
									<span className="font-[family-name:'Cormorant_Garamond'] text-3xl text-[var(--gold)]/40">
										{workshop.title}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* ── RIGHT: Details ── */}
					<div>
						{/* Category badge */}
						{workshop.category && (
							<span
								className="mb-4 inline-block text-xs uppercase tracking-[3px]"
								style={{ color: 'var(--gold)', fontFamily: "'Josefin Sans', sans-serif" }}
							>
								{workshop.category.name}
							</span>
						)}

						{/* Title */}
						<h1
							className="font-[family-name:'Cormorant_Garamond'] font-medium leading-tight text-[var(--dark)]"
							style={{ fontSize: '36px' }}
						>
							{workshop.title}
						</h1>

						{/* Price */}
						{workshop.price != null && (
							<div className="mt-4">
								<span
									className="font-[family-name:'Cormorant_Garamond'] font-semibold text-[var(--gold)]"
									style={{ fontSize: '32px' }}
								>
									{workshop.price}&nbsp;&euro;
								</span>
								<span className="ml-1 text-sm text-[var(--dark-soft)]/60">/personne</span>
							</div>
						)}

						{/* Payment info */}
						{workshop.depositPercent != null && workshop.price != null && (
							<p
								className="mt-2 text-sm text-[var(--dark-soft)]/70"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								{workshop.depositPercent >= 100
									? `Paiement intégral : ${Number(workshop.price).toFixed(2)} €/pers`
									: `Acompte de ${workshop.depositPercent}% soit ${depositAmount} €`}
							</p>
						)}

						<div className="my-6">
							<GoldDivider />
						</div>

						{/* ── Info grid ── */}
						<div className="grid grid-cols-2 gap-4">
							{/* Date */}
							{workshop.date && (
								<div className="rounded-xl bg-[var(--cream)] p-4">
									<div className="flex items-center gap-2 text-[var(--gold)]">
										<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
										</svg>
										<span
											className="text-[11px] uppercase tracking-wider text-[var(--dark-soft)]/60"
											style={{ fontFamily: "'Josefin Sans', sans-serif" }}
										>
											Date
										</span>
									</div>
									<p className="mt-2 font-[family-name:'Cormorant_Garamond'] text-lg text-[var(--dark)]">
										{new Date(workshop.date).toLocaleDateString('fr-FR', {
											weekday: 'long',
											day: 'numeric',
											month: 'long',
											year: 'numeric',
										})}
									</p>
								</div>
							)}

							{/* Time */}
							{workshop.startTime && (
								<div className="rounded-xl bg-[var(--cream)] p-4">
									<div className="flex items-center gap-2 text-[var(--gold)]">
										<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span
											className="text-[11px] uppercase tracking-wider text-[var(--dark-soft)]/60"
											style={{ fontFamily: "'Josefin Sans', sans-serif" }}
										>
											Horaires
										</span>
									</div>
									<p className="mt-2 font-[family-name:'Cormorant_Garamond'] text-lg text-[var(--dark)]">
										{workshop.startTime}
									</p>
								</div>
							)}

							{/* Duration */}
							{duration && (
								<div className="rounded-xl bg-[var(--cream)] p-4">
									<div className="flex items-center gap-2 text-[var(--gold)]">
										<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<span
											className="text-[11px] uppercase tracking-wider text-[var(--dark-soft)]/60"
											style={{ fontFamily: "'Josefin Sans', sans-serif" }}
										>
											Durée
										</span>
									</div>
									<p className="mt-2 font-[family-name:'Cormorant_Garamond'] text-lg text-[var(--dark)]">
										{duration}
									</p>
								</div>
							)}

							{/* Location */}
							{workshop.location && (
								<div className="rounded-xl bg-[var(--cream)] p-4">
									<div className="flex items-center gap-2 text-[var(--gold)]">
										<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
										</svg>
										<span
											className="text-[11px] uppercase tracking-wider text-[var(--dark-soft)]/60"
											style={{ fontFamily: "'Josefin Sans', sans-serif" }}
										>
											Lieu
										</span>
									</div>
									<p className="mt-2 font-[family-name:'Cormorant_Garamond'] text-lg text-[var(--dark)]">
										{workshop.location}
									</p>
								</div>
							)}

							{/* Capacity */}
							{workshop.capacity != null && (
								<div className="rounded-xl bg-[var(--cream)] p-4">
									<div className="flex items-center gap-2 text-[var(--gold)]">
										<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
										</svg>
										<span
											className="text-[11px] uppercase tracking-wider text-[var(--dark-soft)]/60"
											style={{ fontFamily: "'Josefin Sans', sans-serif" }}
										>
											Places
										</span>
									</div>
									<p className="mt-2 font-[family-name:'Cormorant_Garamond'] text-lg text-[var(--dark)]">
										{workshop.capacity} max
										{spotsLeft !== null && (
											<>
												{' — '}
												<span style={{ color: isFull ? '#DC2626' : spotsLeft <= 3 ? '#DC2626' : '#16a34a' }}>
													{isFull
														? 'Complet'
														: `${spotsLeft} disponible${spotsLeft > 1 ? 's' : ''}`}
												</span>
											</>
										)}
									</p>
								</div>
							)}
						</div>

						{/* Level badge */}
						{levelBadge && (
							<div className="mt-6">
								<span
									className="inline-block rounded-full px-4 py-1.5 text-sm font-medium"
									style={{
										backgroundColor: levelBadge.bg,
										color: levelBadge.text,
										fontFamily: "'Josefin Sans', sans-serif",
									}}
								>
									{levelBadge.label}
								</span>
							</div>
						)}

						{/* Description */}
						{workshop.description && (
							<div className="mt-8">
								<h2 className="font-[family-name:'Cormorant_Garamond'] text-2xl font-medium text-[var(--dark)]">
									Description
								</h2>
								<div className="mt-1 h-px w-12 bg-[var(--gold)]" />
								<p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--dark-soft)]/80">
									{workshop.description}
								</p>
							</div>
						)}

						{/* What's included */}
						{workshop.whatIncluded && (
							<div className="mt-8">
								<h2 className="font-[family-name:'Cormorant_Garamond'] text-2xl font-medium text-[var(--dark)]">
									Ce qui est inclus
								</h2>
								<div className="mt-1 h-px w-12 bg-[var(--gold)]" />
								<p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[var(--dark-soft)]/80">
									{workshop.whatIncluded}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* ── Booking section ── */}
				<div className="mt-20" style={{ animation: 'fadeInUp 0.8s ease-out 0.3s both' }}>
					<SectionTitle subtitle="réservation" title="Réserver cet atelier" />

					{isFull ? (
						<div className="mx-auto max-w-xl rounded-2xl border-2 border-[var(--cream-dark)] bg-white p-10 text-center">
							<div
								className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
								style={{ backgroundColor: 'rgba(220,38,38,0.08)' }}
							>
								<svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
								</svg>
							</div>
							<h3 className="font-[family-name:'Cormorant_Garamond'] text-2xl font-medium text-[var(--dark)]">
								Cet atelier est complet
							</h3>
							<p className="mt-2 text-sm text-[var(--dark-soft)]/60">
								Toutes les places ont été réservées. N&apos;hésitez pas à consulter nos autres ateliers.
							</p>
							<Link
								href={`${basePath}/workshops`}
								className="mt-6 inline-block bg-[var(--gold)] px-8 py-3 text-xs font-semibold uppercase tracking-[3px] text-[var(--dark)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--gold-light)]"
								style={{ fontFamily: "'Josefin Sans', sans-serif" }}
							>
								Voir les autres ateliers
							</Link>
						</div>
					) : (
						<WorkshopBookingForm
							workshopId={workshop.id}
							price={workshop.price || 0}
							depositPercent={workshop.depositPercent || 0}
							spotsLeft={workshop.spotsLeft ?? workshop.capacity ?? 0}
						/>
					)}
				</div>
			</div>
		</>
	)
}
