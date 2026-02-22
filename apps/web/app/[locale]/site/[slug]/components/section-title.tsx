'use client'

import { GoldDivider } from './gold-divider'

interface SectionTitleProps {
	subtitle?: string
	title: string
	light?: boolean
}

export function SectionTitle({ subtitle, title, light }: SectionTitleProps) {
	return (
		<div className="mb-12 text-center">
			{subtitle && (
				<span
					className={`font-[family-name:'Josefin_Sans'] text-xs tracking-[4px] uppercase ${
						light ? 'text-white/70' : 'text-[var(--gold)]'
					}`}
				>
					{subtitle}
				</span>
			)}
			<h2
				className={`mt-2 font-[family-name:'Cormorant_Garamond'] font-normal leading-tight ${
					light ? 'text-white' : 'text-[var(--dark)]'
				}`}
				style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}
			>
				{title}
			</h2>
			<GoldDivider />
		</div>
	)
}
