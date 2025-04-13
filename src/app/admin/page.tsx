"use client";

import { useState, useEffect, FormEvent } from "react";
import { ArrowLeft, Save, Trash, Move, Download, Upload } from "react-feather";
import Link from "next/link";
import IconUpload from "../components/IconUpload";
import CustomIcon, { IconType } from "../components/CustomIcon";
import { SoundEffect } from "../components/SoundCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { fetchSoundEffects, saveSoundEffect, deleteSoundEffect, saveSoundEffects, fetchCategories } from "../../lib/soundEffectsService";

// Import the built-in sound effects
import { builtInSoundEffects } from "../data/soundEffects";

// Default sound effect data structure
const defaultSound: Omit<SoundEffect, "id"> = {
  name: "",
  category: "",
  description: "",
  file: "",
  icon: {
    type: "svg",
    content: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v8"></path>
        <path d="M8 12h8"></path>
      </svg>
    ),
    color: "#4a6cf7",
  },
};

export default function AdminPage() {
  const [sounds, setSounds] = useState<SoundEffect[]>([]);
  const [currentSound, setCurrentSound] = useState<SoundEffect | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [highlightCategory, setHighlightCategory] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    isVisible: boolean;
  }>({
    message: "",
    isVisible: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Set up the sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Apply saved theme on admin page load
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      // Default to system if no preference saved
      applyTheme("system");
    }

    // Load sound effects
    const loadSoundEffects = async () => {
      setIsLoading(true);
      
      // Get all built-in sounds first
      const allSounds = [...builtInSoundEffects];

      try {
        // Get custom sounds from Supabase
        const customSounds = await fetchSoundEffects();

        // Merge custom sounds, replace built-in sounds with custom versions if they exist
        customSounds.forEach((customSound) => {
          const existingIndex = allSounds.findIndex(
            (s) => s.id === customSound.id
          );
          if (existingIndex >= 0) {
            // Replace existing built-in sound with custom version
            allSounds[existingIndex] = customSound;
          } else {
            // Add new custom sound
            allSounds.push(customSound);
          }
        });

        setSounds(allSounds);
      } catch (error) {
        console.error("Error loading sound effects:", error);
        
        // Fallback to localStorage if Supabase fails
        if (typeof window !== "undefined") {
          const savedSounds = localStorage.getItem("soundEffects");
          if (savedSounds) {
            const localCustomSounds = JSON.parse(savedSounds);

            // Merge custom sounds from localStorage
            localCustomSounds.forEach((customSound: SoundEffect) => {
              // Fix for SVG icons that were serialized
              if (
                customSound.icon &&
                customSound.icon.type === "svg" &&
                customSound.icon.content === "DEFAULT_SVG"
              ) {
                // Reconstruct the SVG element
                customSound.icon.content = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 8v8"></path>
                    <path d="M8 12h8"></path>
                  </svg>
                );
              }

              const existingIndex = allSounds.findIndex(
                (s) => s.id === customSound.id
              );
              if (existingIndex >= 0) {
                // Replace existing built-in sound with custom version
                allSounds[existingIndex] = customSound;
              } else {
                // Add new custom sound
                allSounds.push(customSound);
              }
            });

            setSounds(allSounds);
          } else {
            setSounds(allSounds);
          }
        }
      } finally {
        setIsLoading(false);
      }

      // Load categories from both Supabase and localStorage
      try {
        // Get categories from Supabase
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
        
        // Merge categories from both sources
        const uniqueCategories = [
          ...new Set([
            ...supabaseCategories,
            ...localCategories,
            ...builtInSoundEffects.map(sound => sound.category)
          ])
        ].filter(Boolean);
        
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
        
        // Fallback to localStorage
        if (typeof window !== "undefined") {
          const savedCategories = localStorage.getItem("soundCategories");
          if (savedCategories) {
            try {
              const parsedCategories = JSON.parse(savedCategories);
              if (Array.isArray(parsedCategories)) {
                setCategories(parsedCategories);
              }
            } catch (e) {
              console.error("Error parsing saved categories:", e);
            }
          } else {
            // Extract unique categories from built-in sounds
            const uniqueCategories = [
              ...new Set(builtInSoundEffects.map((sound) => sound.category)),
            ].filter(Boolean);
            setCategories(uniqueCategories);
          }
        }
      }
    };

    loadSoundEffects();
  }, []);

  // Add the theme application function
  const applyTheme = (theme: string) => {
    if (theme === "system") {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        systemDark ? "dark" : "light"
      );
      document.documentElement.classList.add("system-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.classList.remove("system-theme");
    }
  };

  const handleCreateNew = () => {
    const newId =
      sounds.length > 0 ? Math.max(...sounds.map((s) => s.id)) + 1 : 1;
    setCurrentSound({
      id: newId,
      ...defaultSound,
    });
  };

  const handleEditSound = (id: number) => {
    const soundToEdit = sounds.find((s) => s.id === id);
    if (soundToEdit) {
      setCurrentSound(soundToEdit);
    }
  };

  // Show notification helper
  const showNotification = (message: string) => {
    setNotification({ message, isVisible: true });
    setTimeout(() => {
      setNotification({ message: "", isVisible: false });
    }, 3000);
  };

  const handleSaveSound = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentSound) return;

    // Validate the form
    if (!currentSound.name || !currentSound.category) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // Save to Supabase
      const success = await saveSoundEffect(currentSound);

      if (!success) {
        throw new Error("Failed to save to Supabase");
      }

      // Check if this is a new sound or an edit of an existing sound
      const soundExists = sounds.some((s) => s.id === currentSound.id);

      // Update the sounds array appropriately
      let updatedSounds;
      if (soundExists) {
        // Update existing sound
        updatedSounds = sounds.map((s) =>
          s.id === currentSound.id ? currentSound : s
        );
      } else {
        // Add new sound
        updatedSounds = [...sounds, currentSound];
      }

      setSounds(updatedSounds);

      // Fallback: Save to localStorage as well
      // Get custom sounds (those that were edited from built-in or newly added)
      const builtInIds = new Set(builtInSoundEffects.map((s) => s.id));
      const customSounds = updatedSounds.filter((sound) => {
        // Include sound if it's not in built-in list or if it was modified from built-in
        const builtInVersion = builtInSoundEffects.find((s) => s.id === sound.id);
        const isModified =
          builtInVersion &&
          JSON.stringify(builtInVersion) !== JSON.stringify(sound);
        return isModified || !builtInIds.has(sound.id);
      });

      // Create a serializable version of each sound object
      const serializableSounds = customSounds.map((sound) => {
        const serializedSound = { ...sound };

        // Handle SVG icons for localStorage (convert SVG React elements to a marker string)
        if (
          sound.icon &&
          sound.icon.type === "svg" &&
          typeof sound.icon.content !== "string"
        ) {
          serializedSound.icon = {
            ...sound.icon,
            content: "DEFAULT_SVG", // This is a marker that we'll use when reading back
            type: "svg",
          };
        }

        return serializedSound;
      });

      localStorage.setItem("soundEffects", JSON.stringify(serializableSounds));

      // Show success notification
      showNotification(
        soundExists
          ? "Sound updated successfully!"
          : "New sound added successfully!"
      );

      // Reset form
      setCurrentSound(null);
    } catch (error) {
      console.error("Error saving sound:", error);
      showNotification("Failed to save sound effect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSound = async (id: number) => {
    if (confirm("Are you sure you want to delete this sound effect?")) {
      setIsLoading(true);

      try {
        // Delete from Supabase
        const success = await deleteSoundEffect(id);

        if (!success) {
          throw new Error("Failed to delete from Supabase");
        }

        const updatedSounds = sounds.filter((s) => s.id !== id);
        setSounds(updatedSounds);

        // Fallback: Update localStorage
        const builtInIds = new Set(builtInSoundEffects.map((s) => s.id));
        const customSounds = updatedSounds.filter((sound) => {
          const builtInVersion = builtInSoundEffects.find(
            (s) => s.id === sound.id
          );
          const isModified =
            builtInVersion &&
            JSON.stringify(builtInVersion) !== JSON.stringify(sound);
          return isModified || !builtInIds.has(sound.id);
        });

        localStorage.setItem("soundEffects", JSON.stringify(customSounds));

        if (currentSound?.id === id) {
          setCurrentSound(null);
        }

        showNotification("Sound effect deleted successfully");
      } catch (error) {
        console.error("Error deleting sound:", error);
        showNotification("Failed to delete sound effect. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddCategory = async () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const newCategoryValue = newCategory.trim();
      const updatedCategories = [...categories, newCategoryValue];

      // Update categories state
      setCategories(updatedCategories);

      // Save categories to localStorage
      localStorage.setItem(
        "soundCategories",
        JSON.stringify(updatedCategories)
      );

      // Update current sound with the new category if editing
      if (currentSound) {
        setCurrentSound({
          ...currentSound,
          category: newCategoryValue,
        });
      } else {
        // If not currently editing a sound, create a placeholder sound with the new category
        // This ensures the category is synced to Supabase
        setIsLoading(true);
        
        try {
          // Create a placeholder sound effect with the new category
          const newId = sounds.length > 0 ? Math.max(...sounds.map((s) => s.id)) + 1 : 1;
          const placeholderSound: SoundEffect = {
            id: newId,
            name: `${newCategoryValue} Placeholder`,
            category: newCategoryValue,
            description: `Placeholder for ${newCategoryValue} category`,
            file: "/sounds/click.mp3", // Using a default sound file
            icon: {
              type: "svg",
              content: (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 8v8"></path>
                  <path d="M8 12h8"></path>
                </svg>
              ),
              color: "#4a6cf7",
            },
          };
          
          // Save the placeholder sound to Supabase
          const success = await saveSoundEffect(placeholderSound);
          
          if (success) {
            // Add the new sound to the sounds list
            setSounds([...sounds, placeholderSound]);
            
            // Show notification of success
            showNotification(`New category '${newCategoryValue}' added and synced to Supabase`);
          } else {
            throw new Error("Failed to save placeholder sound");
          }
        } catch (error) {
          console.error("Error creating placeholder for new category:", error);
          showNotification("Category added locally but failed to sync to Supabase");
        } finally {
          setIsLoading(false);
        }
      }

      // Reset form
      setNewCategory("");
      setIsAddingCategory(false);

      // Highlight the category dropdown
      setHighlightCategory(true);
      setTimeout(() => setHighlightCategory(false), 1500);
    }
  };

  const handleIconSelect = (icon: IconType) => {
    if (currentSound) {
      setCurrentSound({
        ...currentSound,
        icon,
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!currentSound) return;

    const { name, value } = e.target;
    setCurrentSound({
      ...currentSound,
      [name]: value,
    });
  };

  // Handle the drag end event to reorder the sounds
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSounds((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const reorderedSounds = arrayMove(items, oldIndex, newIndex);

        // Save the updated order asynchronously
        const saveReorderedSounds = async () => {
          setIsLoading(true);
          
          try {
            // Get custom sounds to update
            const builtInIds = new Set(builtInSoundEffects.map((s) => s.id));
            const customSounds = reorderedSounds.filter((sound) => {
              const builtInVersion = builtInSoundEffects.find(
                (s) => s.id === sound.id
              );
              const isModified =
                builtInVersion &&
                JSON.stringify(builtInVersion) !== JSON.stringify(sound);
              return isModified || !builtInIds.has(sound.id);
            });

            // Save to Supabase
            await saveSoundEffects(customSounds);

            // Fallback: Save to localStorage
            localStorage.setItem("soundEffects", JSON.stringify(customSounds));
          } catch (error) {
            console.error("Error saving reordered sounds:", error);
          } finally {
            setIsLoading(false);
          }
        };

        saveReorderedSounds();

        return reorderedSounds;
      });
    }
  };

  const handleCategoryInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (newCategory.trim()) {
        handleAddCategory();
      }
    }
  };

  // Sortable Item component
  function SortableSoundItem({ sound }: { sound: SoundEffect }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: sound.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 10 : 1,
      position: isDragging ? ("relative" as const) : ("static" as const),
      boxShadow: isDragging ? "0 5px 10px rgba(0,0,0,0.15)" : "none",
      background: isDragging ? "var(--card-bg)" : "transparent",
    };

    return (
      <li
        ref={setNodeRef}
        style={style}
        className={`sound-item ${
          currentSound?.id === sound.id ? "active" : ""
        }`}
      >
        <div className="drag-handle" {...attributes} {...listeners}>
          <Move size={14} />
        </div>
        <div
          className="sound-item-content"
          onClick={() => handleEditSound(sound.id)}
        >
          <div className="sound-item-icon">
            <CustomIcon icon={sound.icon} size={16} />
          </div>
          <div className="sound-item-info">
            <h3>{sound.name}</h3>
            <span className="sound-category">{sound.category}</span>
          </div>
        </div>
        <button
          className="delete-button"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteSound(sound.id);
          }}
          aria-label="Delete sound"
        >
          <Trash size={14} />
        </button>
      </li>
    );
  }

  const exportSoundEffects = async () => {
    setIsLoading(true);
    
    try {
      // Get custom sounds from Supabase
      const customSounds = await fetchSoundEffects();
      
      if (customSounds.length === 0) {
        // Fallback to localStorage if no sounds in Supabase
        const savedSounds = localStorage.getItem("soundEffects");
        if (!savedSounds) {
          showNotification("No custom sound effects to export");
          return;
        }
        
        // Create and download the file
        downloadSoundsFile(savedSounds);
      } else {
        // Convert to serializable format
        const serializableSounds = customSounds.map((sound) => {
          const serializedSound = { ...sound };
          
          if (
            sound.icon &&
            sound.icon.type === "svg" &&
            typeof sound.icon.content !== "string"
          ) {
            serializedSound.icon = {
              ...sound.icon,
              content: "DEFAULT_SVG",
              type: "svg",
            };
          }
          
          return serializedSound;
        });
        
        // Create and download the file
        downloadSoundsFile(JSON.stringify(serializableSounds));
      }
    } catch (error) {
      console.error("Error exporting sound effects:", error);
      
      // Fallback to localStorage if Supabase fails
      const savedSounds = localStorage.getItem("soundEffects");
      if (!savedSounds) {
        showNotification("No custom sound effects to export");
        return;
      }
      
      // Create and download the file
      downloadSoundsFile(savedSounds);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to download sounds file
  const downloadSoundsFile = (jsonContent: string) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonContent);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "sound-effects-export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showNotification("Sound effects exported successfully");
  };

  const importSoundEffects = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = async (e) => {
      if (!e.target || typeof e.target.result !== 'string') {
        showNotification("Error reading file");
        return;
      }
      
      setIsLoading(true);
      
      try {
        const content = e.target.result;
        const importedSounds = JSON.parse(content);
        
        // Validate imported data
        if (!Array.isArray(importedSounds)) {
          throw new Error("Invalid format: expected an array");
        }
        
        // Save to Supabase
        const success = await saveSoundEffects(importedSounds);
        
        if (!success) {
          throw new Error("Failed to save to Supabase");
        }
        
        // Save to localStorage as fallback
        localStorage.setItem("soundEffects", content);
        
        // Reload the sounds
        const allSounds = [...builtInSoundEffects];
        importedSounds.forEach(customSound => {
          const existingIndex = allSounds.findIndex(s => s.id === customSound.id);
          if (existingIndex >= 0) {
            allSounds[existingIndex] = customSound;
          } else {
            allSounds.push(customSound);
          }
        });
        
        setSounds(allSounds);
        showNotification("Sound effects imported successfully");
      } catch (error) {
        console.error("Import error:", error);
        showNotification("Error importing sound effects: Invalid file format");
      } finally {
        setIsLoading(false);
        
        // Clear the file input
        event.target.value = '';
      }
    };
    
    fileReader.onerror = () => {
      showNotification("Error reading file");
    };
  };

  return (
    <div className="admin-page">
      {/* Add loading indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <header className="admin-header">
        <Link href="/" className="back-link">
          <ArrowLeft size={18} /> Back to Sound Library
        </Link>
        <h1 className="admin-title">Sound Effect Manager</h1>
        <div className="admin-actions">
          <button
            className="export-button"
            onClick={exportSoundEffects}
            title="Export sound effects"
          >
            <Download size={18} /> Export
          </button>
          <label className="import-button" title="Import sound effects">
            <Upload size={18} /> Import
            <input
              type="file"
              accept=".json"
              onChange={importSoundEffects}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </header>

      <main className="admin-content">
        <div className="sound-list-section">
          <div className="section-header">
            <h2>Sound Effects</h2>
            <button className="add-button" onClick={handleCreateNew}>
              Add New
            </button>
          </div>

          {sounds.length === 0 ? (
            <div className="empty-state">
              <p>No sound effects added yet.</p>
              <button onClick={handleCreateNew}>Create your first sound</button>
            </div>
          ) : (
            <>
              <p className="drag-drop-help">
                <Move
                  size={12}
                  style={{ verticalAlign: "middle", marginRight: "4px" }}
                />
                Drag to reorder
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sounds.map((sound) => sound.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="sound-list">
                    {sounds.map((sound) => (
                      <SortableSoundItem key={sound.id} sound={sound} />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>

        {currentSound && (
          <div className="sound-edit-section">
            <h2>{currentSound.id ? "Edit Sound" : "Add New Sound"}</h2>
            <form onSubmit={handleSaveSound} className="sound-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={currentSound.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <div
                  className={`category-select-container ${
                    highlightCategory ? "highlight-animate" : ""
                  }`}
                >
                  <select
                    id="category"
                    name="category"
                    value={currentSound.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="add-category-button"
                    onClick={() => setIsAddingCategory(true)}
                  >
                    +
                  </button>
                </div>
              </div>

              {isAddingCategory && (
                <div className="form-group new-category-group">
                  <label htmlFor="newCategory">New Category</label>
                  <div className="new-category-input">
                    <input
                      id="newCategory"
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Enter new category"
                      autoFocus
                      onKeyDown={handleCategoryInputKeyDown}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCategory.trim()}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategory("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={currentSound.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="file">Sound File Path *</label>
                <input
                  id="file"
                  name="file"
                  type="text"
                  value={currentSound.file}
                  onChange={handleChange}
                  placeholder="/sounds/your-sound.mp3"
                  required
                />
                <p className="help-text">
                  Enter the path to your sound file (must be in the public
                  folder)
                </p>
              </div>

              <div className="form-group">
                <label>Icon</label>
                <IconUpload
                  onIconSelect={handleIconSelect}
                  currentIcon={currentSound.icon}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setCurrentSound(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  <Save size={16} />
                  <span>Save Sound</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {notification.isVisible && (
        <div className="notification">{notification.message}</div>
      )}

      <style jsx>{`
        .admin-page {
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          --card-bg: var(--sound-card-bg);
          --highlight-bg: rgba(var(--gray-rgb), 0.03);
          --secondary-button-bg: rgba(var(--gray-rgb), 0.07);
          --primary-color: var(--accent-color);
          --highlight-rgb: 74, 108, 247;
          --danger-color: #f44336;
        }

        .admin-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--text-color);
          width: fit-content;
        }

        .admin-content {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .section-header h2 {
          font-size: 1.25rem;
        }

        .sound-list {
          list-style: none;
          padding: 0;
          margin: 0;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
          max-height: 500px;
          overflow-y: auto;
        }

        .sound-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--border-color);
        }

        .drag-handle {
          cursor: grab;
          padding: 4px;
          margin-right: 4px;
          color: var(--secondary-text-color);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        .drag-handle:hover {
          color: var(--text-color);
          opacity: 1;
        }

        .sound-item:last-child {
          border-bottom: none;
        }

        .sound-item.active {
          background-color: var(--highlight-color, rgba(74, 108, 247, 0.1));
        }

        .sound-item-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          cursor: pointer;
        }

        .sound-item-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .sound-item-info {
          display: flex;
          flex-direction: column;
        }

        .sound-item-info h3 {
          margin: 0;
          font-size: 0.8rem;
        }

        .sound-category {
          font-size: 0.7rem;
          color: var(--secondary-text-color);
        }

        .delete-button {
          background: none;
          border: none;
          color: var(--danger-color, #f44336);
          cursor: pointer;
          padding: 0.25rem;
          margin-left: 0.25rem;
          opacity: 0.7;
        }

        .delete-button:hover {
          opacity: 1;
        }

        .sound-edit-section {
          background-color: var(--card-bg);
          padding: 1.25rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .sound-edit-section h2 {
          font-size: 1.25rem;
          margin-bottom: 0.75rem;
        }

        .sound-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .form-group label {
          font-weight: 500;
          font-size: 0.9rem;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          background-color: var(--input-bg);
          color: var(--text-color);
          padding-right: 36px;
          font-size: 0.9rem;
        }

        /* Custom select styling */
        .form-group select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8.825L1.175 4 2.238 2.938 6 6.7 9.762 2.938 10.825 4z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .help-text {
          font-size: 0.7rem;
          color: var(--secondary-text-color);
          margin: 0.25rem 0 0;
        }

        .category-select-container {
          display: flex;
          gap: 0.5rem;
        }

        .category-select-container select {
          flex: 1;
        }

        .add-category-button {
          width: 32px;
          height: 35px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--primary-color, #4a6cf7);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1.25rem;
          cursor: pointer;
        }

        .new-category-group {
          background-color: var(--highlight-bg);
          padding: 0.75rem;
          border-radius: 4px;
          border: 1px solid var(--border-color);
        }

        .new-category-input {
          display: flex;
          gap: 0.5rem;
        }

        .new-category-input input {
          flex: 1;
        }

        .new-category-input button {
          padding: 0.5rem 0.75rem;
          background-color: var(--primary-color, #4a6cf7);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .new-category-input .cancel-button {
          background-color: var(--secondary-button-bg);
          color: var(--text-color);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        .cancel-button {
          padding: 0.5rem 0.75rem;
          background-color: var(--secondary-button-bg);
          color: var(--text-color);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .save-button {
          padding: 0.5rem 0.75rem;
          background-color: var(--primary-color, #4a6cf7);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .empty-state {
          text-align: center;
          padding: 1.5rem;
          background-color: var(--card-bg);
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }

        .empty-state button {
          margin-top: 0.75rem;
          padding: 0.5rem 0.75rem;
          background-color: var(--primary-color, #4a6cf7);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .add-button {
          padding: 0.4rem 0.75rem;
          background-color: var(--primary-color, #4a6cf7);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .drag-drop-help {
          display: flex;
          align-items: center;
          color: var(--secondary-text-color);
          font-size: 0.75rem;
          margin: 0.35rem 0;
          padding: 0.35rem 0.5rem;
          background-color: rgba(var(--highlight-rgb, 74, 108, 247), 0.1);
          border-radius: 4px;
        }

        .admin-title {
          font-size: 1.5rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .admin-content {
            grid-template-columns: 1fr;
          }

          .sound-list-section {
            margin-bottom: 1.5rem;
            order: 2;
          }

          .sound-edit-section {
            order: 1;
            margin-bottom: 1.5rem;
          }
        }

        .notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: var(--primary-color);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 100;
          animation: slideIn 0.3s ease-out forwards;
        }

        @keyframes slideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .highlight-animate {
          animation: highlight-pulse 1.5s ease;
        }

        @keyframes highlight-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--highlight-rgb), 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(var(--highlight-rgb), 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--highlight-rgb), 0);
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
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
