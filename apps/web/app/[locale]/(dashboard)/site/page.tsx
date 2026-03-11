'use client'

import {
	AlertCircle,
	ExternalLink,
	Eye,
	FileText,
	LayoutGrid,
	Monitor,
	Palette,
	Phone,
	RefreshCw,
	Save,
	Smartphone,
	Undo2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ImageCropper } from '@/components/ui/image-cropper'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api/client'
import { useTour } from '@/lib/hooks/use-tour'
import { BrandingTab } from './_components/branding-tab'
import { ContactTab } from './_components/contact-tab'
import { ContentTab } from './_components/content-tab'
import { SectionsTab } from './_components/sections-tab'
import type { Profile, SiteConfig } from './_components/types'

export default function SiteEditorPage() {
	const t = useTranslations('siteEditor')
	const tc = useTranslations('common')

	const [profile, setProfile] = useState<Profile | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [activeTab, setActiveTab] = useState<string>('branding')
	const [showPreview, setShowPreview] = useState(false)
	const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop')
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
	const [instagramStatus, setInstagramStatus] = useState<{
		connected: boolean
		valid?: boolean
		username?: string
	} | null>(null)
	const [instagramLoading, setInstagramLoading] = useState(false)

	// Image cropper state
	const [cropState, setCropState] = useState<{
		src: string
		file?: File
		target: 'hero' | string
	} | null>(null)

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

	// Send live preview updates to the iframe
	useEffect(() => {
		if (!iframeRef.current?.contentWindow || !showPreview) return
		const configWithFont: typeof siteConfig = {
			...siteConfig,
			fontPreset: fontPreset as 'classic' | 'modern' | 'elegant' | 'playful',
		}
		iframeRef.current.contentWindow.postMessage(
			{
				type: 'PATISSIO_PREVIEW_UPDATE',
				payload: {
					primaryColor,
					secondaryColor,
					siteConfig: configWithFont,
					ordersEnabled,
					workshopsEnabled,
					phone: phone || null,
					addressStreet: addressStreet || null,
					addressCity: addressCity || null,
					addressZip: addressZip || null,
					addressCountry: addressCountry || null,
					socialLinks,
					operatingHours,
				},
			},
			'*'
		)
	}, [
		showPreview,
		primaryColor,
		secondaryColor,
		fontPreset,
		siteConfig,
		ordersEnabled,
		workshopsEnabled,
		phone,
		addressStreet,
		addressCity,
		addressZip,
		addressCountry,
		socialLinks,
		operatingHours,
	])

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

	// Fetch Instagram connection status
	const loadInstagramStatus = useCallback(async () => {
		try {
			const res = await api.get('/patissier/instagram/status')
			setInstagramStatus(res.data.data)
		} catch {
			setInstagramStatus(null)
		}
	}, [])

	useEffect(() => {
		loadInstagramStatus()
	}, [loadInstagramStatus])

	// Handle Instagram OAuth redirect result
	const igExchanged = useRef(false)
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const igResult = params.get('instagram')
		const igCode = params.get('instagram_code')

		if (igCode && !igExchanged.current) {
			igExchanged.current = true
			setActiveTab('sections')
			api
				.post('/patissier/instagram/exchange', { code: igCode })
				.then(() => {
					loadInstagramStatus()
					toast.success(t('instagramSuccess'))
				})
				.catch(() => {
					toast.error(t('instagramError'))
				})
				.finally(() => {
					const url = new URL(window.location.href)
					url.searchParams.delete('instagram_code')
					window.history.replaceState({}, '', url.pathname)
				})
			return
		}

		if (igResult) {
			setActiveTab('sections')
			if (igResult === 'success') {
				loadInstagramStatus()
				toast.success(t('instagramSuccess'))
			} else {
				toast.error(t('instagramError'))
			}
			const url = new URL(window.location.href)
			url.searchParams.delete('instagram')
			window.history.replaceState({}, '', url.pathname)
		}
	}, [loadInstagramStatus, t])

	const handleInstagramConnect = async () => {
		setInstagramLoading(true)
		try {
			const res = await api.get('/patissier/instagram/auth-url')
			const url = res.data.data.url
			window.location.href = url
		} catch {
			toast.error(t('instagramNotConfigured'))
			setInstagramLoading(false)
		}
	}

	const handleInstagramDisconnect = async () => {
		setInstagramLoading(true)
		try {
			await api.delete('/patissier/instagram/disconnect')
			setInstagramStatus({ connected: false })
			toast(t('instagramDisconnected'))
		} catch {
			toast.error(t('instagramDisconnectError'))
		} finally {
			setInstagramLoading(false)
		}
	}

	const updateSiteConfigField = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
		setSiteConfig((prev) => ({ ...prev, [key]: value }))
	}

	const handleSave = async () => {
		if (!profile) return
		setIsSaving(true)
		try {
			const configToSave: SiteConfig = {
				...siteConfig,
				fontPreset: fontPreset as SiteConfig['fontPreset'],
			}

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

			toast.success(t('saved'))
			await loadProfile()
			setPreviewKey((k) => k + 1)
		} catch (e) {
			console.error(e)
			toast.error(t('saveError'))
		} finally {
			setIsSaving(false)
		}
	}

	const discardChanges = () => {
		if (!profile) return
		setPrimaryColor(profile.primaryColor)
		setSecondaryColor(profile.secondaryColor)
		setFontPreset(profile.siteConfig?.fontPreset || 'classic')
		setHeroImageUrl(profile.heroImageUrl)
		setSiteConfig(profile.siteConfig || {})
		setOrdersEnabled(profile.ordersEnabled)
		setWorkshopsEnabled(profile.workshopsEnabled)
		setPhone(profile.phone || '')
		setAddressStreet(profile.addressStreet || '')
		setAddressCity(profile.addressCity || '')
		setAddressZip(profile.addressZip || '')
		setAddressCountry(profile.addressCountry || 'France')
		setSocialLinks(profile.socialLinks || {})
		setOperatingHours(profile.operatingHours)
	}

	const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const formData = new FormData()
		formData.append('logo', file)
		try {
			await api.upload('/patissier/logo', formData)
			toast.success(t('logoUpdated'))
			await loadProfile()
		} catch {
			toast.error(t('logoError'))
		}
	}

	const handleLogoDelete = async () => {
		try {
			await api.delete('/patissier/logo')
			toast(t('logoDeleted'))
			await loadProfile()
		} catch {
			toast.error(t('logoError'))
		}
	}

	const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		e.target.value = ''
		const src = URL.createObjectURL(file)
		setCropState({ src, file, target: 'hero' })
	}

	const handleHeroImageDelete = async () => {
		try {
			await api.delete('/patissier/hero-image')
			toast(t('heroImageDeleted'))
			await loadProfile()
		} catch {
			toast.error(t('imageDeleteError'))
		}
	}

	const handleStoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const formData = new FormData()
		formData.append('image', file)
		try {
			await api.upload('/patissier/story-image', formData)
			toast.success(t('imageUpdated'))
			await loadProfile()
		} catch {
			toast.error(t('imageUploadError'))
		}
	}

	const handleStoryImageDelete = async () => {
		try {
			await api.delete('/patissier/story-image')
			toast(t('imageDeleted'))
			await loadProfile()
		} catch {
			toast.error(t('imageDeleteError'))
		}
	}

	const handlePageHeroUpload = (page: string, e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		e.target.value = ''
		const src = URL.createObjectURL(file)
		setCropState({ src, file, target: page })
	}

	const handlePageHeroDelete = async (page: string) => {
		try {
			await api.delete(`/patissier/page-hero/${page}`)
			toast(t('coverImageDeleted'))
			await loadProfile()
		} catch {
			toast.error(t('imageDeleteError'))
		}
	}

	const handleCropConfirm = async (blob: Blob) => {
		if (!cropState) return
		const { src, file, target } = cropState
		const formData = new FormData()
		formData.append('image', blob, file?.name || 'image.jpg')
		URL.revokeObjectURL(src)
		setCropState(null)
		try {
			if (target === 'hero') {
				await api.upload('/patissier/hero-image', formData)
			} else {
				await api.upload(`/patissier/page-hero/${target}`, formData)
			}
			toast.success(t('imageUpdated'))
			await loadProfile()
		} catch {
			toast.error(t('imageUploadError'))
		}
	}

	const handleCropCancel = () => {
		if (cropState) URL.revokeObjectURL(cropState.src)
		setCropState(null)
	}

	const updateOperatingHour = (
		day: string,
		field: 'open' | 'close' | 'closed',
		value: string | boolean
	) => {
		setOperatingHours((prev) => {
			const current = prev || {}
			const dayData = current[day] || { open: '09:00', close: '18:00' }
			return {
				...current,
				[day]: { ...dayData, [field]: value },
			}
		})
	}

	const refreshPreview = () => setPreviewKey((k) => k + 1)

	// Auto-start site editor tour for new users
	useTour('site-editor', true)

	if (isLoading) {
		return <p className="text-muted-foreground">{tc('loading')}</p>
	}

	if (!profile) {
		return <p className="text-destructive">{t('profileLoadError')}</p>
	}

	const isPro = profile.plan !== 'starter'

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col">
			{/* Header */}
			<div className="flex-none border-b bg-background">
				<div className="flex items-center justify-between px-6 py-4">
					<div>
						<h1 className="text-xl font-semibold">{t('title')}</h1>
						<p className="text-sm text-muted-foreground">{t('subtitle')}</p>
					</div>
					<div className="flex items-center gap-2">
						{siteUrl && (
							<Button variant="outline" size="sm" asChild>
								<a href={siteUrl} target="_blank" rel="noopener noreferrer">
									<ExternalLink className="mr-2 size-4" />
									{t('previewSite')}
								</a>
							</Button>
						)}
						<Button
							id="tour-site-preview"
							variant={showPreview ? 'secondary' : 'outline'}
							size="sm"
							onClick={() => setShowPreview(!showPreview)}
						>
							<Eye className="mr-2 size-4" />
							{t('preview')}
						</Button>
						<Button
							id="tour-site-save"
							size="sm"
							disabled={!hasChanges || isSaving}
							onClick={handleSave}
						>
							{isSaving ? (
								<RefreshCw className="mr-2 size-4 animate-spin" />
							) : (
								<Save className="mr-2 size-4" />
							)}
							{isSaving ? t('saving') : t('saveChanges')}
						</Button>
					</div>
				</div>

				{/* Unsaved changes banner */}
				{hasChanges && (
					<div className="px-6 pb-4">
						<Alert className="border-amber-200 bg-amber-50">
							<AlertCircle className="size-4 text-amber-600" />
							<AlertDescription className="flex w-full items-center justify-between">
								<span className="text-amber-800">{t('unsavedChanges')}</span>
								<div className="flex gap-2">
									<Button variant="ghost" size="sm" onClick={discardChanges}>
										<Undo2 className="mr-1 size-4" />
										{t('discard')}
									</Button>
									<Button size="sm" onClick={handleSave} disabled={isSaving}>
										{isSaving ? t('saving') : t('saveChanges')}
									</Button>
								</div>
							</AlertDescription>
						</Alert>
					</div>
				)}
			</div>

			{/* Main Content */}
			<div className="flex flex-1 overflow-hidden">
				{/* Editor Panel */}
				<div className={`flex-1 overflow-y-auto ${showPreview ? 'max-w-2xl' : ''}`}>
					<div className="p-6">
						<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
							<TabsList id="tour-site-tabs" className="grid w-full grid-cols-4">
								<TabsTrigger id="tour-tab-branding" value="branding" className="gap-2">
									<Palette className="size-4" />
									<span className="hidden sm:inline">{t('branding')}</span>
								</TabsTrigger>
								<TabsTrigger id="tour-tab-content" value="content" className="gap-2">
									<FileText className="size-4" />
									<span className="hidden sm:inline">{t('content')}</span>
								</TabsTrigger>
								<TabsTrigger id="tour-tab-sections" value="sections" className="gap-2">
									<LayoutGrid className="size-4" />
									<span className="hidden sm:inline">{t('sections')}</span>
								</TabsTrigger>
								<TabsTrigger id="tour-tab-contact" value="contact" className="gap-2">
									<Phone className="size-4" />
									<span className="hidden sm:inline">{t('contact')}</span>
								</TabsTrigger>
							</TabsList>

							<TabsContent value="branding">
								<BrandingTab
									profile={profile}
									primaryColor={primaryColor}
									setPrimaryColor={setPrimaryColor}
									secondaryColor={secondaryColor}
									setSecondaryColor={setSecondaryColor}
									fontPreset={fontPreset}
									setFontPreset={setFontPreset}
									onLogoUpload={handleLogoUpload}
									onLogoDelete={handleLogoDelete}
									onHeroImageUpload={handleHeroImageUpload}
									onHeroImageDelete={handleHeroImageDelete}
								/>
							</TabsContent>

							<TabsContent value="content">
								<ContentTab
									profile={profile}
									siteConfig={siteConfig}
									ordersEnabled={ordersEnabled}
									updateSiteConfigField={updateSiteConfigField}
									onStoryImageUpload={handleStoryImageUpload}
									onStoryImageDelete={handleStoryImageDelete}
									onPageHeroUpload={handlePageHeroUpload}
									onPageHeroDelete={handlePageHeroDelete}
								/>
							</TabsContent>

							<TabsContent value="sections">
								<SectionsTab
									isPro={isPro}
									siteConfig={siteConfig}
									ordersEnabled={ordersEnabled}
									workshopsEnabled={workshopsEnabled}
									setOrdersEnabled={setOrdersEnabled}
									setWorkshopsEnabled={setWorkshopsEnabled}
									updateSiteConfigField={updateSiteConfigField}
									instagramStatus={instagramStatus}
									instagramLoading={instagramLoading}
									onInstagramConnect={handleInstagramConnect}
									onInstagramDisconnect={handleInstagramDisconnect}
								/>
							</TabsContent>

							<TabsContent value="contact">
								<ContactTab
									phone={phone}
									setPhone={setPhone}
									addressStreet={addressStreet}
									setAddressStreet={setAddressStreet}
									addressCity={addressCity}
									setAddressCity={setAddressCity}
									addressZip={addressZip}
									setAddressZip={setAddressZip}
									addressCountry={addressCountry}
									setAddressCountry={setAddressCountry}
									socialLinks={socialLinks}
									setSocialLinks={setSocialLinks}
									operatingHours={operatingHours}
									updateOperatingHour={updateOperatingHour}
								/>
							</TabsContent>
						</Tabs>
					</div>
				</div>

				{/* Preview Panel — side by side */}
				{showPreview && siteUrl && (
					<div className="flex flex-1 flex-col border-l bg-muted/30">
						<div className="flex items-center justify-between border-b bg-background p-4">
							<div className="flex items-center gap-2">
								<Button
									variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'}
									size="sm"
									onClick={() => setPreviewDevice('mobile')}
								>
									<Smartphone className="size-4" />
								</Button>
								<Button
									variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'}
									size="sm"
									onClick={() => setPreviewDevice('desktop')}
								>
									<Monitor className="size-4" />
								</Button>
							</div>
							<Button variant="ghost" size="sm" onClick={refreshPreview}>
								<RefreshCw className="size-4" />
							</Button>
						</div>
						<div className="flex flex-1 items-center justify-center overflow-hidden p-4">
							<div
								className={`overflow-hidden rounded-lg bg-white shadow-xl transition-all ${
									previewDevice === 'mobile'
										? 'h-[600px] w-[375px]'
										: 'h-[500px] w-full max-w-[900px]'
								}`}
							>
								<iframe
									ref={iframeRef}
									key={previewKey}
									src={siteUrl}
									className="size-full"
									title="Site preview"
								/>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Image Cropper */}
			{cropState && (
				<ImageCropper
					imageSrc={cropState.src}
					onCrop={handleCropConfirm}
					onCancel={handleCropCancel}
					aspect={16 / 9}
				/>
			)}
		</div>
	)
}
