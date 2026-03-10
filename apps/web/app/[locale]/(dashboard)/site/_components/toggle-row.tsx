'use client'

import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function FeatureToggle({
	label,
	description,
	checked,
	onCheckedChange,
	disabled = false,
	requiresPro = false,
	isLocked = false,
	children,
}: {
	label: string
	description?: string
	checked: boolean
	onCheckedChange: (checked: boolean) => void
	disabled?: boolean
	requiresPro?: boolean
	isLocked?: boolean
	children?: React.ReactNode
}) {
	return (
		<div className="py-4 first:pt-0 last:pb-0">
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 space-y-0.5">
					<div className="flex items-center gap-2">
						<Label className="text-sm font-medium">{label}</Label>
						{requiresPro && (
							<Badge variant="secondary" className="text-xs">
								<Lock className="mr-1 size-3" />
								Pro
							</Badge>
						)}
					</div>
					{description && <p className="text-xs text-muted-foreground">{description}</p>}
				</div>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div>
								<Switch
									checked={checked}
									onCheckedChange={onCheckedChange}
									disabled={disabled || isLocked}
								/>
							</div>
						</TooltipTrigger>
						{isLocked && (
							<TooltipContent>
								<p>Passez au plan Pro pour activer cette fonctionnalité</p>
							</TooltipContent>
						)}
					</Tooltip>
				</TooltipProvider>
			</div>
			{checked && children && <div className="mt-4 border-l-2 border-muted pl-4">{children}</div>}
		</div>
	)
}
