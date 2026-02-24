'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface RichTextEditorProps {
	content: string
	onChange: (html: string) => void
	placeholder?: string
}

function ToolbarButton({
	onClick,
	active,
	children,
	title,
}: {
	onClick: () => void
	active?: boolean
	children: React.ReactNode
	title: string
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			className={`rounded px-2 py-1 text-sm transition-colors ${
				active
					? 'bg-primary/15 text-primary'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'
			}`}
		>
			{children}
		</button>
	)
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({
				heading: { levels: [2, 3] },
			}),
			Underline,
			TextAlign.configure({ types: ['heading', 'paragraph'] }),
			Placeholder.configure({ placeholder: placeholder || 'Ecrivez votre texte...' }),
		],
		content,
		onUpdate: ({ editor: e }) => {
			onChange(e.getHTML())
		},
	})

	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content || '')
		}
	}, [content, editor])

	if (!editor) return null

	return (
		<div className="rounded-md border">
			{/* Toolbar */}
			<div className="flex flex-wrap gap-0.5 border-b px-2 py-1.5">
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					active={editor.isActive('bold')}
					title="Gras"
				>
					<strong>B</strong>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					active={editor.isActive('italic')}
					title="Italique"
				>
					<em>I</em>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleUnderline().run()}
					active={editor.isActive('underline')}
					title="Souligne"
				>
					<span className="underline">U</span>
				</ToolbarButton>

				<div className="mx-1 w-px bg-border" />

				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					active={editor.isActive('heading', { level: 2 })}
					title="Titre"
				>
					H2
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					active={editor.isActive('heading', { level: 3 })}
					title="Sous-titre"
				>
					H3
				</ToolbarButton>

				<div className="mx-1 w-px bg-border" />

				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					active={editor.isActive('bulletList')}
					title="Liste a puces"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<line x1="8" y1="6" x2="21" y2="6" />
						<line x1="8" y1="12" x2="21" y2="12" />
						<line x1="8" y1="18" x2="21" y2="18" />
						<circle cx="3" cy="6" r="1" fill="currentColor" />
						<circle cx="3" cy="12" r="1" fill="currentColor" />
						<circle cx="3" cy="18" r="1" fill="currentColor" />
					</svg>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					active={editor.isActive('orderedList')}
					title="Liste numerotee"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<line x1="10" y1="6" x2="21" y2="6" />
						<line x1="10" y1="12" x2="21" y2="12" />
						<line x1="10" y1="18" x2="21" y2="18" />
						<text x="1" y="8" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
						<text x="1" y="14" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
						<text x="1" y="20" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
					</svg>
				</ToolbarButton>

				<div className="mx-1 w-px bg-border" />

				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					active={editor.isActive('blockquote')}
					title="Citation"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
						<path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3" />
					</svg>
				</ToolbarButton>

				<div className="mx-1 w-px bg-border" />

				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('left').run()}
					active={editor.isActive({ textAlign: 'left' })}
					title="Aligner a gauche"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<line x1="3" y1="6" x2="15" y2="6" />
						<line x1="3" y1="12" x2="21" y2="12" />
						<line x1="3" y1="18" x2="15" y2="18" />
					</svg>
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('center').run()}
					active={editor.isActive({ textAlign: 'center' })}
					title="Centrer"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<line x1="6" y1="6" x2="18" y2="6" />
						<line x1="3" y1="12" x2="21" y2="12" />
						<line x1="6" y1="18" x2="18" y2="18" />
					</svg>
				</ToolbarButton>
			</div>

			{/* Editor */}
			<EditorContent
				editor={editor}
				className="prose prose-sm max-w-none px-3 py-2 focus-within:outline-none [&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0"
			/>
		</div>
	)
}
