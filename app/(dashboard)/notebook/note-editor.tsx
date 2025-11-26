'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Save, Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Note, NoteTag, Task } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import TiptapEditor from '@/components/tiptap-editor'

interface NoteWithTags extends Note {
    note_tags: NoteTag[]
}

interface NoteEditorProps {
    note: NoteWithTags | null
    availableTasks: Task[]
    onSave: () => void
    onCancel: () => void
}

export default function NoteEditor({ note, availableTasks, onSave, onCancel }: NoteEditorProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isSaving, setIsSaving] = useState(false)
    
    const [title, setTitle] = useState(note?.title || '')
    const [content, setContent] = useState(note?.content || '')
    const [sourceType, setSourceType] = useState(note?.source_type || 'general')
    const [sourceName, setSourceName] = useState(note?.source_name || '')
    
    const [tags, setTags] = useState<Array<{ type: string; value: string }>>(
        note?.note_tags.map((t) => ({ type: t.tag_type, value: t.tag_value })) || []
    )
    const [newTag, setNewTag] = useState('')
    const [newTagType, setNewTagType] = useState('concept')
    
    const [showMetadata, setShowMetadata] = useState(false)

    // Reset state when note changes
    useEffect(() => {
        setTitle(note?.title || '')
        setContent(note?.content || '')
        setSourceType(note?.source_type || 'general')
        setSourceName(note?.source_name || '')
        setTags(note?.note_tags?.map((t) => ({ type: t.tag_type, value: t.tag_value })) || [])
    }, [note])

    const handleAddTag = () => {
        if (newTag.trim()) {
            setTags([...tags, { type: newTagType, value: newTag.trim() }])
            setNewTag('')
        }
    }

    const handleRemoveTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!content.trim()) return

        setIsSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Auto-generate title from content if empty
            let finalTitle = title.trim()
            if (!finalTitle) {
                const tempDiv = document.createElement('div')
                tempDiv.innerHTML = content
                const textContent = tempDiv.textContent || tempDiv.innerText || ''
                finalTitle = textContent.substring(0, 50).trim() || 'Untitled Note'
            }

            let noteId = note?.id

            if (note) {
                // Update existing note
                await supabase
                    .from('notes')
                    .update({
                        title: finalTitle,
                        content,
                        source_type: sourceType,
                        source_name: sourceName || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', note.id)

                // Delete existing tags
                await supabase
                    .from('note_tags')
                    .delete()
                    .eq('note_id', note.id)
            } else {
                // Create new note
                const { data: newNote } = await supabase
                    .from('notes')
                    .insert({
                        user_id: user.id,
                        title: finalTitle,
                        content,
                        source_type: sourceType,
                        source_name: sourceName || null,
                    })
                    .select()
                    .single()

                noteId = newNote?.id
            }

            // Insert tags
            if (noteId && tags.length > 0) {
                await supabase.from('note_tags').insert(
                    tags.map((tag) => ({
                        note_id: noteId,
                        tag_type: tag.type,
                        tag_value: tag.value,
                    }))
                )
            }

            onSave()
        } catch (error) {
            console.error('Error saving note:', error)
            alert('Failed to save note')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!note || !confirm('Delete this note?')) return

        setIsSaving(true)

        try {
            await supabase.from('notes').delete().eq('id', note.id)
            onSave()
        } catch (error) {
            console.error('Error deleting note:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Editor Content */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title (optional - auto-generated if empty)"
                    className="w-full bg-transparent border-none text-2xl font-bold text-white placeholder-gray-600 focus:outline-none"
                    autoFocus
                />

                {/* Tags inline */}
                <div className="flex flex-wrap items-center gap-2">
                    {tags.map((tag, index) => (
                        <span
                            key={index}
                            className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-1.5"
                        >
                            {tag.value}
                            <button
                                onClick={() => handleRemoveTag(index)}
                                className="hover:text-blue-300"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    
                    {/* Inline tag input */}
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            placeholder="+ Add tag"
                            className="w-24 bg-transparent border-none text-sm text-gray-400 placeholder-gray-600 focus:outline-none focus:text-white"
                        />
                        {newTag && (
                            <button
                                onClick={handleAddTag}
                                className="text-blue-400 hover:text-blue-300"
                            >
                                <Plus size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Editor */}
                <div className="min-h-[300px] bg-zinc-800/30 rounded-xl border border-zinc-800 overflow-hidden">
                    <TiptapEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Start writing your note..."
                    />
                </div>

                {/* Metadata Toggle */}
                <button
                    onClick={() => setShowMetadata(!showMetadata)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
                >
                    {showMetadata ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    Source & Metadata
                </button>

                {/* Metadata Section */}
                <AnimatePresence>
                    {showMetadata && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">SOURCE TYPE</label>
                                    <select
                                        value={sourceType}
                                        onChange={(e) => setSourceType(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="general">General</option>
                                        <option value="book">Book</option>
                                        <option value="podcast">Podcast</option>
                                        <option value="idea">Idea</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-2">SOURCE NAME</label>
                                    <input
                                        type="text"
                                        value={sourceName}
                                        onChange={(e) => setSourceName(e.target.value)}
                                        placeholder="e.g., Deep Work by Cal Newport"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
                {note ? (
                    <button
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                ) : (
                    <div />
                )}
                
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!content.trim() || isSaving}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 text-sm"
                    >
                        <Save size={14} />
                        {isSaving ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </div>
        </div>
    )
}
