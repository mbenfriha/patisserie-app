export function stripHtml(html: string | null): string | null {
	if (!html) return null
	return html.replace(/<[^>]*>/g, '').trim()
}
