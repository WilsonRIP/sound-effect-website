"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'react-feather';
import { SoundEffect } from './SoundCard';
import { getSearchSuggestions } from '../../lib/searchUtils';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  allSoundEffects: SoundEffect[];
  onSelectSound?: (sound: SoundEffect) => void;
  categoryFilter?: string;
}

export default function SearchBar({ 
  searchTerm, 
  onSearchChange, 
  allSoundEffects,
  onSelectSound,
  categoryFilter = "All"
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SoundEffect[]>([]);
  const [exactMatch, setExactMatch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Add keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Escape to clear search and blur
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        onSearchChange('');
        searchInputRef.current?.blur();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSearchChange]);

  // Update suggestions when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }

    // Use the new search utility to get suggestions
    const searchResults = getSearchSuggestions(
      allSoundEffects,
      searchTerm,
      5
    );
    
    setSuggestions(searchResults);
  }, [searchTerm, allSoundEffects, categoryFilter, exactMatch]);

  const handleClear = () => {
    onSearchChange('');
    searchInputRef.current?.focus();
  };

  const handleSuggestionClick = (sound: SoundEffect) => {
    if (onSelectSound) {
      onSelectSound(sound);
    } else {
      onSearchChange(sound.name);
    }
    setSuggestions([]);
  };

  const toggleExactMatch = () => {
    setExactMatch(!exactMatch);
  };

  return (
    <div className="search-container">
      <div className={`search-input-wrapper ${isFocused ? 'focused' : ''}`}>
        <Search size={18} className="search-icon" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search sounds..."
          className="search-input"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
        {searchTerm && (
          <button 
            className="clear-button" 
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        <button 
          className={`exact-match-button ${exactMatch ? 'active' : ''}`}
          onClick={toggleExactMatch}
          title={exactMatch ? "Using exact match" : "Using fuzzy match"}
        >
          <span>"</span>
        </button>
        <div className="search-shortcut">
          <kbd>Ctrl</kbd> + <kbd>K</kbd>
        </div>
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map(sound => (
            <div 
              key={sound.id} 
              className="suggestion-item"
              onClick={() => handleSuggestionClick(sound)}
            >
              <div className="suggestion-name">{sound.name}</div>
              <div className="suggestion-category">{sound.category}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 