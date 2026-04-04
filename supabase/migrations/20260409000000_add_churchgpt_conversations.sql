CREATE TABLE churchgpt_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  title TEXT DEFAULT 'New Conversation',
  session_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE churchgpt_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES churchgpt_conversations(id)
    ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cgpt_convos_user
  ON churchgpt_conversations(user_id, updated_at DESC);
CREATE INDEX idx_cgpt_messages_convo
  ON churchgpt_messages(conversation_id, created_at ASC);

ALTER TABLE churchgpt_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE churchgpt_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations"
  ON churchgpt_conversations FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own messages"
  ON churchgpt_messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM churchgpt_conversations
      WHERE user_id = auth.uid()
    )
  );
