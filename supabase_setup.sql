-- Create the sound_effects table
CREATE TABLE sound_effects (
  id integer PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  file text NOT NULL,
  icon_type text NOT NULL,
  icon_content text NOT NULL,
  icon_color text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sound_effects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with type casting for UUID to text
CREATE POLICY "Users can view their own sound effects" ON sound_effects
FOR SELECT USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert their own sound effects" ON sound_effects
FOR INSERT WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own sound effects" ON sound_effects
FOR UPDATE USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can delete their own sound effects" ON sound_effects
FOR DELETE USING (auth.uid()::text = user_id OR auth.uid() IS NULL);

-- Add comment to the table for documentation
COMMENT ON TABLE sound_effects IS 'Stores custom sound effects for users across devices'; 