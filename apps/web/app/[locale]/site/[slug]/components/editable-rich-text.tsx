'use client'

import { type CSSProperties, useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { useInlineEdit } from './inline-edit-provider'

interface EditableRichTextProps {
	value: string
	onChange: (html: string) => void
	className?: string
	style?: CSSProperties
}

export function EditableRichText({ value, onChange, className, style }: EditableRichTextProps) {
	const { isEditing } = useInlineEdit()

	if (!isEditing) {
		return (
			<div className={className} style={style} dangerouslySetInnerHTML={{ __html: value }} />
		)
	}

	return <InlineRichEditor value={value} onChange={onChange} className={className} style={style} />
}

function InlineRichEditor({ value, onChange, className, style }: EditableRichTextProps) {
	const [linkInput, setLinkInput] = useState<{ show: boolean; url: string }>({
		show: false,
		url: '',
	})

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit,
			Underline,
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
			}),
		],
		content: value,
		onUpdate: ({ editor: e }) => {
			onChange(e.getHTML())
		},
		editorProps: {
			attributes: {
				class: `${className || ''} outline-none focus:outline-none`,
			},
		},
	})

	const openLinkInput = useCallback(() => {
		if (!editor) return
		const existing = editor.getAttributes('link').href ?? ''
		setLinkInput({ show: true, url: existing })
	}, [editor])

	const applyLink = useCallback(() => {
		if (!editor) return
		const url = linkInput.url.trim()
		if (url) {
			editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
		} else {
			editor.chain().focus().extendMarkRange('link').unsetLink().run()
		}
		setLinkInput({ show: false, url: '' })
	}, [editor, linkInput.url])

	const removeLink = useCallback(() => {
		if (!editor) return
		editor.chain().focus().extendMarkRange('link').unsetLink().run()
		setLinkInput({ show: false, url: '' })
	}, [editor])

	if (!editor) return null

	return (
		<div className="relative">
			{/* Floating mini toolbar */}
			<div className="absolute -top-11 left-0 z-10 flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#1A1A1A]/95 px-2 py-1.5 shadow-xl backdrop-blur-sm">
				<MiniBtn
					active={editor.isActive('bold')}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<strong>B</strong>
				</MiniBtn>
				<MiniBtn
					active={editor.isActive('italic')}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<em>I</em>
				</MiniBtn>
				<MiniBtn
					active={editor.isActive('underline')}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
				>
					<span className="underline">U</span>
				</MiniBtn>
				<Sep />
				<MiniBtn
					active={editor.isActive('heading', { level: 2 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				>
					H2
				</MiniBtn>
				<MiniBtn
					active={editor.isActive('heading', { level: 3 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				>
					H3
				</MiniBtn>
				<Sep />
				<MiniBtn
					active={editor.isActive('bulletList')}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<svg
						className="h-3.5 w-3.5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008z"
						/>
					</svg>
				</MiniBtn>
				<MiniBtn
					active={editor.isActive('blockquote')}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
				>
					<svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
					</svg>
				</MiniBtn>
				<Sep />
				<MiniBtn active={editor.isActive('link')} onClick={openLinkInput}>
					<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
						<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
						<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
					</svg>
				</MiniBtn>
			</div>

			{/* Link input popover */}
			{linkInput.show && (
				<div className="absolute -top-[5.5rem] left-0 z-20 flex items-center gap-1 rounded-lg border border-white/10 bg-[#1A1A1A]/95 px-2 py-1.5 shadow-xl backdrop-blur-sm">
					<input
						type="url"
						value={linkInput.url}
						onChange={(e) => setLinkInput((s) => ({ ...s, url: e.target.value }))}
						onKeyDown={(e) => {
							if (e.key === 'Enter') applyLink()
							if (e.key === 'Escape') setLinkInput({ show: false, url: '' })
						}}
						placeholder="https://..."
						autoFocus
						className="h-6 w-48 rounded border border-white/20 bg-transparent px-2 text-[11px] text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--gold)]"
					/>
					<MiniBtn onClick={applyLink}>
						<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
						</svg>
					</MiniBtn>
					{editor.isActive('link') && (
						<MiniBtn onClick={removeLink}>
							<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</MiniBtn>
					)}
				</div>
			)}

			{/* Editor with edit indicator */}
			<div className="outline-2 outline-dashed outline-[var(--gold)]/30 outline-offset-4 transition-all hover:outline-[var(--gold)]/50 focus-within:outline-[var(--gold)]/70 focus-within:outline-solid rounded">
				<EditorContent editor={editor} style={style} />
			</div>
		</div>
	)
}

function MiniBtn({
	active,
	onClick,
	children,
}: {
	active?: boolean
	onClick: () => void
	children: React.ReactNode
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
				active ? 'bg-[var(--gold)] text-[#1A1A1A]' : 'text-white/70 hover:text-white'
			}`}
		>
			{children}
		</button>
	)
}

function Sep() {
	return <div className="mx-0.5 h-4 w-px bg-white/20" />
}
