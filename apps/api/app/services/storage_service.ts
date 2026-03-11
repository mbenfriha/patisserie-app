import { readFile } from 'node:fs/promises'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import sharp from 'sharp'
import env from '#start/env'

export default class StorageService {
	/**
	 * Upload an image to the public R2 bucket.
	 * Auto-rotates based on EXIF orientation and strips metadata.
	 * Converts photos to webp; preserves PNG transparency for logos/favicons.
	 */
	async uploadImage(
		file: MultipartFile,
		folder: string,
		options?: { keepFormat?: boolean }
	): Promise<string> {
		const disk = drive.use('r2_public')

		const filePath = file.tmpPath
		if (!filePath) {
			throw new Error('File has no temporary path')
		}

		const ext = file.extname || 'jpg'
		const buffer = await readFile(filePath)

		// SVG/ICO: store as-is (sharp doesn't support them)
		if (ext === 'svg' || ext === 'ico') {
			const key = `${folder}/${cuid()}.${ext}`
			const contentType = ext === 'svg' ? 'image/svg+xml' : 'image/x-icon'
			await disk.put(key, buffer, { contentType })
			return key
		}

		const pipeline = sharp(buffer).rotate()

		let key: string
		let contentType: string

		if (options?.keepFormat && ext === 'png') {
			// Preserve PNG (transparency for logos/favicons)
			const processed = await pipeline.png().toBuffer()
			key = `${folder}/${cuid()}.png`
			contentType = 'image/png'
			await disk.put(key, processed, { contentType })
		} else {
			const processed = await pipeline.webp({ quality: 85 }).toBuffer()
			key = `${folder}/${cuid()}.webp`
			contentType = 'image/webp'
			await disk.put(key, processed, { contentType })
		}

		return key
	}

	/**
	 * Delete an image from the public R2 bucket.
	 *
	 * @param key - The storage key of the file to delete
	 */
	async deleteImage(key: string): Promise<void> {
		const disk = drive.use('r2_public')
		await disk.delete(key)
	}

	/**
	 * Get the public URL for a stored image.
	 *
	 * @param key - The storage key of the file
	 * @returns The full public URL
	 */
	getPublicUrl(key: string): string {
		const publicUrl = env.get('R2_PUBLIC_URL')

		if (publicUrl) {
			return `${publicUrl}/${key}`
		}

		// Fallback: construct URL from endpoint
		const endpoint = env.get('R2_ENDPOINT')
		const bucket = env.get('R2_PUBLIC_BUCKET') || env.get('R2_BUCKET')
		return `${endpoint}/${bucket}/${key}`
	}
}
