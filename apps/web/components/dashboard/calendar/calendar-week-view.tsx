'use client'

import { eachDayOfInterval, endOfWeek, format, isToday, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { useDashboardPrefix } from '@/lib/hooks/use-custom-domain'
import { getStatusColor, getStatusLabel, KIND_COLORS } from './colors'
import type { ActiveFilters, CalendarEvent } from './types'

interface CalendarWeekViewProps {
	currentWeek: Date
	events: CalendarEvent[]
	filters: ActiveFilters
}

const HOUR_HEIGHT = 56
const START_HOUR = 7
const END_HOUR = 22
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

function parseTime(time: string): { hours: number; minutes: number } | null {
	const parts = time.split(':')
	if (parts.length < 2) return null
	const hours = Number.parseInt(parts[0], 10)
	const minutes = Number.parseInt(parts[1], 10)
	if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
	return { hours, minutes }
}

export function CalendarWeekView({ currentWeek, events, filters }: CalendarWeekViewProps) {
	const prefix = useDashboardPrefix()
	const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
	const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
	const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

	const filteredEvents = events.filter((e) => filters[e.kind])

	function getEventsForDay(day: Date): CalendarEvent[] {
		const dateStr = format(day, 'yyyy-MM-dd')
		return filteredEvents.filter((e) => e.date === dateStr)
	}

	function getEventLink(event: CalendarEvent): string {
		if (event.kind === 'workshop') return `${prefix}/workshops/${event.id}`
		return `${prefix}/orders/${event.id}`
	}

	// Separate timed events (workshops) from all-day events (orders/devis)
	function getTimedEvents(day: Date): CalendarEvent[] {
		return getEventsForDay(day).filter((e) => e.kind === 'workshop' && e.meta.startTime)
	}

	function getAllDayEvents(day: Date): CalendarEvent[] {
		return getEventsForDay(day).filter((e) => e.kind !== 'workshop' || !e.meta.startTime)
	}

	function getEventPosition(event: CalendarEvent): { top: number; height: number } | null {
		const time = parseTime(String(event.meta.startTime || ''))
		if (!time) return null
		const duration = Number(event.meta.durationMinutes) || 60
		const topMinutes = (time.hours - START_HOUR) * 60 + time.minutes
		const top = (topMinutes / 60) * HOUR_HEIGHT
		const height = Math.max((duration / 60) * HOUR_HEIGHT, 24)
		return { top, height }
	}

	const hasAllDayEvents = days.some((d) => getAllDayEvents(d).length > 0)

	return (
		<div className="flex flex-col overflow-hidden rounded-lg border bg-card">
			{/* Day headers */}
			<div className="grid border-b" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
				<div className="border-r" />
				{days.map((day) => {
					const today = isToday(day)
					return (
						<div
							key={day.toISOString()}
							className={`border-r p-2 text-center last:border-r-0 ${today ? 'bg-primary/5' : ''}`}
						>
							<div className="text-[11px] font-medium uppercase text-muted-foreground">
								{format(day, 'EEE', { locale: fr })}
							</div>
							<div
								className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
									today ? 'bg-primary text-primary-foreground' : ''
								}`}
							>
								{format(day, 'd')}
							</div>
						</div>
					)
				})}
			</div>

			{/* All-day events section */}
			{hasAllDayEvents && (
				<div className="grid border-b" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
					<div className="flex items-start justify-end border-r px-1.5 py-1.5">
						<span className="text-[10px] text-muted-foreground">journée</span>
					</div>
					{days.map((day) => {
						const allDay = getAllDayEvents(day)
						const today = isToday(day)
						return (
							<div
								key={day.toISOString()}
								className={`space-y-px border-r p-1 last:border-r-0 ${today ? 'bg-primary/5' : ''}`}
							>
								{allDay.map((event) => (
									<Link
										key={`${event.kind}-${event.id}`}
										href={getEventLink(event)}
										className={`flex items-center gap-1 truncate rounded border-l-2 px-1.5 py-0.5 text-[10px] leading-tight transition-colors hover:opacity-80 ${KIND_COLORS[event.kind].bg} ${KIND_COLORS[event.kind].border} ${KIND_COLORS[event.kind].text}`}
										title={`${event.title} — ${getStatusLabel(event.kind, event.status)}`}
									>
										<span
											className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${getStatusColor(event.kind, event.status)}`}
										/>
										<span className="truncate font-medium">{event.title}</span>
									</Link>
								))}
							</div>
						)
					})}
				</div>
			)}

			{/* Time grid */}
			<div className="relative overflow-auto" style={{ maxHeight: '600px' }}>
				<div
					className="relative grid"
					style={{
						gridTemplateColumns: '56px repeat(7, 1fr)',
						height: `${HOURS.length * HOUR_HEIGHT}px`,
					}}
				>
					{/* Hour labels */}
					<div className="relative border-r">
						{HOURS.map((hour) => (
							<div
								key={hour}
								className="absolute right-0 left-0 border-t"
								style={{
									top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
									height: `${HOUR_HEIGHT}px`,
								}}
							>
								<span className="relative -top-2.5 block pr-1.5 text-right text-[10px] text-muted-foreground">
									{String(hour).padStart(2, '0')}:00
								</span>
							</div>
						))}
					</div>

					{/* Day columns */}
					{days.map((day) => {
						const timed = getTimedEvents(day)
						const today = isToday(day)

						return (
							<div
								key={day.toISOString()}
								className={`relative border-r last:border-r-0 ${today ? 'bg-primary/[0.02]' : ''}`}
							>
								{/* Hour grid lines */}
								{HOURS.map((hour) => (
									<div
										key={hour}
										className="absolute right-0 left-0 border-t border-dashed border-muted/60"
										style={{
											top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
											height: `${HOUR_HEIGHT}px`,
										}}
									/>
								))}

								{/* Current time indicator */}
								{today && <NowIndicator />}

								{/* Timed events (workshops) */}
								{timed.map((event) => {
									const pos = getEventPosition(event)
									if (!pos) return null
									const colors = KIND_COLORS[event.kind]
									const duration = Number(event.meta.durationMinutes) || 60
									const h = Math.floor(duration / 60)
									const m = duration % 60
									const durationLabel =
										h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m}min`

									return (
										<Link
											key={`${event.kind}-${event.id}`}
											href={getEventLink(event)}
											className={`absolute right-1 left-1 overflow-hidden rounded border-l-3 px-1.5 py-1 transition-opacity hover:opacity-90 ${colors.bg} ${colors.border}`}
											style={{
												top: `${pos.top}px`,
												height: `${pos.height}px`,
												borderLeftWidth: '3px',
											}}
											title={`${event.title} — ${getStatusLabel(event.kind, event.status)}`}
										>
											<div
												className={`truncate text-[11px] font-semibold leading-tight ${colors.text}`}
											>
												{event.title}
											</div>
											<div className="mt-px flex items-center gap-1.5">
												<span className={`text-[10px] ${colors.text} opacity-70`}>
													{event.meta.startTime} · {durationLabel}
												</span>
												<span
													className={`rounded-sm px-1 py-px text-[9px] font-medium leading-none ${getStatusColor(event.kind, event.status)}`}
												>
													{getStatusLabel(event.kind, event.status)}
												</span>
											</div>
											{pos.height > 50 && event.meta.location && (
												<div className={`mt-0.5 truncate text-[10px] ${colors.text} opacity-60`}>
													{event.meta.location}
												</div>
											)}
										</Link>
									)
								})}
							</div>
						)
					})}
				</div>
			</div>
		</div>
	)
}

function NowIndicator() {
	const now = new Date()
	const minutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes()
	if (minutes < 0 || minutes > (END_HOUR - START_HOUR) * 60) return null
	const top = (minutes / 60) * HOUR_HEIGHT

	return (
		<div className="pointer-events-none absolute right-0 left-0 z-10" style={{ top: `${top}px` }}>
			<div className="relative flex items-center">
				<div className="h-2.5 w-2.5 rounded-full bg-red-500" />
				<div className="h-px flex-1 bg-red-500" />
			</div>
		</div>
	)
}
