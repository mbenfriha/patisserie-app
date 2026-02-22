'use client'

interface StepHeaderProps {
	number: number
	title: string
}

export function StepHeader({ number, title }: StepHeaderProps) {
	return (
		<div className="mb-8 flex items-center gap-4">
			<div
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-sm font-bold text-white"
				style={{ fontFamily: "'Josefin Sans', sans-serif" }}
			>
				{number}
			</div>
			<h3
				className="font-[family-name:'Josefin_Sans'] text-xs font-semibold uppercase tracking-[3px] text-[var(--dark)]"
			>
				{title}
			</h3>
		</div>
	)
}
