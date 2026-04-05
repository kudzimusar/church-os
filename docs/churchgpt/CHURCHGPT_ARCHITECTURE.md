# ChurchGPT — Technical Architecture & Gemini Integration Spec
**Church OS Layer | Version 1.0**

---

## 1. Architecture Overview

ChurchGPT is implemented as a **fine-tuned / system-prompted Gemini model layer** integrated into the Church OS Next.js application. The architecture mirrors the Apple Intelligence + Gemini approach: a base model (Gemini) is given deep, structured context about its identity, purpose, and knowledge domain, and then exposed through a purpose-built UI that is deeply integrated into the host application.

```
┌─────────────────────────────────────────────────────────┐
│                    Church OS (Next.js)                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │               ChurchGPT UI Layer                   │  │
│  │  ChurchGPTChat.tsx | ChurchGPTWidget.tsx           │  │
│  │  useChruchGPT hook | ChurchGPTProvider             │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │           ChurchGPT API Route                      │  │
│  │  /app/api/churchgpt/route.ts                       │  │
│  │  - Injects system prompt (Identity + Knowledge)    │  │
│  │  - Injects org context (JKC member data)           │  │
│  │  - Manages conversation history                    │  │
│  │  - Logs interactions to Supabase                   │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │         Supabase Edge Function (optional)           │  │
│  │  churchgpt-gateway (for server-side only flows)    │  │
│  └──────────────────────┬─────────────────────────────┘  │
└───────────────────────────────────────────────────────── ┘
                          │
          ┌───────────────▼────────────────┐
          │   Google AI Studio / Gemini    │
          │   Model: gemini-2.5-flash      │
          │   Context Window: 1M tokens    │
          │   System Instruction: Full     │
          │   ChurchGPT Constitution       │
          └────────────────────────────────┘
```

---

## 2. Model Strategy — Gemini as ChurchGPT's Brain

### 2.1 Why Gemini
- Church OS already uses `gemini-2.5-flash` (confirmed working API key)
- Google AI Studio allows System Instructions — this is the primary mechanism for ChurchGPT's identity
- Gemini's 1M token context window allows injecting the full theological knowledge base + conversation history
- No additional API costs beyond existing Gemini usage
- Same SDK, same patterns as existing AI worker

### 2.2 The Apple Intelligence Approach Applied Here
Apple Intelligence with Gemini works by:
1. Sending user requests to Gemini with rich contextual framing from Apple's on-device layer
2. Apple's system instructions define how Gemini should behave for Apple's context
3. The underlying model capability is Gemini's — the "intelligence" of the product comes from the framing

ChurchGPT does the same:
1. Every request to Gemini includes the **ChurchGPT System Prompt** (identity + constitution)
2. Relevant **church context** is injected (member profile, org data, recent activity)
3. Gemini's intelligence + ChurchGPT's framing = a purpose-built Christian AI

### 2.3 Future: Google AI Studio Fine-Tuning
Once usage patterns are established, ChurchGPT can be improved through:
- **Tuned Models in AI Studio**: Upload training examples (question → ideal ChurchGPT response pairs) to fine-tune a base Gemini model
- Training data format: JSONL pairs of user messages and ideal Christian-aligned responses
- The fine-tuned model is hosted by Google, called via API just like the base model
- This is the path to a ChurchGPT model that genuinely "knows" Christian content at the weights level

---

## 3. System Prompt Architecture

The ChurchGPT system prompt is assembled dynamically per request from:

```typescript
// /lib/churchgpt/buildSystemPrompt.ts

export function buildChurchGPTSystemPrompt(context?: ChurchGPTContext): string {
  return [
    CHURCHGPT_CORE_IDENTITY,      // Who ChurchGPT is (from CHURCHGPT_IDENTITY.md)
    CHURCHGPT_THEOLOGY,           // Doctrinal positions
    CHURCHGPT_BEHAVIOURAL_RULES,  // How to handle sin, other religions, etc.
    CHURCHGPT_KNOWLEDGE_BASE,     // Key biblical knowledge, apologetics primers
    context?.orgContext   ? buildOrgContext(context.orgContext)     : '',
    context?.memberProfile? buildMemberContext(context.memberProfile): '',
    context?.sessionType  ? buildSessionContext(context.sessionType) : '',
  ].filter(Boolean).join('\n\n---\n\n')
}
```

### 3.1 System Prompt Layers

| Layer | Content | Size (est.) |
|-------|---------|-------------|
| Core Identity | Who ChurchGPT is, mission mandate | ~500 tokens |
| Theological Constitution | Doctrines, positions, charity areas | ~800 tokens |
| Behavioural Rules | Tone, sin handling, response patterns | ~600 tokens |
| Knowledge Primers | Biblical summaries, apologetics, key arguments | ~3,000 tokens |
| Org Context | Church name, pastor, current sermon series | ~200 tokens |
| Member Context | Name, spiritual journey notes, recent activity | ~300 tokens |
| Session Type | What mode: devotional, general, counselling, admin | ~100 tokens |

**Total: ~5,500 tokens** — well within Gemini's limits, leaves massive room for conversation history.

---

## 4. File & Folder Structure

```
/app
  /api
    /churchgpt
      route.ts                    # Main API endpoint
      
/components
  /churchgpt
    ChurchGPTChat.tsx             # Full chat interface (standalone page)
    ChurchGPTWidget.tsx           # Floating widget (embedded in all pages)
    ChurchGPTMessage.tsx          # Individual message bubble
    ChurchGPTInput.tsx            # Input bar with send button
    ChurchGPTSuggestions.tsx      # Suggested prompts on empty state
    ChurchGPTPrayer.tsx           # Prayer mode UI variant
    ChurchGPTScripture.tsx        # Scripture card component
    
/lib
  /churchgpt
    buildSystemPrompt.ts          # Dynamic system prompt assembler
    theology.const.ts             # CHURCHGPT_THEOLOGY string constant
    identity.const.ts             # CHURCHGPT_CORE_IDENTITY string constant
    behaviouralRules.const.ts     # CHURCHGPT_BEHAVIOURAL_RULES string
    knowledgeBase.const.ts        # CHURCHGPT_KNOWLEDGE_BASE string
    sessionTypes.ts               # Session type definitions
    types.ts                      # ChurchGPT TypeScript types
    
/hooks
  useChurchGPT.ts                 # React hook for chat state management
  
/app
  /(member)
    /churchgpt
      page.tsx                    # Dedicated ChurchGPT page
```

---

## 5. API Route Implementation

```typescript
// /app/api/churchgpt/route.ts

import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildChurchGPTSystemPrompt } from '@/lib/churchgpt/buildSystemPrompt'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionType, memberProfile } = await req.json()
    const supabase = await createClient()
    
    // Get org context
    const { data: org } = await supabase
      .from('organizations')
      .select('name, settings')
      .eq('id', process.env.NEXT_PUBLIC_ORG_ID!)  // use org-resolver in production
      .single()

    // Build system prompt
    const systemPrompt = buildChurchGPTSystemPrompt({
      orgContext: org,
      memberProfile,
      sessionType: sessionType || 'general'
    })
    
    // Initialize model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      }
    })
    
    // Build chat history (all messages except the last)
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }))
    
    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1]
    
    // Stream response
    const result = await chat.sendMessageStream(lastMessage.content)
    
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          controller.enqueue(new TextEncoder().encode(text))
        }
        controller.close()
      }
    })
    
    // Log interaction to Supabase (fire and forget)
    logChurchGPTInteraction(supabase, {
      orgId: org?.id,
      memberProfile,
      sessionType,
      messageCount: messages.length,
    }).catch(console.error)
    
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
    
  } catch (error) {
    console.error('ChurchGPT API error:', error)
    return NextResponse.json(
      { error: 'ChurchGPT is momentarily unavailable. Please try again.' },
      { status: 500 }
    )
  }
}

async function logChurchGPTInteraction(supabase: any, meta: any) {
  await supabase.from('churchgpt_interactions').insert({
    org_id: meta.orgId,
    member_id: meta.memberProfile?.id,
    session_type: meta.sessionType,
    message_count: meta.messageCount,
    created_at: new Date().toISOString()
  })
}
```

---

## 6. React Hook

```typescript
// /hooks/useChurchGPT.ts

import { useState, useCallback } from 'react'

export interface ChurchGPTMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  scriptureRefs?: string[]  // extracted scripture references for highlighting
}

export function useChurchGPT(sessionType?: string) {
  const [messages, setMessages] = useState<ChurchGPTMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChurchGPTMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    
    const assistantMessage: ChurchGPTMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, assistantMessage])
    
    try {
      const response = await fetch('/api/churchgpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          sessionType
        })
      })
      
      if (!response.ok) throw new Error('ChurchGPT request failed')
      
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        fullContent += chunk
        setMessages(prev => prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: fullContent }
            : m
        ))
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setMessages(prev => prev.filter(m => m.id !== assistantMessage.id))
    } finally {
      setIsLoading(false)
    }
  }, [messages, sessionType])

  const clearConversation = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])
  
  return { messages, isLoading, error, sendMessage, clearConversation }
}
```

---

## 7. Supabase Schema

```sql
-- ChurchGPT conversation logging table
CREATE TABLE churchgpt_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_type TEXT DEFAULT 'general',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for org-scoped analytics
CREATE INDEX idx_churchgpt_interactions_org ON churchgpt_interactions(org_id, created_at DESC);

-- RLS: org members can see their own, admins see all
ALTER TABLE churchgpt_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see own interactions"
  ON churchgpt_interactions FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Admins see org interactions"
  ON churchgpt_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_id = churchgpt_interactions.org_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'pastor', 'leader')
    )
  );

CREATE POLICY "API can insert interactions"
  ON churchgpt_interactions FOR INSERT
  WITH CHECK (true); -- controlled at API route level
```

---

## 8. Environment Variables

```bash
# Required (already exists in Church OS)
GEMINI_API_KEY=your_gemini_api_key_here

# ChurchGPT-specific (optional feature flags)
CHURCHGPT_ENABLED=true
CHURCHGPT_MODEL=gemini-2.5-flash
CHURCHGPT_MAX_HISTORY=20          # max messages to send in context
CHURCHGPT_STREAM=true
```

---

## 9. Session Types

ChurchGPT adapts its behaviour based on the session context:

| Session Type | Trigger | Behaviour |
|---|---|---|
| `general` | Default | Full capability, Christian lens |
| `devotional` | Morning devotion page | Focuses on Scripture, reflection, prayer |
| `pastoral` | Pastoral care module | Softer tone, encourages human pastoral follow-up |
| `apologetics` | Debate/study mode | Sharper, more argumentative, cites evidence |
| `admin` | Pastor/leader tools | Business-like, planning focused |
| `prayer` | Prayer request flow | Leads with prayer, minimal chit-chat |
| `bible-study` | Bible study module | Exegetical, commentary-style |
| `visitor` | Visitor/seeker context | Extra warm, evangelistic, minimal assumed knowledge |

---

## 10. Static Export Compatibility

Church OS deploys as a static export to GitHub Pages. This means:

- **The `/api/churchgpt/route.ts` API route will NOT work in static export**
- **Solution**: The ChurchGPT API route must be deployed as a **Supabase Edge Function** (`churchgpt-gateway`)
- The Next.js frontend calls the Edge Function URL directly
- This mirrors the pattern already used by other AI features in Church OS

```typescript
// In production (static export), call Edge Function instead
const CHURCHGPT_ENDPOINT = process.env.NODE_ENV === 'production'
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/churchgpt-gateway`
  : '/api/churchgpt'
```

The Edge Function uses the same logic as the API route but runs on Supabase's Deno runtime.

---

*Architecture Owner: Kudzie (Church OS Lead)*
*Implementation: Antigravity (Gemini-based coding agent)*
