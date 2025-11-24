'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, Book, Podcast, Lightbulb, FileText, X, Tag } from 'lucide-react'
import { Note, NoteTag, Task } from '@/lib/types/database'

interface NoteWithTags extends Note {
    note_tags: NoteTag[]
}

interface NoteListProps {
    initialNotes: NoteWithTags[]
    availableTasks: Task[]
    onNotesChange: () => void
    onNoteSelect: (note: NoteWithTags) => void
    currentNoteId?: string
}

const SOURCE_ICONS = {
    book: Book,
    podcast: Podcast,
    idea: Lightbulb,
    general: FileText,
}

export default function NoteList({ initialNotes, availableTasks, onNotesChange, onNoteSelect, currentNoteId }: NoteListProps) {
    const [notes, setNotes] = useState<NoteWithTags[]>(initialNotes)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTag, setFilterTag] = useState<string>('')

    useEffect(() => {
        setNotes(initialNotes)
    }, [initialNotes])

    // Filter notes
    const filteredNotes = notes.filter((note) => {
        const matchesSearch =
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesTag = filterTag
            ? note.note_tags.some((tag) => tag.tag_value === filterTag)
            : true

        return matchesSearch && matchesTag
    })

    // Get all unique tags
    const allTags = Array.from(
        new Set(notes.flatMap((note) => note.note_tags.map((tag) => tag.tag_value)))
    )

    const getSourceIcon = (sourceType: string | null) => {
        const IconComponent = SOURCE_ICONS[sourceType as keyof typeof SOURCE_ICONS] || FileText
        return <IconComponent size={14} />
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Search Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                </div>

                {/* Active Filter Tag */}
                {filterTag && (
                    <button
                        onClick={() => setFilterTag('')}
                        className="w-full px-3 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-colors hover:bg-blue-600/30 flex items-center justify-between"
                    >
                        <span className="flex items-center gap-2">
                            <Tag size={12} />
                            {filterTag}
                        </span>
                        <X size={12} />
                    </button>
                )}

                {/* Tags Filter */}
                {allTags.length > 0 && !filterTag && (
                    <div className="flex flex-wrap gap-1.5">
                        {allTags.slice(0, 6).map((tag) => (
                            <button
                                key={tag}
                                onClick={() => setFilterTag(tag)}
                                className="px-2 py-1 bg-zinc-800 border border-zinc-700 hover:border-blue-500/30 text-gray-400 hover:text-blue-400 rounded text-xs transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                <AnimatePresence mode="popLayout">
                    {filteredNotes.map((note) => {
                        const isActive = note.id === currentNoteId
                        return (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => onNoteSelect(note)}
                                className={`group bg-zinc-900/30 backdrop-blur-sm border rounded-lg p-3 cursor-pointer transition-all ${
                                    isActive
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-zinc-800 hover:border-blue-500/30 hover:bg-zinc-900/50'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                        {getSourceIcon(note.source_type)}
                                        {note.source_name && (
                                            <span className="truncate max-w-[100px]">
                                                {note.source_name}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {new Date(note.updated_at).toLocaleDateString('en-US', { 
                                            month: 'short', 
                                            day: 'numeric' 
                                        })}
                                    </div>
                                </div>

                                <h3 className={`text-sm font-semibold mb-1.5 line-clamp-2 transition-colors ${
                                    isActive ? 'text-blue-400' : 'text-white group-hover:text-blue-400'
                                }`}>
                                    {note.title}
                                </h3>

                                <div 
                                    className="text-xs text-gray-400 line-clamp-2 mb-2 prose prose-sm prose-invert max-w-none [&>*]:m-0 [&_p]:text-xs"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                />

                                {note.note_tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {note.note_tags.slice(0, 2).map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px]"
                                            >
                                                {tag.tag_value}
                                            </span>
                                        ))}
                                        {note.note_tags.length > 2 && (
                                            <span className="px-1.5 py-0.5 text-gray-500 text-[10px]">
                                                +{note.note_tags.length - 2}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </AnimatePresence>

                {filteredNotes.length === 0 && (
                    <div className="text-center py-8 px-4">
                        <FileText size={32} className="mx-auto text-gray-700 mb-3" />
                        <p className="text-sm text-gray-400 mb-1">
                            {searchQuery || filterTag ? 'No notes found' : 'No notes yet'}
                        </p>
                        <p className="text-xs text-gray-600">
                            {searchQuery || filterTag
                                ? 'Try adjusting your search or filter'
                                : 'Start writing in the editor'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

