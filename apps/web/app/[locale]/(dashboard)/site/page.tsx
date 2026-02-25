'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api/client'
import { getImageUrl } from '@/lib/utils/image-url'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

interface SiteConfig {
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

interface Profile {
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
	socialLinks: { instagram?: string; facebook?: string; tiktok?: string; snapchat?: string; linkedin?: string; youtube?: string; customUrl?: string; customLabel?: string }
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

const FONT_PRESETS = [
	{ value: 'classic', label: 'Classique', fonts: 'Cormorant Garamond + Josefin Sans' },
	{ value: 'modern', label: 'Moderne', fonts: 'Montserrat + Inter' },
	{ value: 'elegant', label: 'Elegant', fonts: 'Playfair Display + Lato' },
	{ value: 'playful', label: 'Fantaisie', fonts: 'Pacifico + Nunito' },
] as const

const DAYS = [
	{ key: 'monday', label: 'Lundi' },
	{ key: 'tuesday', label: 'Mardi' },
	{ key: 'wednesday', label: 'Mercredi' },
	{ key: 'thursday', label: 'Jeudi' },
	{ key: 'friday', label: 'Vendredi' },
	{ key: 'saturday', label: 'Samedi' },
	{ key: 'sunday', label: 'Dimanche' },
]

const DEFAULT_MARQUEE = [
	'Macarons',
	'Cake Design',
	'Entremets',
	'Wedding Cake',
	'Cupcakes',
	'Viennoiseries',
	'Number Cake',
	'Layer Cake',
]

type Tab = 'apparence' | 'contenu' | 'pages' | 'contact'

export default function SiteEditorPage() {
	const [profile, setProfile] = useState<Profile | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [activeTab, setActiveTab] = useState<Tab>('apparence')
	const [toast, setToast] = useState<string | null>(null)
	const [showPreview, setShowPreview] = useState(false)
	const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')
	const iframeRef = useRef<HTMLIFrameElement>(null)
	const [previewKey, setPreviewKey] = useState(0)

	// Form state
	const [primaryColor, setPrimaryColor] = useState('#D4A574')
	const [secondaryColor, setSecondaryColor] = useState('#8B6F47')
	const [fontPreset, setFontPreset] = useState<string>('classic')
	const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
	const [siteConfig, setSiteConfig] = useState<SiteConfig>({})
	const [ordersEnabled, setOrdersEnabled] = useState(false)
	const [workshopsEnabled, setWorkshopsEnabled] = useState(true)

	// Contact state
	const [phone, setPhone] = useState('')
	const [addressStreet, setAddressStreet] = useState('')
	const [addressCity, setAddressCity] = useState('')
	const [addressZip, setAddressZip] = useState('')
	const [addressCountry, setAddressCountry] = useState('France')
	const [socialLinks, setSocialLinks] = useState<Profile['socialLinks']>({})
	const [operatingHours, setOperatingHours] = useState<Profile['operatingHours']>(null)

	// Marquee chip input
	const [newMarqueeItem, setNewMarqueeItem] = useState('')

	// Accordion state for content tab
	const [openSections, setOpenSections] = useState<Record<string, boolean>>({
		hero: true,
	})

	const siteUrl = profile ? `/${profile.slug}` : null

	// Track unsaved changes
	const hasChanges = profile
		? primaryColor !== profile.primaryColor ||
			secondaryColor !== profile.secondaryColor ||
			fontPreset !== (profile.siteConfig?.fontPreset || 'classic') ||
			JSON.stringify(siteConfig) !== JSON.stringify(profile.siteConfig || {}) ||
			ordersEnabled !== profile.ordersEnabled ||
			workshopsEnabled !== profile.workshopsEnabled ||
			phone !== (profile.phone || '') ||
			addressStreet !== (profile.addressStreet || '') ||
			addressCity !== (profile.addressCity || '') ||
			addressZip !== (profile.addressZip || '') ||
			addressCountry !== (profile.addressCountry || 'France') ||
			JSON.stringify(socialLinks) !== JSON.stringify(profile.socialLinks || {}) ||
			JSON.stringify(operatingHours) !== JSON.stringify(profile.operatingHours)
		: false

	useEffect(() => {
		if (!hasChanges) return
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault()
		}
		window.addEventListener('beforeunload', handler)
		return () => window.removeEventListener('beforeunload', handler)
	}, [hasChanges])

	const loadProfile = useCallback(async () => {
		try {
			const res = await api.get('/patissier/profile')
			const p = res.data.data as Profile
			setProfile(p)
			setPrimaryColor(p.primaryColor)
			setSecondaryColor(p.secondaryColor)
			setFontPreset(p.siteConfig?.fontPreset || 'classic')
			setHeroImageUrl(p.heroImageUrl)
			setSiteConfig(p.siteConfig || {})
			setOrdersEnabled(p.ordersEnabled)
			setWorkshopsEnabled(p.workshopsEnabled)
			setPhone(p.phone || '')
			setAddressStreet(p.addressStreet || '')
			setAddressCity(p.addressCity || '')
			setAddressZip(p.addressZip || '')
			setAddressCountry(p.addressCountry || 'France')
			setSocialLinks(p.socialLinks || {})
			setOperatingHours(p.operatingHours)
		} catch (e) {
			console.error(e)
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		loadProfile()
	}, [loadProfile])

	const showToast = (msg: string) => {
		setToast(msg)
		setTimeout(() => setToast(null), 3000)
	}

	const updateSiteConfigField = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
		setSiteConfig((prev) => ({ ...prev, [key]: value }))
	}

	const handleSave = async () => {
		if (!profile) return
		setIsSaving(true)
		try {
			const configToSave: SiteConfig = { ...siteConfig, fontPreset: fontPreset as SiteConfig['fontPreset'] }

			await api.put('/patissier/site', {
				primaryColor,
				secondaryColor,
				heroImageUrl,
				siteConfig: configToSave,
				ordersEnabled,
				workshopsEnabled,
			})

			await api.patch('/patissier/profile', {
				phone: phone || null,
				addressStreet: addressStreet || null,
				addressCity: addressCity || null,
				addressZip: addressZip || null,
				addressCountry: addressCountry || null,
				socialLinks,
				operatingHours,
			})

			showToast('Modifications enregistrees avec succes !')
			await loadProfile()
			setPreviewKey((k) => k + 1)
		} catch (e) {
			console.error(e)
			showToast('Erreur lors de la sauvegarde')
		} finally {
			setIsSaving(false)
		}
	}

	const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const formData = new FormData()
		formData.append('logo', file)
		try {
			await api.upload('/patissier/logo', formData)
			showToast('Logo mis a jour')
			await loadProfile()
		} catch {
			showToast('Erreur lors du telechargement du logo')
		}
	}

	const handleLogoDelete = async () => {
		try {
			await api.delete('/patissier/logo')
			showToast('Logo supprime')
			await loadProfile()
		} catch {
			showToast('Erreur lors de la suppression du logo')
		}
	}

	const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const formData = new FormData()
		formData.append('image', file)
		try {
			await api.upload('/patissier/hero-image', formData)
			showToast('Image hero mise a jour')
			await loadProfile()
		} catch {
			showToast('Erreur lors du telechargement')
		}
	}

	const handleHeroImageDelete = async () => {
		try {
			await api.delete('/patissier/hero-image')
			showToast('Image hero supprimee')
			await loadProfile()
		} catch {
			showToast('Erreur lors de la suppression')
		}
	}

	const handleStoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const formData = new FormData()
		formData.append('image', file)
		try {
			await api.upload('/patissier/story-image', formData)
			showToast('Image mise a jour')
			await loadProfile()
		} catch {
			showToast('Erreur lors du telechargement')
		}
	}

	const handleStoryImageDelete = async () => {
		try {
			await api.delete('/patissier/story-image')
			showToast('Image supprimee')
			await loadProfile()
		} catch {
			showToast('Erreur lors de la suppression')
		}
	}

	const handlePageHeroUpload = async (page: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const formData = new FormData()
		formData.append('image', file)
		try {
			await api.upload(`/patissier/page-hero/${page}`, formData)
			showToast('Image hero mise a jour')
			await loadProfile()
		} catch {
			showToast('Erreur lors du telechargement')
		}
	}

	const handlePageHeroDelete = async (page: string) => {
		try {
			await api.delete(`/patissier/page-hero/${page}`)
			showToast('Image hero supprimee')
			await loadProfile()
		} catch {
			showToast('Erreur lors de la suppression')
		}
	}

	const toggleSection = (key: string) => {
		setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
	}

	const addMarqueeItem = () => {
		const item = newMarqueeItem.trim()
		if (!item) return
		const current = siteConfig.marqueeItems || DEFAULT_MARQUEE
		updateSiteConfigField('marqueeItems', [...current, item])
		setNewMarqueeItem('')
	}

	const removeMarqueeItem = (index: number) => {
		const current = siteConfig.marqueeItems || DEFAULT_MARQUEE
		updateSiteConfigField(
			'marqueeItems',
			current.filter((_, i) => i !== index)
		)
	}

	const resetMarquee = () => {
		updateSiteConfigField('marqueeItems', DEFAULT_MARQUEE)
	}

	const updateOperatingHour = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
		setOperatingHours((prev) => {
			const current = prev || {}
			const dayData = current[day] || { open: '09:00', close: '18:00' }
			return {
				...current,
				[day]: { ...dayData, [field]: value },
			}
		})
	}

	if (isLoading) {
		return <p className="text-muted-foreground">Chargement...</p>
	}

	if (!profile) {
		return <p className="text-destructive">Impossible de charger le profil</p>
	}

	const tabs: { key: Tab; label: string }[] = [
		{ key: 'apparence', label: 'Apparence' },
		{ key: 'contenu', label: 'Contenu' },
		{ key: 'pages', label: 'Pages' },
		{ key: 'contact', label: 'Contact' },
	]

	const marqueeItems = siteConfig.marqueeItems || DEFAULT_MARQUEE

	const refreshPreview = () => setPreviewKey((k) => k + 1)

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<h1 className="text-3xl font-bold">Mon site</h1>
				<div className="flex items-center gap-2">
					{siteUrl && (
						<a
							href={siteUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
						>
							Ouvrir le site
						</a>
					)}
					<button
						type="button"
						onClick={() => setShowPreview(!showPreview)}
						className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
							showPreview
								? 'border-primary bg-primary/10 text-primary'
								: 'text-muted-foreground hover:bg-muted'
						}`}
					>
						{showPreview ? 'Masquer' : 'Previsualiser'}
					</button>
				</div>
			</div>

			{/* Preview panel */}
			{showPreview && siteUrl && (
				<div className="rounded-lg border bg-muted/30 p-4">
					<div className="mb-3 flex items-center justify-between">
						<div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
							<button
								type="button"
								onClick={() => setPreviewDevice('mobile')}
								className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
									previewDevice === 'mobile' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
								}`}
							>
								Mobile
							</button>
							<button
								type="button"
								onClick={() => setPreviewDevice('desktop')}
								className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
									previewDevice === 'desktop' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
								}`}
							>
								Desktop
							</button>
						</div>
						<button
							type="button"
							onClick={refreshPreview}
							className="flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
								<path d="M21 2v6h-6" />
								<path d="M3 12a9 9 0 0115-6.7L21 8" />
								<path d="M3 22v-6h6" />
								<path d="M21 12a9 9 0 01-15 6.7L3 16" />
							</svg>
							Rafraichir
						</button>
					</div>
					<div className="flex justify-center">
						<div
							className={`overflow-hidden rounded-lg border-2 border-foreground/20 bg-white shadow-lg transition-all duration-300 ${
								previewDevice === 'mobile' ? 'h-[600px] w-[375px]' : 'h-[500px] w-full max-w-[900px]'
							}`}
						>
							<iframe
								ref={iframeRef}
								key={previewKey}
								src={siteUrl}
								className="h-full w-full"
								title="Previsualisation du site"
							/>
						</div>
					</div>
					<p className="mt-2 text-center text-xs text-muted-foreground">
						Enregistrez vos modifications puis cliquez sur Rafraichir pour voir les changements
					</p>
				</div>
			)}

			{/* Tabs */}
			<div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={`shrink-0 flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
							activeTab === tab.key
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* Tab content */}
			<div className="space-y-6">
				{/* ─── APPARENCE ─────────────────────────────── */}
				{activeTab === 'apparence' && (
					<>
						{/* Logo */}
						<section className="rounded-lg border p-6">
							<h2 className="text-lg font-semibold">Logo</h2>
							<div className="mt-4 flex items-center gap-4">
								{profile.logoUrl ? (
									<img
										src={getImageUrl(profile.logoUrl)!}
										alt="Logo"
										className="h-16 w-16 rounded-lg border object-contain"
									/>
								) : (
									<div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
										Aucun
									</div>
								)}
								<div className="flex gap-2">
									<label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-muted">
										Changer
										<input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
									</label>
									{profile.logoUrl && (
										<button
											type="button"
											onClick={handleLogoDelete}
											className="rounded-md border px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
										>
											Supprimer
										</button>
									)}
								</div>
							</div>
						</section>

						{/* Colors */}
						<section className="rounded-lg border p-6">
							<h2 className="text-lg font-semibold">Couleurs</h2>
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								<div>
									<label className="text-sm font-medium">Couleur principale</label>
									<div className="mt-1 flex items-center gap-3">
										<input
											type="color"
											value={primaryColor}
											onChange={(e) => setPrimaryColor(e.target.value)}
											className="h-10 w-10 cursor-pointer rounded border"
										/>
										<input
											type="text"
											value={primaryColor}
											onChange={(e) => setPrimaryColor(e.target.value)}
											className="rounded-md border px-3 py-2 text-sm"
										/>
									</div>
								</div>
								<div>
									<label className="text-sm font-medium">Couleur secondaire</label>
									<div className="mt-1 flex items-center gap-3">
										<input
											type="color"
											value={secondaryColor}
											onChange={(e) => setSecondaryColor(e.target.value)}
											className="h-10 w-10 cursor-pointer rounded border"
										/>
										<input
											type="text"
											value={secondaryColor}
											onChange={(e) => setSecondaryColor(e.target.value)}
											className="rounded-md border px-3 py-2 text-sm"
										/>
									</div>
								</div>
							</div>
						</section>

						{/* Font preset */}
						<section className="rounded-lg border p-6">
							<h2 className="text-lg font-semibold">Police</h2>
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								{FONT_PRESETS.map((preset) => (
									<label
										key={preset.value}
										className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
											fontPreset === preset.value
												? 'border-primary bg-primary/5'
												: 'hover:bg-muted'
										}`}
									>
										<input
											type="radio"
											name="fontPreset"
											value={preset.value}
											checked={fontPreset === preset.value}
											onChange={(e) => setFontPreset(e.target.value)}
											className="accent-primary"
										/>
										<div>
											<span className="text-sm font-medium">{preset.label}</span>
											<span className="block text-xs text-muted-foreground">{preset.fonts}</span>
										</div>
									</label>
								))}
							</div>
						</section>

						{/* Hero image */}
						<section className="rounded-lg border p-6">
							<h2 className="text-lg font-semibold">Image hero</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Image d'arriere-plan de la section principale (20 Mo max)
							</p>
							<div className="mt-4 flex items-center gap-4">
								{profile.heroImageUrl ? (
									<img
										src={getImageUrl(profile.heroImageUrl)!}
										alt="Hero"
										className="h-32 rounded-lg border object-cover"
									/>
								) : (
									<div className="flex h-32 w-48 items-center justify-center rounded-lg border-2 border-dashed bg-muted text-xs text-muted-foreground">
										Aucune image
									</div>
								)}
								<div className="flex flex-col gap-2">
									<label className="cursor-pointer rounded-md border px-3 py-2 text-center text-sm hover:bg-muted">
										{profile.heroImageUrl ? 'Changer' : 'Ajouter'}
										<input type="file" accept="image/*" onChange={handleHeroImageUpload} className="hidden" />
									</label>
									{profile.heroImageUrl && (
										<button
											type="button"
											onClick={handleHeroImageDelete}
											className="rounded-md border px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
										>
											Supprimer
										</button>
									)}
								</div>
							</div>
						</section>
					</>
				)}

				{/* ─── CONTENU ─────────────────────────────── */}
				{activeTab === 'contenu' && (
					<>
						{/* Hero section */}
						<Accordion
							title="Section Hero"
							isOpen={openSections.hero}
							onToggle={() => toggleSection('hero')}
						>
							<div className="grid gap-4">
								<div>
									<label className="text-sm font-medium">Sous-titre</label>
									<input
										type="text"
										value={siteConfig.heroSubtitle || ''}
										onChange={(e) => updateSiteConfigField('heroSubtitle', e.target.value)}
										placeholder="patisserie & ateliers"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Label du bouton CTA</label>
									<input
										type="text"
										value={siteConfig.heroCtaLabel || ''}
										onChange={(e) => updateSiteConfigField('heroCtaLabel', e.target.value)}
										placeholder={ordersEnabled ? 'Commander' : 'Voir nos creations'}
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Destination du bouton CTA</label>
									<select
										value={siteConfig.heroCtaHref || ''}
										onChange={(e) => updateSiteConfigField('heroCtaHref', e.target.value)}
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									>
										<option value="">Automatique ({ordersEnabled ? 'Commandes' : 'Créations'})</option>
										<optgroup label="Pages">
											<option value="/creations">Créations</option>
											<option value="/commandes">Commandes</option>
											<option value="/workshops">Ateliers</option>
										</optgroup>
										<optgroup label="Sections de la page d'accueil">
											<option value="#story">Notre histoire</option>
											<option value="#creations">Créations</option>
											<option value="#workshops-cta">Ateliers</option>
										</optgroup>
									</select>
								</div>
							</div>
						</Accordion>

						{/* Story section */}
						<Accordion
							title="Section Notre histoire"
							isOpen={openSections.story}
							onToggle={() => toggleSection('story')}
						>
							<div className="grid gap-4">
								<div>
									<label className="text-sm font-medium">Titre</label>
									<input
										type="text"
										value={siteConfig.storyTitle || ''}
										onChange={(e) => updateSiteConfigField('storyTitle', e.target.value)}
										placeholder="Notre histoire"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Sous-titre</label>
									<input
										type="text"
										value={siteConfig.storySubtitle || ''}
										onChange={(e) => updateSiteConfigField('storySubtitle', e.target.value)}
										placeholder="qui sommes-nous"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Texte</label>
									<div className="mt-1">
										<RichTextEditor
											content={siteConfig.storyText || ''}
											onChange={(html) => updateSiteConfigField('storyText', html)}
											placeholder={profile.description || 'Votre histoire...'}
										/>
									</div>
								</div>
								<div>
									<label className="text-sm font-medium">Image</label>
									<div className="mt-2 flex items-center gap-4">
										{profile.storyImageUrl ? (
											<img
												src={getImageUrl(profile.storyImageUrl)!}
												alt="Notre histoire"
												className="h-24 rounded-lg border object-cover"
											/>
										) : (
											<div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed bg-muted text-xs text-muted-foreground">
												Aucune
											</div>
										)}
										<div className="flex flex-col gap-2">
											<label className="cursor-pointer rounded-md border px-3 py-2 text-center text-sm hover:bg-muted">
												{profile.storyImageUrl ? 'Changer' : 'Ajouter'}
												<input type="file" accept="image/*" onChange={handleStoryImageUpload} className="hidden" />
											</label>
											{profile.storyImageUrl && (
												<button
													type="button"
													onClick={handleStoryImageDelete}
													className="rounded-md border px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
												>
													Supprimer
												</button>
											)}
										</div>
									</div>
								</div>
							</div>
						</Accordion>

						{/* Marquee */}
						<Accordion
							title="Bandeau defilant (Marquee)"
							isOpen={openSections.marquee}
							onToggle={() => toggleSection('marquee')}
						>
							<div className="space-y-4">
								<div className="flex flex-wrap gap-2">
									{marqueeItems.map((item, i) => (
										<span
											key={i}
											className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-sm"
										>
											{item}
											<button
												type="button"
												onClick={() => removeMarqueeItem(i)}
												className="text-muted-foreground hover:text-destructive"
											>
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M18 6L6 18M6 6l12 12" />
												</svg>
											</button>
										</span>
									))}
								</div>
								<div className="flex gap-2">
									<input
										type="text"
										value={newMarqueeItem}
										onChange={(e) => setNewMarqueeItem(e.target.value)}
										onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMarqueeItem())}
										placeholder="Ajouter un mot..."
										className="flex-1 rounded-md border px-3 py-2 text-sm"
									/>
									<button
										type="button"
										onClick={addMarqueeItem}
										className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
									>
										Ajouter
									</button>
								</div>
								<button
									type="button"
									onClick={resetMarquee}
									className="text-sm text-muted-foreground underline hover:text-foreground"
								>
									Reinitialiser par defaut
								</button>
							</div>
						</Accordion>

						{/* Creations section */}
						<Accordion
							title="Section Creations (homepage)"
							isOpen={openSections.creations}
							onToggle={() => toggleSection('creations')}
						>
							<div className="grid gap-4">
								<div>
									<label className="text-sm font-medium">Titre</label>
									<input
										type="text"
										value={siteConfig.creationsTitle || ''}
										onChange={(e) => updateSiteConfigField('creationsTitle', e.target.value)}
										placeholder="Nos Creations"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Sous-titre</label>
									<input
										type="text"
										value={siteConfig.creationsSubtitle || ''}
										onChange={(e) => updateSiteConfigField('creationsSubtitle', e.target.value)}
										placeholder="nos specialites"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
							</div>
						</Accordion>

						{/* Workshops CTA section */}
						<Accordion
							title={
								profile?.plan === 'starter'
									? 'Section CTA Ateliers (homepage) — Pro'
									: 'Section CTA Ateliers (homepage)'
							}
							isOpen={openSections.workshopsCta}
							onToggle={() => toggleSection('workshopsCta')}
						>
							<div className="grid gap-4">
								<div>
									<label className="text-sm font-medium">Titre</label>
									<input
										type="text"
										value={siteConfig.workshopsCtaTitle || ''}
										onChange={(e) => updateSiteConfigField('workshopsCtaTitle', e.target.value)}
										placeholder="Des cours de patisserie pour tous"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Sous-titre</label>
									<input
										type="text"
										value={siteConfig.workshopsCtaSubtitle || ''}
										onChange={(e) => updateSiteConfigField('workshopsCtaSubtitle', e.target.value)}
										placeholder="master class"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Description</label>
									<div className="mt-1">
										<RichTextEditor
											content={siteConfig.workshopsCtaDescription || ''}
											onChange={(html) => updateSiteConfigField('workshopsCtaDescription', html)}
											placeholder="La patisserie n'aura plus de secret pour vous..."
										/>
									</div>
								</div>
								<div>
									<label className="text-sm font-medium">Label du bouton</label>
									<input
										type="text"
										value={siteConfig.workshopsCtaLabel || ''}
										onChange={(e) => updateSiteConfigField('workshopsCtaLabel', e.target.value)}
										placeholder="Reserver votre atelier"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
							</div>
						</Accordion>

						{/* Page Hero Images */}
						<Accordion
							title="Images hero des pages"
							isOpen={openSections.pageHeroes}
							onToggle={() => toggleSection('pageHeroes')}
						>
							<p className="mb-4 text-sm text-muted-foreground">
								Ajoutez une image hero en haut de chaque page de votre site
							</p>
							<div className="grid gap-6">
								{([
									{ page: 'creations', label: 'Page Creations', field: 'creationsHeroImageUrl' },
									{ page: 'workshops', label: 'Page Ateliers', field: 'workshopsHeroImageUrl' },
									{ page: 'products', label: 'Page Produits', field: 'productsHeroImageUrl' },
									{ page: 'orders', label: 'Page Commandes', field: 'ordersHeroImageUrl' },
								] as const).map(({ page, label, field }) => (
									<div key={page}>
										<label className="text-sm font-medium">{label}</label>
										<div className="mt-2 flex items-center gap-4">
											{profile[field] ? (
												<img
													src={getImageUrl(profile[field])!}
													alt={label}
													className="h-24 rounded-lg border object-cover"
												/>
											) : (
												<div className="flex h-24 w-36 items-center justify-center rounded-lg border-2 border-dashed bg-muted text-xs text-muted-foreground">
													Aucune
												</div>
											)}
											<div className="flex flex-col gap-2">
												<label className="cursor-pointer rounded-md border px-3 py-2 text-center text-sm hover:bg-muted">
													{profile[field] ? 'Changer' : 'Ajouter'}
													<input type="file" accept="image/*" onChange={(e) => handlePageHeroUpload(page, e)} className="hidden" />
												</label>
												{profile[field] && (
													<button
														type="button"
														onClick={() => handlePageHeroDelete(page)}
														className="rounded-md border px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
													>
														Supprimer
													</button>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						</Accordion>
					</>
				)}

				{/* ─── PAGES ─────────────────────────────── */}
				{activeTab === 'pages' && (
					<section className="rounded-lg border p-6">
						<h2 className="text-lg font-semibold">Visibilite des sections</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Activez ou desactivez les sections de votre site
						</p>
						{(() => {
							const isPro = profile && profile.plan !== 'starter'
							return (
								<div className="mt-6 space-y-4">
									<ToggleRow
										label='Section "Notre histoire"'
										checked={siteConfig.showStorySection !== false}
										onChange={(v) => updateSiteConfigField('showStorySection', v)}
									/>
									<ToggleRow
										label="Bandeau marquee"
										checked={siteConfig.showMarquee !== false}
										onChange={(v) => updateSiteConfigField('showMarquee', v)}
									/>
									<ToggleRow
										label="Creations sur homepage"
										checked={siteConfig.showCreationsOnHomepage !== false}
										onChange={(v) => updateSiteConfigField('showCreationsOnHomepage', v)}
									/>
									<ToggleRow
										label="CTA Ateliers sur homepage"
										checked={isPro ? siteConfig.showWorkshopsCta !== false : false}
										onChange={(v) => updateSiteConfigField('showWorkshopsCta', v)}
										locked={!isPro}
										badge={!isPro ? 'pro' : undefined}
									/>
									<div className="border-t pt-4">
										<ToggleRow
											label="Page Ateliers"
											checked={isPro ? workshopsEnabled : false}
											onChange={setWorkshopsEnabled}
											locked={!isPro}
											badge={!isPro ? 'pro' : undefined}
										/>
									</div>
									<ToggleRow
										label="Page Commandes"
										checked={isPro ? ordersEnabled : false}
										onChange={setOrdersEnabled}
										locked={!isPro}
										badge={!isPro ? 'pro' : undefined}
									/>
									{ordersEnabled && isPro && (
										<div className="ml-6 space-y-4 border-l pl-4">
											<ToggleRow
												label="Onglet Catalogue"
												checked={siteConfig.showCatalogueTab !== false}
												onChange={(v) => updateSiteConfigField('showCatalogueTab', v)}
											/>
											<ToggleRow
												label="Onglet Sur-mesure"
												checked={siteConfig.showCustomOrderTab !== false}
												onChange={(v) => updateSiteConfigField('showCustomOrderTab', v)}
											/>
										</div>
									)}
								</div>
							)
						})()}
					</section>
				)}

				{/* ─── CONTACT ─────────────────────────────── */}
				{activeTab === 'contact' && (
					<>
						<section className="rounded-lg border p-6">
							<h2 className="text-lg font-semibold">Coordonnees</h2>
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								<div>
									<label className="text-sm font-medium">Telephone</label>
									<input
										type="tel"
										value={phone}
										onChange={(e) => setPhone(e.target.value)}
										placeholder="06 12 34 56 78"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
							</div>
						</section>

						<section className="rounded-lg border p-6">
							<h2 className="text-lg font-semibold">Adresse</h2>
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								<div className="md:col-span-2">
									<label className="text-sm font-medium">Rue</label>
									<input
										type="text"
										value={addressStreet}
										onChange={(e) => setAddressStreet(e.target.value)}
										placeholder="12 rue de la Patisserie"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Ville</label>
									<input
										type="text"
										value={addressCity}
										onChange={(e) => setAddressCity(e.target.value)}
										placeholder="Paris"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Code postal</label>
									<input
										type="text"
										value={addressZip}
										onChange={(e) => setAddressZip(e.target.value)}
										placeholder="75001"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Pays</label>
									<input
										type="text"
										value={addressCountry}
										onChange={(e) => setAddressCountry(e.target.value)}
										placeholder="France"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
							</div>
						</section>

						<section className="rounded-lg border p-6">
							<h2 className="text-lg font-semibold">Reseaux sociaux</h2>
							<div className="mt-4 grid gap-4 md:grid-cols-2">
								<div>
									<label className="text-sm font-medium">Instagram</label>
									<input
										type="url"
										value={socialLinks.instagram || ''}
										onChange={(e) => setSocialLinks((prev) => ({ ...prev, instagram: e.target.value }))}
										placeholder="https://instagram.com/votre-page"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Facebook</label>
									<input
										type="url"
										value={socialLinks.facebook || ''}
										onChange={(e) => setSocialLinks((prev) => ({ ...prev, facebook: e.target.value }))}
										placeholder="https://facebook.com/votre-page"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">TikTok</label>
									<input
										type="url"
										value={socialLinks.tiktok || ''}
										onChange={(e) => setSocialLinks((prev) => ({ ...prev, tiktok: e.target.value }))}
										placeholder="https://tiktok.com/@votre-page"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">Snapchat</label>
									<input
										type="url"
										value={socialLinks.snapchat || ''}
										onChange={(e) => setSocialLinks((prev) => ({ ...prev, snapchat: e.target.value }))}
										placeholder="https://snapchat.com/add/votre-pseudo"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">LinkedIn</label>
									<input
										type="url"
										value={socialLinks.linkedin || ''}
										onChange={(e) => setSocialLinks((prev) => ({ ...prev, linkedin: e.target.value }))}
										placeholder="https://linkedin.com/in/votre-profil"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
								<div>
									<label className="text-sm font-medium">YouTube</label>
									<input
										type="url"
										value={socialLinks.youtube || ''}
										onChange={(e) => setSocialLinks((prev) => ({ ...prev, youtube: e.target.value }))}
										placeholder="https://youtube.com/@votre-chaine"
										className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
									/>
								</div>
							</div>
							<div className="mt-4 border-t pt-4">
								<h3 className="text-sm font-medium">Lien personnalise</h3>
								<div className="mt-2 grid gap-4 md:grid-cols-2">
									<div>
										<label className="text-sm text-muted-foreground">Nom du lien</label>
										<input
											type="text"
											value={socialLinks.customLabel || ''}
											onChange={(e) => setSocialLinks((prev) => ({ ...prev, customLabel: e.target.value }))}
											placeholder="Mon autre site"
											className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
										/>
									</div>
									<div>
										<label className="text-sm text-muted-foreground">URL</label>
										<input
											type="url"
											value={socialLinks.customUrl || ''}
											onChange={(e) => setSocialLinks((prev) => ({ ...prev, customUrl: e.target.value }))}
											placeholder="https://..."
											className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
										/>
									</div>
								</div>
							</div>
						</section>

						<section className="rounded-lg border p-6">
							<h2 className="text-lg font-semibold">Horaires d'ouverture</h2>
							<div className="mt-4 space-y-3">
								{DAYS.map((day) => {
									const hours = operatingHours?.[day.key]
									const isClosed = hours?.closed === true
									return (
										<div key={day.key} className="flex flex-wrap items-center gap-2 sm:gap-4">
											<span className="w-20 text-sm font-medium sm:w-24">{day.label}</span>
											<label className="flex items-center gap-2 text-sm">
												<input
													type="checkbox"
													checked={!isClosed}
													onChange={(e) => updateOperatingHour(day.key, 'closed', !e.target.checked)}
													className="accent-primary"
												/>
												Ouvert
											</label>
											{!isClosed && (
												<>
													<input
														type="time"
														value={hours?.open || '09:00'}
														onChange={(e) => updateOperatingHour(day.key, 'open', e.target.value)}
														className="rounded-md border px-2 py-1 text-sm"
													/>
													<span className="text-sm text-muted-foreground">-</span>
													<input
														type="time"
														value={hours?.close || '18:00'}
														onChange={(e) => updateOperatingHour(day.key, 'close', e.target.value)}
														className="rounded-md border px-2 py-1 text-sm"
													/>
												</>
											)}
										</div>
									)
								})}
							</div>
						</section>
					</>
				)}
			</div>

			{/* Save button */}
			<div className="sticky bottom-0 border-t bg-background py-4">
				<button
					type="button"
					onClick={handleSave}
					disabled={isSaving}
					className="w-full rounded-md bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
				>
					{isSaving ? 'Enregistrement...' : 'Enregistrer'}
				</button>
			</div>

			{/* Toast */}
			{toast && (
				<div className="fixed right-4 bottom-4 z-50 rounded-lg border bg-background px-4 py-3 text-sm shadow-lg">
					{toast}
				</div>
			)}
		</div>
	)
}

// ─── Accordion Component ────────────────────────────────────────

function Accordion({
	title,
	isOpen,
	onToggle,
	children,
}: {
	title: string
	isOpen: boolean
	onToggle: () => void
	children: React.ReactNode
}) {
	return (
		<section className="rounded-lg border">
			<button
				type="button"
				onClick={onToggle}
				className="flex w-full items-center justify-between p-6 text-left"
			>
				<h2 className="text-lg font-semibold">{title}</h2>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
				>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</button>
			{isOpen && <div className="border-t px-6 pb-6 pt-4">{children}</div>}
		</section>
	)
}

// ─── Toggle Row Component ────────────────────────────────────────

function ToggleRow({
	label,
	checked,
	onChange,
	locked,
	badge,
}: {
	label: string
	checked: boolean
	onChange: (value: boolean) => void
	locked?: boolean
	badge?: 'pro' | 'premium'
}) {
	return (
		<div className="flex items-center justify-between">
			<span className={`text-sm font-medium ${locked ? 'text-muted-foreground' : ''}`}>
				{label}
				{badge && (
					<span
						className={`ml-2 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
							badge === 'premium'
								? 'bg-amber-100 text-amber-700'
								: 'bg-blue-100 text-blue-700'
						}`}
					>
						{badge === 'premium' ? 'Premium' : 'Pro'}
					</span>
				)}
			</span>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				disabled={locked}
				onClick={() => onChange(!checked)}
				className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
					locked
						? 'cursor-not-allowed opacity-40 bg-muted-foreground/30'
						: checked
							? 'bg-primary'
							: 'bg-muted-foreground/30'
				}`}
			>
				<span
					className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
						checked ? 'translate-x-6' : 'translate-x-1'
					}`}
				/>
			</button>
		</div>
	)
}
