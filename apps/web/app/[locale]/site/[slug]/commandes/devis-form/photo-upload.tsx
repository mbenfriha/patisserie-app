'use client'

import { useCallback, useRef, useState } from 'react'

interface PhotoUploadProps {
	files: File[]
	onChange: (files: File[]) => void
}

export function PhotoUpload({ files, onChange }: PhotoUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [dragOver, setDragOver] = useState(false)

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setDragOver(false)
			const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
			if (dropped.length > 0) {
				onChange([...files, ...dropped])
			}
		},
		[onChange, files]
	)

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const selected = e.target.files
		if (selected && selected.length > 0) {
			onChange([...files, ...Array.from(selected)])
		}
		if (inputRef.current) {
			inputRef.current.value = ''
		}
	}

	function handleRemove(index: number) {
		onChange(files.filter((_, i) => i !== index))
	}

	return (
		<div>
			{files.length > 0 && (
				<div className="mb-3 flex flex-wrap gap-3">
					{files.map((file, i) => {
						const url = URL.createObjectURL(file)
						return (
							<div key={`${file.name}-${i}`} className="group relative inline-block">
								<img
									src={url}
									alt="Aperçu"
									className="h-24 w-24 rounded-xl border-2 border-[var(--gold)]/30 object-cover"
								/>
								<button
									type="button"
									onClick={() => handleRemove(i)}
									className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-md opacity-0 transition-opacity group-hover:opacity-100"
								>
									&times;
								</button>
							</div>
						)
					})}
				</div>
			)}

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
					Glissez des photos ou cliquez pour parcourir
				</span>
			</div>

			<input
				ref={inputRef}
				type="file"
				multiple
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>
		</div>
	)
}
