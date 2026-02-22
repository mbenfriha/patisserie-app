'use client'

import { useState, useRef, useEffect } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'

interface Category {
	id: string
	name: string
}

interface CategoryComboboxProps {
	categories: Category[]
	value: string
	onChange: (value: string) => void
	onCreateCategory: (name: string) => Promise<string | null>
}

export function CategoryCombobox({
	categories,
	value,
	onChange,
	onCreateCategory,
}: CategoryComboboxProps) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [creating, setCreating] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	const selectedCategory = categories.find((c) => c.id === value)

	useEffect(() => {
		if (!open) {
			setSearch('')
		}
	}, [open])

	const filtered = categories.filter((c) =>
		c.name.toLowerCase().includes(search.toLowerCase())
	)

	const exactMatch = categories.some(
		(c) => c.name.toLowerCase() === search.toLowerCase()
	)

	const handleCreate = async () => {
		if (!search.trim() || creating) return
		setCreating(true)
		try {
			const newId = await onCreateCategory(search.trim())
			if (newId) {
				onChange(newId)
				setOpen(false)
			}
		} finally {
			setCreating(false)
		}
	}

	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<button
					type="button"
					className="flex w-full items-center justify-between rounded border bg-white px-3 py-2 text-left text-sm hover:bg-muted/50"
				>
					<span className={selectedCategory ? 'text-foreground' : 'text-muted-foreground'}>
						{selectedCategory?.name || 'Choisir une catégorie...'}
					</span>
					<svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
					</svg>
				</button>
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Content
					className="z-[100] w-[var(--radix-popover-trigger-width)] rounded-md border bg-white shadow-lg"
					sideOffset={4}
					align="start"
				>
					<Command shouldFilter={false}>
						<div className="flex items-center border-b px-3">
							<svg className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
							</svg>
							<Command.Input
								ref={inputRef}
								value={search}
								onValueChange={setSearch}
								placeholder="Rechercher ou créer..."
								className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
							/>
						</div>
						<Command.List className="max-h-[200px] overflow-y-auto p-1">
							{/* Option "Aucune" */}
							<Command.Item
								value="__none__"
								onSelect={() => {
									onChange('')
									setOpen(false)
								}}
								className="flex cursor-pointer items-center rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted data-[selected=true]:bg-muted"
							>
								Aucune catégorie
								{!value && (
									<svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
									</svg>
								)}
							</Command.Item>

							{filtered.map((cat) => (
								<Command.Item
									key={cat.id}
									value={cat.id}
									onSelect={() => {
										onChange(cat.id)
										setOpen(false)
									}}
									className="flex cursor-pointer items-center rounded px-2 py-1.5 text-sm hover:bg-muted data-[selected=true]:bg-muted"
								>
									{cat.name}
									{value === cat.id && (
										<svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
										</svg>
									)}
								</Command.Item>
							))}

							{filtered.length === 0 && !search && (
								<div className="px-2 py-4 text-center text-sm text-muted-foreground">
									Aucune catégorie
								</div>
							)}

							{/* Option "Créer" */}
							{search.trim() && !exactMatch && (
								<Command.Item
									value={`__create__${search}`}
									onSelect={handleCreate}
									className="flex cursor-pointer items-center gap-2 rounded border-t px-2 py-1.5 text-sm font-medium text-primary hover:bg-muted data-[selected=true]:bg-muted"
								>
									<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
									</svg>
									{creating ? 'Création...' : `Créer "${search.trim()}"`}
								</Command.Item>
							)}
						</Command.List>
					</Command>
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	)
}
