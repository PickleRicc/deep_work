'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Note, NoteTag, Task, ConceptConnection } from '@/lib/types/database'
import NoteList from './note-list'
import ConceptMap from './concept-map'
import NoteEditor from './note-editor'
import { motion, AnimatePresence } from 'motion/react'
import { 
    BookText, 
    Network, 
    Plus, 
    Search, 
    Filter, 
    Grid3X3, 
    List,
    FileText,
    Tag,
    Calendar,
    X,
    BookOpen
} from 'lucide-react'

interface NoteWithTags extends Note {
    note_tags: NoteTag[]
}

export default function NotebookPage() {
    const [activeTab, setActiveTab] = useState<'notes' | 'map'>('notes')
    const [notes, setNotes] = useState<NoteWithTags[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [connections, setConnections] = useState<ConceptConnection[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    
    // Editor modal state
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingNote, setEditingNote] = useState<NoteWithTags | null>(null)

    const supabase = createClient()

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch notes
        const { data: notesData } = await supabase
            .from('notes')
            .select(`
                *,
                note_tags (*)
            `)
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        // Fetch tasks
        const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .in('status', ['active', 'completed'])
            .order('title', { ascending: true })

        // Fetch concept connections
        const { data: connectionsData } = await supabase
            .from('concept_connections')
            .select('*')
            .eq('user_id', user.id)
            .order('strength', { ascending: false })

        setNotes((notesData as any) || [])
        setTasks(tasksData || [])
        setConnections(connectionsData || [])
        setLoading(false)
    }

    const handleCreateNote = () => {
        setEditingNote(null)
        setIsEditorOpen(true)
    }

    const handleEditNote = (note: NoteWithTags) => {
        setEditingNote(note)
        setIsEditorOpen(true)
    }

    const handleEditorClose = () => {
        setIsEditorOpen(false)
        setEditingNote(null)
    }

    const handleNoteSaved = async () => {
        await loadData()
        handleEditorClose()
    }

    // Get all unique tags from notes
    const allTags = Array.from(
        new Set(
            notes.flatMap(note => note.note_tags?.map(t => t.tag_value) || [])
        )
    )

    // Filter notes based on search and tag
    const filteredNotes = notes.filter(note => {
        const matchesSearch = searchQuery === '' || 
            note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesTag = selectedTag === null || 
            note.note_tags?.some(t => t.tag_value === selectedTag)
        
        return matchesSearch && matchesTag
    })

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 0) return 'Today'
        if (diffDays === 1) return 'Yesterday'
        if (diffDays < 7) return `${diffDays} days ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Strip HTML for preview
    const stripHtml = (html: string) => {
        const tmp = document.createElement('div')
        tmp.innerHTML = html
        return tmp.textContent || tmp.innerText || ''
    }

    return (
        <div className="px-4 md:px-8 lg:px-12 py-6 md:py-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-white flex items-center gap-2 sm:gap-3">
                        <BookOpen className="text-blue-400" size={24} />
                        Notebook
                    </h1>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base">{notes.length} notes in your knowledge base</p>
                </div>
                <button
                    onClick={handleCreateNote}
                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 text-sm sm:text-base"
                >
                    <Plus size={18} />
                    New Note
                </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 mb-4 md:mb-6 gap-2">
                <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
                            activeTab === 'notes'
                                ? 'text-blue-400'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        <BookText size={18} />
                        <span>Notes</span>
                        {activeTab === 'notes' && (
                            <motion.div 
                                layoutId="activeNotebookTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" 
                            />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('map')}
                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-medium transition-colors relative whitespace-nowrap text-sm sm:text-base ${
                            activeTab === 'map'
                                ? 'text-blue-400'
                                : 'text-gray-400 hover:text-gray-300'
                        }`}
                    >
                        <Network size={18} />
                        <span>Concept Map</span>
                        {activeTab === 'map' && (
                            <motion.div 
                                layoutId="activeNotebookTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" 
                            />
                        )}
                    </button>
                </div>

                {/* View toggle - only for notes tab */}
                {activeTab === 'notes' && (
                    <div className="flex items-center gap-2 pb-2 sm:pb-3">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'grid' 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : 'text-gray-500 hover:text-white hover:bg-zinc-800'
                            }`}
                        >
                            <Grid3X3 size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === 'list' 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : 'text-gray-500 hover:text-white hover:bg-zinc-800'
                            }`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Tab Content */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : activeTab === 'notes' ? (
                <div className="space-y-6">
                    {/* Search and Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search notes..."
                                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Tag Filter */}
                        {allTags.length > 0 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                <Filter size={16} className="text-gray-500 flex-shrink-0" />
                                <button
                                    onClick={() => setSelectedTag(null)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                        selectedTag === null
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : 'bg-zinc-800/50 text-gray-400 border border-zinc-700 hover:text-white'
                                    }`}
                                >
                                    All
                                </button>
                                {allTags.slice(0, 5).map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                                            selectedTag === tag
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                : 'bg-zinc-800/50 text-gray-400 border border-zinc-700 hover:text-white'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes Grid/List */}
                    {filteredNotes.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16"
                        >
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
                                <FileText size={40} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {searchQuery || selectedTag ? 'No matching notes' : 'No notes yet'}
                            </h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                {searchQuery || selectedTag 
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Start capturing your thoughts, ideas, and learnings'
                                }
                            </p>
                            {!searchQuery && !selectedTag && (
                                <button
                                    onClick={handleCreateNote}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    <Plus size={18} />
                                    Create your first note
                                </button>
                            )}
                        </motion.div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredNotes.map((note, index) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleEditNote(note)}
                                    className="group bg-zinc-900/50 hover:bg-zinc-800/70 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20"
                                >
                                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                        {note.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                                        {stripHtml(note.content)}
                                    </p>
                                    
                                    {/* Tags */}
                                    {note.note_tags && note.note_tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {note.note_tags.slice(0, 3).map(tag => (
                                                <span
                                                    key={tag.id}
                                                    className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs"
                                                >
                                                    {tag.tag_value}
                                                </span>
                                            ))}
                                            {note.note_tags.length > 3 && (
                                                <span className="px-2 py-0.5 bg-zinc-700/50 text-gray-400 rounded text-xs">
                                                    +{note.note_tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Footer */}
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {formatDate(note.updated_at)}
                                        </div>
                                        {note.source_type && note.source_type !== 'general' && (
                                            <span className="capitalize">{note.source_type}</span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredNotes.map((note, index) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onClick={() => handleEditNote(note)}
                                    className="group flex items-start gap-4 bg-zinc-900/30 hover:bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 cursor-pointer transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <FileText size={20} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                                            {note.title}
                                        </h3>
                                        <p className="text-sm text-gray-400 line-clamp-1 mt-1">
                                            {stripHtml(note.content)}
                                        </p>
                                        {note.note_tags && note.note_tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {note.note_tags.slice(0, 3).map(tag => (
                                                    <span
                                                        key={tag.id}
                                                        className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs"
                                                    >
                                                        {tag.tag_value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 flex-shrink-0">
                                        {formatDate(note.updated_at)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <ConceptMap 
                    notes={notes}
                    connections={connections}
                />
            )}

            {/* Note Editor Modal */}
            <AnimatePresence>
                {isEditorOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-4xl h-[95vh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800">
                                <h2 className="text-base sm:text-lg font-semibold text-white">
                                    {editingNote ? 'Edit Note' : 'New Note'}
                                </h2>
                                <button
                                    onClick={handleEditorClose}
                                    className="p-2 text-gray-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Editor Content */}
                            <div className="flex-1 overflow-y-auto">
                                <NoteEditor
                                    note={editingNote}
                                    availableTasks={tasks}
                                    onSave={handleNoteSaved}
                                    onCancel={handleEditorClose}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
