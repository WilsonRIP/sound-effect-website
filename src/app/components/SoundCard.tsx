"use client";

import { Heart } from "react-feather";
import CustomIcon, { IconType } from "./CustomIcon";

export type SoundEffect = {
  id: number;
  name: string;
  category: string;
  description: string;
  file: string;
  icon: IconType;
};

interface SoundCardProps {
  sound: SoundEffect;
  isPlaying: boolean;
  isFavorite: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
}

export default function SoundCard({
  sound,
  isPlaying,
  isFavorite,
  onPlay,
  onToggleFavorite,
  onViewDetails,
}: SoundCardProps) {
  return (
    <div className={`sound-card ${isPlaying ? "playing" : ""}`}>
      <div className="sound-icon">
        <CustomIcon icon={sound.icon} />
      </div>
      <div className="sound-info">
        <h3>{sound.name}</h3>
        <div className="card-details">
          <span className="category-tag">{sound.category}</span>
          <button
            className={`favorite-btn ${isFavorite ? "active" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <div className="card-actions">
        <button
          className="info-btn"
          onClick={onViewDetails}
          aria-label="View sound details"
        >
          Info
        </button>
        <button className="play-btn" onClick={onPlay}>
          {isPlaying ? "Stop" : "Play"}
        </button>
      </div>
    </div>
  );
}
