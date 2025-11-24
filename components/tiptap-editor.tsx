'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { 
    Bold, 
    Italic, 
    List, 
    ListOrdered, 
    Heading2, 
    Quote,
    Undo,
    Redo
} from 'lucide-react'

interface TiptapEditorProps {
    content: string
    onChange: (html: string) => void
    placeholder?: string
}

export default function TiptapEditor({ content, onChange, placeholder = 'Start writing...' }: TiptapEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4',
            },
        },
    })

    // Update editor content when content prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    if (!editor) {
        return null
    }

    return (
        <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50">
            {/* Toolbar */}
            <div className="border-b border-zinc-800 bg-black/50 p-2 flex items-center gap-1 flex-wrap">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
                        editor.isActive('bold') ? 'bg-zinc-800 text-blue-400' : 'text-gray-400'
                    }`}
                    title="Bold"
                >
                    <Bold size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
                        editor.isActive('italic') ? 'bg-zinc-800 text-blue-400' : 'text-gray-400'
                    }`}
                    title="Italic"
                >
                    <Italic size={18} />
                </button>
                
                <div className="w-px h-6 bg-zinc-800 mx-1" />
                
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
                        editor.isActive('heading', { level: 2 }) ? 'bg-zinc-800 text-blue-400' : 'text-gray-400'
                    }`}
                    title="Heading"
                >
                    <Heading2 size={18} />
                </button>
                
                <div className="w-px h-6 bg-zinc-800 mx-1" />
                
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
                        editor.isActive('bulletList') ? 'bg-zinc-800 text-blue-400' : 'text-gray-400'
                    }`}
                    title="Bullet List"
                >
                    <List size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
                        editor.isActive('orderedList') ? 'bg-zinc-800 text-blue-400' : 'text-gray-400'
                    }`}
                    title="Numbered List"
                >
                    <ListOrdered size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
                        editor.isActive('blockquote') ? 'bg-zinc-800 text-blue-400' : 'text-gray-400'
                    }`}
                    title="Quote"
                >
                    <Quote size={18} />
                </button>
                
                <div className="w-px h-6 bg-zinc-800 mx-1" />
                
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-2 rounded hover:bg-zinc-800 transition-colors text-gray-400 disabled:opacity-30"
                    title="Undo"
                >
                    <Undo size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-2 rounded hover:bg-zinc-800 transition-colors text-gray-400 disabled:opacity-30"
                    title="Redo"
                >
                    <Redo size={18} />
                </button>
            </div>
            
            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    )
}

