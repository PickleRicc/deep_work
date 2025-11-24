'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Save, Trash2, Plus, X, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Note, NoteTag, Task } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import TiptapEditor from '@/components/tiptap-editor'

interface NoteWithTags extends Note {
    note_tags: NoteTag[]
}

interface InlineNoteEditorProps {
    note: NoteWithTags | null
    availableTasks: Task[]
    onSave: (noteId?: string) => void
    onClear: () => void
}

export default function InlineNoteEditor({ note, availableTasks, onSave, onClear }: InlineNoteEditorProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isSaving, setIsSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    
    const [title, setTitle] = useState(note?.title || '')
    const [content, setContent] = useState(note?.content || '')
    const [sourceType, setSourceType] = useState(note?.source_type || 'general')
    const [sourceName, setSourceName] = useState(note?.source_name || '')
    
    const [tags, setTags] = useState<Array<{ type: string; value: string }>>(
        note?.note_tags.map((t) => ({ type: t.tag_type, value: t.tag_value })) || []
    )
    const [newTag, setNewTag] = useState('')
    const [newTagType, setNewTagType] = useState('concept')
    
    const [isSourceExpanded, setIsSourceExpanded] = useState(false)
    const [isTagsExpanded, setIsTagsExpanded] = useState(false)

    // Reset state when note changes
    useEffect(() => {
        setTitle(note?.title || '')
        setContent(note?.content || '')
        setSourceType(note?.source_type || 'general')
        setSourceName(note?.source_name || '')
        setTags(note?.note_tags?.map((t) => ({ type: t.tag_type, value: t.tag_value })) || [])
        setHasUnsavedChanges(false)
        setIsSourceExpanded(false)
        setIsTagsExpanded(false)
    }, [note])

    const handleTitleChange = (value: string) => {
        setTitle(value)
        setHasUnsavedChanges(true)
    }

    const handleContentChange = (value: string) => {
        setContent(value)
        setHasUnsavedChanges(true)
    }

    const handleAddTag = () => {
        if (newTag.trim()) {
            setTags([...tags, { type: newTagType, value: newTag.trim() }])
            setNewTag('')
            setHasUnsavedChanges(true)
        }
    }

    const handleRemoveTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index))
        setHasUnsavedChanges(true)
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
                // Extract first line or first 50 characters as title
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

            setHasUnsavedChanges(false)
            onSave(noteId)
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
            onClear()
            router.refresh()
        } catch (error) {
            console.error('Error deleting note:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleClear = () => {
        if (hasUnsavedChanges && !confirm('Discard unsaved changes?')) return
        onClear()
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header with unsaved indicator */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <FileText size={20} className="text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">
                        {note ? 'Edit Note' : 'New Note'}
                    </h2>
                    {hasUnsavedChanges && (
                        <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
                            Unsaved
                        </span>
                    )}
                </div>
                <button
                    onClick={handleClear}
                    className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    title="Clear editor"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Note title (optional - auto-generated if empty)"
                    className="w-full bg-transparent border-none text-3xl font-bold text-white placeholder-gray-600 focus:outline-none"
                />

                {/* Content Editor */}
                <div className="min-h-[400px]">
                    <TiptapEditor
                        content={content}
                        onChange={handleContentChange}
                        placeholder="Start writing..."
                    />
                </div>

                {/* Configuration Sections - Collapsed by default */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    {/* Source Configuration */}
                    <div className="bg-zinc-900/30 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setIsSourceExpanded(!isSourceExpanded)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            <span>Source Information</span>
                            {isSourceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <AnimatePresence>
                            {isSourceExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-2">TYPE</label>
                                            <select
                                                value={sourceType}
                                                onChange={(e) => {
                                                    setSourceType(e.target.value)
                                                    setHasUnsavedChanges(true)
                                                }}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                                            >
                                                <option value="general">General</option>
                                                <option value="book">Book</option>
                                                <option value="podcast">Podcast</option>
                                                <option value="idea">Idea</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-2">NAME</label>
                                            <input
                                                type="text"
                                                value={sourceName}
                                                onChange={(e) => {
                                                    setSourceName(e.target.value)
                                                    setHasUnsavedChanges(true)
                                                }}
                                                placeholder="e.g., Deep Work"
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Tags Configuration */}
                    <div className="bg-zinc-900/30 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            <span>Tags {tags.length > 0 && `(${tags.length})`}</span>
                            {isTagsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <AnimatePresence>
                            {isTagsExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-4 space-y-3">
                                        {/* Existing Tags */}
                                        {tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
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
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

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
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
                {note ? (
                    <button
                        onClick={handleDelete}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                ) : (
                    <div />
                )}
                
                <div className="flex gap-3">
                    <button
                        onClick={handleClear}
                        disabled={isSaving}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg transition-colors text-sm"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!content.trim() || isSaving}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20 text-sm"
                    >
                        <Save size={14} />
                        {isSaving ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </div>
        </div>
    )
}

