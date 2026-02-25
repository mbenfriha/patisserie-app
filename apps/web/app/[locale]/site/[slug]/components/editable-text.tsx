'use client'

import { createElement, useRef, useEffect, type CSSProperties } from 'react'
import { useInlineEdit } from './inline-edit-provider'

interface EditableTextProps {
	value: string
	onChange: (value: string) => void
	as?: string
	className?: string
	style?: CSSProperties
}

export function EditableText({
	value,
	onChange,
	as = 'span',
	className = '',
	style,
}: EditableTextProps) {
	const { isEditing } = useInlineEdit()
	const ref = useRef<HTMLElement>(null)
	const wasEditing = useRef(false)

	useEffect(() => {
		if (isEditing && !wasEditing.current && ref.current) {
			ref.current.textContent = value
		}
		wasEditing.current = isEditing
	}, [isEditing, value])

	if (!isEditing) {
		return createElement(as, { className, style }, value)
	}

	return createElement(as, {
		ref,
		className: `${className} outline-2 outline-dashed outline-[var(--gold)]/30 outline-offset-4 cursor-text hover:outline-[var(--gold)]/50 focus:outline-[var(--gold)]/70 focus:outline-solid transition-all rounded-sm`,
		style: { ...style, minWidth: '2em' },
		contentEditable: true,
		suppressContentEditableWarning: true,
		onInput: () => {
			const text = ref.current?.textContent || ''
			onChange(text)
		},
		onKeyDown: (e: KeyboardEvent) => {
			if (e.key === 'Enter' && !['div', 'p'].includes(as)) {
				e.preventDefault()
			}
		},
	})
}
