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

const HOUR_HEIGHT = 60
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
		const height = Math.max((duration / 60) * HOUR_HEIGHT, 28)
		return { top, height }
	}

	return (
		<div className="flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
			{/* Day headers with inline all-day events */}
			<div
				className="grid border-b border-border/40"
				style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}
			>
				<div className="border-r border-border/30" />
				{days.map((day) => {
					const today = isToday(day)
					const allDay = getAllDayEvents(day)
					return (
						<div
							key={day.toISOString()}
							className={`border-r border-border/30 px-1.5 py-2.5 last:border-r-0 ${today ? 'bg-primary/5' : ''}`}
						>
							{/* Day name & number */}
							<div className="mb-1 text-center">
								<div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
									{format(day, 'EEE', { locale: fr })}
								</div>
								<div
									className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
										today ? 'bg-primary text-primary-foreground shadow-sm' : 'text-foreground'
									}`}
								>
									{format(day, 'd')}
								</div>
							</div>

							{/* Orders/devis for this day */}
							{allDay.length > 0 && (
								<>
									{/* Mobile: dots */}
									<div className="mt-1.5 flex flex-wrap justify-center gap-1 sm:hidden">
										{allDay.map((event) => {
											const colors = KIND_COLORS[event.kind]
											return (
												<Link
													key={`${event.kind}-${event.id}`}
													href={getEventLink(event)}
													className={`h-2 w-2 rounded-full ${colors.dot}`}
													title={`${event.title} — ${getStatusLabel(event.kind, event.status)}`}
												/>
											)
										})}
									</div>
									{/* Desktop: labels */}
									<div className="mt-1.5 hidden space-y-0.5 sm:block">
										{allDay.map((event) => {
											const colors = KIND_COLORS[event.kind]
											return (
												<Link
													key={`${event.kind}-${event.id}`}
													href={getEventLink(event)}
													className={`flex items-center gap-1 truncate rounded-md border-l-2 px-1.5 py-1 text-[10px] leading-tight transition-all hover:shadow-sm ${colors.bg} ${colors.border}`}
													title={`${event.title} — ${getStatusLabel(event.kind, event.status)}`}
												>
													<span className={`truncate font-medium ${colors.text}`}>
														{event.title}
													</span>
													<span
														className={`ml-auto shrink-0 rounded px-1 py-px text-[8px] font-semibold leading-none ${getStatusColor(event.kind, event.status)}`}
													>
														{getStatusLabel(event.kind, event.status)}
													</span>
												</Link>
											)
										})}
									</div>
								</>
							)}
						</div>
					)
				})}
			</div>

			{/* Time grid */}
			<div className="relative overflow-auto" style={{ maxHeight: '640px' }}>
				<div
					className="relative grid"
					style={{
						gridTemplateColumns: '60px repeat(7, 1fr)',
						height: `${HOURS.length * HOUR_HEIGHT}px`,
					}}
				>
					{/* Hour labels */}
					<div className="relative border-r border-border/30">
						{HOURS.map((hour) => (
							<div
								key={hour}
								className="absolute right-0 left-0 border-t border-border/30"
								style={{
									top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
									height: `${HOUR_HEIGHT}px`,
								}}
							>
								<span className="relative -top-2.5 block pr-2 text-right text-[10px] font-medium tabular-nums text-muted-foreground/50">
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
								className={`relative border-r border-border/30 last:border-r-0 ${today ? 'bg-primary/[0.02]' : ''}`}
							>
								{/* Hour grid lines */}
								{HOURS.map((hour) => (
									<div
										key={hour}
										className="absolute right-0 left-0 border-t border-dashed border-border/20"
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
											className={`absolute right-0.5 left-0.5 overflow-hidden rounded-lg shadow-sm transition-all hover:shadow-md sm:right-1.5 sm:left-1.5 ${colors.bg} border border-l-[3px] ${colors.border}`}
											style={{
												top: `${pos.top}px`,
												height: `${pos.height}px`,
											}}
											title={`${event.title} — ${getStatusLabel(event.kind, event.status)}`}
										>
											{/* Mobile: dot only */}
											<div className="flex h-full items-center justify-center sm:hidden">
												<span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
											</div>
											{/* Desktop: full labels */}
											<div className="hidden px-2 py-1.5 sm:block">
												<div
													className={`truncate text-[11px] font-semibold leading-tight ${colors.text}`}
												>
													{event.title}
												</div>
												<div className="mt-0.5 flex items-center gap-1.5">
													<span className={`text-[10px] ${colors.text} opacity-60`}>
														{event.meta.startTime} · {durationLabel}
													</span>
													<span
														className={`rounded px-1 py-px text-[8px] font-semibold leading-none ${getStatusColor(event.kind, event.status)}`}
													>
														{getStatusLabel(event.kind, event.status)}
													</span>
												</div>
												{pos.height > 55 && event.meta.location && (
													<div
														className={`mt-0.5 flex items-center gap-1 truncate text-[10px] ${colors.text} opacity-50`}
													>
														<svg
															width="10"
															height="10"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
															strokeLinecap="round"
															strokeLinejoin="round"
															aria-hidden="true"
														>
															<title>Lieu</title>
															<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
															<circle cx="12" cy="10" r="3" />
														</svg>
														{event.meta.location}
													</div>
												)}
											</div>
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
				<div className="h-3 w-3 -translate-x-[5px] rounded-full bg-red-500 shadow-sm shadow-red-500/30" />
				<div className="h-[2px] flex-1 bg-red-500/80" />
			</div>
		</div>
	)
}
