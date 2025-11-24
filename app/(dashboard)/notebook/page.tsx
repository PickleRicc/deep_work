'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Note, NoteTag, Task, ConceptConnection } from '@/lib/types/database'
import NoteList from './note-list'
import ConceptMap from './concept-map'
import InlineNoteEditor from './inline-note-editor'
import { BookText, Network } from 'lucide-react'

interface NoteWithTags extends Note {
    note_tags: NoteTag[]
}

export default function NotebookPage() {
    const [activeTab, setActiveTab] = useState<'notes' | 'map'>('notes')
    const [notes, setNotes] = useState<NoteWithTags[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [connections, setConnections] = useState<ConceptConnection[]>([])
    const [loading, setLoading] = useState(true)
    const [currentNote, setCurrentNote] = useState<NoteWithTags | null>(null)
    const [mobileView, setMobileView] = useState<'editor' | 'list'>('editor')

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
        
        return (notesData as any) || []
    }

    const handleNoteSelect = (note: NoteWithTags) => {
        setCurrentNote(note)
        // On mobile, switch to editor view when a note is selected
        setMobileView('editor')
    }

    const handleNoteSaved = async (savedNoteId?: string) => {
        const updatedNotes = await loadData()
        
        // If we have a note ID, re-select it after loading to show updated data
        if (savedNoteId || currentNote?.id) {
            const noteId = savedNoteId || currentNote?.id
            const updatedNote = updatedNotes.find((n: NoteWithTags) => n.id === noteId)
            if (updatedNote) {
                setCurrentNote(updatedNote)
            }
        }
    }

    const handleClearEditor = () => {
        setCurrentNote(null)
    }

    return (
        <div className="px-4 md:px-8 lg:px-12 py-8 h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-4xl font-bold text-white">Notebook</h1>
                    <p className="text-gray-400 mt-1">Your knowledge repository</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-zinc-800 mb-6">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${
                        activeTab === 'notes'
                            ? 'text-blue-400'
                            : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                    <BookText size={20} />
                    <span>Notes</span>
                    {activeTab === 'notes' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('map')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${
                        activeTab === 'map'
                            ? 'text-blue-400'
                            : 'text-gray-400 hover:text-gray-300'
                    }`}
                >
                    <Network size={20} />
                    <span>Concept Map</span>
                    {activeTab === 'map' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : activeTab === 'notes' ? (
                <>
                    {/* Mobile: Toggle View */}
                    <div className="lg:hidden mb-4">
                        <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <button
                                onClick={() => setMobileView('editor')}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    mobileView === 'editor'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Editor
                            </button>
                            <button
                                onClick={() => setMobileView('list')}
                                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    mobileView === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                Notes ({notes.length})
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 h-[calc(100vh-16rem)] lg:h-[calc(100vh-16rem)]">
                        {/* Left Column: Editor */}
                        <div className={`h-full ${mobileView === 'editor' ? 'block' : 'hidden lg:block'}`}>
                            <InlineNoteEditor
                                note={currentNote}
                                availableTasks={tasks}
                                onSave={handleNoteSaved}
                                onClear={handleClearEditor}
                            />
                        </div>

                        {/* Right Column: Note List Sidebar */}
                        <div className={`h-full overflow-hidden ${mobileView === 'list' ? 'block' : 'hidden lg:block'}`}>
                            <NoteList 
                                initialNotes={notes} 
                                availableTasks={tasks}
                                onNotesChange={loadData}
                                onNoteSelect={handleNoteSelect}
                                currentNoteId={currentNote?.id}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <ConceptMap 
                    notes={notes}
                    connections={connections}
                />
            )}
        </div>
    )
}
