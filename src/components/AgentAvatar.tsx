"use client";

import { useState } from "react";

interface AgentAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export default function AgentAvatar({ name, avatarUrl, size = "md", className = "" }: AgentAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = sizes[size];

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-[var(--primary)] font-bold text-[var(--primary-foreground)] ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
