'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function AccordionSection({
	title,
	children,
	defaultOpen = false,
	badge,
}: {
	title: string | React.ReactNode
	children: React.ReactNode
	defaultOpen?: boolean
	badge?: React.ReactNode
}) {
	const [isOpen, setIsOpen] = useState(defaultOpen)

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="-mx-4 flex w-[calc(100%+2rem)] items-center justify-between rounded-lg px-4 py-4 transition-colors hover:bg-muted/50"
				>
					<div className="flex items-center gap-2">
						<span className="font-medium">{title}</span>
						{badge}
					</div>
					{isOpen ? (
						<ChevronDown className="size-4 text-muted-foreground" />
					) : (
						<ChevronRight className="size-4 text-muted-foreground" />
					)}
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent className="pb-4 pt-2">{children}</CollapsibleContent>
		</Collapsible>
	)
}
