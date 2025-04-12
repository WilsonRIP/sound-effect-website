"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { IconType } from "./CustomIcon";
import { Upload, X } from "react-feather";

interface IconUploadProps {
  onIconSelect: (icon: IconType) => void;
  currentIcon?: IconType;
}

export default function IconUpload({
  onIconSelect,
  currentIcon,
}: IconUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [iconColor, setIconColor] = useState<string>(
    currentIcon?.color || "#4a6cf7"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use useEffect to initialize the preview URL when currentIcon changes
  useEffect(() => {
    if (
      currentIcon?.type === "image" &&
      typeof currentIcon.content === "string"
    ) {
      setPreviewUrl(currentIcon.content);
    }
    if (currentIcon?.color) {
      setIconColor(currentIcon.color);
    }
  }, [currentIcon]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept image files
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Use FileReader to convert to data URL instead of object URL for better serialization
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        const dataUrl = event.target.result;
        setPreviewUrl(dataUrl);

        const newIcon: IconType = {
          type: "image",
          content: dataUrl,
          color: iconColor,
        };

        onIconSelect(newIcon);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setIconColor(newColor);

    if (currentIcon) {
      // Update color for both image and SVG icons
      const updatedIcon: IconType = {
        ...currentIcon,
        color: newColor,
      };

      onIconSelect(updatedIcon);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Reset to default SVG icon
    if (currentIcon) {
      onIconSelect({
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
        color: iconColor,
      });
    }
  };

  // Display different preview based on icon type
  const renderIconPreview = () => {
    if (previewUrl) {
      return (
        <div className="icon-preview">
          <img src={previewUrl} alt="Icon preview" className="preview-image" />
          <button
            className="clear-preview"
            onClick={clearImage}
            aria-label="Clear image"
          >
            <X size={16} />
          </button>
        </div>
      );
    } else if (currentIcon?.type === "svg") {
      return (
        <div
          className="icon-preview svg-preview"
          onClick={triggerFileInput}
          style={{ color: iconColor }}
        >
          {currentIcon.content}
          <div className="preview-overlay">
            <Upload size={20} />
          </div>
        </div>
      );
    } else {
      return (
        <div className="icon-placeholder" onClick={triggerFileInput}>
          <Upload size={24} />
          <span>Upload icon</span>
        </div>
      );
    }
  };

  return (
    <div className="icon-upload">
      <div className="icon-preview-container">{renderIconPreview()}</div>

      <div className="upload-controls">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
          style={{ display: "none" }}
        />

        <button className="upload-button" onClick={triggerFileInput}>
          {previewUrl || currentIcon?.type === "image"
            ? "Change Icon"
            : "Upload Icon"}
        </button>

        <div className="color-picker">
          <label htmlFor="icon-color">Icon Color:</label>
          <input
            id="icon-color"
            type="color"
            value={iconColor}
            onChange={handleColorChange}
            className="color-input"
          />
        </div>
      </div>

      <style jsx>{`
        .icon-upload {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .icon-preview-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .icon-preview {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background-color: var(--input-bg, #f5f5f5);
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid var(--border-color, #ddd);
        }

        .svg-preview {
          cursor: pointer;
        }

        .preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .preview-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          color: white;
        }

        .svg-preview:hover .preview-overlay {
          opacity: 1;
        }

        .clear-preview {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          border-radius: 50%;
          color: white;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .icon-placeholder {
          width: 80px;
          height: 80px;
          border: 2px dashed var(--border-color, #ccc);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          gap: 0.5rem;
          color: var(--secondary-text-color, #777);
          padding: 0.5rem;
          text-align: center;
          background-color: var(--input-bg, #f5f5f5);
        }

        .icon-placeholder span {
          font-size: 0.75rem;
        }

        .upload-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .upload-button {
          padding: 0.5rem 1rem;
          background-color: var(--primary-color, #4a6cf7);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .color-picker {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .color-input {
          width: 40px;
          height: 30px;
          padding: 0;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
