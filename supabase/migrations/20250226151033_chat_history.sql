CREATE TABLE chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID, -- Removed REFERENCES auth.users(id) to avoid cascade
  assistant_name TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Add an index for performance (optional)
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);


CREATE POLICY "Users can read their own chat history"
ON chat_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own chat history"
ON chat_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;