'use client'

import {
	AlertTriangle,
	Check,
	Copy,
	Eye,
	EyeOff,
	Key,
	Loader2,
	Lock,
	Shield,
	ShieldCheck,
	ShieldOff,
	Smartphone,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '@/lib/api/client'

export default function SettingsPage() {
	return (
		<div className="space-y-8">
			<h1 className="text-2xl font-bold text-foreground">Parametres</h1>
			<ChangePasswordSection />
			<TwoFactorSection />
		</div>
	)
}

function ChangePasswordSection() {
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showCurrent, setShowCurrent] = useState(false)
	const [showNew, setShowNew] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setSuccess('')

		if (newPassword !== confirmPassword) {
			setError('Les mots de passe ne correspondent pas')
			return
		}

		if (newPassword.length < 8) {
			setError('Le mot de passe doit contenir au moins 8 caracteres')
			return
		}

		setIsLoading(true)
		try {
			await api.post('/auth/change-password', { currentPassword, newPassword })

			setSuccess('Mot de passe modifie avec succes')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Erreur lors du changement de mot de passe')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className="bg-card border border-border rounded-lg p-6">
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 rounded-lg bg-primary/10">
					<Lock className="w-5 h-5 text-primary" />
				</div>
				<div>
					<h2 className="text-lg font-semibold text-foreground">Changer le mot de passe</h2>
					<p className="text-sm text-muted-foreground">
						Mettez a jour votre mot de passe de connexion
					</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4 max-w-md">
				{error && (
					<div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg">
						{error}
					</div>
				)}
				{success && (
					<div className="bg-green-500/10 text-green-600 text-sm px-4 py-3 rounded-lg">
						{success}
					</div>
				)}

				<div>
					<label
						htmlFor="currentPassword"
						className="block text-sm font-medium text-foreground mb-2"
					>
						Mot de passe actuel
					</label>
					<div className="relative">
						<input
							id="currentPassword"
							type={showCurrent ? 'text' : 'password'}
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							className="w-full px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10"
							required
							disabled={isLoading}
						/>
						<button
							type="button"
							onClick={() => setShowCurrent(!showCurrent)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
						</button>
					</div>
				</div>

				<div>
					<label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
						Nouveau mot de passe
					</label>
					<div className="relative">
						<input
							id="newPassword"
							type={showNew ? 'text' : 'password'}
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="Minimum 8 caracteres"
							className="w-full px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10"
							required
							disabled={isLoading}
							minLength={8}
						/>
						<button
							type="button"
							onClick={() => setShowNew(!showNew)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							{showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
						</button>
					</div>
				</div>

				<div>
					<label
						htmlFor="confirmPassword"
						className="block text-sm font-medium text-foreground mb-2"
					>
						Confirmer le nouveau mot de passe
					</label>
					<input
						id="confirmPassword"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="w-full px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						required
						disabled={isLoading}
						minLength={8}
					/>
				</div>

				<button
					type="submit"
					className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
					disabled={isLoading}
				>
					{isLoading ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Modification...
						</>
					) : (
						<>
							<Key className="w-4 h-4" />
							Modifier le mot de passe
						</>
					)}
				</button>
			</form>
		</div>
	)
}

type TwoFactorStep = 'idle' | 'setup' | 'verify' | 'backup'

function TwoFactorSection() {
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
			const data = await api.get<{ enabled: boolean }>('/auth/2fa/status')
			setEnabled(data.enabled)
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
			const data = await api.post<{ secret: string; qrCode: string }>('/auth/2fa/setup')
			setSecret(data.secret)
			setQrCode(data.qrCode)
			setStep('setup')
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Erreur lors de la configuration')
		} finally {
			setActionLoading(false)
		}
	}

	const handleVerify = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setActionLoading(true)
		try {
			const data = await api.post<{ backupCodes: string[] }>('/auth/2fa/verify', { code })
			setBackupCodes(data.backupCodes)
			setEnabled(true)
			setStep('backup')
			setCode('')
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Code invalide')
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
		} catch (err) {
			setError(err instanceof ApiError ? err.message : 'Erreur lors de la desactivation')
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
			<div className="bg-card border border-border rounded-lg p-6">
				<div className="flex items-center justify-center py-8">
					<Loader2 className="w-6 h-6 animate-spin text-primary" />
				</div>
			</div>
		)
	}

	return (
		<div className="bg-card border border-border rounded-lg p-6">
			<div className="flex items-center gap-3 mb-6">
				<div className={`p-2 rounded-lg ${enabled ? 'bg-green-500/10' : 'bg-primary/10'}`}>
					{enabled ? (
						<ShieldCheck className="w-5 h-5 text-green-600" />
					) : (
						<Shield className="w-5 h-5 text-primary" />
					)}
				</div>
				<div className="flex-1">
					<h2 className="text-lg font-semibold text-foreground">Double authentification (2FA)</h2>
					<p className="text-sm text-muted-foreground">
						Ajoutez une couche de securite supplementaire a votre compte
					</p>
				</div>
				{enabled && step === 'idle' && (
					<span className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
						Active
					</span>
				)}
			</div>

			{error && (
				<div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg mb-4">
					{error}
				</div>
			)}

			{/* Idle state - 2FA not enabled */}
			{!enabled && step === 'idle' && (
				<div className="space-y-4">
					<div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
						<AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
						<div className="text-sm text-yellow-700">
							<p className="font-medium">Recommandation de securite</p>
							<p className="mt-1">
								La double authentification protege votre compte meme si votre mot de passe est
								compromis. Nous vous recommandons fortement de l&apos;activer.
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={handleSetup}
						disabled={actionLoading}
						className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
					>
						{actionLoading ? (
							<>
								<Loader2 className="w-4 h-4 animate-spin" />
								Configuration...
							</>
						) : (
							<>
								<Smartphone className="w-4 h-4" />
								Activer la 2FA
							</>
						)}
					</button>
				</div>
			)}

			{/* Setup step - QR Code display */}
			{step === 'setup' && (
				<div className="space-y-6">
					<div className="space-y-3">
						<p className="text-sm text-foreground font-medium">
							1. Scannez ce QR code avec votre application d&apos;authentification
						</p>
						<p className="text-xs text-muted-foreground">
							Google Authenticator, Authy, 1Password ou toute application compatible TOTP
						</p>
					</div>

					<div className="flex justify-center">
						<div className="bg-white p-4 rounded-lg">
							{/* biome-ignore lint/performance/noImgElement: data URL QR code, not optimizable by next/image */}
							<img src={qrCode} alt="QR Code 2FA" className="w-48 h-48" />
						</div>
					</div>

					<div className="space-y-2">
						<p className="text-sm text-muted-foreground">Ou entrez cette cle manuellement :</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 px-4 py-2.5 bg-secondary rounded-lg text-sm font-mono text-foreground break-all">
								{secret}
							</code>
							<button
								type="button"
								onClick={() => copyToClipboard(secret, 'secret')}
								className="p-2.5 rounded-lg border border-input hover:bg-secondary transition-colors shrink-0"
								title="Copier"
							>
								{copiedSecret ? (
									<Check className="w-4 h-4 text-green-600" />
								) : (
									<Copy className="w-4 h-4 text-muted-foreground" />
								)}
							</button>
						</div>
					</div>

					<form onSubmit={handleVerify} className="space-y-4">
						<div>
							<label htmlFor="2fa-code" className="block text-sm font-medium text-foreground mb-2">
								2. Entrez le code a 6 chiffres de votre application
							</label>
							<input
								id="2fa-code"
								type="text"
								inputMode="numeric"
								pattern="[0-9]{6}"
								maxLength={6}
								value={code}
								onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
								placeholder="000000"
								className="w-full max-w-xs px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground text-center text-lg tracking-widest font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
								required
								disabled={actionLoading}
								autoComplete="one-time-code"
							/>
						</div>

						<div className="flex items-center gap-3">
							<button
								type="submit"
								disabled={actionLoading || code.length !== 6}
								className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
							>
								{actionLoading ? (
									<>
										<Loader2 className="w-4 h-4 animate-spin" />
										Verification...
									</>
								) : (
									<>
										<Check className="w-4 h-4" />
										Verifier et activer
									</>
								)}
							</button>
							<button
								type="button"
								onClick={() => {
									setStep('idle')
									setError('')
								}}
								className="px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
							>
								Annuler
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Backup codes display */}
			{step === 'backup' && (
				<div className="space-y-6">
					<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
						<ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
						<div className="text-sm text-green-700">
							<p className="font-medium">Double authentification activee !</p>
							<p className="mt-1">
								Sauvegardez ces codes de secours dans un endroit sur. Ils vous permettront de vous
								connecter si vous perdez l&apos;acces a votre application d&apos;authentification.
							</p>
						</div>
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<p className="text-sm font-medium text-foreground">Codes de secours</p>
							<button
								type="button"
								onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
								className="text-xs text-primary hover:underline flex items-center gap-1"
							>
								{copiedBackup ? (
									<>
										<Check className="w-3 h-3" />
										Copie !
									</>
								) : (
									<>
										<Copy className="w-3 h-3" />
										Copier tous
									</>
								)}
							</button>
						</div>
						<div className="grid grid-cols-2 gap-2">
							{backupCodes.map((bCode) => (
								<code
									key={bCode}
									className="px-3 py-2 bg-secondary rounded text-sm font-mono text-foreground text-center"
								>
									{bCode}
								</code>
							))}
						</div>
						<p className="text-xs text-muted-foreground">
							Chaque code ne peut etre utilise qu&apos;une seule fois.
						</p>
					</div>

					<button
						type="button"
						onClick={() => {
							setStep('idle')
							setBackupCodes([])
						}}
						className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
					>
						<Check className="w-4 h-4" />
						J&apos;ai sauvegarde mes codes
					</button>
				</div>
			)}

			{/* Enabled state - option to disable */}
			{enabled && step === 'idle' && !showDisableConfirm && (
				<div className="space-y-4">
					<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
						<ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
						<p className="text-sm text-green-700">
							Votre compte est protege par la double authentification.
						</p>
					</div>
					<button
						type="button"
						onClick={() => setShowDisableConfirm(true)}
						className="px-6 py-2.5 border border-destructive/30 text-destructive font-medium rounded-lg hover:bg-destructive/10 transition-colors flex items-center gap-2"
					>
						<ShieldOff className="w-4 h-4" />
						Desactiver la 2FA
					</button>
				</div>
			)}

			{/* Disable confirmation */}
			{showDisableConfirm && (
				<form onSubmit={handleDisable} className="space-y-4">
					<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
						<AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
						<div className="text-sm text-destructive">
							<p className="font-medium">Attention</p>
							<p className="mt-1">
								Desactiver la 2FA rendra votre compte moins securise. Entrez votre mot de passe pour
								confirmer.
							</p>
						</div>
					</div>

					<div>
						<label
							htmlFor="disable-password"
							className="block text-sm font-medium text-foreground mb-2"
						>
							Mot de passe
						</label>
						<input
							id="disable-password"
							type="password"
							value={disablePassword}
							onChange={(e) => setDisablePassword(e.target.value)}
							className="w-full max-w-md px-4 py-2.5 rounded-lg border border-input bg-secondary text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
							required
							disabled={actionLoading}
						/>
					</div>

					<div className="flex items-center gap-3">
						<button
							type="submit"
							disabled={actionLoading || !disablePassword}
							className="px-6 py-2.5 bg-destructive text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
						>
							{actionLoading ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin" />
									Desactivation...
								</>
							) : (
								<>
									<ShieldOff className="w-4 h-4" />
									Confirmer la desactivation
								</>
							)}
						</button>
						<button
							type="button"
							onClick={() => {
								setShowDisableConfirm(false)
								setDisablePassword('')
								setError('')
							}}
							className="px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							Annuler
						</button>
					</div>
				</form>
			)}
		</div>
	)
}
