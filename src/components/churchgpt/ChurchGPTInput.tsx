import { useState, KeyboardEvent, useRef } from "react"
import { Send, Mic } from "lucide-react"

interface ChurchGPTInputProps {
  onSend: (message: string, sessionType: string) => void
  disabled?: boolean
  sessionType: string
  setSessionType: (v: string) => void
}

export function ChurchGPTInput({ onSend, disabled, sessionType, setSessionType }: ChurchGPTInputProps) {
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (content.trim() && !disabled) {
      onSend(content.trim(), sessionType)
      setContent("")
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-[#f5a623] focus-within:border-transparent transition-all">
      <div className="absolute opacity-[0.03] pointer-events-none right-4 bottom-4">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M8 8h8" />
        </svg>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Ask ChurchGPT anything..."
        className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-gray-800 focus:outline-none min-h-[60px] relative z-10"
        rows={1}
        disabled={disabled}
      />
      <div className="flex justify-between items-center px-4 pb-3 pt-2 bg-white relative z-10">
        <div className="flex items-center space-x-2">
          <select 
            value={sessionType}
            onChange={e => setSessionType(e.target.value)}
            disabled={disabled}
            className="text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1b3a6b]"
          >
            <option value="general">General</option>
            <option value="devotional">Devotional</option>
            <option value="prayer">Prayer</option>
            <option value="bible-study">Bible Study</option>
            <option value="apologetics">Apologetics</option>
            <option value="admin">Admin</option>
            <option value="pastoral">Pastoral</option>
            <option value="visitor">Visitor</option>
          </select>
          <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors" disabled={disabled}>
            <Mic className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className="bg-[#1b3a6b] text-white p-2.5 rounded-xl hover:bg-[#152e55] disabled:opacity-50 disabled:hover:bg-[#1b3a6b] transition-colors flex shrink-0 items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
