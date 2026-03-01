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
		<div className="flex flex-wrap gap-1.5">
			{kinds.map((kind) => {
				const { dot, label } = KIND_COLORS[kind]
				const active = filters[kind]

				return (
					<button
						key={kind}
						type="button"
						onClick={() => onToggle(kind)}
						className={`group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
							active
								? 'bg-muted/60 text-foreground'
								: 'text-muted-foreground/50 hover:text-muted-foreground'
						}`}
					>
						<span
							className={`inline-block h-2 w-2 rounded-full transition-opacity ${dot} ${active ? 'opacity-100' : 'opacity-30'}`}
						/>
						{label}
						{counts[kind] > 0 && (
							<span
								className={`tabular-nums transition-opacity ${active ? 'text-muted-foreground' : 'opacity-40'}`}
							>
								{counts[kind]}
							</span>
						)}
					</button>
				)
			})}
		</div>
	)
}
