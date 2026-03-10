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
	showInstagramSection?: boolean
	instagramSectionTitle?: string
	instagramSectionSubtitle?: string
	fontPreset?: 'classic' | 'modern' | 'elegant' | 'playful'
}

export interface Profile {
	id: string
	slug: string
	businessName: string
	logoUrl: string | null
	description: string | null
	phone: string | null
	addressStreet: string | null
	addressCity: string | null
	addressZip: string | null
	addressCountry: string | null
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
	ordersEnabled: boolean
	workshopsEnabled: boolean
	plan: 'starter' | 'pro' | 'premium'
	operatingHours: Record<string, { open: string; close: string; closed?: boolean }> | null
}

export const FONT_PRESETS = [
	{ value: 'classic', label: 'Classique', fonts: 'Cormorant Garamond + Josefin Sans' },
	{ value: 'modern', label: 'Moderne', fonts: 'Montserrat + Inter' },
	{ value: 'elegant', label: 'Elegant', fonts: 'Playfair Display + Lato' },
	{ value: 'playful', label: 'Fantaisie', fonts: 'Pacifico + Nunito' },
] as const

export const DAYS = [
	{ key: 'monday', label: 'Lundi' },
	{ key: 'tuesday', label: 'Mardi' },
	{ key: 'wednesday', label: 'Mercredi' },
	{ key: 'thursday', label: 'Jeudi' },
	{ key: 'friday', label: 'Vendredi' },
	{ key: 'saturday', label: 'Samedi' },
	{ key: 'sunday', label: 'Dimanche' },
]

export const DEFAULT_MARQUEE = [
	'Macarons',
	'Cake Design',
	'Entremets',
	'Wedding Cake',
	'Cupcakes',
	'Viennoiseries',
	'Number Cake',
	'Layer Cake',
]
