import { ChurchGPTMessage as IChurchGPTMessage } from "@/lib/churchgpt/types"
import ReactMarkdown from 'react-markdown'
import { Card } from "@/components/ui/card"

export function ChurchGPTMessage({ message }: { message: IChurchGPTMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="flex-shrink-0 mr-4 mt-1">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1b3a6b] text-white shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M8 8h8" />
              </svg>
            </div>
          </div>
        )}
        
        <Card className={`px-5 py-4 ${
          isUser 
            ? 'bg-[#1b3a6b] text-white border-transparent' 
            : 'bg-[#fcfbf9] text-gray-800 border-[#f5a623]/30 shadow-sm'
        }`}>
          {message.content === '' ? (
            <div className="flex items-center space-x-1 h-6">
              <div className="w-2 h-2 rounded-full bg-[#f5a623] animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-[#f5a623] animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-[#f5a623] animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
