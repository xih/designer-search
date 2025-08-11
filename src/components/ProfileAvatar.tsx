"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import type { ProfileHitOptional } from "~/types/typesense";

interface ProfileAvatarProps {
  profile: ProfileHitOptional;
  size?: number; // Size in pixels (default: 80)
  zoom?: number; // Zoom level (1.0 = normal, 1.2 = 120%, 0.8 = 80%, etc.)
  className?: string;
}

export function ProfileAvatar({
  profile,
  size = 80,
  zoom = 1.1, // Default 110% zoom to crop out black borders
  className = "",
}: ProfileAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(true); // Consider error as "loaded" to hide skeleton
  };

  const isValidUrl = (url?: string): boolean => {
    return !!(url?.trim() && url !== "");
  };

  // Prefer opengraphimageurl, fallback to photourl, then profilePhotoUrl
  const imageUrl = profile.photourl ?? profile.profilePhotoUrl;

  // Calculate size classes
  const sizeClass = `h-[${size}px] w-[${size}px]`;

  // Calculate zoom transform
  const zoomTransform = zoom !== 1 ? `scale(${zoom})` : undefined;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Skeleton overlay that disappears when image loads */}
      {!imageLoaded && isValidUrl(imageUrl) && (
        <Skeleton 
          className="absolute inset-0 rounded-full z-10"
          style={{ width: size, height: size }}
        />
      )}
      
      <Avatar
        className={`${sizeClass} ${className} ${!imageLoaded && isValidUrl(imageUrl) ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ width: size, height: size }}
      >
        {isValidUrl(imageUrl) && (
          <AvatarImage
            src={imageUrl}
            alt={`${profile.name}'s profile photo`}
            className="object-cover"
            style={{
              transform: zoomTransform,
              transformOrigin: "center center",
            }}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        )}

        <AvatarFallback className="bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 font-bold text-white">
          <span style={{ fontSize: size * 0.4 }}>
            {profile.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

// Export default zoom levels for consistency
export const AVATAR_ZOOM_PRESETS = {
  NORMAL: 1.0,
  CROP_BORDERS: 1.1, // Good for removing black borders
  ZOOM_IN: 1.2, // More aggressive cropping
  ZOOM_OUT: 0.9, // Show more of the image
} as const;
