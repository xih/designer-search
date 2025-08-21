"use client";

import React, { useState, useEffect, useRef } from "react";
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

export const ProfileAvatar = React.memo(function ProfileAvatar({
  profile,
  size = 80,
  zoom = 1.1, // Default 110% zoom to crop out black borders
  className = "",
}: ProfileAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Debug logging for image flickering investigation
  const renderCount = useRef(0);
  const prevImageUrl = useRef<string | undefined>();
  const mountTime = useRef(Date.now());
  
  const handleImageLoad = () => {
    console.log(`🖼️ ProfileAvatar [${profile.name}] - Image LOADED:`, {
      profileId: profile.id,
      profileName: profile.name,
      imageUrl: imageUrl,
      loadTime: Date.now() - mountTime.current,
      renderCount: renderCount.current,
    });
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.log(`❌ ProfileAvatar [${profile.name}] - Image ERROR:`, {
      profileId: profile.id,
      profileName: profile.name,
      imageUrl: imageUrl,
      renderCount: renderCount.current,
    });
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
  
  useEffect(() => {
    renderCount.current += 1;
    const hasImageUrlChanged = prevImageUrl.current !== imageUrl;
    
    if (hasImageUrlChanged) {
      console.log(`🔄 ProfileAvatar [${profile.name}] - Component re-render #${renderCount.current}:`, {
        profileId: profile.id,
        profileName: profile.name,
        newImageUrl: imageUrl,
        prevImageUrl: prevImageUrl.current,
        hasImageUrlChanged,
        imageLoaded,
        componentAge: Date.now() - mountTime.current,
      });
      
      // Reset image loaded state if URL changed
      if (hasImageUrlChanged) {
        setImageLoaded(false);
        mountTime.current = Date.now();
      }
    }
    
    prevImageUrl.current = imageUrl;
  });

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
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo - only re-render if props actually change
  return (
    prevProps.profile.id === nextProps.profile.id &&
    prevProps.profile.name === nextProps.profile.name &&
    prevProps.profile.photourl === nextProps.profile.photourl &&
    prevProps.profile.profilePhotoUrl === nextProps.profile.profilePhotoUrl &&
    prevProps.size === nextProps.size &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.className === nextProps.className
  );
});

// Export default zoom levels for consistency
export const AVATAR_ZOOM_PRESETS = {
  NORMAL: 1.0,
  CROP_BORDERS: 1.1, // Good for removing black borders
  ZOOM_IN: 1.2, // More aggressive cropping
  ZOOM_OUT: 0.9, // Show more of the image
} as const;
