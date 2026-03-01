'use client'

import { KIND_COLORS } from './colors'
import type { ActiveFilters, CalendarEvent, CalendarEventKind } from './types'

interface CalendarFiltersProps {
	filters: ActiveFilters
	onToggle: (kind: CalendarEventKind) => void
	events: CalendarEvent[]
}

export function CalendarFilters({ filters, onToggle, events }: CalendarFiltersProps) {
	const counts: Record<CalendarEventKind, number> = {
		order: events.filter((e) => e.kind === 'order').length,
		devis: events.filter((e) => e.kind === 'devis').length,
		workshop: events.filter((e) => e.kind === 'workshop').length,
	}

	const kinds: CalendarEventKind[] = ['order', 'devis', 'workshop']

	return (
		<div className="flex flex-wrap gap-2">
			{kinds.map((kind) => {
				const { dot, label } = KIND_COLORS[kind]
				const active = filters[kind]

				return (
					<button
						key={kind}
						type="button"
						onClick={() => onToggle(kind)}
						className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
							active
								? 'border-foreground/20 bg-foreground/5'
								: 'border-transparent bg-muted/50 text-muted-foreground opacity-60'
						}`}
					>
						<span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
						{label}
						<span className="ml-0.5 text-xs text-muted-foreground">({counts[kind]})</span>
					</button>
				)
			})}
		</div>
	)
}
