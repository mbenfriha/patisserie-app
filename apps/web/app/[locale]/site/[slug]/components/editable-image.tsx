'use client'

import { useRef, useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import { ImageCropper } from '@/components/ui/image-cropper'
import { useInlineEdit } from './inline-edit-provider'

interface EditableImageProps {
	src: string | null
	previewSrc: string | null
	onFileSelect: (file: File) => void
	onDelete?: () => void
	alt?: string
	className?: string
	style?: CSSProperties
	fallback?: ReactNode
	cropAspect?: number
	/** Render as a floating button overlay instead of wrapping the image */
	overlay?: boolean
}

export function EditableImage({
	src,
	previewSrc,
	onFileSelect,
	onDelete,
	alt = '',
	className,
	style,
	fallback,
	cropAspect = 16 / 9,
	overlay = false,
}: EditableImageProps) {
	const { isEditing } = useInlineEdit()
	const inputRef = useRef<HTMLInputElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const [showMenu, setShowMenu] = useState(false)
	const [cropSrc, setCropSrc] = useState<string | null>(null)

	const displaySrc = previewSrc || src

	// Close menu on click outside
	useEffect(() => {
		if (!showMenu) return
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowMenu(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [showMenu])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const url = URL.createObjectURL(file)
		setCropSrc(url)
		setShowMenu(false)
		e.target.value = ''
	}

	const handleCrop = (blob: Blob) => {
		const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
		onFileSelect(file)
		if (cropSrc) URL.revokeObjectURL(cropSrc)
		setCropSrc(null)
	}

	const handleCancelCrop = () => {
		if (cropSrc) URL.revokeObjectURL(cropSrc)
		setCropSrc(null)
	}

	const handleEditExisting = () => {
		if (displaySrc) {
			setCropSrc(displaySrc)
		}
		setShowMenu(false)
	}

	const handleDelete = () => {
		setShowMenu(false)
		onDelete?.()
	}

	const dropdownMenu = showMenu && (
		<div
			ref={menuRef}
			className="absolute z-30 overflow-hidden rounded-lg border border-white/20 bg-[#1A1A1A]/95 shadow-2xl backdrop-blur-xl"
			style={overlay ? { top: '100%', right: 0, marginTop: 8 } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
			onClick={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				onClick={() => {
					setShowMenu(false)
					inputRef.current?.click()
				}}
				className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="17 8 12 3 7 8" />
					<line x1="12" y1="3" x2="12" y2="15" />
				</svg>
				Changer
			</button>
			{displaySrc && (
				<button
					type="button"
					onClick={handleEditExisting}
					className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
						<line x1="9" y1="3" x2="9" y2="21" />
						<line x1="15" y1="3" x2="15" y2="21" />
						<line x1="3" y1="9" x2="21" y2="9" />
						<line x1="3" y1="15" x2="21" y2="15" />
					</svg>
					Recadrer
				</button>
			)}
			{displaySrc && onDelete && (
				<button
					type="button"
					onClick={handleDelete}
					className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-white/10"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
						<polyline points="3 6 5 6 21 6" />
						<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
					</svg>
					Supprimer
				</button>
			)}
		</div>
	)

	const fileInput = (
		<input
			ref={inputRef}
			type="file"
			accept="image/jpeg,image/png,image/webp,image/avif"
			className="hidden"
			onChange={handleChange}
		/>
	)

	const cropperModal = cropSrc && (
		<ImageCropper
			imageSrc={cropSrc}
			aspect={cropAspect}
			onCrop={handleCrop}
			onCancel={handleCancelCrop}
		/>
	)

	// ── Overlay mode: floating button in corner ──
	if (overlay) {
		if (!isEditing) return null

		return (
			<>
				<div className="absolute right-4 top-4 z-20" style={{ position: 'absolute' }}>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							setShowMenu(!showMenu)
						}}
						className="flex items-center gap-2 rounded-full border border-white/20 bg-[#1A1A1A]/80 px-3 py-2 text-xs font-medium text-white/90 shadow-lg backdrop-blur-sm transition-all hover:border-white/40 hover:bg-[#1A1A1A]/95"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
							<circle cx="12" cy="13" r="4" />
						</svg>
						Image
					</button>
					{dropdownMenu}
				</div>
				{fileInput}
				{cropperModal}
			</>
		)
	}

	// ── Wrap mode: wraps the image with hover overlay ──
	if (!isEditing) {
		if (!displaySrc) return <>{fallback}</>
		return <img src={displaySrc} alt={alt} className={className} style={style} />
	}

	return (
		<>
			<div
				className="group/edit relative cursor-pointer"
				onClick={() => setShowMenu(!showMenu)}
			>
				{displaySrc ? (
					<img src={displaySrc} alt={alt} className={className} style={style} />
				) : (
					fallback
				)}
				<div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover/edit:opacity-100">
					<div className="flex flex-col items-center gap-2 text-white">
						<svg
							width="28"
							height="28"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
							<circle cx="12" cy="13" r="4" />
						</svg>
						<span className="text-xs font-medium tracking-wide">
							{displaySrc ? 'Modifier l\u2019image' : 'Ajouter une image'}
						</span>
					</div>
				</div>

				{dropdownMenu}
				{fileInput}
			</div>
			{cropperModal}
		</>
	)
}
