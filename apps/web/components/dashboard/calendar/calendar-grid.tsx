'use client'

import {
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameDay,
	isSameMonth,
	isToday,
	startOfMonth,
	startOfWeek,
} from 'date-fns'
import Link from 'next/link'
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'
import { getStatusColor, getStatusLabel, KIND_COLORS } from './colors'
import type { ActiveFilters, CalendarEvent } from './types'

interface CalendarGridProps {
	currentMonth: Date
	selectedDate: Date | null
	onSelectDate: (date: Date) => void
	events: CalendarEvent[]
	filters: ActiveFilters
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MAX_VISIBLE_EVENTS = 3

export function CalendarGrid({
	currentMonth,
	selectedDate,
	onSelectDate,
	events,
	filters,
}: CalendarGridProps) {
	const prefix = useDashboardPrefix()
	const monthStart = startOfMonth(currentMonth)
	const monthEnd = endOfMonth(currentMonth)
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

	const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

	const filteredEvents = events.filter((e) => filters[e.kind])

	function getEventsForDay(day: Date): CalendarEvent[] {
		const dateStr = format(day, 'yyyy-MM-dd')
		return filteredEvents
			.filter((e) => e.date === dateStr)
			.sort((a, b) => {
				const kindOrder = { workshop: 0, order: 1, devis: 2 }
				const ka = kindOrder[a.kind] ?? 1
				const kb = kindOrder[b.kind] ?? 1
				if (ka !== kb) return ka - kb
				if (a.meta.startTime && b.meta.startTime) {
					return String(a.meta.startTime).localeCompare(String(b.meta.startTime))
				}
				return 0
			})
	}

	function getEventLink(event: CalendarEvent): string {
		if (event.kind === 'workshop') return `${prefix}/workshops/${event.id}`
		return `${prefix}/orders/${event.id}`
	}

	function getEventLabel(event: CalendarEvent): string {
		if (event.kind === 'workshop') {
			const time = event.meta.startTime ? `${event.meta.startTime} ` : ''
			return `${time}${event.title}`
		}
		return event.title
	}

	return (
		<div>
			{/* Weekday headers */}
			<div className="grid grid-cols-7">
				{WEEKDAYS.map((day) => (
					<div
						key={day}
						className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
					>
						{day}
					</div>
				))}
			</div>

			{/* Day cells */}
			<div className="grid grid-cols-7">
				{days.map((day) => {
					const inMonth = isSameMonth(day, currentMonth)
					const today = isToday(day)
					const selected = selectedDate ? isSameDay(day, selectedDate) : false
					const dayEvents = getEventsForDay(day)
					const dayNum = format(day, 'd')
					const extraCount = Math.max(0, dayEvents.length - MAX_VISIBLE_EVENTS)

					return (
						<div
							key={day.toISOString()}
							onClick={() => onSelectDate(day)}
							className={`relative flex min-h-[100px] cursor-pointer flex-col border-b border-r border-border/40 p-1.5 transition-colors last:border-r-0 [&:nth-child(7n)]:border-r-0 ${
								!inMonth ? 'bg-muted/20' : 'hover:bg-muted/30'
							} ${selected ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
						>
							{/* Day number */}
							<div className="mb-1 flex justify-end">
								<span
									className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
										today
											? 'bg-primary font-bold text-primary-foreground shadow-sm'
											: !inMonth
												? 'text-muted-foreground/30'
												: 'text-muted-foreground'
									}`}
								>
									{dayNum}
								</span>
							</div>

							{/* Events */}
							<div className="flex min-w-0 flex-1 flex-col gap-0.5">
								{dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => {
									const colors = KIND_COLORS[event.kind]
									return (
										<Link
											key={`${event.kind}-${event.id}`}
											href={getEventLink(event)}
											onClick={(e) => e.stopPropagation()}
											className={`group flex items-center gap-1 truncate rounded-md border-l-2 px-1.5 py-0.5 text-[10px] leading-tight transition-all hover:shadow-sm ${colors.bg} ${colors.border}`}
											title={`${getEventLabel(event)} — ${getStatusLabel(event.kind, event.status)}`}
										>
											<span className={`truncate font-medium ${colors.text}`}>
												{getEventLabel(event)}
											</span>
											<span
												className={`ml-auto hidden shrink-0 rounded px-1 py-px text-[8px] font-semibold leading-none group-hover:inline-block ${getStatusColor(event.kind, event.status)}`}
											>
												{getStatusLabel(event.kind, event.status)}
											</span>
										</Link>
									)
								})}
								{extraCount > 0 && (
									<span className="px-1.5 text-[10px] font-medium text-muted-foreground/60">
										+{extraCount} autre{extraCount > 1 ? 's' : ''}
									</span>
								)}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}
