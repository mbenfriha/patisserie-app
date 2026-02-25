'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSiteProfile, useSiteBasePath, useSiteConfig } from './site-provider'
import { useInlineEdit } from './components/inline-edit-provider'
import { EditableText } from './components/editable-text'
import { EditableImage } from './components/editable-image'
import { EditableRichText } from './components/editable-rich-text'
import { SectionTitle } from './components/section-title'
import { getImageUrl } from '@/lib/utils/image-url'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

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
	price: number | null
	images: CreationImage[]
}

function getCreationImage(creation: Creation): string | null {
	if (!creation.images || creation.images.length === 0) return null
	const cover = creation.images.find((img) => img.isCover)
	const url = (cover || creation.images[0])?.url || null
	return getImageUrl(url)
}

export default function PatissierSitePage() {
	const profile = useSiteProfile()
	const basePath = useSiteBasePath()
	const config = useSiteConfig()
	const {
		isEditing,
		getConfigValue,
		updateConfig,
		description: editedDescription,
		updateDescription,
		heroImagePreview,
		storyImagePreview,
		setHeroImageFile,
		setStoryImageFile,
		deleteHeroImage,
		deleteStoryImage,
	} = useInlineEdit()
	const [creations, setCreations] = useState<Creation[]>([])

	useEffect(() => {
		async function fetchCreations() {
			try {
				const res = await fetch(
					`${API_URL}/public/${profile.slug}/creations?featured=true&limit=6`
				)
				if (res.ok) {
					const data = await res.json()
					setCreations(data.data || [])
				}
			} catch {
				// silently fail
			}
		}
		fetchCreations()
	}, [profile.slug])

	const ctaLabel =
		getConfigValue('heroCtaLabel') ||
		(profile.ordersEnabled ? 'Commander' : 'Voir nos créations')

	const configuredHref = getConfigValue('heroCtaHref') as string
	const ctaHref = configuredHref
		? (configuredHref.startsWith('#') ? configuredHref : `${basePath}${configuredHref.startsWith('/') ? configuredHref : `/${configuredHref}`}`)
		: (profile.ordersEnabled ? `${basePath}/commandes` : `${basePath}/creations`)

	const storyText = getConfigValue('storyText') || (editedDescription !== null ? editedDescription : profile.description)
	const heroImage = heroImagePreview === 'deleted' ? null : (heroImagePreview || getImageUrl(profile.heroImageUrl))
	const storyImage = storyImagePreview === 'deleted' ? null : (storyImagePreview || getImageUrl(profile.storyImageUrl) || heroImage)

	return (
		<>
			{/* ── Marquee animation ────────────────────────────────────── */}
			<style>{`
				@keyframes marquee-scroll {
					0% { transform: translateX(0); }
					100% { transform: translateX(-50%); }
				}
				@keyframes float {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-10px); }
				}
				@keyframes fadeInUp {
					from { opacity: 0; transform: translateY(40px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>

			{/* ══════════════════════════════════════════════════════════
			     HERO SECTION
			     ══════════════════════════════════════════════════════════ */}
			<section
				className="relative flex min-h-screen items-center justify-center overflow-hidden text-center"
				style={{
					background: heroImage
						? `linear-gradient(160deg, rgba(26,26,26,0.92) 0%, rgba(45,30,10,0.88) 50%, rgba(26,26,26,0.92) 100%), url('${heroImage}') center/cover`
						: 'linear-gradient(160deg, rgba(26,26,26,0.95) 0%, rgba(45,30,10,0.90) 50%, rgba(26,26,26,0.95) 100%)',
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

				{/* Hero image edit button */}
				<EditableImage
					src={heroImage}
					previewSrc={null}
					onFileSelect={setHeroImageFile}
					onDelete={deleteHeroImage}
					cropAspect={16 / 9}
					overlay
				/>

				{/* Hero content */}
				<div
					className="relative z-10 max-w-[800px] px-6"
					style={{ animation: 'fadeInUp 1s ease-out' }}
				>
					<EditableText
						value={getConfigValue('heroSubtitle') as string}
						onChange={(v) => updateConfig('heroSubtitle', v)}
						as="p"
						className="mb-6 text-[13px] uppercase tracking-[6px] text-[var(--gold-light)]"
						style={{ fontFamily: 'var(--font-body)' }}
					/>

					<h1
						className="mb-4 font-light leading-[1.1] text-white"
						style={{ fontSize: 'clamp(48px, 8vw, 96px)', fontFamily: 'var(--font-heading)' }}
					>
						{profile.businessName}
					</h1>

					{(profile.description || isEditing) && (
						<EditableText
							value={editedDescription || profile.description || ''}
							onChange={updateDescription}
							as="p"
							className="mx-auto mb-12 max-w-xl font-light text-white/70 italic"
							style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontFamily: 'var(--font-heading)' }}
						/>
					)}

					{isEditing ? (
						<div className="inline-flex flex-col items-center gap-3">
							<span
								className="group inline-block border-2 border-[var(--gold)] bg-transparent px-12 py-4 text-xs font-normal uppercase tracking-[4px] text-[var(--gold)]"
								style={{ fontFamily: 'var(--font-body)' }}
							>
								<EditableText
									value={getConfigValue('heroCtaLabel') as string || (profile.ordersEnabled ? 'Commander' : 'Voir nos créations')}
									onChange={(v) => updateConfig('heroCtaLabel', v)}
									as="span"
								/>
							</span>
							<select
								value={getConfigValue('heroCtaHref') as string || ''}
								onChange={(e) => updateConfig('heroCtaHref', e.target.value)}
								className="rounded-lg border border-white/20 bg-[#1A1A1A]/90 px-3 py-1.5 text-[11px] text-white/80 backdrop-blur-sm focus:border-[var(--gold)] focus:outline-none"
							>
								<option value="">Automatique ({profile.ordersEnabled ? 'Commandes' : 'Créations'})</option>
								<optgroup label="Pages">
									<option value="/creations">Créations</option>
									<option value="/commandes">Commandes</option>
									<option value="/workshops">Ateliers</option>
								</optgroup>
								<optgroup label="Sections de la page">
									<option value="#story">Notre histoire</option>
									<option value="#creations">Créations</option>
									<option value="#workshops-cta">Ateliers</option>
								</optgroup>
							</select>
						</div>
					) : (
						<Link
							href={ctaHref}
							className="group inline-block border-2 border-[var(--gold)] bg-transparent px-12 py-4 text-xs font-normal uppercase tracking-[4px] text-[var(--gold)] transition-all duration-400 hover:bg-[var(--gold)] hover:text-[var(--dark)]"
							style={{ fontFamily: 'var(--font-body)' }}
						>
							{ctaLabel}
						</Link>
					)}
				</div>

				{/* Scroll indicator */}
				{!isEditing && (
					<div
						className="absolute bottom-10 left-1/2 -translate-x-1/2"
						style={{ animation: 'float 2s ease-in-out infinite' }}
					>
						<div className="flex h-10 w-6 items-start justify-center rounded-xl border-2 border-[var(--gold)]/50 pt-2">
							<div className="h-2.5 w-[3px] rounded-sm bg-[var(--gold)]" />
						</div>
					</div>
				)}
			</section>

			{/* ══════════════════════════════════════════════════════════
			     STORY SECTION - "Notre histoire"
			     ══════════════════════════════════════════════════════════ */}
			{(config.showStorySection && storyText) && (
				<section id="story" className="mx-auto grid max-w-[1100px] items-center gap-16 px-6 py-24 md:grid-cols-2">
					{/* Image */}
					<div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '3/4' }}>
						<EditableImage
							src={storyImage}
							previewSrc={storyImagePreview === 'deleted' ? null : storyImagePreview}
							onFileSelect={setStoryImageFile}
							onDelete={deleteStoryImage}
							cropAspect={3 / 4}
							alt={profile.businessName}
							className="h-full w-full object-cover"
							fallback={
								<div className="h-full w-full bg-gradient-to-br from-[var(--gold)]/20 to-[var(--cream-dark)]" />
							}
						/>
						{/* Gold inner border overlay */}
						<div className="pointer-events-none absolute inset-0 m-4 rounded-xl border-2 border-[var(--gold)]/50" />
					</div>

					{/* Text */}
					<div>
						{isEditing ? (
							<div className="mb-8">
								<EditableText
									value={getConfigValue('storySubtitle') as string}
									onChange={(v) => updateConfig('storySubtitle', v)}
									as="p"
									className="mb-3 text-[12px] uppercase tracking-[5px] text-[var(--gold)]"
									style={{ fontFamily: 'var(--font-body)' }}
								/>
								<EditableText
									value={getConfigValue('storyTitle') as string}
									onChange={(v) => updateConfig('storyTitle', v)}
									as="h2"
									className="text-[clamp(32px,5vw,48px)] font-light leading-[1.15] text-[var(--dark)]"
									style={{ fontFamily: 'var(--font-heading)' }}
								/>
								<div className="mt-4 h-[3px] w-16 bg-[var(--gold)]" />
							</div>
						) : (
							<SectionTitle subtitle={getConfigValue('storySubtitle') as string} title={getConfigValue('storyTitle') as string} />
						)}
						<EditableRichText
							value={storyText}
							onChange={(html) => updateConfig('storyText', html)}
							className="prose prose-lg max-w-none text-[var(--text)] [&_p]:leading-[1.9] [&_h2]:text-[var(--text)] [&_h3]:text-[var(--text)] [&_blockquote]:border-[var(--primary)] [&_a]:text-[var(--primary)]"
							style={{ fontFamily: 'var(--font-heading)' }}
						/>
					</div>
				</section>
			)}

			{/* ══════════════════════════════════════════════════════════
			     MARQUEE SECTION
			     ══════════════════════════════════════════════════════════ */}
			{config.showMarquee && (
				<div className="overflow-hidden bg-[var(--dark)] py-5">
					<div
						className="flex whitespace-nowrap"
						style={{ animation: isEditing ? 'none' : 'marquee-scroll 14s linear infinite' }}
					>
						{[0, 1].map((copy) => (
							<div key={copy} className="flex shrink-0">
								{config.marqueeItems.map((item, i) => (
									<span
										key={i}
										className={`px-8 text-2xl font-light italic ${
											i % 2 === 0 ? 'text-[var(--gold)]' : 'text-white/50'
										}`}
										style={{ fontFamily: 'var(--font-heading)' }}
									>
										{item}
									</span>
								))}
							</div>
						))}
					</div>
				</div>
			)}

			{/* ══════════════════════════════════════════════════════════
			     CREATIONS SECTION
			     ══════════════════════════════════════════════════════════ */}
			{config.showCreationsOnHomepage && creations.length > 0 && (
				<section id="creations" className="mx-auto max-w-[1200px] px-6 py-24">
					{isEditing ? (
						<div className="mb-12">
							<EditableText
								value={getConfigValue('creationsSubtitle') as string}
								onChange={(v) => updateConfig('creationsSubtitle', v)}
								as="p"
								className="mb-3 text-center text-[12px] uppercase tracking-[5px] text-[var(--gold)]"
								style={{ fontFamily: 'var(--font-body)' }}
							/>
							<EditableText
								value={getConfigValue('creationsTitle') as string}
								onChange={(v) => updateConfig('creationsTitle', v)}
								as="h2"
								className="text-center text-[clamp(32px,5vw,48px)] font-light leading-[1.15] text-[var(--dark)]"
								style={{ fontFamily: 'var(--font-heading)' }}
							/>
							<div className="mx-auto mt-4 h-[3px] w-16 bg-[var(--gold)]" />
						</div>
					) : (
						<SectionTitle subtitle={getConfigValue('creationsSubtitle') as string} title={getConfigValue('creationsTitle') as string} />
					)}

					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{creations.map((creation, i) => {
							const imageUrl = getCreationImage(creation)
							return (
								<Link
									key={creation.id}
									href={`${basePath}/creations/${creation.slug}`}
									className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_16px_48px_rgba(197,165,90,0.15)]"
									style={{
										animation: `fadeInUp 0.6s ease-out ${i * 0.15}s both`,
									}}
								>
									{/* Image */}
									<div className="relative overflow-hidden" style={{ aspectRatio: '1' }}>
										{imageUrl ? (
											<img
												src={imageUrl}
												alt={creation.title}
												className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-[1.08]"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--cream)] to-[var(--cream-dark)]">
												<span className="text-2xl text-[var(--gold)]/40" style={{ fontFamily: 'var(--font-heading)' }}>
													{creation.title}
												</span>
											</div>
										)}
										{/* Subtitle overlay */}
										{creation.category && (
											<div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-5">
												<span className="text-[11px] uppercase tracking-[3px] text-[var(--gold-light)]">
													{creation.category.name}
												</span>
											</div>
										)}
									</div>

									{/* Content */}
									{(creation.title || creation.description || creation.price != null) && (
										<div className="p-6">
											{creation.title && (
												<h3 className="text-[26px] font-medium text-[var(--dark)]" style={{ fontFamily: 'var(--font-heading)' }}>
													{creation.title}
												</h3>
											)}
											{creation.description && (
												<div
													className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--text-light)]"
													dangerouslySetInnerHTML={{ __html: creation.description }}
												/>
											)}
											{creation.price != null && (
												<p className="mt-3 text-sm font-semibold text-[var(--gold)]" style={{ fontFamily: 'var(--font-body)' }}>
													{creation.price}&nbsp;&euro;
												</p>
											)}
										</div>
									)}
								</Link>
							)
						})}
					</div>

					{/* View all link */}
					<div className="mt-12 text-center">
						<Link
							href={`${basePath}/creations`}
							className="inline-block border-2 border-[var(--gold)] bg-transparent px-10 py-3 text-xs font-normal uppercase tracking-[3px] text-[var(--gold)] transition-all duration-400 hover:bg-[var(--gold)] hover:text-[var(--dark)]"
							style={{ fontFamily: 'var(--font-body)' }}
						>
							Toutes nos cr&eacute;ations
						</Link>
					</div>
				</section>
			)}

			{/* ══════════════════════════════════════════════════════════
			     MASTERCLASS / ATELIERS CTA
			     ══════════════════════════════════════════════════════════ */}
			{config.showWorkshopsCta && profile.workshopsEnabled && (
				<section
					id="workshops-cta"
					className="relative px-6 py-24 text-center"
					style={{
						background: `linear-gradient(rgba(26,26,26,0.88), rgba(26,26,26,0.92)), url('${
							heroImage || ''
						}') center/cover fixed`,
					}}
				>
					<div className="relative z-10 mx-auto max-w-[700px]">
						{isEditing ? (
							<div className="mb-8">
								<EditableText
									value={getConfigValue('workshopsCtaSubtitle') as string}
									onChange={(v) => updateConfig('workshopsCtaSubtitle', v)}
									as="p"
									className="mb-3 text-center text-[12px] uppercase tracking-[5px] text-[var(--gold)]"
									style={{ fontFamily: 'var(--font-body)' }}
								/>
								<EditableText
									value={getConfigValue('workshopsCtaTitle') as string}
									onChange={(v) => updateConfig('workshopsCtaTitle', v)}
									as="h2"
									className="text-center text-[clamp(32px,5vw,48px)] font-light leading-[1.15] text-white"
									style={{ fontFamily: 'var(--font-heading)' }}
								/>
								<div className="mx-auto mt-4 h-[3px] w-16 bg-[var(--gold)]" />
							</div>
						) : (
							<SectionTitle
								subtitle={getConfigValue('workshopsCtaSubtitle') as string}
								title={getConfigValue('workshopsCtaTitle') as string}
								light
							/>
						)}
						<EditableRichText
							value={getConfigValue('workshopsCtaDescription') as string}
							onChange={(v) => updateConfig('workshopsCtaDescription', v)}
							className="mb-10 text-xl leading-[1.8] text-white/70"
							style={{ fontFamily: 'var(--font-heading)' }}
						/>
						<Link
							href={`${basePath}/workshops`}
							className="inline-block bg-[var(--gold)] px-12 py-4 text-xs font-semibold uppercase tracking-[4px] text-[var(--dark)] transition-all duration-400 hover:-translate-y-0.5 hover:bg-[var(--gold-light)]"
							style={{ fontFamily: 'var(--font-body)' }}
						>
							{isEditing ? (
								<EditableText
									value={getConfigValue('workshopsCtaLabel') as string}
									onChange={(v) => updateConfig('workshopsCtaLabel', v)}
									as="span"
								/>
							) : (
								config.workshopsCtaLabel
							)}
						</Link>
					</div>
				</section>
			)}
		</>
	)
}
