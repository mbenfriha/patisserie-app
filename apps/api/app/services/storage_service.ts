import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import env from '#start/env'

export default class StorageService {
	/**
	 * Upload an image to the public R2 bucket.
	 *
	 * @param file - The multipart file from the request
	 * @param folder - The folder path (e.g. 'creations', 'products', 'workshops', 'logos')
	 * @returns The storage key for the uploaded file
	 */
	async uploadImage(file: MultipartFile, folder: string): Promise<string> {
		const extension = file.extname || 'jpg'
		const key = `${folder}/${cuid()}.${extension}`

		await file.moveToDisk(key, 'r2_public')

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
