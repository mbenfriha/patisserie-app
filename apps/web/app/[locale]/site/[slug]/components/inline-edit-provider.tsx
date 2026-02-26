'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { useAuth } from '@/lib/providers/auth-provider'
import { api } from '@/lib/api/client'
import { useSiteProfile, useSiteConfig, type SiteConfig, type PatissierProfile } from '../site-provider'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

interface InlineEditContextValue {
	isOwner: boolean
	isEditing: boolean
	toggleEdit: () => void
	getConfigValue: <K extends keyof SiteConfig>(key: K) => Required<SiteConfig>[K]
	updateConfig: (key: keyof SiteConfig, value: string | boolean | string[] | number) => void
	description: string | null
	updateDescription: (value: string) => void
	heroImagePreview: string | null
	storyImagePreview: string | null
	setHeroImageFile: (file: File) => void
	setStoryImageFile: (file: File) => void
	deleteHeroImage: () => void
	deleteStoryImage: () => void
	save: () => Promise<void>
	cancel: () => void
	isSaving: boolean
	hasChanges: boolean
}

const InlineEditContext = createContext<InlineEditContextValue | null>(null)

export function useInlineEdit() {
	const ctx = useContext(InlineEditContext)
	if (!ctx) throw new Error('useInlineEdit must be used within InlineEditProvider')
	return ctx
}

export function InlineEditProvider({
	children,
	onProfileUpdate,
}: {
	children: ReactNode
	onProfileUpdate: (profile: PatissierProfile) => void
}) {
	const { user } = useAuth()
	const profile = useSiteProfile()
	const config = useSiteConfig()

	const isOwner =
		!!user &&
		((user.role === 'patissier' && user.profile?.slug === profile.slug) ||
			(user.role === 'superadmin' && profile.allowSupportAccess))

	const isSuperadminSupport = !!user && user.role === 'superadmin' && profile.allowSupportAccess

	const [isEditing, setIsEditing] = useState(false)

	// Set support slug header when superadmin enters edit mode
	useEffect(() => {
		if (isEditing && isSuperadminSupport) {
			api.setSupportSlug(profile.slug)
		} else {
			api.setSupportSlug(null)
		}
		return () => {
			api.setSupportSlug(null)
		}
	}, [isEditing, isSuperadminSupport, profile.slug])
	const [isSaving, setIsSaving] = useState(false)
	const [toast, setToast] = useState('')
	const [editedConfig, setEditedConfig] = useState<Partial<SiteConfig>>({})
	const [editedDescription, setEditedDescription] = useState<string | null>(null)
	const [heroFile, setHeroFile] = useState<File | null>(null)
	const [storyFile, setStoryFile] = useState<File | null>(null)
	const [heroPreview, setHeroPreview] = useState<string | null>(null)
	const [storyPreview, setStoryPreview] = useState<string | null>(null)
	const [heroDeleted, setHeroDeleted] = useState(false)
	const [storyDeleted, setStoryDeleted] = useState(false)

	const hasChanges =
		Object.keys(editedConfig).length > 0 ||
		editedDescription !== null ||
		!!heroFile ||
		!!storyFile ||
		heroDeleted ||
		storyDeleted

	// Warn before leaving with unsaved changes
	useEffect(() => {
		if (!isEditing || !hasChanges) return
		const handler = (e: BeforeUnloadEvent) => {
			e.preventDefault()
		}
		window.addEventListener('beforeunload', handler)
		return () => window.removeEventListener('beforeunload', handler)
	}, [isEditing, hasChanges])

	const showToast = (msg: string) => {
		setToast(msg)
		setTimeout(() => setToast(''), 3000)
	}

	const resetEditState = useCallback(() => {
		setIsEditing(false)
		setEditedConfig({})
		setEditedDescription(null)
		setHeroFile(null)
		setStoryFile(null)
		if (heroPreview) URL.revokeObjectURL(heroPreview)
		if (storyPreview) URL.revokeObjectURL(storyPreview)
		setHeroPreview(null)
		setStoryPreview(null)
		setHeroDeleted(false)
		setStoryDeleted(false)
	}, [heroPreview, storyPreview])

	const toggleEdit = useCallback(() => {
		if (isEditing) {
			resetEditState()
		} else {
			setIsEditing(true)
		}
	}, [isEditing, resetEditState])

	const getConfigValue = useCallback(
		<K extends keyof SiteConfig>(key: K): Required<SiteConfig>[K] => {
			if (key in editedConfig) return editedConfig[key] as Required<SiteConfig>[K]
			return config[key]
		},
		[editedConfig, config]
	)

	const updateConfig = useCallback((key: keyof SiteConfig, value: string | boolean | string[] | number) => {
		setEditedConfig((prev) => ({ ...prev, [key]: value }))
	}, [])

	const description = editedDescription !== null ? editedDescription : profile.description

	const updateDescription = useCallback((value: string) => {
		setEditedDescription(value)
	}, [])

	const setHeroImageFile = useCallback((file: File) => {
		setHeroFile(file)
		setHeroPreview(URL.createObjectURL(file))
		setHeroDeleted(false)
	}, [])

	const setStoryImageFile = useCallback((file: File) => {
		setStoryFile(file)
		setStoryPreview(URL.createObjectURL(file))
		setStoryDeleted(false)
	}, [])

	const deleteHeroImage = useCallback(() => {
		setHeroDeleted(true)
		setHeroFile(null)
		if (heroPreview) URL.revokeObjectURL(heroPreview)
		setHeroPreview(null)
	}, [heroPreview])

	const deleteStoryImage = useCallback(() => {
		setStoryDeleted(true)
		setStoryFile(null)
		if (storyPreview) URL.revokeObjectURL(storyPreview)
		setStoryPreview(null)
	}, [storyPreview])

	const cancel = resetEditState

	const save = useCallback(async () => {
		setIsSaving(true)
		try {
			if (heroDeleted && !heroFile) {
				try {
					await api.delete('/patissier/hero-image')
				} catch (err: any) {
					console.error('Hero image delete failed:', err)
				}
			}
			if (storyDeleted && !storyFile) {
				try {
					await api.delete('/patissier/story-image')
				} catch (err: any) {
					console.error('Story image delete failed:', err)
				}
			}
			if (heroFile) {
				try {
					const fd = new FormData()
					fd.append('image', heroFile)
					await api.upload('/patissier/hero-image', fd)
				} catch (err: any) {
					const msg = err?.data?.message || err?.message || "Erreur lors de l'upload"
					const details = err?.data?.errors
						? `: ${err.data.errors.map((e: any) => e.message).join(', ')}`
						: ''
					console.error('Hero image upload failed:', err)
					showToast(`Image hero - ${msg}${details}`)
					return
				}
			}
			if (storyFile) {
				try {
					const fd = new FormData()
					fd.append('image', storyFile)
					await api.upload('/patissier/story-image', fd)
				} catch (err: any) {
					const msg = err?.data?.message || err?.message || "Erreur lors de l'upload"
					const details = err?.data?.errors
						? `: ${err.data.errors.map((e: any) => e.message).join(', ')}`
						: ''
					console.error('Story image upload failed:', err)
					showToast(`Image story - ${msg}${details}`)
					return
				}
			}

			if (Object.keys(editedConfig).length > 0) {
				const mergedConfig = { ...profile.siteConfig, ...editedConfig }
				await api.put('/patissier/site', { siteConfig: mergedConfig })
			}

			if (editedDescription !== null) {
				await api.patch('/patissier/profile', { description: editedDescription })
			}

			// Fetch updated profile
			const res = await fetch(`${API_URL}/public/${profile.slug}`)
			if (res.ok) {
				const data = await res.json()
				onProfileUpdate(data.data)
			}

			showToast('Modifications enregistrees !')
			resetEditState()
		} catch (err: any) {
			console.error('Failed to save:', err)
			const msg = err?.data?.message || err?.message || 'Erreur lors de la sauvegarde'
			showToast(msg)
		} finally {
			setIsSaving(false)
		}
	}, [editedConfig, editedDescription, heroFile, storyFile, heroDeleted, storyDeleted, profile, onProfileUpdate, resetEditState])

	return (
		<InlineEditContext.Provider
			value={{
				isOwner,
				isEditing,
				toggleEdit,
				getConfigValue,
				updateConfig,
				description,
				updateDescription,
				heroImagePreview: heroDeleted ? 'deleted' : heroPreview,
				storyImagePreview: storyDeleted ? 'deleted' : storyPreview,
				setHeroImageFile,
				setStoryImageFile,
				deleteHeroImage,
				deleteStoryImage,
				save,
				cancel,
				isSaving,
				hasChanges,
			}}
		>
			{children}
			{isOwner && <EditToolbar isSupportMode={isSuperadminSupport} />}

			{toast && (
				<div className="fixed bottom-20 left-1/2 z-[110] -translate-x-1/2 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-sm text-white shadow-xl">
					{toast}
				</div>
			)}
		</InlineEditContext.Provider>
	)
}

function EditToolbar({ isSupportMode }: { isSupportMode: boolean }) {
	const { isEditing, toggleEdit, save, cancel, isSaving, hasChanges } = useInlineEdit()

	return (
		<div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2">
			{isEditing ? (
				<div
					className="flex items-center gap-3 rounded-full border border-white/20 bg-[#1A1A1A]/95 px-5 py-3 shadow-2xl backdrop-blur-xl"
					style={{ animation: 'fadeInUp 0.3s ease-out' }}
				>
					{hasChanges && (
						<span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-[var(--gold)]" />
					)}
					<button
						type="button"
						onClick={cancel}
						disabled={isSaving}
						className="rounded-full px-4 py-1.5 text-xs font-medium tracking-wide text-white/70 transition-colors hover:text-white disabled:opacity-50"
					>
						Annuler
					</button>
					<button
						type="button"
						onClick={save}
						disabled={isSaving || !hasChanges}
						className="rounded-full bg-[var(--gold)] px-5 py-1.5 text-xs font-semibold tracking-wide text-[#1A1A1A] transition-all hover:brightness-110 disabled:opacity-50"
					>
						{isSaving ? 'Enregistrement...' : 'Sauvegarder'}
					</button>
				</div>
			) : (
				<button
					type="button"
					onClick={toggleEdit}
					className="flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[#1A1A1A]/90 px-5 py-3 text-xs font-medium tracking-wide text-[var(--gold)] shadow-2xl backdrop-blur-xl transition-all hover:border-[var(--gold)] hover:bg-[#1A1A1A]"
					style={{ animation: 'fadeInUp 0.3s ease-out' }}
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
						<path d="m15 5 4 4" />
					</svg>
					{isSupportMode ? 'Mode assistance' : 'Modifier la page'}
				</button>
			)}
		</div>
	)
}
