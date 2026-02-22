'use client'

import { useState } from 'react'
import { getImageUrl } from '@/lib/utils/image-url'

interface CreationImage {
	url: string
	alt: string | null
	isCover: boolean
}

interface ImageGalleryProps {
	images: CreationImage[]
	title: string
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
	const [selectedImageIndex, setSelectedImageIndex] = useState(0)

	const mainImage = images[selectedImageIndex] || images[0] || null

	return (
		<div>
			{/* Main image */}
			<div className="overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3' }}>
				{mainImage?.url ? (
					<img
						src={getImageUrl(mainImage.url) || ''}
						alt={mainImage.alt || title}
						className="h-full w-full object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--cream)] to-[var(--cream-dark)]">
						<span className="font-[family-name:'Cormorant_Garamond'] text-3xl text-[var(--gold)]/30">
							{title}
						</span>
					</div>
				)}
			</div>

			{/* Thumbnails */}
			{images.length > 1 && (
				<div className="mt-4 grid grid-cols-4 gap-3">
					{images.map((image, index) => (
						<button
							key={index}
							onClick={() => setSelectedImageIndex(index)}
							className="overflow-hidden rounded-xl transition-all duration-300"
							style={{
								aspectRatio: '1',
								border: selectedImageIndex === index
									? '2px solid var(--gold)'
									: '2px solid transparent',
								opacity: selectedImageIndex === index ? 1 : 0.6,
							}}
						>
							<img
								src={getImageUrl(image.url) || ''}
								alt={image.alt || `${title} - ${index + 1}`}
								className="h-full w-full object-cover transition-opacity duration-300 hover:opacity-100"
							/>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
