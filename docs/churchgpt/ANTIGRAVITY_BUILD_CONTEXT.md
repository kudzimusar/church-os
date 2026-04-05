# ChurchGPT — Antigravity Build Context
**Implementation Guide for the Coding Agent**
**Read CHURCHGPT_IDENTITY.md and CHURCHGPT_ARCHITECTURE.md first.**

---

## Mission

You are building ChurchGPT — the AI conversational layer for Church OS. This is a full-capability LLM chat experience (like Claude, Gemini, ChatGPT) that is purpose-built for a Christian audience. It uses the Gemini API (already integrated in this codebase) as its intelligence layer.

**Build everything in one continuous pass. Do not stop for approval between steps unless you hit a genuine blocker (missing env var, schema conflict, etc.).**

---

## Pre-Build Checklist

Before writing a single line, confirm:
- [ ] `GEMINI_API_KEY` is in `.env.local` (it is — already used by ai-worker)
- [ ] `@google/generative-ai` is in `package.json` (it is — already installed)
- [ ] Supabase client patterns from existing files (use same `createClient` import paths)
- [ ] Nav/routing patterns (study existing member routes before adding new ones)
- [ ] The org-resolver module exists and is the correct way to get org_id — use it, never hardcode `fa547adf-f820-412f-9458-d6bade11517d`

---

## Build Order

Follow this exact sequence. Each step builds on the previous.

---

### STEP 1 — TypeScript Types & Constants

**Create `/lib/churchgpt/types.ts`**

```typescript
export interface ChurchGPTMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
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
```

**Create `/lib/churchgpt/identity.const.ts`**

This file contains the CORE IDENTITY string that becomes ChurchGPT's system prompt. It must capture:

1. Who ChurchGPT is (Christian AI, part of Church OS)
2. The Mission: spreading Christianity, building up the Church
3. Core doctrines it holds and defends (Trinity, Incarnation, Atonement, Resurrection, Scripture, Salvation by grace, the Church, Second Coming)
4. Behavioural rules:
   - Warm, encouraging, pastoral tone always
   - On sin: speak truth in love, never condemn the person, always point toward Scripture and transformation
   - Actively encourage Bible reading (cite specific passages), prayer, church attendance
   - Engage all topics (coding, math, writing, business) with full capability — but as a believer
   - Defend the faith. Never be neutral about Christ. Never pretend all religions are equally true.
   - Acknowledge Apocrypha and early church tradition as historically significant
   - On other religions: respectful, curious about the person, clear about the Gospel
   - On science: affirm valid science, do not require young-earth creationism
   - Never produce content that attacks/mocks Christianity
   - Never assist with occultism or spiritually harmful content
5. Tone examples (include 2-3 sample interaction starters)

Write this as a long, rich string — aim for 800–1200 words. This is the most important file in the entire ChurchGPT layer.

**Create `/lib/churchgpt/sessionModifiers.const.ts`**

A Record mapping each ChurchGPTSessionType to a short additional instruction string, e.g.:
- `devotional`: "The user is in devotional mode. Open with Scripture. Lead them toward quiet reflection and prayer. End with an invitation to pray."
- `pastoral`: "The user may be struggling. Be gentle. Ask caring questions. Remind them of God's love. Encourage them to speak with a pastor or trusted elder."
- `apologetics`: "The user wants to think and argue. Be intellectually rigorous. Cite evidence (historical, philosophical, archaeological, scientific). Be confident in defending the faith."
- `prayer`: "The user wants to pray. Lead with prayer. Offer to pray with them. Write prayers in first-person plural ('Lord, we ask...'). Keep responses focused on communion with God."
- `visitor`: "This may be a seeker or visitor unfamiliar with Christianity. Be especially warm and welcoming. Avoid jargon. Meet them where they are. Share the Gospel naturally."

**Create `/lib/churchgpt/buildSystemPrompt.ts`**

```typescript
import { CHURCHGPT_CORE_IDENTITY } from './identity.const'
import { SESSION_MODIFIERS } from './sessionModifiers.const'
import type { ChurchGPTContext } from './types'

export function buildChurchGPTSystemPrompt(context?: ChurchGPTContext): string {
  const parts: string[] = [CHURCHGPT_CORE_IDENTITY]
  
  if (context?.orgContext?.name) {
    parts.push(`You are deployed within ${context.orgContext.name}. Reference this church warmly when relevant.`)
  }
  
  if (context?.memberProfile?.full_name) {
    parts.push(`The member you are speaking with is ${context.memberProfile.full_name}.${
      context.memberProfile.spiritual_notes 
        ? ` Pastoral context: ${context.memberProfile.spiritual_notes}` 
        : ''
    } Use their name naturally in conversation.`)
  }
  
  const sessionType = context?.sessionType || 'general'
  const modifier = SESSION_MODIFIERS[sessionType]
  if (modifier) parts.push(modifier)
  
  return parts.join('\n\n')
}
```

---

### STEP 2 — Database Migration

**Create a new Supabase migration file** in the migrations folder:

```sql
-- Migration: add_churchgpt_interactions
-- Purpose: Log ChurchGPT usage per org for ministry analytics

CREATE TABLE IF NOT EXISTS churchgpt_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_type TEXT DEFAULT 'general',
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churchgpt_org_created 
  ON churchgpt_interactions(org_id, created_at DESC);

ALTER TABLE churchgpt_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see own churchgpt interactions"
  ON churchgpt_interactions FOR SELECT
  USING (member_id = auth.uid());

CREATE POLICY "Org admins see all churchgpt interactions"
  ON churchgpt_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = churchgpt_interactions.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('admin', 'pastor', 'leader')
    )
  );

CREATE POLICY "Service role can insert churchgpt interactions"
  ON churchgpt_interactions FOR INSERT
  WITH CHECK (true);
```

Apply this migration via Supabase CLI or the dashboard.

---

### STEP 3 — Supabase Edge Function: `churchgpt-gateway`

**Create `/supabase/functions/churchgpt-gateway/index.ts`**

This is the production AI endpoint (required because Church OS static export cannot use Next.js API routes in production).

Structure:
1. Import Gemini SDK (use `npm:@google/generative-ai`)
2. Import `buildChurchGPTSystemPrompt` logic (inline the function — Edge Functions can't import from `/lib`)
3. Import Supabase client for org context lookup and interaction logging
4. Handle CORS (same pattern as other Edge Functions in this codebase)
5. Accept POST with `{ messages, sessionType, orgId, memberProfile }`
6. Look up org name from Supabase using orgId (via supabaseAdmin)
7. Build system prompt
8. Call Gemini with streaming
9. Return streaming response
10. Log interaction (fire and forget)

**Inline the full `CHURCHGPT_CORE_IDENTITY` string in the Edge Function** — do not import from `/lib`. Copy it verbatim.

Add the cron schedule trigger comment at the top (though this function is HTTP-triggered, not cron):
```
// Endpoint: POST /functions/v1/churchgpt-gateway
// Auth: Bearer (Supabase anon key)
// No cron schedule — HTTP triggered per conversation turn
```

---

### STEP 4 — React Hook

**Create `/hooks/useChurchGPT.ts`**

Implement the hook exactly as specified in CHURCHGPT_ARCHITECTURE.md Section 6. Key requirements:
- State: `messages`, `isLoading`, `error`
- `sendMessage(content: string)` — streams response, updates assistant message in real-time
- `clearConversation()` — resets to empty
- Uses streaming (`response.body.getReader()`)
- The endpoint URL resolves to the Edge Function in production and `/api/churchgpt` in dev
- Include `sessionType` as a hook parameter

---

### STEP 5 — UI Components

#### 5a. ChurchGPT Empty State / Suggestions Component
**`/components/churchgpt/ChurchGPTSuggestions.tsx`**

Show when messages array is empty. Display 6 suggested prompts:
1. "Help me understand John 3:16 more deeply"
2. "I'm struggling with doubt — what does the Bible say?"
3. "Write a prayer for my family"
4. "What does Christianity say about suffering?"
5. "I want to read the Bible but don't know where to start"
6. "Help me prepare a short devotional"

Style: card grid with cross/Scripture icon accents. Church OS design system (navy `#1b3a6b`, gold `#f5a623`).

#### 5b. Message Component
**`/components/churchgpt/ChurchGPTMessage.tsx`**

Props: `message: ChurchGPTMessage`

- User messages: right-aligned, navy background, white text
- Assistant messages: left-aligned, cream/white background with subtle gold border, cross icon avatar
- Render markdown in assistant messages (use existing markdown renderer if available, otherwise use `dangerouslySetInnerHTML` with basic formatting)
- Loading indicator: animated gold dot pulse while streaming

#### 5c. Input Component
**`/components/churchgpt/ChurchGPTInput.tsx`**

- Textarea (auto-grows with content)
- Send button (Enter to send, Shift+Enter for newline)
- Session type selector (small dropdown: General / Devotional / Prayer / Apologetics / Bible Study)
- Mic icon placeholder (future voice input)
- Subtle cross watermark in textarea background

#### 5d. Full Chat Interface
**`/components/churchgpt/ChurchGPTChat.tsx`**

Full-page chat layout:
- Header: "ChurchGPT" + cross logo + subtitle "Your Christian AI Companion"
- Messages scroll area (auto-scroll to bottom on new message)
- Empty state (suggestions) when no messages
- Input bar at bottom
- "Clear conversation" button in header
- Responsive: works on mobile and desktop

#### 5e. Floating Widget (optional, build last)
**`/components/churchgpt/ChurchGPTWidget.tsx`**

A floating action button (bottom-right) that expands into a compact chat window. Can be embedded on any page of Church OS. Shows unread indicator. Gold cross icon for the FAB.

---

### STEP 6 — Page Route

**Create `/app/(member)/churchgpt/page.tsx`**

```typescript
import { ChurchGPTChat } from '@/components/churchgpt/ChurchGPTChat'

export const metadata = {
  title: 'ChurchGPT | Church OS',
  description: 'Your Christian AI Companion'
}

export default function ChurchGPTPage() {
  return <ChurchGPTChat sessionType="general" />
}
```

Add ChurchGPT to the member navigation:
- Icon: cross or Bible emoji or a small custom SVG
- Label: "ChurchGPT"
- Position: prominent — this is a flagship feature

---

### STEP 7 — Development API Route (Next.js)

**Create `/app/api/churchgpt/route.ts`**

This is the local dev endpoint (not used in production static export). Implement exactly as specified in CHURCHGPT_ARCHITECTURE.md Section 5.

Key requirements:
- Import `buildChurchGPTSystemPrompt` from `/lib/churchgpt/buildSystemPrompt`
- **CRITICAL**: Use `models/gemini-2.5-flash` model. NEVER use deprecated `1.5` versions.
- Use `startChat` with history for multi-turn conversations
- Stream the response
- Log to `churchgpt_interactions` (fire and forget)
- Use org-resolver for org_id (NOT the hardcoded GUID)

---

### STEP 8 — Navigation Integration

Find the member navigation component (likely in `/components/layout/` or `/app/(member)/layout.tsx`) and add ChurchGPT as a nav item. It should be near the top — this is a flagship feature, not buried in a menu.

---

### STEP 9 — Environment & Config

Add to `.env.local` (if not present):
```
CHURCHGPT_ENABLED=true
```

Add to any env documentation files.

---

### STEP 10 — Smoke Test

After all files are created:
1. Start the dev server
2. Navigate to `/churchgpt`
3. Send the message: "Who is Jesus?"
4. Confirm ChurchGPT responds with a biblically grounded, warm, doctrinally correct answer
5. Send: "Help me with a Python script to parse a CSV"
6. Confirm it helps with the code but perhaps with a brief acknowledgment of service/stewardship
7. Confirm streaming works (text appears token by token)

---

## Critical Rules (DO NOT BREAK)

1. **Never hardcode the org GUID** (`fa547adf-f820-412f-9458-d6bade11517d`) — always use org-resolver
2. **Never use `supabaseAdmin` on the client side** — only in Edge Functions or server-side routes
3. **The Edge Function is the production endpoint** — the Next.js API route is dev only
4. **`prophetic_insights` and `ai_ministry_insights` are separate tables** — never union them
5. **The CHURCHGPT_CORE_IDENTITY string is the soul of this feature** — write it with care. It should read like a mission statement, not a terms of service. It is the thing that makes ChurchGPT Christian, not just an AI that mentions Jesus.
6. **No ChurchGPT response should ever deny Christ, call Jesus merely a teacher, or imply all religions are equal** — the system prompt must make this impossible regardless of user prompt
7. **Streaming is required** — do not buffer and return full responses. Users expect the LLM typing effect.

---

## The Identity String — Most Important Implementation Note

The `CHURCHGPT_CORE_IDENTITY` constant in `/lib/churchgpt/identity.const.ts` is the most consequential file in this entire build. 

When writing it, imagine you are writing a letter from the founder of Church OS to every person who will ever talk to ChurchGPT. It should:
- Feel like talking to a wise, warm Christian friend
- Never sound like a corporate content policy
- Be written in first person ("I am ChurchGPT...")
- Include specific scriptural references ChurchGPT should draw on
- Describe the tone with examples, not just adjectives
- Include clear guidance on how to handle moments of doubt, sin, grief, questioning faith

This string, more than the UI or the architecture, is what makes ChurchGPT different from every other AI assistant ever built.

---

## Definition of Done

ChurchGPT is complete when:
- [ ] A member can open `/churchgpt` and have a full multi-turn conversation
- [ ] The AI is identifiably Christian in every response, even mundane ones
- [ ] Streaming works
- [ ] The Edge Function is deployed and the production endpoint is configured
- [ ] ChurchGPT appears in member navigation
- [ ] The `churchgpt_interactions` table logs usage
- [ ] No hardcoded org GUIDs anywhere in the new code

---

*"Go therefore and make disciples of all nations." — Matthew 28:19*
