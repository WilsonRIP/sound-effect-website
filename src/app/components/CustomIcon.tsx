"use client";

import { ReactNode } from "react";
import Image from "next/image";

export type IconType = {
  type: "svg" | "image" | "component";
  content: ReactNode | string;
  color?: string;
  size?: number;
};

interface CustomIconProps {
  icon: IconType;
  className?: string;
  size?: number;
}

export default function CustomIcon({
  icon,
  className = "",
  size = 24,
}: CustomIconProps) {
  const iconSize = icon.size || size;

  if (icon.type === "svg") {
    return (
      <div
        className={`custom-icon ${className}`}
        style={{ color: icon.color || "currentColor" }}
      >
        {icon.content}
      </div>
    );
  }

  if (icon.type === "image") {
    return (
      <div className={`custom-icon ${className}`}>
        <Image
          src={icon.content as string}
          alt="Custom icon"
          width={iconSize}
          height={iconSize}
          className="icon-image"
        />
      </div>
    );
  }

  if (icon.type === "component") {
    return (
      <div
        className={`custom-icon ${className}`}
        style={{ color: icon.color || "currentColor" }}
      >
        {icon.content}
      </div>
    );
  }

  return null;
}
