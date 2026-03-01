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
			const kindOrder = { workshop: 0, order: 1, devis: 2 }
			return (kindOrder[a.kind] ?? 1) - (kindOrder[b.kind] ?? 1)
		})

	const dayLabel = format(date, 'EEEE d MMMM', { locale: fr })

	function getLink(event: CalendarEvent): string {
		if (event.kind === 'workshop') return `${prefix}/workshops/${event.id}`
		return `${prefix}/orders/${event.id}`
	}

	return (
		<div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
			<h3 className="mb-3 text-sm font-semibold capitalize tracking-tight">{dayLabel}</h3>
			{dayEvents.length === 0 ? (
				<p className="py-4 text-center text-sm text-muted-foreground/60">Aucun événement ce jour</p>
			) : (
				<div className="space-y-1.5">
					{dayEvents.map((event) => {
						const colors = KIND_COLORS[event.kind]
						return (
							<Link
								key={`${event.kind}-${event.id}`}
								href={getLink(event)}
								className="group flex items-start gap-3 rounded-lg border border-border/40 p-3 transition-all hover:border-border hover:bg-muted/30 hover:shadow-sm"
							>
								<span
									className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ${colors.dot}`}
								/>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="truncate text-sm font-medium group-hover:text-foreground">
											{event.title}
										</span>
										<span
											className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(event.kind, event.status)}`}
										>
											{getStatusLabel(event.kind, event.status)}
										</span>
									</div>
									<div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground/70">
										{event.kind === 'workshop' && event.meta.startTime && (
											<span className="flex items-center gap-1">
												<svg
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
													aria-hidden="true"
												>
													<circle cx="12" cy="12" r="10" />
													<polyline points="12 6 12 12 16 14" />
												</svg>
												{event.meta.startTime}
												{event.meta.durationMinutes && ` · ${event.meta.durationMinutes}min`}
											</span>
										)}
										{event.kind === 'workshop' && event.meta.location && (
											<span className="flex items-center gap-1">
												<svg
													width="12"
													height="12"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
													aria-hidden="true"
												>
													<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
													<circle cx="12" cy="10" r="3" />
												</svg>
												{event.meta.location}
											</span>
										)}
										{event.kind !== 'workshop' && event.meta.clientName && (
											<span>{event.meta.clientName}</span>
										)}
										{event.meta.total != null && event.kind !== 'workshop' && (
											<span className="font-medium">{event.meta.total} €</span>
										)}
									</div>
								</div>
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
									className="mt-1 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground"
								>
									<path d="m9 18 6-6-6-6" />
								</svg>
							</Link>
						)
					})}
				</div>
			)}
		</div>
	)
}
