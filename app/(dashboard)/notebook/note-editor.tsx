'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { X, Save, Trash2, Tag as TagIcon, Plus } from 'lucide-react'
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
    onClose: () => void
    onSave: () => void
}

export default function NoteEditor({ note, availableTasks, onClose, onSave }: NoteEditorProps) {
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
        if (!title.trim() || !content.trim()) return

        setIsSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            let noteId = note?.id

            if (note) {
                // Update existing note
                await supabase
                    .from('notes')
                    .update({
                        title,
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
                        title,
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
            router.refresh()
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
            router.refresh()
        } catch (error) {
            console.error('Error deleting note:', error)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-2xl font-bold text-white">
                        {note ? 'Edit Note' : 'New Note'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Source Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-2">SOURCE TYPE</label>
                            <select
                                value={sourceType}
                                onChange={(e) => setSourceType(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 appearance-none"
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
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">TITLE</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Note title..."
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 font-semibold"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">CONTENT</label>
                        <TiptapEditor
                            content={content}
                            onChange={setContent}
                            placeholder="Start writing your note..."
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">TAGS</label>
                        
                        {/* Existing Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm flex items-center gap-2"
                                >
                                    {tag.value}
                                    <button
                                        onClick={() => handleRemoveTag(index)}
                                        className="hover:text-blue-300"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>

                        {/* Add New Tag */}
                        <div className="flex gap-2">
                            <select
                                value={newTagType}
                                onChange={(e) => setNewTagType(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                            >
                                <option value="concept">Concept</option>
                                <option value="project">Project</option>
                                <option value="person">Person</option>
                                <option value="custom">Custom</option>
                            </select>
                            
                            {newTagType === 'project' ? (
                                <select
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Select project...</option>
                                    {availableTasks.map((task) => (
                                        <option key={task.id} value={task.title}>
                                            {task.title}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                    placeholder="Add tag..."
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                />
                            )}
                            
                            <button
                                onClick={handleAddTag}
                                disabled={!newTag.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-zinc-800">
                    {note ? (
                        <button
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    ) : (
                        <div />
                    )}
                    
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim() || !content.trim() || isSaving}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20"
                        >
                            <Save size={16} />
                            {isSaving ? 'Saving...' : 'Save Note'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

