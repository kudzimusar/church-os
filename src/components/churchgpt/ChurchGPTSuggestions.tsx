import { BookOpen } from "lucide-react"

interface ChurchGPTSuggestionsProps {
  onSelect: (prompt: string) => void;
}

export function ChurchGPTSuggestions({ onSelect }: ChurchGPTSuggestionsProps) {
  const suggestions = [
    "Help me understand John 3:16 more deeply",
    "I'm struggling with doubt — what does the Bible say?",
    "Write a prayer for my family",
    "What does Christianity say about suffering?",
    "I want to read the Bible but don't know where to start",
    "Help me prepare a short devotional"
  ]

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4">
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4 text-[#f5a623]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M8 8h8" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-[#1b3a6b]">How can I help you today?</h2>
        <p className="text-gray-500 mt-2">Choose a suggestion below or type your own message.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="flex items-start text-left p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-[#f5a623] transition-all"
          >
            <BookOpen className="text-[#f5a623] w-5 h-5 shrink-0 mt-0.5 mr-3" />
            <span className="text-sm text-gray-700">{s}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
