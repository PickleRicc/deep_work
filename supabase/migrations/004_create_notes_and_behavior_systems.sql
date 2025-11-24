-- Create Notes and Behavior Tracking Systems
-- Migration: 004_create_notes_and_behavior_systems.sql

-- =====================================================
-- NOTES SYSTEM
-- =====================================================

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT, -- 'book', 'podcast', 'idea', 'general', etc.
  source_name TEXT, -- Name of book/podcast if applicable
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note tags (many-to-many)
CREATE TABLE note_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL, -- 'project', 'concept', 'person', 'custom'
  tag_value TEXT NOT NULL, -- The actual tag (project id, concept name, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(note_id, tag_type, tag_value)
);

-- Concept connections (AI-generated)
CREATE TABLE concept_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id_1 UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  note_id_2 UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  connection_strength FLOAT, -- 0-1 score from Claude
  shared_concepts TEXT[], -- Array of shared concepts/themes
  ai_explanation TEXT, -- Claude's explanation of connection
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (note_id_1 < note_id_2) -- Ensure no duplicates
);

-- Indexes for notes system
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(user_id, created_at DESC);
CREATE INDEX idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX idx_note_tags_tag ON note_tags(tag_type, tag_value);
CREATE INDEX idx_concept_connections_user ON concept_connections(user_id);
CREATE INDEX idx_concept_connections_notes ON concept_connections(note_id_1, note_id_2);

-- RLS Policies for notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view tags for their notes"
  ON note_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert tags for their notes"
  ON note_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tags for their notes"
  ON note_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM notes WHERE notes.id = note_tags.note_id AND notes.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own concept connections"
  ON concept_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own concept connections"
  ON concept_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own concept connections"
  ON concept_connections FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- BEHAVIOR TRACKING SYSTEM
-- =====================================================

-- Behavior tracking table
CREATE TABLE behaviors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  behavior_name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  is_rewarding BOOLEAN NOT NULL, -- true = rewards me, false = doesn't reward me
  category TEXT, -- 'health', 'work', 'relationships', 'finance', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Behavior check-ins (actual tracking)
CREATE TABLE behavior_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  behavior_id UUID NOT NULL REFERENCES behaviors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT true,
  outcome_notes TEXT, -- How did it feel? What was the reward/consequence?
  reward_score INTEGER, -- 1-10 rating of how rewarding it was
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(behavior_id, date)
);

-- Indexes for behavior system
CREATE INDEX idx_behaviors_user ON behaviors(user_id);
CREATE INDEX idx_behaviors_frequency ON behaviors(user_id, frequency, is_rewarding);
CREATE INDEX idx_behavior_checkins_behavior ON behavior_checkins(behavior_id);
CREATE INDEX idx_behavior_checkins_date ON behavior_checkins(user_id, date DESC);

-- RLS Policies for behaviors
ALTER TABLE behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own behaviors"
  ON behaviors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behaviors"
  ON behaviors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behaviors"
  ON behaviors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own behaviors"
  ON behaviors FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own behavior checkins"
  ON behavior_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own behavior checkins"
  ON behavior_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own behavior checkins"
  ON behavior_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own behavior checkins"
  ON behavior_checkins FOR DELETE
  USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE notes IS 'User notes with tagging for knowledge management';
COMMENT ON TABLE note_tags IS 'Tags for notes (projects, concepts, people, custom)';
COMMENT ON TABLE concept_connections IS 'AI-generated connections between notes';
COMMENT ON TABLE behaviors IS 'User behaviors to track (rewarding vs non-rewarding)';
COMMENT ON TABLE behavior_checkins IS 'Daily/weekly/monthly check-ins for behavior tracking';

