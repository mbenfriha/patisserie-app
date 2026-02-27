'use client'

import { Check, CheckCircle, Eye, EyeOff, X } from 'lucide-react'
import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/lib/providers/auth-provider'

function ResetPasswordForm() {
	const { resetPassword } = useAuth()
	const searchParams = useSearchParams()
	const token = searchParams.get('token')

	const [password, setPassword] = useState('')
	const [passwordConfirmation, setPasswordConfirmation] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [success, setSuccess] = useState(false)

	const passwordRules = [
		{ key: 'minLength', label: '8 caractères minimum', valid: password.length >= 8 },
		{ key: 'uppercase', label: 'Une majuscule', valid: /[A-Z]/.test(password) },
		{ key: 'lowercase', label: 'Une minuscule', valid: /[a-z]/.test(password) },
		{ key: 'number', label: 'Un chiffre', valid: /[0-9]/.test(password) },
		{
			key: 'specialChar',
			label: 'Un caractère spécial',
			valid: /[^A-Za-z0-9]/.test(password),
		},
		{
			key: 'match',
			label: 'Les mots de passe correspondent',
			valid:
				password.length > 0 &&
				passwordConfirmation.length > 0 &&
				password === passwordConfirmation,
		},
	]

	const allRulesValid = passwordRules.every((rule) => rule.valid)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!allRulesValid || !token) return
		setError('')
		setIsLoading(true)
		try {
			await resetPassword(token, password)
			setSuccess(true)
		} catch (err: any) {
			setError(err.message || 'Une erreur est survenue')
		} finally {
			setIsLoading(false)
		}
	}

	if (!token) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="mx-auto w-full max-w-md space-y-6 p-8 text-center">
					<div className="flex flex-col items-center">
						<Link href="/">
							<Image src="/logo-patissio-full.png" alt="Patissio" width={886} height={368} className="h-12 w-auto" />
						</Link>
					</div>
					<div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
						Lien de réinitialisation invalide. Veuillez refaire une demande.
					</div>
					<p className="text-sm text-muted-foreground">
						<Link href="/forgot-password" className="text-primary hover:underline">
							Demander un nouveau lien
						</Link>
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="mx-auto w-full max-w-md space-y-6 p-8">
				<div className="flex flex-col items-center">
					<Link href="/">
						<Image src="/logo-patissio-full.png" alt="Patissio" width={886} height={368} className="h-12 w-auto" />
					</Link>
					<p className="text-muted-foreground mt-3">Nouveau mot de passe</p>
				</div>

				{success ? (
					<div className="space-y-4 text-center">
						<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
							<CheckCircle className="h-6 w-6 text-green-600" />
						</div>
						<div>
							<p className="font-medium">Mot de passe réinitialisé</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.
							</p>
						</div>
						<Link
							href="/login"
							className="inline-block rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
						>
							Se connecter
						</Link>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="password" className="text-sm font-medium">
								Nouveau mot de passe
							</label>
							<div className="flex gap-2">
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
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
									value={passwordConfirmation}
									onChange={(e) => setPasswordConfirmation(e.target.value)}
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

						{password && (
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
							disabled={isLoading || !allRulesValid}
							className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
						>
							{isLoading ? '...' : 'Réinitialiser le mot de passe'}
						</button>
					</form>
				)}
			</div>
		</div>
	)
}

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	)
}
