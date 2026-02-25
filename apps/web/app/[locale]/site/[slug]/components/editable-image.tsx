'use client'

import { useRef, type CSSProperties, type ReactNode } from 'react'
import { useInlineEdit } from './inline-edit-provider'

interface EditableImageProps {
	src: string | null
	previewSrc: string | null
	onFileSelect: (file: File) => void
	alt?: string
	className?: string
	style?: CSSProperties
	fallback?: ReactNode
}

export function EditableImage({
	src,
	previewSrc,
	onFileSelect,
	alt = '',
	className,
	style,
	fallback,
}: EditableImageProps) {
	const { isEditing } = useInlineEdit()
	const inputRef = useRef<HTMLInputElement>(null)

	const displaySrc = previewSrc || src

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) onFileSelect(file)
	}

	if (!isEditing) {
		if (!displaySrc) return <>{fallback}</>
		return <img src={displaySrc} alt={alt} className={className} style={style} />
	}

	return (
		<div
			className="group/edit relative cursor-pointer"
			onClick={() => inputRef.current?.click()}
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
					<span className="text-xs font-medium tracking-wide">Changer l'image</span>
				</div>
			</div>
			<input
				ref={inputRef}
				type="file"
				accept="image/jpeg,image/png,image/webp,image/avif"
				className="hidden"
				onChange={handleChange}
			/>
		</div>
	)
}
