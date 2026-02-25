'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react'
import { SiteNavbar } from './components/site-navbar'
import { SiteFooter } from './components/site-footer'
import { InlineEditProvider } from './components/inline-edit-provider'

export interface SiteConfig {
	heroSubtitle?: string
	heroCtaLabel?: string
	heroCtaHref?: string
	storyTitle?: string
	storySubtitle?: string
	storyText?: string
	marqueeItems?: string[]
	creationsTitle?: string
	creationsSubtitle?: string
	workshopsCtaTitle?: string
	workshopsCtaSubtitle?: string
	workshopsCtaDescription?: string
	workshopsCtaLabel?: string
	showStorySection?: boolean
	showMarquee?: boolean
	showCreationsOnHomepage?: boolean
	showWorkshopsCta?: boolean
	showCatalogueTab?: boolean
	showCustomOrderTab?: boolean
	fontPreset?: 'classic' | 'modern' | 'elegant' | 'playful'
}

export interface PatissierProfile {
	id: string
	slug: string
	businessName: string
	logoUrl: string | null
	description: string | null
	phone: string | null
	addressStreet: string | null
	addressCity: string | null
	addressZip: string | null
	socialLinks: {
		instagram?: string
		facebook?: string
		tiktok?: string
		snapchat?: string
		linkedin?: string
		youtube?: string
		customUrl?: string
		customLabel?: string
	}
	primaryColor: string
	secondaryColor: string
	fontFamily: string
	heroImageUrl: string | null
	creationsHeroImageUrl: string | null
	workshopsHeroImageUrl: string | null
	productsHeroImageUrl: string | null
	ordersHeroImageUrl: string | null
	storyImageUrl: string | null
	siteConfig: SiteConfig
	plan: string
	ordersEnabled: boolean
	workshopsEnabled: boolean
	allowSupportAccess: boolean
}

const DEFAULT_SITE_CONFIG: Required<SiteConfig> = {
	heroSubtitle: 'p\u00e2tisserie & ateliers',
	heroCtaLabel: '',
	heroCtaHref: '',
	storyTitle: 'Notre histoire',
	storySubtitle: 'qui sommes-nous',
	storyText: '',
	marqueeItems: [
		'Macarons',
		'Cake Design',
		'Entremets',
		'Wedding Cake',
		'Cupcakes',
		'Viennoiseries',
		'Number Cake',
		'Layer Cake',
	],
	creationsTitle: 'Nos Cr\u00e9ations',
	creationsSubtitle: 'nos sp\u00e9cialit\u00e9s',
	workshopsCtaTitle: 'Des cours de p\u00e2tisserie pour tous',
	workshopsCtaSubtitle: 'master class',
	workshopsCtaDescription:
		'La p\u00e2tisserie n\u2019aura plus de secret pour vous\u00a0: cake design, pi\u00e8ce mont\u00e9e, macaron, entremet et plein d\u2019autres.',
	workshopsCtaLabel: 'R\u00e9server votre atelier',
	showStorySection: true,
	showMarquee: true,
	showCreationsOnHomepage: true,
	showWorkshopsCta: true,
	showCatalogueTab: true,
	showCustomOrderTab: true,
	fontPreset: 'classic',
}

const FONT_PRESETS: Record<string, { heading: string; body: string; cssImport: string }> = {
	classic: {
		heading: "'Cormorant Garamond', serif",
		body: "'Josefin Sans', sans-serif",
		cssImport: '',
	},
	modern: {
		heading: "'Montserrat', sans-serif",
		body: "'Inter', sans-serif",
		cssImport:
			'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap',
	},
	elegant: {
		heading: "'Playfair Display', serif",
		body: "'Lato', sans-serif",
		cssImport:
			'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap',
	},
	playful: {
		heading: "'Pacifico', cursive",
		body: "'Nunito', sans-serif",
		cssImport:
			'https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@300;400;600;700&display=swap',
	},
}

function adjustColor(hex: string, amount: number): string {
	const num = parseInt(hex.replace('#', ''), 16)
	const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
	const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
	const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
	return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

interface SiteContextValue {
	profile: PatissierProfile
	basePath: string
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function useSiteProfile() {
	const ctx = useContext(SiteContext)
	if (!ctx) throw new Error('useSiteProfile must be used within SiteProvider')
	return ctx.profile
}

export function useSiteBasePath() {
	const ctx = useContext(SiteContext)
	if (!ctx) throw new Error('useSiteBasePath must be used within SiteProvider')
	return ctx.basePath
}

export function useSiteConfig(): Required<SiteConfig> {
	const profile = useSiteProfile()
	return useMemo(
		() => ({ ...DEFAULT_SITE_CONFIG, ...profile.siteConfig }),
		[profile.siteConfig]
	)
}

export function SiteProvider({
	profile: initialProfile,
	slug,
	children,
}: {
	profile: PatissierProfile
	slug: string
	children: ReactNode
}) {
	const [profile, setProfile] = useState(initialProfile)
	const [basePath, setBasePath] = useState(`/${slug}`)
	const fontPreset = profile.siteConfig?.fontPreset || 'classic'
	const fonts = FONT_PRESETS[fontPreset] || FONT_PRESETS.classic

	useEffect(() => {
		const hostname = window.location.hostname
		// If subdomain (e.g., slug.localhost or slug.patissio.com)
		if (
			hostname.endsWith('.localhost') ||
			(hostname.split('.').length > 2 &&
				hostname !== 'www.' + hostname.split('.').slice(1).join('.'))
		) {
			setBasePath('')
		}
	}, [slug])

	return (
		<SiteContext.Provider value={{ profile, basePath }}>
			{fonts.cssImport && (
				<link rel="stylesheet" href={fonts.cssImport} />
			)}
			<div
				className="min-h-screen bg-[var(--cream)]"
				style={
					{
						'--gold': profile.primaryColor || '#C5A55A',
						'--gold-light': adjustColor(profile.primaryColor || '#C5A55A', 40),
						'--gold-dark': adjustColor(profile.primaryColor || '#C5A55A', -30),
						'--cream': '#FDF8F0',
						'--cream-dark': '#F5EDE0',
						'--dark': '#1A1A1A',
						'--dark-soft': '#2D2D2D',
						'--font-heading': fonts.heading,
						'--font-body': fonts.body,
					} as React.CSSProperties
				}
			>
				<InlineEditProvider onProfileUpdate={setProfile}>
					<SiteNavbar />
					<main>{children}</main>
					<SiteFooter />
				</InlineEditProvider>
				{profile.plan !== 'premium' && (
					<a
						href="https://patissio.com"
						target="_blank"
						rel="noreferrer"
						className="fixed bottom-4 left-4 z-40 flex items-center gap-1.5 rounded-full bg-[#1A1A1A]/80 px-3 py-1.5 text-[11px] text-white/70 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-[#1A1A1A] hover:text-white"
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
						</svg>
						Propulsé par <span className="font-semibold">Patissio</span>
					</a>
				)}
			</div>
		</SiteContext.Provider>
	)
}
