'use client'

export function GoldDivider() {
	return (
		<div className="flex items-center justify-center gap-4 py-2">
			<div
				className="h-px w-[60px]"
				style={{
					background: 'linear-gradient(90deg, transparent, var(--gold))',
				}}
			/>
			<div className="h-2 w-2 rotate-45 bg-[var(--gold)]" />
			<div
				className="h-px w-[60px]"
				style={{
					background: 'linear-gradient(90deg, var(--gold), transparent)',
				}}
			/>
		</div>
	)
}
