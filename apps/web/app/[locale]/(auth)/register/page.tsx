'use client'

import { Check, Eye, EyeOff, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { api } from '@/lib/api/client'
import { useAuth } from '@/lib/providers/auth-provider'
import { slugify } from '@/lib/utils'

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'too_short'

export default function RegisterPage() {
	const t = useTranslations('auth')
	const { register } = useAuth()
	const [formData, setFormData] = useState({
		fullName: '',
		businessName: '',
		email: '',
		password: '',
		passwordConfirmation: '',
	})
	const [slug, setSlug] = useState('')
	const [slugTouched, setSlugTouched] = useState(false)
	const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const checkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Password validation rules
	const passwordRules = [
		{ key: 'minLength', label: '8 caractères minimum', valid: formData.password.length >= 8 },
		{ key: 'uppercase', label: 'Une majuscule', valid: /[A-Z]/.test(formData.password) },
		{ key: 'lowercase', label: 'Une minuscule', valid: /[a-z]/.test(formData.password) },
		{ key: 'number', label: 'Un chiffre', valid: /[0-9]/.test(formData.password) },
		{
			key: 'specialChar',
			label: 'Un caractère spécial',
			valid: /[^A-Za-z0-9]/.test(formData.password),
		},
		{
			key: 'match',
			label: 'Les mots de passe correspondent',
			valid:
				formData.password.length > 0 &&
				formData.passwordConfirmation.length > 0 &&
				formData.password === formData.passwordConfirmation,
		},
	]

	const allPasswordRulesValid = passwordRules.every((rule) => rule.valid)

	// Debounced auto-slug from business name
	useEffect(() => {
		if (slugTouched) return

		if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)

		slugDebounceRef.current = setTimeout(() => {
			setSlug(slugify(formData.businessName))
		}, 400)

		return () => {
			if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
		}
	}, [formData.businessName, slugTouched])

	// Debounced slug availability check
	useEffect(() => {
		if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current)

		if (!slug || slug.length < 3) {
			setSlugStatus(slug ? 'too_short' : 'idle')
			return
		}

		setSlugStatus('checking')

		checkDebounceRef.current = setTimeout(async () => {
			try {
				const res = await api.get(`/public/check-slug/${slug}`)
				setSlugStatus(res.data.data.available ? 'available' : 'taken')
			} catch {
				setSlugStatus('idle')
			}
		}, 500)

		return () => {
			if (checkDebounceRef.current) clearTimeout(checkDebounceRef.current)
		}
	}, [slug])

	const handleSlugChange = (value: string) => {
		setSlugTouched(true)
		setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
	}

	const updateField = (field: keyof typeof formData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const canSubmit = allPasswordRulesValid && slugStatus !== 'taken' && slugStatus !== 'checking' && slug.length >= 3

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!canSubmit) return
		setError('')
		setIsLoading(true)
		try {
			await register({
				email: formData.email,
				password: formData.password,
				passwordConfirmation: formData.passwordConfirmation,
				fullName: formData.fullName,
				role: 'patissier',
				slug,
				businessName: formData.businessName,
			})
		} catch (err: any) {
			setError(err.message || 'Registration failed')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="mx-auto w-full max-w-md space-y-6 p-8">
				<div className="flex flex-col items-center">
					<Link href="/">
						<Image src="/logo-patissio-full.png" alt="Patissio" width={886} height={368} className="h-12 w-auto" />
					</Link>
					<p className="text-muted-foreground mt-3">{t('register')}</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="fullName" className="text-sm font-medium">
							Nom complet
						</label>
						<input
							id="fullName"
							type="text"
							value={formData.fullName}
							onChange={(e) => updateField('fullName', e.target.value)}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="businessName" className="text-sm font-medium">
							Nom de votre établissement
						</label>
						<input
							id="businessName"
							type="text"
							value={formData.businessName}
							onChange={(e) => updateField('businessName', e.target.value)}
							placeholder="L'Atelier de Zina"
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							required
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="slug" className="text-sm font-medium">
							Adresse de votre site
						</label>
						<div
							className={`flex items-center rounded-md border bg-background ${
								slugStatus === 'taken'
									? 'border-destructive'
									: slugStatus === 'available'
										? 'border-green-500'
										: 'border-input'
							}`}
						>
							<input
								id="slug"
								type="text"
								value={slug}
								onChange={(e) => handleSlugChange(e.target.value)}
								className="w-full rounded-l-md bg-transparent px-3 py-2 text-sm focus:outline-none"
								required
							/>
							<span className="shrink-0 border-l px-3 py-2 text-sm text-muted-foreground">
								.patissio.com
							</span>
						</div>
						<SlugFeedback status={slugStatus} slug={slug} />
					</div>

					<div className="space-y-2">
						<label htmlFor="email" className="text-sm font-medium">
							{t('email')}
						</label>
						<input
							id="email"
							type="email"
							value={formData.email}
							onChange={(e) => updateField('email', e.target.value)}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
							required
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium">
							{t('password')}
						</label>
						<div className="flex gap-2">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								value={formData.password}
								onChange={(e) => updateField('password', e.target.value)}
								placeholder="••••••••"
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="rounded-md border border-input bg-background px-3 py-2 hover:bg-accent"
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4 text-muted-foreground" />
								) : (
									<Eye className="h-4 w-4 text-muted-foreground" />
								)}
							</button>
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="passwordConfirmation" className="text-sm font-medium">
							Confirmer le mot de passe
						</label>
						<div className="flex gap-2">
							<input
								id="passwordConfirmation"
								type={showPassword ? 'text' : 'password'}
								value={formData.passwordConfirmation}
								onChange={(e) => updateField('passwordConfirmation', e.target.value)}
								placeholder="••••••••"
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="rounded-md border border-input bg-background px-3 py-2 hover:bg-accent"
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4 text-muted-foreground" />
								) : (
									<Eye className="h-4 w-4 text-muted-foreground" />
								)}
							</button>
						</div>
					</div>

					{formData.password && (
						<div className="space-y-2 rounded-lg border bg-muted/50 p-3">
							<p className="mb-2 text-sm font-medium">Sécurité du mot de passe</p>
							<div className="grid grid-cols-1 gap-1">
								{passwordRules.map((rule) => (
									<div key={rule.key} className="flex items-center gap-2">
										{rule.valid ? (
											<Check className="h-4 w-4 text-green-600" />
										) : (
											<X className="h-4 w-4 text-muted-foreground" />
										)}
										<span
											className={`text-xs ${rule.valid ? 'text-green-600' : 'text-muted-foreground'}`}
										>
											{rule.label}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					<button
						type="submit"
						disabled={isLoading || !canSubmit}
						className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
					>
						{isLoading ? '...' : t('register')}
					</button>
				</form>

				<p className="text-center text-sm text-muted-foreground">
					{t('hasAccount')}{' '}
					<Link href="/login" className="text-primary hover:underline">
						{t('login')}
					</Link>
				</p>
			</div>
		</div>
	)
}

function SlugFeedback({ status, slug }: { status: SlugStatus; slug: string }) {
	if (status === 'idle' || !slug) return null

	if (status === 'too_short') {
		return <p className="text-xs text-muted-foreground">3 caractères minimum</p>
	}

	if (status === 'checking') {
		return <p className="text-xs text-muted-foreground">Vérification de la disponibilité...</p>
	}

	if (status === 'available') {
		return (
			<p className="text-xs text-green-600">
				<span className="font-medium">{slug}.patissio.com</span> est disponible
			</p>
		)
	}

	if (status === 'taken') {
		return (
			<p className="text-xs text-destructive">
				<span className="font-medium">{slug}.patissio.com</span> est déjà pris
			</p>
		)
	}

	return null
}
