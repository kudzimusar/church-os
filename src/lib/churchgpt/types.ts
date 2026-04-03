export interface ChurchGPTMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  scriptureRefs?: string[]
}

export interface ChurchGPTContext {
  orgContext?: {
    id: string
    name: string
    settings?: Record<string, any>
  }
  memberProfile?: {
    id: string
    full_name: string
    role?: string
    spiritual_notes?: string
  }
  sessionType?: ChurchGPTSessionType
}

export type ChurchGPTSessionType =
  | 'general'
  | 'devotional'
  | 'pastoral'
  | 'apologetics'
  | 'admin'
  | 'prayer'
  | 'bible-study'
  | 'visitor'

export interface ChurchGPTSession {
  id: string
  messages: ChurchGPTMessage[]
  sessionType: ChurchGPTSessionType
  createdAt: Date
}
