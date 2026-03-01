export type CalendarEventKind = 'order' | 'devis' | 'workshop'

export type ViewMode = 'month' | 'week'

export interface CalendarEvent {
	id: string
	kind: CalendarEventKind
	date: string
	title: string
	status: string
	meta: Record<string, string | number | null | undefined>
}

export interface ActiveFilters {
	order: boolean
	devis: boolean
	workshop: boolean
}
