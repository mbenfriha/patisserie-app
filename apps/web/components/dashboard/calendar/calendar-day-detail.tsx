'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'
import { getStatusColor, getStatusLabel, KIND_COLORS } from './colors'
import type { ActiveFilters, CalendarEvent } from './types'

interface CalendarDayDetailProps {
	date: Date
	events: CalendarEvent[]
	filters: ActiveFilters
}

export function CalendarDayDetail({ date, events, filters }: CalendarDayDetailProps) {
	const prefix = useDashboardPrefix()
	const dateStr = format(date, 'yyyy-MM-dd')
	const dayEvents = events
		.filter((e) => e.date === dateStr && filters[e.kind])
		.sort((a, b) => {
			// Workshops first (they have a start time), then orders, then devis
			const kindOrder = { workshop: 0, order: 1, devis: 2 }
			return (kindOrder[a.kind] ?? 1) - (kindOrder[b.kind] ?? 1)
		})

	const dayLabel = format(date, 'EEEE d MMMM', { locale: fr })

	function getLink(event: CalendarEvent): string {
		if (event.kind === 'workshop') {
			return `${prefix}/workshops/${event.id}`
		}
		return `${prefix}/orders/${event.id}`
	}

	return (
		<div className="rounded-lg border bg-card p-4">
			<h3 className="mb-3 text-sm font-semibold capitalize">{dayLabel}</h3>
			{dayEvents.length === 0 ? (
				<p className="text-sm text-muted-foreground">Aucun événement ce jour</p>
			) : (
				<div className="space-y-2">
					{dayEvents.map((event) => (
						<Link
							key={`${event.kind}-${event.id}`}
							href={getLink(event)}
							className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
						>
							<span
								className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${KIND_COLORS[event.kind].dot}`}
							/>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="truncate text-sm font-medium">{event.title}</span>
									<span
										className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(event.kind, event.status)}`}
									>
										{getStatusLabel(event.kind, event.status)}
									</span>
								</div>
								<div className="mt-0.5 text-xs text-muted-foreground">
									{event.kind === 'workshop' && event.meta.startTime && (
										<span>{event.meta.startTime}</span>
									)}
									{event.kind !== 'workshop' && event.meta.clientName && (
										<span>{event.meta.clientName}</span>
									)}
									{event.meta.total != null && event.kind !== 'workshop' && (
										<span className="ml-2">{event.meta.total} €</span>
									)}
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
