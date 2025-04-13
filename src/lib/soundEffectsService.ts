import { SoundEffect } from '../app/components/SoundCard';
import { supabase, SupabaseSoundEffect } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import React from 'react';

// Convert SoundEffect to format suitable for Supabase
export const toSupabaseFormat = (sound: SoundEffect, userId: string): Omit<SupabaseSoundEffect, 'created_at'> => {
  return {
    id: sound.id,
    user_id: userId,
    name: sound.name,
    category: sound.category,
    description: sound.description,
    file: sound.file,
    icon_type: sound.icon.type,
    icon_content: sound.icon.type === 'svg' && typeof sound.icon.content !== 'string' 
      ? 'DEFAULT_SVG' 
      : String(sound.icon.content || ''),
    icon_color: sound.icon.color || '',
  };
};

// Convert from Supabase format to SoundEffect
export const fromSupabaseFormat = (supabaseSound: SupabaseSoundEffect): SoundEffect => {
  // Handle the SVG icon content
  let iconContent: string | React.ReactElement = supabaseSound.icon_content;
  
  if (supabaseSound.icon_type === 'svg' && supabaseSound.icon_content === 'DEFAULT_SVG') {
    iconContent = React.createElement('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      children: [
        React.createElement('circle', {
          key: 'circle',
          cx: '12',
          cy: '12',
          r: '10'
        }),
        React.createElement('path', {
          key: 'path1',
          d: 'M12 8v8'
        }),
        React.createElement('path', {
          key: 'path2',
          d: 'M8 12h8'
        })
      ]
    });
  }

  return {
    id: supabaseSound.id,
    name: supabaseSound.name,
    category: supabaseSound.category,
    description: supabaseSound.description,
    file: supabaseSound.file,
    icon: {
      type: supabaseSound.icon_type as 'svg',
      content: iconContent,
      color: supabaseSound.icon_color,
    },
  };
};

// Get user ID from session or generate anonymous ID
export const getUserId = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user?.id) {
    return session.user.id;
  }
  
  // For anonymous users, get or create a UUID stored in localStorage
  let anonymousId = localStorage.getItem('anonymousUserId');
  if (!anonymousId) {
    anonymousId = uuidv4();
    localStorage.setItem('anonymousUserId', anonymousId);
  }
  
  return anonymousId;
};

// Fetch sound effects for the current user
export const fetchSoundEffects = async (): Promise<SoundEffect[]> => {
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('sound_effects')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching sound effects:', error);
    return [];
  }
  
  return data ? data.map((item: SupabaseSoundEffect) => fromSupabaseFormat(item)) : [];
};

// Fetch all unique categories from the user's sound effects in Supabase
export const fetchCategories = async (): Promise<string[]> => {
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('sound_effects')
    .select('category')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  
  // Extract unique categories
  const categories = data ? [...new Set(data.map(item => item.category))] : [];
  return categories;
};

// Save a sound effect
export const saveSoundEffect = async (sound: SoundEffect): Promise<boolean> => {
  const userId = await getUserId();
  const supabaseSound = toSupabaseFormat(sound, userId);
  
  const { error } = await supabase
    .from('sound_effects')
    .upsert(supabaseSound, { onConflict: 'id' });
    
  if (error) {
    console.error('Error saving sound effect:', error);
    return false;
  }
  
  return true;
};

// Delete a sound effect
export const deleteSoundEffect = async (soundId: number): Promise<boolean> => {
  const userId = await getUserId();
  
  const { error } = await supabase
    .from('sound_effects')
    .delete()
    .match({ id: soundId, user_id: userId });
    
  if (error) {
    console.error('Error deleting sound effect:', error);
    return false;
  }
  
  return true;
};

// Save multiple sound effects (for bulk operations)
export const saveSoundEffects = async (sounds: SoundEffect[]): Promise<boolean> => {
  const userId = await getUserId();
  const supabaseSounds = sounds.map(sound => toSupabaseFormat(sound, userId));
  
  const { error } = await supabase
    .from('sound_effects')
    .upsert(supabaseSounds, { onConflict: 'id' });
    
  if (error) {
    console.error('Error saving sound effects:', error);
    return false;
  }
  
  return true;
}; 