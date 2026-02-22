import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

/**
 * Generates a URL-safe slug from a business name.
 * "L'Atelier de Zina" → "latelier-de-zina"
 * "Pâtisserie Éloïse" → "patisserie-eloise"
 */
export function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // strip accents
		.toLowerCase()
		.replace(/['']/g, '') // remove apostrophes (collapse: l'atelier → latelier)
		.replace(/[^a-z0-9]+/g, '-') // non-alphanumeric → single hyphen
		.replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}
