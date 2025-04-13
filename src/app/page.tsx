"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Heart, Bookmark, X } from "react-feather";
import CustomIcon from "./components/CustomIcon";
import { SoundEffect } from "./components/SoundCard";
import Link from "next/link";
import { builtInSoundEffects } from "./data/soundEffects";
import { fetchSoundEffects, fetchCategories } from "../lib/soundEffectsService";
import SearchBar from "./components/SearchBar";
import { searchSoundEffects } from "../lib/searchUtils";

export default function Home() {
  const [filter, setFilter] = useState("All");
  const [theme, setTheme] = useState("system");
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SoundEffect | null>(null);
  const [allSoundEffects, setAllSoundEffects] =
    useState<SoundEffect[]>(builtInSoundEffects);
  const [isLoading, setIsLoading] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(allSoundEffects.map((sound) => sound.category)),
    ].filter(Boolean);
  }, [allSoundEffects]);

  // Use improved search functionality
  const filteredSounds = useMemo(() => {
    // First filter by favorites if needed
    let soundsToSearch = allSoundEffects;

    if (showFavoritesOnly) {
      soundsToSearch = allSoundEffects.filter((sound) =>
        favorites.includes(sound.id)
      );
    }

    // Then apply search filters
    return searchSoundEffects(soundsToSearch, searchTerm, filter, exactMatch);
  }, [
    allSoundEffects,
    searchTerm,
    filter,
    favorites,
    showFavoritesOnly,
    exactMatch,
  ]);

  useEffect(() => {
    // Load saved favorites
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    // Load sound effects and categories
    const loadSoundEffects = async () => {
      setIsLoading(true);

      // Create a new array with built-in sounds
      const mergedSounds = [...builtInSoundEffects];

      try {
        // Get custom sounds from Supabase
        console.log("Fetching sounds from Supabase...");
        const customSounds = await fetchSoundEffects();
        console.log("Supabase response:", customSounds);

        // Replace or add custom sounds
        customSounds.forEach((customSound) => {
          const existingIndex = mergedSounds.findIndex(
            (s) => s.id === customSound.id
          );
          if (existingIndex >= 0) {
            // Replace existing sound with custom version
            mergedSounds[existingIndex] = customSound;
          } else {
            // Add new custom sound
            mergedSounds.push(customSound);
          }
        });

        // Update the sounds state
        setAllSoundEffects(mergedSounds);

        // Fetch categories from Supabase
        const supabaseCategories = await fetchCategories();

        // Get categories from localStorage
        let localCategories: string[] = [];
        if (typeof window !== "undefined") {
          const savedCategories = localStorage.getItem("soundCategories");
          if (savedCategories) {
            try {
              const parsedCategories = JSON.parse(savedCategories);
              if (Array.isArray(parsedCategories)) {
                localCategories = parsedCategories;
              }
            } catch (e) {
              console.error("Error parsing saved categories:", e);
            }
          }
        }

        // Update categories using a callback to ensure it happens after sounds are updated
        // This will rebuild the categories automatically based on all sound effects
      } catch (error) {
        console.error("Error loading sounds from Supabase:", error);

        // Fallback to localStorage if Supabase fails
        const customSounds = localStorage.getItem("soundEffects");
        if (customSounds) {
          // Parse custom sounds and merge with built-in sounds
          const parsedSounds: SoundEffect[] = JSON.parse(customSounds);

          // Replace or add custom sounds
          parsedSounds.forEach((customSound) => {
            const existingIndex = mergedSounds.findIndex(
              (s) => s.id === customSound.id
            );
            if (existingIndex >= 0) {
              // Replace existing sound with custom version
              mergedSounds[existingIndex] = customSound;
            } else {
              // Add new custom sound
              mergedSounds.push(customSound);
            }
          });

          // Update the sounds state
          setAllSoundEffects(mergedSounds);
        } else {
          setAllSoundEffects(builtInSoundEffects);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSoundEffects();

    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to system if no preference saved
      applyTheme("system");
    }

    // Add event listener for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (theme === "system") {
        document.documentElement.setAttribute(
          "data-theme",
          mediaQuery.matches ? "dark" : "light"
        );
      }
    };

    // Apply initial system preference if in system mode
    if (theme === "system") {
      handleSystemThemeChange();
    }

    // Listen for system preference changes
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    // Add click outside handler for dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Keyboard event for search
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search - we'll handle this in the SearchBar component
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // No need to manually focus, SearchBar will handle this
      }

      // Escape to clear search - we'll handle this in the SearchBar component
      if (e.key === "Escape") {
        setSearchTerm("");
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [theme]);

  const applyTheme = (newTheme: string) => {
    if (newTheme === "system") {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        systemDark ? "dark" : "light"
      );
      document.documentElement.classList.add("system-theme");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
      document.documentElement.classList.remove("system-theme");
    }
  };

  const changeTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    setDropdownOpen(false);
  };

  const toggleFavorite = (id: number) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];

    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  };

  const playSound = (id: number, soundFile: string) => {
    // If already playing this sound, stop it
    if (isPlaying === id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(null);
      return;
    }

    // If playing something else, stop it first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Play the new sound
    try {
      const audio = new Audio(soundFile);
      audio.volume = volume;
      audio.addEventListener("ended", () => {
        setIsPlaying(null);
      });

      audioRef.current = audio;
      audio.play().catch((err) => {
        console.error("Error playing sound:", err);
      });

      setIsPlaying(id);
    } catch (error) {
      console.error("Failed to play sound:", error);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);

    // Update current playing sound if there is one
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const openSoundDetail = (sound: SoundEffect) => {
    setSelectedSound(sound);
  };

  const closeSoundDetail = () => {
    setSelectedSound(null);
  };

  // Add a handler for selecting a sound from search suggestions
  const handleSelectSound = (sound: SoundEffect) => {
    setSelectedSound(sound);
  };

  // Add handler for toggling exact match
  const handleExactMatchChange = (isExact: boolean) => {
    setExactMatch(isExact);
  };

  return (
    <div className="container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      <header className="header">
        <div className="logo-container">
          <div className="logo">
            <Image
              src="/sound-icon.png"
              alt="Sound Effect Library"
              width={32}
              height={32}
            />
          </div>
          <h1>SoundFX Hub</h1>
        </div>

        <div className="search-section">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            allSoundEffects={allSoundEffects}
            onSelectSound={handleSelectSound}
            categoryFilter={filter}
          />
        </div>

        <div className="controls">
          <div className="volume-control">
            <label htmlFor="volume" className="volume-label">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path
                  d={volume > 0.5 ? "M19.07 4.93a10 10 0 0 1 0 14.14" : ""}
                />
                <path d={volume > 0.1 ? "M15.54 8.46a5 5 0 0 1 0 7.07" : ""} />
              </svg>
            </label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>

          <div className="theme-selector" ref={dropdownRef}>
            <button
              className="theme-toggle"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Theme settings"
              aria-expanded={dropdownOpen}
            >
              {theme === "light" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
              {theme === "dark" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
              {theme === "system" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              )}
            </button>

            {dropdownOpen && (
              <div className="theme-dropdown">
                <button
                  className={`theme-option ${
                    theme === "light" ? "active" : ""
                  }`}
                  onClick={() => changeTheme("light")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                  <span>Light</span>
                </button>
                <button
                  className={`theme-option ${theme === "dark" ? "active" : ""}`}
                  onClick={() => changeTheme("dark")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                  <span>Dark</span>
                </button>
                <button
                  className={`theme-option ${
                    theme === "system" ? "active" : ""
                  }`}
                  onClick={() => changeTheme("system")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="3"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span>System</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="hero-section">
          <h2 className="headline">Your Ultimate Sound Effect Library</h2>
          <p className="subheading">
            Browse, play, and use high-quality sound effects for your projects
          </p>
          <div className="admin-link">
            <Link href="/admin" className="admin-button">
              Manage Sounds
            </Link>
          </div>
        </div>

        <div className="filter-section">
          <div className="category-tabs">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${
                  filter === category ? "active" : ""
                }`}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="filter-options">
            <button
              className={`favorite-filter ${showFavoritesOnly ? "active" : ""}`}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              aria-label="Show favorites only"
            >
              <Heart
                size={16}
                fill={showFavoritesOnly ? "currentColor" : "none"}
              />
              <span>Favorites</span>
            </button>
          </div>
        </div>

        {filteredSounds.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">
              <Bookmark size={48} strokeWidth={1.5} />
            </div>
            <h3>No sound effects found</h3>
            <p>Try adjusting your search or filters</p>
            <button
              className="reset-filters"
              onClick={() => {
                setFilter("All");
                setSearchTerm("");
                setShowFavoritesOnly(false);
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="sound-grid">
            {filteredSounds.map((sound) => (
              <div
                key={sound.id}
                className={`sound-card ${
                  isPlaying === sound.id ? "playing" : ""
                }`}
              >
                <div className="sound-icon" style={{ color: sound.icon.color }}>
                  <CustomIcon icon={sound.icon} />
                </div>
                <div className="sound-info">
                  <h3>{sound.name}</h3>
                  <div className="card-details">
                    <span className="category-tag">{sound.category}</span>
                    <button
                      className={`favorite-btn ${
                        favorites.includes(sound.id) ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(sound.id);
                      }}
                      aria-label={
                        favorites.includes(sound.id)
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <Heart
                        size={16}
                        fill={
                          favorites.includes(sound.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="info-btn"
                    onClick={() => openSoundDetail(sound)}
                    aria-label="View sound details"
                  >
                    Info
                  </button>
                  <button
                    className="play-btn"
                    onClick={() => playSound(sound.id, sound.file)}
                  >
                    {isPlaying === sound.id ? "Stop" : "Play"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedSound && (
        <div className="sound-detail-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={closeSoundDetail}>
              <X size={24} />
            </button>
            <div className="modal-header">
              <div
                className="modal-icon"
                style={{
                  color: selectedSound.icon.color,
                  background: `${selectedSound.icon.color}20`,
                }}
              >
                <CustomIcon icon={selectedSound.icon} />
              </div>
              <div className="modal-title">
                <h2>{selectedSound.name}</h2>
                <span className="category-tag">{selectedSound.category}</span>
              </div>
            </div>
            <div className="modal-body">
              <p className="sound-description">{selectedSound.description}</p>
              <div className="sound-actions">
                <button
                  className={`modal-favorite-btn ${
                    favorites.includes(selectedSound.id) ? "active" : ""
                  }`}
                  onClick={() => toggleFavorite(selectedSound.id)}
                >
                  <Heart
                    size={18}
                    fill={
                      favorites.includes(selectedSound.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                  {favorites.includes(selectedSound.id)
                    ? "Remove from Favorites"
                    : "Add to Favorites"}
                </button>
                <button
                  className="modal-play-btn"
                  onClick={() =>
                    playSound(selectedSound.id, selectedSound.file)
                  }
                >
                  {isPlaying === selectedSound.id ? "Stop" : "Play Sound"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>© 2025 SoundFX Hub. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
        </div>
      </footer>

      <style jsx>{`
        .admin-link {
          display: flex;
          justify-content: center;
          margin-top: 1.5rem;
        }

        .admin-button {
          padding: 0.75rem 1.5rem;
          background-color: var(--primary-color, #4a6cf7);
          color: white;
          border: none;
          border-radius: 4px;
          text-decoration: none;
          font-size: 1rem;
          display: inline-block;
          font-weight: 500;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .admin-button:hover {
          background-color: #3a5cc6;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .filter-section {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 5px solid var(--border-color);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
