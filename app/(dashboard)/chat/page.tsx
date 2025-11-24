import ChatInterface from './chat-interface'

export default function ChatPage() {
    return (
        <div className="flex flex-col h-full px-4 md:px-8 lg:px-12 py-8">
            <div className="mb-6 max-w-4xl mx-auto w-full">
                <h1 className="text-4xl font-bold text-white">Claude Assistant</h1>
                <p className="text-gray-400 mt-1">AI-powered productivity assistant</p>
            </div>

            <div className="flex-1 max-w-4xl mx-auto w-full">
                <ChatInterface />
            </div>
        </div>
    )
}
