"use client";

import { SoundEffect } from "../components/SoundCard";
import React from "react";

// Built-in sound effects
export const builtInSoundEffects: SoundEffect[] = [
  // UI Sounds
  {
    id: 1,
    name: "Button Click",
    category: "UI",
    description: "Clean button click sound for interfaces",
    file: "/sounds/click.mp3",
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
  },
  {
    id: 2,
    name: "Notification",
    category: "UI",
    description: "Standard notification alert tone",
    file: "/sounds/notification.mp3",
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      ),
      color: "#f5a623",
    },
  },
  {
    id: 3,
    name: "Success",
    category: "UI",
    description: "Positive confirmation sound",
    file: "/sounds/success.wav",
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
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      ),
      color: "#4caf50",
    },
  },
  {
    id: 4,
    name: "Error",
    category: "UI",
    description: "Alert sound for errors",
    file: "/sounds/error.mp3",
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
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      ),
      color: "#f44336",
    },
  },

  // Nature Sounds
  {
    id: 5,
    name: "Rain",
    category: "Nature",
    description: "Gentle rainfall ambience",
    file: "/sounds/rain.mp3",
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
          <line x1="16" y1="13" x2="16" y2="21"></line>
          <line x1="8" y1="13" x2="8" y2="21"></line>
          <line x1="12" y1="15" x2="12" y2="23"></line>
          <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path>
        </svg>
      ),
      color: "#00bcd4",
    },
  },
];
