'use client'

import { useCallback, useRef, useState } from 'react'

interface PhotoUploadProps {
	file: File | null
	onChange: (file: File | null) => void
}

export function PhotoUpload({ file, onChange }: PhotoUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [dragOver, setDragOver] = useState(false)
	const previewUrl = file ? URL.createObjectURL(file) : null

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setDragOver(false)
			const dropped = e.dataTransfer.files[0]
			if (dropped?.type.startsWith('image/')) {
				onChange(dropped)
			}
		},
		[onChange]
	)

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files?.[0] || null
		onChange(selected)
	}

	function handleRemove() {
		onChange(null)
		if (inputRef.current) {
			inputRef.current.value = ''
		}
	}

	return (
		<div>
			{previewUrl ? (
				<div className="relative inline-block">
					<img
						src={previewUrl}
						alt="Aperçu"
						className="h-32 w-32 rounded-xl border-2 border-[var(--gold)]/30 object-cover"
					/>
					<button
						type="button"
						onClick={handleRemove}
						className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-md transition-colors hover:bg-red-600"
					>
						&times;
					</button>
				</div>
			) : (
				<div
					onDragOver={(e) => {
						e.preventDefault()
						setDragOver(true)
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={handleDrop}
					onClick={() => inputRef.current?.click()}
					className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200"
					style={{
						borderColor: dragOver ? 'var(--gold)' : 'var(--cream-dark)',
						backgroundColor: dragOver ? 'rgba(197,165,90,0.05)' : 'transparent',
					}}
				>
					<svg
						className="mb-3 h-8 w-8"
						style={{ color: 'var(--gold)', opacity: 0.5 }}
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
						/>
					</svg>
					<span
						className="text-sm text-[var(--dark-soft)]/60"
						style={{ fontFamily: "'Josefin Sans', sans-serif" }}
					>
						Glissez une photo ou cliquez pour parcourir
					</span>
				</div>
			)}

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>
		</div>
	)
}
