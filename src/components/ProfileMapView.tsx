"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useInfiniteHits, useInstantSearch } from "react-instantsearch";
import { Map, Marker } from "react-map-gl/mapbox";
import type { ProfileHitOptional } from "~/types/typesense";
import { ProfileCard } from "./ProfileCard";
import { ProfileAvatar } from "./ProfileAvatar";

interface ProfileMapViewProps {
  onProfileSelect?: (profile: ProfileHitOptional) => void;
}

interface MapProfile extends ProfileHitOptional {
  longitude: number;
  latitude: number;
}


// Custom component to render ProfileAvatars using Marker for proper globe projection
function ProfileAvatarOverlay({
  profiles,
  onProfileClick,
}: {
  profiles: MapProfile[];
  onProfileClick: (profile: ProfileHitOptional) => void;
}) {
  return (
    <>
      {profiles.map((profile) => (
        <Marker
          key={profile.id}
          longitude={profile.longitude}
          latitude={profile.latitude}
          anchor="center"
        >
          <div
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={() => onProfileClick(profile)}
          >
            <ProfileAvatar
              profile={profile}
              size={50}
              className="shadow-lg ring-2 ring-white hover:ring-blue-500"
            />
          </div>
        </Marker>
      ))}
    </>
  );
}

// Simple geocoding mock - in real app, you'd use a proper geocoding service
const geocodeLocation = (
  location: string,
): { lng: number; lat: number } | null => {
  const coordinates: Record<string, { lng: number; lat: number }> = {
    "san francisco": { lng: -122.4194, lat: 37.7749 },
    "new york": { lng: -74.006, lat: 40.7128 },
    london: { lng: -0.1276, lat: 51.5074 },
    paris: { lng: 2.3522, lat: 48.8566 },
    tokyo: { lng: 139.6917, lat: 35.6895 },
    berlin: { lng: 13.405, lat: 52.52 },
    amsterdam: { lng: 4.9041, lat: 52.3676 },
    toronto: { lng: -79.3832, lat: 43.6532 },
    sydney: { lng: 151.2093, lat: -33.8688 },
    singapore: { lng: 103.8198, lat: 1.3521 },
    "los angeles": { lng: -118.2437, lat: 34.0522 },
    chicago: { lng: -87.6298, lat: 41.8781 },
    seattle: { lng: -122.3321, lat: 47.6062 },
    boston: { lng: -71.0589, lat: 42.3601 },
    austin: { lng: -97.7431, lat: 30.2672 },
  };

  const normalized = location?.toLowerCase().trim();
  if (!normalized) return null;

  // Try exact match first
  if (coordinates[normalized]) return coordinates[normalized];

  // Try partial matches
  for (const [city, coords] of Object.entries(coordinates)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      return coords;
    }
  }

  return null;
};

export function ProfileMapView({ onProfileSelect }: ProfileMapViewProps) {
  const {
    items: hitsItems,
    showMore,
    isLastPage,
  } = useInfiniteHits<ProfileHitOptional>();
  const { status } = useInstantSearch();
  const [selectedProfile, setSelectedProfile] =
    useState<ProfileHitOptional | null>(null);

  // Process profiles and add coordinates
  const mapProfiles = useMemo(() => {
    if (!hitsItems || !Array.isArray(hitsItems)) return [];

    const profilesWithCoords: MapProfile[] = [];
    const locationCounts: Record<string, number> = {};

    hitsItems.forEach((profile) => {
      if (!profile?.location) return;

      const coords = geocodeLocation(profile.location);
      if (coords) {
        // Track how many profiles are in each location for clustering
        const locationKey = `${coords.lat},${coords.lng}`;
        locationCounts[locationKey] = (locationCounts[locationKey] ?? 0) + 1;

        // Add small offset for profiles in the same city to prevent overlap
        const offset = (locationCounts[locationKey] - 1) * 0.005; // Smaller offset
        const angle =
          (locationCounts[locationKey] - 1) * 137.5 * (Math.PI / 180); // Golden angle

        profilesWithCoords.push({
          ...profile,
          longitude: coords.lng + Math.cos(angle) * offset,
          latitude: coords.lat + Math.sin(angle) * offset,
        });
      }
    });

    return profilesWithCoords;
  }, [hitsItems]);

  const handleProfileClick = useCallback(
    (profile: ProfileHitOptional) => {
      setSelectedProfile(profile);
      onProfileSelect?.(profile);
    },
    [onProfileSelect],
  );


  if (status === "loading" && mapProfiles.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-blue-600">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium">Loading map...</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-red-500">Error loading map data</div>
          <div className="mt-2 text-sm text-gray-400">
            Please try refreshing the page
          </div>
        </div>
      </div>
    );
  }

  if (mapProfiles.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-500">
            No profiles with locations found
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Try adjusting your search or filters
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0">
      <Map
        initialViewState={{
          longitude: -122.4194,
          latitude: 37.7749,
          zoom: 2,
        }}
        style={{ width: "100vw", height: "100vh" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ""}
      >
        {/* ProfileAvatar Markers */}
        <ProfileAvatarOverlay
          profiles={mapProfiles}
          onProfileClick={handleProfileClick}
        />
      </Map>

      {/* Profile Card Sidebar */}
      {selectedProfile && (
        <div className="absolute right-4 top-4 z-50 max-h-[500px] w-80 overflow-y-auto">
          <div className="rounded-lg border bg-white p-4 shadow-xl backdrop-blur-sm">
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-semibold">Profile Details</h3>
              <button
                onClick={() => setSelectedProfile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <ProfileCard profile={selectedProfile} />
          </div>
        </div>
      )}

      {/* Load More Profiles Button */}
      {!isLastPage && (
        <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 transform">
          <button
            onClick={() => showMore()}
            className="rounded-full bg-blue-600 px-4 py-2 text-white shadow-xl backdrop-blur-sm transition-colors hover:bg-blue-700"
          >
            Load More Profiles ({mapProfiles.length} shown)
          </button>
        </div>
      )}

      {/* Map Stats */}
      <div className="absolute left-4 top-4 z-40 rounded-lg bg-white/90 px-3 py-2 shadow-xl backdrop-blur-sm">
        <div className="text-sm text-gray-600">
          Showing {mapProfiles.length} profiles with locations
        </div>
      </div>
    </div>
  );
}
