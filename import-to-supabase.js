// Import sound effects from JSON file to Supabase
// Usage: node import-to-supabase.js sound-effects-export.json

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env.local file');
  console.error('Please make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Get JSON file path from command line argument
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('Error: No JSON file specified');
  console.error('Usage: node import-to-supabase.js sound-effects-export.json');
  process.exit(1);
}

async function importSoundEffects() {
  try {
    // Read the JSON file
    const data = fs.readFileSync(jsonFilePath, 'utf8');
    const soundEffects = JSON.parse(data);
    
    if (!Array.isArray(soundEffects)) {
      throw new Error('Invalid JSON format: Expected an array of sound effects');
    }
    
    console.log(`Found ${soundEffects.length} sound effects to import`);
    
    // Generate a user ID for these sound effects
    // Note: You can change this to a specific ID if you want
    const userId = 'imported-' + Date.now();
    
    // Convert sound effects to Supabase format
    const supabaseSoundEffects = soundEffects.map(sound => ({
      id: sound.id,
      user_id: userId,
      name: sound.name,
      category: sound.category,
      description: sound.description || '',
      file: sound.file,
      icon_type: sound.icon.type,
      icon_content: sound.icon.type === 'svg' && typeof sound.icon.content !== 'string' 
        ? 'DEFAULT_SVG' 
        : String(sound.icon.content || ''),
      icon_color: sound.icon.color || ''
    }));
    
    // Insert sound effects into Supabase
    const { data: result, error } = await supabase
      .from('sound_effects')
      .upsert(supabaseSoundEffects);
      
    if (error) {
      throw error;
    }
    
    console.log(`Successfully imported ${soundEffects.length} sound effects to Supabase!`);
    console.log(`User ID assigned: ${userId}`);
    console.log('Make sure to update your anonymous user ID in the app to access these sound effects:');
    console.log(`localStorage.setItem('anonymousUserId', '${userId}');`);
    
  } catch (error) {
    console.error('Error importing sound effects:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

// Run the import
importSoundEffects(); 