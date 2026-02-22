const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:9000/patisserie-public'

/**
 * Build the full public URL for an image stored in R2/MinIO.
 * If the value is already a full URL (http/https), returns it as-is.
 * Returns null if key is null/undefined.
 */
export function getImageUrl(key: string | null | undefined): string | null {
	if (!key) return null
	if (key.startsWith('http://') || key.startsWith('https://')) return key
	return `${STORAGE_URL}/${key}`
}
