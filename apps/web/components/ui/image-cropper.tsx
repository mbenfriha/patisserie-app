'use client'

import { useState, useCallback } from 'react'
import Cropper, { type Area } from 'react-easy-crop'

interface ImageCropperProps {
	imageSrc: string
	onCrop: (blob: Blob) => void
	onCancel: () => void
	aspect?: number
}

export function ImageCropper({ imageSrc, onCrop, onCancel, aspect = 4 / 3 }: ImageCropperProps) {
	const [crop, setCrop] = useState({ x: 0, y: 0 })
	const [zoom, setZoom] = useState(1)
	const [croppedArea, setCroppedArea] = useState<Area | null>(null)

	const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
		setCroppedArea(croppedAreaPixels)
	}, [])

	const handleConfirm = async () => {
		if (!croppedArea) return
		const blob = await getCroppedImg(imageSrc, croppedArea)
		if (blob) onCrop(blob)
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
			<div className="relative flex h-[85vh] w-[90vw] max-w-[700px] flex-col overflow-hidden rounded-xl bg-background shadow-2xl">
				{/* Crop area */}
				<div className="relative flex-1">
					<Cropper
						image={imageSrc}
						crop={crop}
						zoom={zoom}
						aspect={aspect}
						onCropChange={setCrop}
						onZoomChange={setZoom}
						onCropComplete={onCropComplete}
					/>
				</div>

				{/* Controls */}
				<div className="border-t bg-background px-6 py-4">
					<div className="flex items-center gap-4">
						<span className="text-xs text-muted-foreground">Zoom</span>
						<input
							type="range"
							min={1}
							max={3}
							step={0.05}
							value={zoom}
							onChange={(e) => setZoom(Number(e.target.value))}
							className="flex-1 accent-primary"
						/>
					</div>
					<div className="mt-4 flex justify-end gap-3">
						<button
							type="button"
							onClick={onCancel}
							className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
						>
							Annuler
						</button>
						<button
							type="button"
							onClick={handleConfirm}
							className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
						>
							Valider
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob | null> {
	return new Promise((resolve) => {
		const image = new Image()
		image.crossOrigin = 'anonymous'
		image.onload = () => {
			const canvas = document.createElement('canvas')
			canvas.width = crop.width
			canvas.height = crop.height
			const ctx = canvas.getContext('2d')
			if (!ctx) return resolve(null)

			ctx.drawImage(
				image,
				crop.x,
				crop.y,
				crop.width,
				crop.height,
				0,
				0,
				crop.width,
				crop.height,
			)

			canvas.toBlob(
				(blob) => resolve(blob),
				'image/jpeg',
				0.92,
			)
		}
		image.onerror = () => resolve(null)
		image.src = imageSrc
	})
}
