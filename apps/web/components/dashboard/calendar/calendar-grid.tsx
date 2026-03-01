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
import { KIND_COLORS } from './colors'
import type { ActiveFilters, CalendarEvent, CalendarEventKind } from './types'

interface CalendarGridProps {
	currentMonth: Date
	selectedDate: Date | null
	onSelectDate: (date: Date) => void
	events: CalendarEvent[]
	filters: ActiveFilters
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function CalendarGrid({
	currentMonth,
	selectedDate,
	onSelectDate,
	events,
	filters,
}: CalendarGridProps) {
	const monthStart = startOfMonth(currentMonth)
	const monthEnd = endOfMonth(currentMonth)
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

	const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

	const filteredEvents = events.filter((e) => filters[e.kind])

	function getEventsForDay(day: Date): CalendarEvent[] {
		const dateStr = format(day, 'yyyy-MM-dd')
		return filteredEvents.filter((e) => e.date === dateStr)
	}

	function getDotsForDay(day: Date): CalendarEventKind[] {
		const dayEvents = getEventsForDay(day)
		const kinds = new Set<CalendarEventKind>()
		for (const e of dayEvents) {
			kinds.add(e.kind)
		}
		return Array.from(kinds)
	}

	return (
		<div>
			<div className="grid grid-cols-7 border-b">
				{WEEKDAYS.map((day) => (
					<div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground">
						{day}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7">
				{days.map((day) => {
					const inMonth = isSameMonth(day, currentMonth)
					const today = isToday(day)
					const selected = selectedDate ? isSameDay(day, selectedDate) : false
					const dots = getDotsForDay(day)
					const dayNum = format(day, 'd')

					return (
						<button
							type="button"
							key={day.toISOString()}
							onClick={() => onSelectDate(day)}
							className={`relative flex min-h-[56px] flex-col items-center justify-start border-b border-r p-1.5 transition-colors hover:bg-muted/50 ${
								!inMonth ? 'text-muted-foreground/40' : ''
							} ${selected ? 'bg-primary/5 ring-1 ring-inset ring-primary/30' : ''}`}
						>
							<span
								className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
									today ? 'bg-primary font-bold text-primary-foreground' : ''
								}`}
							>
								{dayNum}
							</span>
							{dots.length > 0 && (
								<div className="mt-0.5 flex gap-0.5">
									{dots.map((kind) => (
										<span
											key={kind}
											className={`h-1.5 w-1.5 rounded-full ${KIND_COLORS[kind].dot}`}
										/>
									))}
								</div>
							)}
						</button>
					)
				})}
			</div>
		</div>
	)
}
