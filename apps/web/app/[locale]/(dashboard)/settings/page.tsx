'use client'

import {
	AlertCircle,
	AlertTriangle,
	Check,
	CheckCircle2,
	Copy,
	CreditCard,
	Eye,
	EyeOff,
	Globe,
	HelpCircle,
	Loader2,
	Lock,
	Palette,
	Save,
	Shield,
	ShieldCheck,
	ShieldOff,
	Smartphone,
	Trash2,
	Upload,
	X,
} from 'lucide-react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api/client'
import { useAuth } from '@/lib/providers/auth-provider'

function ColorPicker({
	label,
	value,
	onChange,
}: {
	label: string
	value: string
	onChange: (value: string) => void
}) {
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<div className="flex items-center gap-2">
				<div className="h-9 w-9 shrink-0 rounded-md border" style={{ backgroundColor: value }} />
				<Input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="flex-1 font-mono text-sm"
					placeholder="#000000"
				/>
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-9 w-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
				/>
			</div>
		</div>
	)
}

function PasswordStrengthIndicator({
	rules,
}: {
	rules: { key: string; label: string; valid: boolean }[]
}) {
	const validCount = rules.filter((r) => r.valid).length
	const percentage = (validCount / rules.length) * 100

	return (
		<div className="space-y-3 rounded-lg border bg-muted/50 p-4">
			<div className="space-y-1.5">
				<div className="flex items-center justify-between">
					<p className="text-sm font-medium">Force du mot de passe</p>
					<span className="text-xs text-muted-foreground">
						{validCount}/{rules.length}
					</span>
				</div>
				<Progress value={percentage} className="h-2" />
			</div>
			<div className="grid grid-cols-1 gap-1.5">
				{rules.map((rule) => (
					<div key={rule.key} className="flex items-center gap-2">
						{rule.valid ? (
							<Check className="h-3.5 w-3.5 text-green-600" />
						) : (
							<X className="h-3.5 w-3.5 text-muted-foreground" />
						)}
						<span className={`text-xs ${rule.valid ? 'text-green-600' : 'text-muted-foreground'}`}>
							{rule.label}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}

export default function SettingsPage() {
	const { refreshUser, changePassword } = useAuth()
	const searchParams = useSearchParams()
	const [profile, setProfile] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [isConnecting, setIsConnecting] = useState(false)
	const [stripeStatus, setStripeStatus] = useState<string | null>(null)
	const callbackHandled = useRef(false)

	// Profile form state
	const [businessName, setBusinessName] = useState('')
	const [slug, setSlug] = useState('')
	const [phone, setPhone] = useState('')
	const [addressStreet, setAddressStreet] = useState('')
	const [addressCity, setAddressCity] = useState('')
	const [addressZip, setAddressZip] = useState('')
	const [addressCountry, setAddressCountry] = useState('')

	// Branding state
	const [primaryColor, setPrimaryColor] = useState('#000000')
	const [secondaryColor, setSecondaryColor] = useState('#000000')
	const [fontFamily, setFontFamily] = useState('default')
	const logoInputRef = useRef<HTMLInputElement>(null)
	const [logoUploading, setLogoUploading] = useState(false)

	// Domain state
	const [domainInput, setDomainInput] = useState('')
	const [domainLoading, setDomainLoading] = useState(false)
	const [domainError, setDomainError] = useState<string | null>(null)
	const [domainStatus, setDomainStatus] = useState<{ status: string; domain: string } | null>(null)
	const [domainVerifying, setDomainVerifying] = useState(false)

	// Favicon state
	const [faviconUploading, setFaviconUploading] = useState(false)
	const faviconInputRef = useRef<HTMLInputElement>(null)

	// Password change state
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
	const [showCurrentPassword, setShowCurrentPassword] = useState(false)
	const [showNewPassword, setShowNewPassword] = useState(false)
	const [passwordError, setPasswordError] = useState('')
	const [passwordSuccess, setPasswordSuccess] = useState(false)
	const [isChangingPassword, setIsChangingPassword] = useState(false)

	const passwordStrengthRules = [
		{ key: 'minLength', label: '8 caractères minimum', valid: newPassword.length >= 8 },
		{ key: 'uppercase', label: 'Une majuscule', valid: /[A-Z]/.test(newPassword) },
		{ key: 'lowercase', label: 'Une minuscule', valid: /[a-z]/.test(newPassword) },
		{ key: 'number', label: 'Un chiffre', valid: /[0-9]/.test(newPassword) },
		{
			key: 'specialChar',
			label: 'Un caractère spécial',
			valid: /[^A-Za-z0-9]/.test(newPassword),
		},
	]

	const passwordsMatch =
		newPassword.length > 0 &&
		newPasswordConfirmation.length > 0 &&
		newPassword === newPasswordConfirmation

	const allPasswordRulesValid = passwordStrengthRules.every((rule) => rule.valid) && passwordsMatch

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!allPasswordRulesValid || !currentPassword) return
		setPasswordError('')
		setPasswordSuccess(false)
		setIsChangingPassword(true)
		try {
			await changePassword(currentPassword, newPassword)
			setPasswordSuccess(true)
			setCurrentPassword('')
			setNewPassword('')
			setNewPasswordConfirmation('')
		} catch (err: any) {
			setPasswordError(err.message || 'Erreur lors du changement de mot de passe')
		} finally {
			setIsChangingPassword(false)
		}
	}

	const loadProfile = useCallback(() => {
		api
			.get('/patissier/profile')
			.then((res) => {
				const p = res.data.data
				setProfile(p)
				setBusinessName(p?.businessName ?? '')
				setSlug(p?.slug ?? '')
				setPhone(p?.phone ?? '')
				setAddressStreet(p?.addressStreet ?? '')
				setAddressCity(p?.addressCity ?? '')
				setAddressZip(p?.addressZip ?? '')
				setAddressCountry(p?.addressCountry ?? '')
				setPrimaryColor(p?.primaryColor ?? '#000000')
				setSecondaryColor(p?.secondaryColor ?? '#000000')
				setFontFamily(p?.fontFamily ?? 'default')
			})
			.catch(console.error)
			.finally(() => setIsLoading(false))
	}, [])

	useEffect(() => {
		loadProfile()
	}, [loadProfile])

	// Handle Stripe callback
	useEffect(() => {
		const stripeParam = searchParams.get('stripe')
		if (stripeParam === 'callback' && !callbackHandled.current) {
			callbackHandled.current = true
			api
				.get('/patissier/integrations/stripe/callback')
				.then((res) => {
					const data = res.data.data
					if (data.onboardingComplete) {
						setStripeStatus('success')
						loadProfile()
						refreshUser?.()
					} else {
						setStripeStatus('incomplete')
					}
				})
				.catch(() => setStripeStatus('error'))
		} else if (stripeParam === 'refresh') {
			setStripeStatus('refresh')
		}
	}, [searchParams, loadProfile, refreshUser])

	const handleSaveAll = async () => {
		setIsSaving(true)
		try {
			// Save profile data
			await api.patch('/patissier/profile', {
				businessName: businessName.trim(),
				phone: phone.trim(),
				addressStreet: addressStreet.trim(),
				addressCity: addressCity.trim(),
				addressZip: addressZip.trim(),
				addressCountry: addressCountry.trim(),
			})

			// Save design data
			await api.put('/patissier/site-design', {
				primaryColor,
				secondaryColor,
				fontFamily,
			})

			// Update local profile state
			setProfile((p: any) => ({
				...p,
				businessName: businessName.trim(),
				phone: phone.trim(),
				addressStreet: addressStreet.trim(),
				addressCity: addressCity.trim(),
				addressZip: addressZip.trim(),
				addressCountry: addressCountry.trim(),
				primaryColor,
				secondaryColor,
				fontFamily,
			}))
		} catch (err) {
			console.error(err)
		} finally {
			setIsSaving(false)
		}
	}

	const handleConnectStripe = async () => {
		setIsConnecting(true)
		try {
			const res = await api.post('/patissier/integrations/stripe/connect')
			const data = res.data.data
			if (data.onboardingComplete) {
				setStripeStatus('success')
				loadProfile()
			} else if (data.onboardingUrl) {
				window.location.href = data.onboardingUrl
			}
		} catch (err) {
			console.error(err)
		} finally {
			setIsConnecting(false)
		}
	}

	const handleStripeDashboard = async () => {
		try {
			const res = await api.get('/patissier/integrations/stripe/dashboard')
			const url = res.data.data?.url
			if (url) window.location.href = url
		} catch {
			// Dashboard failed — capabilities may be missing, re-trigger onboarding
			try {
				const res = await api.post('/patissier/integrations/stripe/connect')
				const data = res.data.data
				if (data.onboardingUrl) {
					window.location.href = data.onboardingUrl
				}
			} catch (err) {
				console.error(err)
			}
		}
	}

	const handleSetDomain = async () => {
		const domain = domainInput
			.trim()
			.toLowerCase()
			.replace(/^(https?:\/\/)?(www\.)?/, '')
			.replace(/\/.*$/, '')
		if (!domain) return
		setDomainLoading(true)
		setDomainError(null)
		try {
			await api.put('/patissier/domain', { domain })
			setProfile((p: any) => ({ ...p, customDomain: domain, customDomainVerified: false }))
			setDomainStatus({ status: 'pending', domain })
			setDomainInput('')
		} catch (err: any) {
			setDomainError(err?.response?.data?.message || 'Erreur lors de la configuration du domaine')
		} finally {
			setDomainLoading(false)
		}
	}

	const handleRemoveDomain = async () => {
		setDomainLoading(true)
		try {
			await api.delete('/patissier/domain')
			setProfile((p: any) => ({ ...p, customDomain: null, customDomainVerified: false }))
			setDomainStatus(null)
		} catch (err) {
			console.error(err)
		} finally {
			setDomainLoading(false)
		}
	}

	const handleVerifyDomain = async () => {
		setDomainVerifying(true)
		try {
			const res = await api.get('/patissier/domain/verify')
			const data = res.data.data
			setDomainStatus({ status: data.status, domain: data.domain })
			if (data.status === 'verified') {
				setProfile((p: any) => ({ ...p, customDomainVerified: true }))
			}
		} catch (err) {
			console.error(err)
		} finally {
			setDomainVerifying(false)
		}
	}

	const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setLogoUploading(true)
		try {
			const formData = new FormData()
			formData.append('logo', file)
			const res = await api.upload('/patissier/logo', formData)
			setProfile((p: any) => ({ ...p, logoUrl: res.data.data.logoUrl }))
		} catch (err) {
			console.error(err)
		} finally {
			setLogoUploading(false)
			if (logoInputRef.current) logoInputRef.current.value = ''
		}
	}

	const handleDeleteLogo = async () => {
		setLogoUploading(true)
		try {
			await api.delete('/patissier/logo')
			setProfile((p: any) => ({ ...p, logoUrl: null }))
		} catch (err) {
			console.error(err)
		} finally {
			setLogoUploading(false)
		}
	}

	const handleUploadFavicon = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setFaviconUploading(true)
		try {
			const formData = new FormData()
			formData.append('favicon', file)
			const res = await api.upload('/patissier/favicon', formData)
			setProfile((p: any) => ({ ...p, faviconUrl: res.data.data.faviconUrl }))
		} catch (err) {
			console.error(err)
		} finally {
			setFaviconUploading(false)
			if (faviconInputRef.current) faviconInputRef.current.value = ''
		}
	}

	const handleDeleteFavicon = async () => {
		setFaviconUploading(true)
		try {
			await api.delete('/patissier/favicon')
			setProfile((p: any) => ({ ...p, faviconUrl: null }))
		} catch (err) {
			console.error(err)
		} finally {
			setFaviconUploading(false)
		}
	}

	if (isLoading) {
		return <p className="text-muted-foreground">Chargement...</p>
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
					<p className="text-muted-foreground">Configurez votre profil et votre compte</p>
				</div>
				<Button onClick={handleSaveAll} disabled={isSaving}>
					{isSaving ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Save className="mr-2 h-4 w-4" />
					)}
					Enregistrer
				</Button>
			</div>

			{/* Stripe callback messages */}
			{stripeStatus === 'success' && (
				<div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
					Votre compte Stripe a été connecté avec succès ! Vous pouvez maintenant recevoir des
					paiements.
				</div>
			)}
			{stripeStatus === 'incomplete' && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
					La vérification de votre compte Stripe n'est pas encore terminée. Veuillez compléter
					toutes les étapes.
				</div>
			)}
			{stripeStatus === 'refresh' && (
				<div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
					Le lien d'onboarding a expiré. Cliquez sur "Connecter Stripe" pour obtenir un nouveau
					lien.
				</div>
			)}
			{stripeStatus === 'error' && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
					Une erreur est survenue lors de la vérification de votre compte Stripe.
				</div>
			)}

			{/* 2-column grid */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Business Profile Card */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Profil de l'entreprise</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="businessName">Nom de la pâtisserie</Label>
							<Input
								id="businessName"
								value={businessName}
								onChange={(e) => setBusinessName(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label>URL du site</Label>
							{profile?.plan === 'pro' || profile?.plan === 'premium' ? (
								<p className="text-sm text-blue-600">{slug}.patissio.com</p>
							) : (
								<p className="text-sm text-blue-600">patissio.com/{slug}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">Téléphone</Label>
							<Input
								id="phone"
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
								placeholder="+33 6 00 00 00 00"
							/>
						</div>

						<Separator />

						<div className="space-y-4">
							<Label className="text-sm font-medium">Adresse</Label>
							<div className="space-y-3">
								<div className="space-y-2">
									<Label htmlFor="addressStreet" className="text-xs text-muted-foreground">
										Rue
									</Label>
									<Input
										id="addressStreet"
										value={addressStreet}
										onChange={(e) => setAddressStreet(e.target.value)}
										placeholder="123 Rue de la Pâtisserie"
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-2">
										<Label htmlFor="addressCity" className="text-xs text-muted-foreground">
											Ville
										</Label>
										<Input
											id="addressCity"
											value={addressCity}
											onChange={(e) => setAddressCity(e.target.value)}
											placeholder="Paris"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="addressZip" className="text-xs text-muted-foreground">
											Code postal
										</Label>
										<Input
											id="addressZip"
											value={addressZip}
											onChange={(e) => setAddressZip(e.target.value)}
											placeholder="75001"
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="addressCountry" className="text-xs text-muted-foreground">
										Pays
									</Label>
									<Input
										id="addressCountry"
										value={addressCountry}
										onChange={(e) => setAddressCountry(e.target.value)}
										placeholder="France"
									/>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Branding Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Palette className="h-5 w-5" />
							Identité visuelle
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<ColorPicker
							label="Couleur principale"
							value={primaryColor}
							onChange={setPrimaryColor}
						/>
						<ColorPicker
							label="Couleur secondaire"
							value={secondaryColor}
							onChange={setSecondaryColor}
						/>

						<div className="space-y-2">
							<Label>Police de caractères</Label>
							<Select value={fontFamily} onValueChange={setFontFamily}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Sélectionner une police" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="default">Par défaut</SelectItem>
									<SelectItem value="serif">Serif</SelectItem>
									<SelectItem value="sans-serif">Sans-serif</SelectItem>
									<SelectItem value="monospace">Monospace</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Separator />

						{/* Logo upload */}
						<div className="space-y-2">
							<Label>Logo</Label>
							<div className="flex items-center gap-4">
								{profile?.logoUrl ? (
									<>
										<div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-white">
											<Image
												src={
													profile.logoUrl.startsWith('http')
														? profile.logoUrl
														: `${process.env.NEXT_PUBLIC_STORAGE_URL}/${profile.logoUrl}`
												}
												alt="Logo"
												width={48}
												height={48}
												className="h-12 w-12 object-contain"
											/>
										</div>
										<div className="flex gap-2">
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => logoInputRef.current?.click()}
												disabled={logoUploading}
											>
												{logoUploading ? (
													<Loader2 className="h-3.5 w-3.5 animate-spin" />
												) : (
													<>
														<Upload className="mr-1.5 inline h-3.5 w-3.5" />
														Changer
													</>
												)}
											</Button>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={handleDeleteLogo}
												disabled={logoUploading}
												className="text-red-500 hover:bg-red-50"
											>
												<Trash2 className="mr-1.5 inline h-3.5 w-3.5" />
												Supprimer
											</Button>
										</div>
									</>
								) : (
									<button
										type="button"
										onClick={() => logoInputRef.current?.click()}
										disabled={logoUploading}
										className="flex items-center gap-2 rounded-md border border-dashed border-input bg-background px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50"
									>
										{logoUploading ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Upload className="h-4 w-4" />
										)}
										Ajouter un logo
									</button>
								)}
								<input
									ref={logoInputRef}
									type="file"
									accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
									onChange={handleUploadLogo}
									className="hidden"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								PNG, JPG, WebP ou SVG. 512x512px recommandé.
							</p>
						</div>

						{/* Favicon upload (Premium only) */}
						{profile?.plan === 'premium' && (
							<>
								<Separator />
								<div className="space-y-2">
									<Label>Icône du navigateur (favicon)</Label>
									<div className="flex items-center gap-4">
										{profile?.faviconUrl ? (
											<>
												<div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-white">
													<Image
														src={
															profile.faviconUrl.startsWith('http')
																? profile.faviconUrl
																: `${process.env.NEXT_PUBLIC_STORAGE_URL}/${profile.faviconUrl}`
														}
														alt="Favicon"
														width={32}
														height={32}
														className="h-8 w-8 object-contain"
													/>
												</div>
												<div className="flex gap-2">
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => faviconInputRef.current?.click()}
														disabled={faviconUploading}
													>
														{faviconUploading ? (
															<Loader2 className="h-3.5 w-3.5 animate-spin" />
														) : (
															<>
																<Upload className="mr-1.5 inline h-3.5 w-3.5" />
																Changer
															</>
														)}
													</Button>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={handleDeleteFavicon}
														disabled={faviconUploading}
														className="text-red-500 hover:bg-red-50"
													>
														<Trash2 className="mr-1.5 inline h-3.5 w-3.5" />
														Supprimer
													</Button>
												</div>
											</>
										) : (
											<button
												type="button"
												onClick={() => faviconInputRef.current?.click()}
												disabled={faviconUploading}
												className="flex items-center gap-2 rounded-md border border-dashed border-input bg-background px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50"
											>
												{faviconUploading ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Upload className="h-4 w-4" />
												)}
												Ajouter une icône
											</button>
										)}
										<input
											ref={faviconInputRef}
											type="file"
											accept="image/png,image/jpeg,image/webp,image/x-icon,image/svg+xml"
											onChange={handleUploadFavicon}
											className="hidden"
										/>
									</div>
									<p className="text-xs text-muted-foreground">
										PNG, JPG, ICO ou SVG. 512x512px recommandé.
									</p>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Custom Domain Card (Premium only) */}
				{profile?.plan === 'premium' && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2 text-lg">
									<Globe className="h-5 w-5" />
									Domaine personnalisé
								</CardTitle>
								<Badge variant="outline" className="text-xs">
									Premium
								</Badge>
							</div>
						</CardHeader>
						<CardContent>
							{profile?.customDomain ? (
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<Globe className="h-5 w-5 text-muted-foreground" />
										<span className="text-sm font-medium">{profile.customDomain}</span>
										{profile.customDomainVerified ? (
											<span className="flex items-center gap-1 text-xs text-green-600">
												<CheckCircle2 className="h-3.5 w-3.5" />
												Vérifié
											</span>
										) : (
											<span className="flex items-center gap-1 text-xs text-amber-600">
												<AlertCircle className="h-3.5 w-3.5" />
												En attente de vérification
											</span>
										)}
									</div>

									{!profile.customDomainVerified && (
										<div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
											<p className="font-medium text-amber-800">Configuration DNS requise</p>
											<p className="mt-1 text-amber-700">
												Ajoutez les <strong>2 enregistrements</strong> suivants chez votre
												registraire de domaine :
											</p>
											<div className="mt-3 overflow-x-auto rounded-md bg-white p-3 font-mono text-xs">
												<table className="w-full">
													<thead>
														<tr className="text-left text-amber-600">
															<th className="pr-6">Type</th>
															<th className="pr-6">Nom</th>
															<th>Valeur</th>
														</tr>
													</thead>
													<tbody className="text-amber-900">
														<tr>
															<td className="pr-6 pt-1">A</td>
															<td className="pr-6 pt-1">@</td>
															<td className="pt-1">76.76.21.21</td>
														</tr>
														<tr>
															<td className="pr-6 pt-1">CNAME</td>
															<td className="pr-6 pt-1">www</td>
															<td className="pt-1">cname.vercel-dns.com</td>
														</tr>
													</tbody>
												</table>
											</div>
											<p className="mt-3 text-xs text-amber-600">
												Le premier enregistrement (A) pointe votre domaine vers notre serveur. Le
												second (CNAME) redirige automatiquement les visiteurs qui tapent www.
												{profile.customDomain} vers {profile.customDomain}.
											</p>
											<div className="mt-3">
												<Button
													type="button"
													onClick={handleVerifyDomain}
													disabled={domainVerifying}
													className="bg-amber-600 text-white hover:bg-amber-700"
													size="sm"
												>
													{domainVerifying ? (
														<span className="flex items-center gap-1.5">
															<Loader2 className="h-3 w-3 animate-spin" />
															Vérification...
														</span>
													) : (
														'Vérifier le domaine'
													)}
												</Button>
											</div>
										</div>
									)}

									{domainStatus?.status === 'verified' && (
										<div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
											<div className="flex items-center gap-2">
												<CheckCircle2 className="h-4 w-4" />
												Domaine vérifié et actif
											</div>
										</div>
									)}

									<button
										type="button"
										onClick={handleRemoveDomain}
										disabled={domainLoading}
										className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
									>
										Supprimer le domaine
									</button>
								</div>
							) : (
								<div className="space-y-3">
									<p className="text-sm text-muted-foreground">
										Connectez votre propre nom de domaine pour que vos clients accèdent à votre site
										via votre URL.
									</p>
									<div className="flex gap-2">
										<Input
											type="text"
											value={domainInput}
											onChange={(e) => {
												setDomainInput(e.target.value)
												setDomainError(null)
											}}
											placeholder="mon-site.com"
											className="flex-1"
											onKeyDown={(e) => {
												if (e.key === 'Enter') handleSetDomain()
											}}
										/>
										<Button
											type="button"
											onClick={handleSetDomain}
											disabled={domainLoading || !domainInput.trim()}
										>
											{domainLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Vérifier'}
										</Button>
									</div>
									{domainError && <p className="text-xs text-red-500">{domainError}</p>}
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Change Password Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Lock className="h-5 w-5" />
							Changer le mot de passe
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleChangePassword} className="space-y-4">
							{passwordError && (
								<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
									{passwordError}
								</div>
							)}
							{passwordSuccess && (
								<div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
									Mot de passe modifié avec succès.
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="currentPassword">Mot de passe actuel</Label>
								<div className="relative">
									<Input
										id="currentPassword"
										type={showCurrentPassword ? 'text' : 'password'}
										value={currentPassword}
										onChange={(e) => {
											setCurrentPassword(e.target.value)
											setPasswordError('')
											setPasswordSuccess(false)
										}}
										className="pr-10"
										required
									/>
									<button
										type="button"
										onClick={() => setShowCurrentPassword(!showCurrentPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										{showCurrentPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="newPassword">Nouveau mot de passe</Label>
								<div className="relative">
									<Input
										id="newPassword"
										type={showNewPassword ? 'text' : 'password'}
										value={newPassword}
										onChange={(e) => {
											setNewPassword(e.target.value)
											setPasswordSuccess(false)
										}}
										placeholder="••••••••"
										className="pr-10"
										required
									/>
									<button
										type="button"
										onClick={() => setShowNewPassword(!showNewPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									>
										{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
									</button>
								</div>
							</div>

							{newPassword && <PasswordStrengthIndicator rules={passwordStrengthRules} />}

							<div className="space-y-2">
								<Label htmlFor="newPasswordConfirmation">Confirmer le nouveau mot de passe</Label>
								<Input
									id="newPasswordConfirmation"
									type={showNewPassword ? 'text' : 'password'}
									value={newPasswordConfirmation}
									onChange={(e) => {
										setNewPasswordConfirmation(e.target.value)
										setPasswordSuccess(false)
									}}
									placeholder="••••••••"
									required
								/>
								{newPasswordConfirmation.length > 0 && (
									<div className="flex items-center gap-2">
										{passwordsMatch ? (
											<>
												<Check className="h-3.5 w-3.5 text-green-600" />
												<span className="text-xs text-green-600">
													Les mots de passe correspondent
												</span>
											</>
										) : (
											<>
												<X className="h-3.5 w-3.5 text-red-500" />
												<span className="text-xs text-red-500">
													Les mots de passe ne correspondent pas
												</span>
											</>
										)}
									</div>
								)}
							</div>

							<Button
								type="submit"
								disabled={isChangingPassword || !allPasswordRulesValid || !currentPassword}
							>
								{isChangingPassword ? 'Modification...' : 'Modifier le mot de passe'}
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Two-Factor Authentication Card */}
				<TwoFactorCard />

				{/* Stripe Connect Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<CreditCard className="h-5 w-5" />
							Stripe Connect
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							{profile?.stripeOnboardingComplete
								? 'Votre compte Stripe est connecté. Vous recevez les paiements de vos ateliers et commandes.'
								: 'Connectez votre compte Stripe pour recevoir les paiements en ligne de vos clients (ateliers, commandes).'}
						</p>

						<div className="mt-4">
							{profile?.stripeOnboardingComplete ? (
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
											<Check className="h-4 w-4 text-green-600" />
										</div>
										<span className="text-sm font-medium text-green-700">Connecté</span>
									</div>
									<Button type="button" variant="outline" onClick={handleStripeDashboard}>
										Gérer
									</Button>
								</div>
							) : (
								<Button type="button" onClick={handleConnectStripe} disabled={isConnecting}>
									{isConnecting
										? 'Connexion en cours...'
										: profile?.stripeAccountId
											? 'Reprendre la vérification'
											: 'Connecter Stripe'}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Support Access Card */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<HelpCircle className="h-5 w-5" />
							Accès au support
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Autorisez l'équipe Patissio à accéder à votre site pour vous aider à le configurer.
							Vous pouvez désactiver cet accès à tout moment.
						</p>
						<div className="mt-4 flex items-center justify-between">
							<Label htmlFor="supportAccess">Autoriser l'accès au support Patissio</Label>
							<Switch
								id="supportAccess"
								checked={profile?.allowSupportAccess ?? false}
								onCheckedChange={async (checked) => {
									setProfile((p: any) => ({ ...p, allowSupportAccess: checked }))
									try {
										await api.patch('/patissier/profile', { allowSupportAccess: checked })
									} catch (err) {
										console.error(err)
										setProfile((p: any) => ({ ...p, allowSupportAccess: !checked }))
									}
								}}
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

type TwoFactorStep = 'idle' | 'setup' | 'verify' | 'backup'

function TwoFactorCard() {
	const [enabled, setEnabled] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [step, setStep] = useState<TwoFactorStep>('idle')
	const [qrCode, setQrCode] = useState('')
	const [secret, setSecret] = useState('')
	const [code, setCode] = useState('')
	const [backupCodes, setBackupCodes] = useState<string[]>([])
	const [error, setError] = useState('')
	const [actionLoading, setActionLoading] = useState(false)
	const [disablePassword, setDisablePassword] = useState('')
	const [showDisableConfirm, setShowDisableConfirm] = useState(false)
	const [copiedSecret, setCopiedSecret] = useState(false)
	const [copiedBackup, setCopiedBackup] = useState(false)

	const fetchStatus = useCallback(async () => {
		try {
			const res = await api.get<{ enabled: boolean }>('/auth/2fa/status')
			setEnabled(res.data.enabled)
		} catch {
			// ignore
		} finally {
			setIsLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchStatus()
	}, [fetchStatus])

	const handleSetup = async () => {
		setError('')
		setActionLoading(true)
		try {
			const res = await api.post<{ secret: string; qrCode: string }>('/auth/2fa/setup')
			setSecret(res.data.secret)
			setQrCode(res.data.qrCode)
			setStep('setup')
		} catch (err: any) {
			setError(err.message || 'Erreur lors de la configuration')
		} finally {
			setActionLoading(false)
		}
	}

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setActionLoading(true)
		try {
			const res = await api.post<{ backupCodes: string[] }>('/auth/2fa/verify', { code })
			setBackupCodes(res.data.backupCodes)
			setEnabled(true)
			setStep('backup')
			setCode('')
		} catch (err: any) {
			setError(err.message || 'Code invalide')
		} finally {
			setActionLoading(false)
		}
	}

	const handleDisable = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setActionLoading(true)
		try {
			await api.post('/auth/2fa/disable', { password: disablePassword })
			setEnabled(false)
			setShowDisableConfirm(false)
			setDisablePassword('')
			setStep('idle')
		} catch (err: any) {
			setError(err.message || 'Erreur lors de la désactivation')
		} finally {
			setActionLoading(false)
		}
	}

	const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
		await navigator.clipboard.writeText(text)
		if (type === 'secret') {
			setCopiedSecret(true)
			setTimeout(() => setCopiedSecret(false), 2000)
		} else {
			setCopiedBackup(true)
			setTimeout(() => setCopiedBackup(false), 2000)
		}
	}

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-primary" />
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-lg">
						{enabled ? (
							<ShieldCheck className="h-5 w-5 text-green-600" />
						) : (
							<Shield className="h-5 w-5" />
						)}
						Double authentification
					</CardTitle>
					{enabled && step === 'idle' && (
						<span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
							Activée
						</span>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{error && (
					<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
				)}

				{/* Idle - not enabled */}
				{!enabled && step === 'idle' && (
					<>
						<div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
							<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
							<div className="text-sm text-amber-700">
								<p className="font-medium">Recommandation de sécurité</p>
								<p className="mt-1">
									La double authentification protège votre compte même si votre mot de passe est
									compromis.
								</p>
							</div>
						</div>
						<Button type="button" onClick={handleSetup} disabled={actionLoading}>
							{actionLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Smartphone className="mr-2 h-4 w-4" />
							)}
							Activer la 2FA
						</Button>
					</>
				)}

				{/* Setup - QR code */}
				{step === 'setup' && (
					<div className="space-y-5">
						<div>
							<p className="text-sm font-medium">
								1. Scannez ce QR code avec votre application d'authentification
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Google Authenticator, Authy, 1Password ou toute application compatible TOTP
							</p>
						</div>

						<div className="flex justify-center">
							<div className="rounded-lg border bg-white p-4">
								{/* biome-ignore lint/performance/noImgElement: data URL QR code, not optimizable by next/image */}
								<img src={qrCode} alt="QR Code 2FA" className="h-48 w-48" />
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">Ou entrez cette clé manuellement :</p>
							<div className="flex items-center gap-2">
								<code className="flex-1 break-all rounded-lg border bg-muted px-3 py-2 font-mono text-sm">
									{secret}
								</code>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => copyToClipboard(secret, 'secret')}
								>
									{copiedSecret ? (
										<Check className="h-4 w-4 text-green-600" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						<form onSubmit={handleVerify} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="2fa-code">
									2. Entrez le code à 6 chiffres de votre application
								</Label>
								<Input
									id="2fa-code"
									type="text"
									inputMode="numeric"
									pattern="[0-9]{6}"
									maxLength={6}
									value={code}
									onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
									placeholder="000000"
									className="max-w-xs text-center font-mono text-lg tracking-widest"
									required
									disabled={actionLoading}
									autoComplete="one-time-code"
								/>
							</div>

							<div className="flex items-center gap-3">
								<Button type="submit" disabled={actionLoading || code.length !== 6}>
									{actionLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Vérification...
										</>
									) : (
										<>
											<Check className="mr-2 h-4 w-4" />
											Vérifier et activer
										</>
									)}
								</Button>
								<Button
									type="button"
									variant="ghost"
									onClick={() => {
										setStep('idle')
										setError('')
									}}
								>
									Annuler
								</Button>
							</div>
						</form>
					</div>
				)}

				{/* Backup codes */}
				{step === 'backup' && (
					<div className="space-y-5">
						<div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
							<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
							<div className="text-sm text-green-700">
								<p className="font-medium">Double authentification activée !</p>
								<p className="mt-1">
									Sauvegardez ces codes de secours dans un endroit sûr. Ils vous permettront de vous
									connecter si vous perdez l'accès à votre application.
								</p>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<p className="text-sm font-medium">Codes de secours</p>
								<button
									type="button"
									onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
									className="flex items-center gap-1 text-xs text-primary hover:underline"
								>
									{copiedBackup ? (
										<>
											<Check className="h-3 w-3" />
											Copié !
										</>
									) : (
										<>
											<Copy className="h-3 w-3" />
											Copier tous
										</>
									)}
								</button>
							</div>
							<div className="grid grid-cols-2 gap-2">
								{backupCodes.map((bCode) => (
									<code
										key={bCode}
										className="rounded border bg-muted px-3 py-2 text-center font-mono text-sm"
									>
										{bCode}
									</code>
								))}
							</div>
							<p className="text-xs text-muted-foreground">
								Chaque code ne peut être utilisé qu'une seule fois.
							</p>
						</div>

						<Button
							type="button"
							onClick={() => {
								setStep('idle')
								setBackupCodes([])
							}}
						>
							<Check className="mr-2 h-4 w-4" />
							J'ai sauvegardé mes codes
						</Button>
					</div>
				)}

				{/* Enabled - option to disable */}
				{enabled && step === 'idle' && !showDisableConfirm && (
					<>
						<div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
							<ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
							<p className="text-sm text-green-700">
								Votre compte est protégé par la double authentification.
							</p>
						</div>
						<Button
							type="button"
							variant="outline"
							className="border-destructive/30 text-destructive hover:bg-destructive/10"
							onClick={() => setShowDisableConfirm(true)}
						>
							<ShieldOff className="mr-2 h-4 w-4" />
							Désactiver la 2FA
						</Button>
					</>
				)}

				{/* Disable confirmation */}
				{showDisableConfirm && (
					<form onSubmit={handleDisable} className="space-y-4">
						<div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
							<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
							<div className="text-sm text-destructive">
								<p className="font-medium">Attention</p>
								<p className="mt-1">
									Désactiver la 2FA rendra votre compte moins sécurisé. Entrez votre mot de passe
									pour confirmer.
								</p>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="disable-2fa-password">Mot de passe</Label>
							<Input
								id="disable-2fa-password"
								type="password"
								value={disablePassword}
								onChange={(e) => setDisablePassword(e.target.value)}
								className="max-w-sm"
								required
								disabled={actionLoading}
							/>
						</div>

						<div className="flex items-center gap-3">
							<Button
								type="submit"
								variant="destructive"
								disabled={actionLoading || !disablePassword}
							>
								{actionLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Désactivation...
									</>
								) : (
									<>
										<ShieldOff className="mr-2 h-4 w-4" />
										Confirmer
									</>
								)}
							</Button>
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setShowDisableConfirm(false)
									setDisablePassword('')
									setError('')
								}}
							>
								Annuler
							</Button>
						</div>
					</form>
				)}
			</CardContent>
		</Card>
	)
}
