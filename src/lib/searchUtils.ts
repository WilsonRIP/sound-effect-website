import { SoundEffect } from "../app/components/SoundCard";

/**
 * Calculate the relevance score of a sound effect based on search term matches
 * 
 * @param sound - The sound effect to score
 * @param searchTerm - The search term to match against
 * @returns A relevance score (higher is better match)
 */
export function calculateRelevance(sound: SoundEffect, searchTerm: string): number {
  const term = searchTerm.toLowerCase().trim();
  const name = sound.name.toLowerCase();
  const category = sound.category.toLowerCase();
  const description = sound.description.toLowerCase();
  
  let score = 0;
  
  // Exact name match (highest priority)
  if (name === term) {
    score += 100;
  }
  // Name starts with the term
  else if (name.startsWith(term)) {
    score += 75;
  }
  // Name contains the term
  else if (name.includes(term)) {
    score += 50;
  }
  
  // Category matches (medium priority)
  if (category === term) {
    score += 30;
  }
  else if (category.includes(term)) {
    score += 20;
  }
  
  // Description contains the term (lower priority)
  if (description.includes(term)) {
    score += 10;
  }
  
  // Word boundary matches (bonus points)
  const words = name.split(/\s+/);
  for (const word of words) {
    if (word === term) {
      score += 15; // Exact word match
    } else if (word.startsWith(term)) {
      score += 10; // Word starts with term
    }
  }
  
  return score;
}

/**
 * Search for sound effects matching the search term
 * 
 * @param sounds - Array of sound effects to search through
 * @param searchTerm - The term to search for
 * @param categoryFilter - Optional category to filter by
 * @param exactMatch - Whether to require exact matching
 * @returns Array of matching sound effects sorted by relevance
 */
export function searchSoundEffects(
  sounds: SoundEffect[], 
  searchTerm: string,
  categoryFilter: string = "All",
  exactMatch: boolean = false
): SoundEffect[] {
  // Return all sounds if no search term
  if (!searchTerm.trim()) {
    return categoryFilter === "All" 
      ? sounds 
      : sounds.filter(sound => sound.category === categoryFilter);
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  // Filter sounds based on search criteria
  const filteredSounds = sounds.filter(sound => {
    // Apply category filter if specified
    if (categoryFilter !== "All" && sound.category !== categoryFilter) {
      return false;
    }
    
    const name = sound.name.toLowerCase();
    const category = sound.category.toLowerCase();
    const description = sound.description.toLowerCase();
    
    if (exactMatch) {
      // For exact matching, check if the term appears exactly as is
      return name === term || 
             category === term || 
             description.includes(term);
    } else {
      // For partial matching
      return name.includes(term) || 
             category.includes(term) || 
             description.includes(term);
    }
  });
  
  // Sort results by relevance score
  return filteredSounds.sort((a, b) => {
    const scoreA = calculateRelevance(a, term);
    const scoreB = calculateRelevance(b, term);
    return scoreB - scoreA; // Higher score first
  });
}

/**
 * Get search suggestions based on a partial search term
 * 
 * @param sounds - Array of sound effects to generate suggestions from
 * @param partialTerm - The partial search term
 * @param limit - Maximum number of suggestions to return
 * @returns Array of sound effects as suggestions
 */
export function getSearchSuggestions(
  sounds: SoundEffect[],
  partialTerm: string,
  limit: number = 5
): SoundEffect[] {
  if (!partialTerm.trim()) {
    return [];
  }
  
  // Get all matches sorted by relevance
  const matches = searchSoundEffects(sounds, partialTerm);
  
  // Return top N results
  return matches.slice(0, limit);
} 