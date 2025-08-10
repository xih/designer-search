"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useInfiniteHits, useInstantSearch } from "react-instantsearch";
import Map from "react-map-gl/mapbox";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, IconLayer } from "@deck.gl/layers";
import { WebMercatorViewport } from "@deck.gl/core";
import type { ProfileHitOptional } from "~/types/typesense";
import { ProfileCard } from "./ProfileCard";
import Image from "next/image";

interface ProfileMapViewProps {
  onProfileSelect?: (profile: ProfileHitOptional) => void;
}

interface MapProfile extends ProfileHitOptional {
  longitude: number;
  latitude: number;
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
  const [viewState, setViewState] = useState({
    longitude: -122.4194,
    latitude: 37.7749,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  });

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
        locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;

        // Add some random offset for profiles in the same city
        const offset = locationCounts[locationKey] * 0.01;
        const angle = locationCounts[locationKey] * 137.5 * (Math.PI / 180); // Golden angle

        profilesWithCoords.push({
          ...profile,
          longitude: coords.lng,
          latitude: coords.lat,
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

  const iconLayer = new IconLayer({
    id: "profile-icons",
    data: mapProfiles,
    pickable: true,
    iconAtlas: "/api/map-icons", // We'll need to create this endpoint or use a CDN
    iconMapping: {
      marker: {
        x: 0,
        y: 0,
        width: 128,
        height: 128,
        mask: true,
      },
    },
    getIcon: () => "marker",
    sizeScale: 15,
    getPosition: (d: MapProfile) => [d.longitude, d.latitude],
    getSize: () => 5,
    getColor: () => [29, 78, 216, 255], // Blue color
    onHover: ({ object, x, y }) => {
      // You can add hover effects here
    },
    onClick: ({ object }) => {
      if (object) {
        handleProfileClick(object as ProfileHitOptional);
      }
    },
  });

  // Fallback to scatter plot if icon atlas fails
  const scatterplotLayer = new ScatterplotLayer({
    id: "profile-scatter",
    data: mapProfiles,
    pickable: true,
    opacity: 0.8,
    stroked: true,
    filled: true,
    radiusScale: 6,
    radiusMinPixels: 8,
    radiusMaxPixels: 100,
    lineWidthMinPixels: 1,
    getPosition: (d: MapProfile) => [d.longitude, d.latitude],
    getRadius: () => 30,
    getFillColor: () => [29, 78, 216, 160],
    getLineColor: () => [255, 255, 255, 255],
    onClick: ({ object }) => {
      if (object) {
        handleProfileClick(object as ProfileHitOptional);
      }
    },
  });

  if (status === "loading" && mapProfiles.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="flex items-center gap-3 text-blue-600">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-sm font-medium">Loading map...</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-[600px] items-center justify-center">
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
      <div className="flex h-[600px] items-center justify-center">
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
    <div className="relative h-[600px] w-full">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }) => setViewState(viewState)}
        controller={true}
        layers={[scatterplotLayer]} // Using scatterplot as fallback since we don't have icon atlas yet
      >
        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onLoad={() => {
            // Fit map to show all profiles
            if (mapProfiles.length > 0) {
              const viewport = new WebMercatorViewport(viewState);
              const bounds = mapProfiles.reduce(
                (acc, profile) => ({
                  minLng: Math.min(acc.minLng, profile.longitude),
                  maxLng: Math.max(acc.maxLng, profile.longitude),
                  minLat: Math.min(acc.minLat, profile.latitude),
                  maxLat: Math.max(acc.maxLat, profile.latitude),
                }),
                {
                  minLng: mapProfiles[0]!.longitude,
                  maxLng: mapProfiles[0]!.longitude,
                  minLat: mapProfiles[0]!.latitude,
                  maxLat: mapProfiles[0]!.latitude,
                },
              );

              const { longitude, latitude, zoom } = viewport.fitBounds(
                [
                  [bounds.minLng, bounds.minLat],
                  [bounds.maxLng, bounds.maxLat],
                ],
                { padding: 40 },
              );

              setViewState((prev) => ({
                ...prev,
                longitude,
                latitude,
                zoom: Math.min(zoom, 10), // Don't zoom in too much
              }));
            }
          }}
        />
      </DeckGL>

      {/* Profile Card Sidebar */}
      {selectedProfile && (
        <div className="absolute right-4 top-4 max-h-[500px] w-80 overflow-y-auto">
          <div className="rounded-lg border bg-white p-4 shadow-lg">
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
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform">
          <button
            onClick={() => showMore()}
            className="rounded-full bg-blue-600 px-4 py-2 text-white shadow-lg transition-colors hover:bg-blue-700"
          >
            Load More Profiles ({mapProfiles.length} shown)
          </button>
        </div>
      )}

      {/* Map Stats */}
      <div className="absolute left-4 top-4 rounded-lg bg-white px-3 py-2 shadow-lg">
        <div className="text-sm text-gray-600">
          Showing {mapProfiles.length} profiles with locations
        </div>
      </div>
    </div>
  );
}
