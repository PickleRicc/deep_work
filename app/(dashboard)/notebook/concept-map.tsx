'use client'

import { Note, ConceptConnection } from '@/lib/types/database'
import { Network, Sparkles } from 'lucide-react'

interface ConceptMapProps {
    notes: Note[]
    connections: ConceptConnection[]
}

export default function ConceptMap({ notes, connections }: ConceptMapProps) {
    if (notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                    <Network size={32} className="text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Notes Yet</h3>
                <p className="text-gray-400 max-w-md">
                    Start creating notes to see how your ideas connect. The AI will analyze your notes and build a concept map.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Coming Soon Banner */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                    <Sparkles size={24} className="text-blue-400" />
                    <h3 className="text-xl font-semibold text-white">AI-Powered Concept Mapping</h3>
                </div>
                <p className="text-gray-300">
                    Your concept map is being built. The AI analyzes connections between your notes, identifying shared themes, 
                    concepts, and ideas. This feature will visualize how your knowledge interconnects.
                </p>
            </div>

            {/* Text-based connections preview */}
            {connections.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Discovered Connections</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                        {connections.map((connection) => {
                            const note1 = notes.find(n => n.id === connection.note_id_1)
                            const note2 = notes.find(n => n.id === connection.note_id_2)
                            
                            if (!note1 || !note2) return null

                            return (
                                <div 
                                    key={connection.id}
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-blue-400 font-medium">
                                            {connection.connection_strength ? Math.round(connection.connection_strength * 100) : 0}% match
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm">
                                            <span className="text-gray-500">From: </span>
                                            <span className="text-white">{note1.title}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-gray-500">To: </span>
                                            <span className="text-white">{note2.title}</span>
                                        </div>
                                    </div>
                                    {connection.shared_concepts && connection.shared_concepts.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {connection.shared_concepts.map((concept, idx) => (
                                                <span 
                                                    key={idx}
                                                    className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                >
                                                    {concept}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

