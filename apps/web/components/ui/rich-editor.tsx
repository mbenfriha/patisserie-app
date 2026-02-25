'use client'

import { useCallback, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'

interface RichEditorProps {
	content: string
	onChange: (html: string) => void
	placeholder?: string
}

function ToolbarButton({
	active,
	onClick,
	children,
	title,
}: {
	active?: boolean
	onClick: () => void
	children: React.ReactNode
	title: string
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className={`rounded px-2 py-1 text-xs transition-colors ${
				active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'
			}`}
		>
			{children}
		</button>
	)
}

export function RichEditor({ content, onChange, placeholder }: RichEditorProps) {
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
			Placeholder.configure({ placeholder: placeholder || 'Commencez a ecrire...' }),
			Link.configure({
				openOnClick: false,
				HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
			}),
		],
		content,
		onUpdate: ({ editor: e }) => {
			onChange(e.getHTML())
		},
		editorProps: {
			attributes: {
				class: 'prose prose-sm max-w-none px-3 py-2 min-h-[120px] focus:outline-none',
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
		<div className="rounded border">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1">
				<ToolbarButton
					active={editor.isActive('bold')}
					onClick={() => editor.chain().focus().toggleBold().run()}
					title="Gras"
				>
					<strong>B</strong>
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive('italic')}
					onClick={() => editor.chain().focus().toggleItalic().run()}
					title="Italique"
				>
					<em>I</em>
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive('underline')}
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					title="Souligne"
				>
					<span className="underline">U</span>
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive('strike')}
					onClick={() => editor.chain().focus().toggleStrike().run()}
					title="Barre"
				>
					<span className="line-through">S</span>
				</ToolbarButton>

				<div className="mx-1 h-4 w-px bg-border" />

				<ToolbarButton
					active={editor.isActive('heading', { level: 2 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					title="Titre"
				>
					H2
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive('heading', { level: 3 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					title="Sous-titre"
				>
					H3
				</ToolbarButton>

				<div className="mx-1 h-4 w-px bg-border" />

				<ToolbarButton
					active={editor.isActive('bulletList')}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					title="Liste a puces"
				>
					<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008z" />
					</svg>
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive('orderedList')}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					title="Liste numerotee"
				>
					<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003h12m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 11.54 1.874l-1.35 1.553h2.1" />
					</svg>
				</ToolbarButton>

				<div className="mx-1 h-4 w-px bg-border" />

				<ToolbarButton
					active={editor.isActive({ textAlign: 'left' })}
					onClick={() => editor.chain().focus().setTextAlign('left').run()}
					title="Aligner a gauche"
				>
					<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h10.5m-10.5 5.25h16.5" />
					</svg>
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive({ textAlign: 'center' })}
					onClick={() => editor.chain().focus().setTextAlign('center').run()}
					title="Centrer"
				>
					<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M6.75 12h10.5M3.75 17.25h16.5" />
					</svg>
				</ToolbarButton>

				<div className="mx-1 h-4 w-px bg-border" />

				<ToolbarButton
					active={editor.isActive('blockquote')}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					title="Citation"
				>
					<svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
						<path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
					</svg>
				</ToolbarButton>

				<div className="mx-1 h-4 w-px bg-border" />

				<div className="relative">
					<ToolbarButton
						active={editor.isActive('link')}
						onClick={openLinkInput}
						title="Lien"
					>
						<svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
							<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
							<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
						</svg>
					</ToolbarButton>
					{linkInput.show && (
						<div className="absolute left-0 top-full z-10 mt-1 flex items-center gap-1 rounded-md border bg-popover p-1.5 shadow-md">
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
								className="h-7 w-48 rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
							/>
							<button
								type="button"
								onClick={applyLink}
								className="rounded px-1.5 py-1 text-xs text-primary hover:bg-muted"
								title="Appliquer"
							>
								<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
								</svg>
							</button>
							{editor.isActive('link') && (
								<button
									type="button"
									onClick={removeLink}
									className="rounded px-1.5 py-1 text-xs text-destructive hover:bg-muted"
									title="Supprimer le lien"
								>
									<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Editor */}
			<EditorContent editor={editor} />
		</div>
	)
}
