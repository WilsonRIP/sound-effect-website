import { createClient } from '@supabase/supabase-js';

// These should be replaced with actual values from your Supabase project
// You should create a .env.local file with these values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type for sound effect in Supabase
export type SupabaseSoundEffect = {
  id: number;
  user_id: string;
  name: string;
  category: string;
  description: string;
  file: string;
  icon_type: string;
  icon_content: string;
  icon_color: string;
  created_at?: string;
}; 