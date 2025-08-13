"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useInfiniteHits, useInstantSearch } from "react-instantsearch";
import { Map, Marker } from "react-map-gl/mapbox";
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import type { ProfileHitOptional } from "~/types/typesense";
import { ProfileCard } from "./ProfileCard";
import { ProfileAvatar } from "./ProfileAvatar";
import { 
  profileDataAtom, 
  profilesCompleteAtom, 
  profilesLoadingAtom,
  initialLoadCompletedAtom,
  dynamicPageSizeAtom,
  storageStatsAtom,
  clearProfileCacheAtom
} from "~/lib/store";

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


export function ProfileMapView({ onProfileSelect }: ProfileMapViewProps) {
  const {
    items: hitsItems,
    showMore,
    isLastPage,
  } = useInfiniteHits<ProfileHitOptional>();
  const { status } = useInstantSearch();
  const [selectedProfile, setSelectedProfile] =
    useState<ProfileHitOptional | null>(null);

  // Global state management with Jotai
  const [profileData, setProfileData] = useAtom(profileDataAtom);
  const [isProfilesComplete, setIsProfilesComplete] = useAtom(profilesCompleteAtom);
  const [isLoading, setIsLoading] = useAtom(profilesLoadingAtom);
  const [initialLoadCompleted, setInitialLoadCompleted] = useAtom(initialLoadCompletedAtom);
  const [dynamicPageSize, setDynamicPageSize] = useAtom(dynamicPageSizeAtom);
  const storageStats = useAtomValue(storageStatsAtom);
  const clearCache = useSetAtom(clearProfileCacheAtom);
  const [previousLength, setPreviousLength] = useState(0);

  // Process profiles with lat_lng_field coordinates
  const mapProfiles = useMemo(() => {
    // Use live search data if available, otherwise use global state
    const profilesToProcess = (hitsItems.length > 0) ? hitsItems : profileData;
    
    if (!profilesToProcess || !Array.isArray(profilesToProcess)) return [];

    const profilesWithCoords: MapProfile[] = [];
    const locationCounts: Record<string, number> = {};

    profilesToProcess.forEach((profile) => {
      // Use lat_lng_field from Typesense geopoint field
      if (!profile?.lat_lng_field || !Array.isArray(profile.lat_lng_field) || profile.lat_lng_field.length !== 2) {
        return;
      }

      const [latitude, longitude] = profile.lat_lng_field;

      // Track how many profiles are in each location for clustering
      const locationKey = `${latitude},${longitude}`;
      locationCounts[locationKey] = (locationCounts[locationKey] ?? 0) + 1;

      // Add small offset for profiles in the same city to prevent overlap
      const offset = (locationCounts[locationKey] - 1) * 0.005; // Smaller offset
      const angle =
        (locationCounts[locationKey] - 1) * 137.5 * (Math.PI / 180); // Golden angle

      profilesWithCoords.push({
        ...profile,
        longitude: longitude + Math.cos(angle) * offset,
        latitude: latitude + Math.sin(angle) * offset,
      });
    });

    return profilesWithCoords;
  }, [hitsItems, profileData]);

  const handleProfileClick = useCallback(
    (profile: ProfileHitOptional) => {
      setSelectedProfile(profile);
      onProfileSelect?.(profile);
    },
    [onProfileSelect],
  );

  // Sync live search data to global state with storage monitoring
  useEffect(() => {
    if (hitsItems.length > 0) {
      setProfileData(hitsItems);
      console.log('🔄 Updated global state with:', hitsItems.length, 'profiles');
      console.log('📊 Storage stats:', {
        size: `${storageStats.currentSizeKB}KB`,
        profiles: storageStats.profileCount,
        maxCached: storageStats.maxCachedProfiles
      });
    }
  }, [hitsItems, setProfileData, storageStats.currentSizeKB, storageStats.profileCount, storageStats.maxCachedProfiles]);

  // Debug logging for batch sizes
  useEffect(() => {
    if (hitsItems.length !== previousLength) {
      const batchSize = hitsItems.length - previousLength;
      console.log('📊 Batch loaded:', batchSize, 'Total:', hitsItems.length);
      setPreviousLength(hitsItems.length);
    }
  }, [hitsItems.length, previousLength]);

  // Progressive auto-loading: Load initial 50, then continue with larger batches
  useEffect(() => {
    if (status === "loading" || isLastPage || isLoading) return;
    // Skip auto-loading if we already have complete data in global state
    if (isProfilesComplete && profileData.length > 0) return;

    const autoLoadMore = () => {
      setIsLoading(true);
      
      // Switch to larger page size after first 50 profiles
      if (!initialLoadCompleted && hitsItems.length >= 50) {
        console.log('✅ Initial 50 profiles loaded, switching to larger page size (500)');
        setDynamicPageSize(500);
        setInitialLoadCompleted(true);
        setIsLoading(false);
        // Continue loading with larger batches after a short delay
        setTimeout(() => {
          if (!isLastPage) {
            console.log('🔄 Continuing with larger batches...');
            showMore();
          }
        }, 200);
        return;
      }
      
      console.log('🔄 Calling showMore(), current items:', hitsItems.length, 'page size:', dynamicPageSize);
      showMore();
      
      // Reset after a delay
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    // For initial load, be more responsive (shorter delay)
    const delay = !initialLoadCompleted && hitsItems.length < 50 ? 100 : 300;
    const timer = setTimeout(autoLoadMore, delay);
    return () => clearTimeout(timer);
  }, [status, isLastPage, isLoading, showMore, hitsItems.length, isProfilesComplete, profileData.length, initialLoadCompleted, setInitialLoadCompleted, dynamicPageSize, setDynamicPageSize, setIsLoading]);

  // Mark profiles as complete when loading is done
  useEffect(() => {
    if (isLastPage && hitsItems.length > 0 && !isProfilesComplete) {
      setIsProfilesComplete(true);
      setIsLoading(false);
      console.log('✅ All profiles loaded and cached globally:', hitsItems.length);
    }
  }, [isLastPage, hitsItems.length, isProfilesComplete, setIsProfilesComplete, setIsLoading]);


  if (status === "loading" && mapProfiles.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-blue-600">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <div className="text-center">
            <div className="text-lg font-medium">Loading Globe View</div>
            <div className="text-sm text-gray-500">Auto-loading all profiles...</div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error" && mapProfiles.length === 0) {
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

  if (mapProfiles.length === 0 && status !== "loading") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-500">
            No profiles with coordinates found
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

      {/* Auto-loading Status */}
      {(isLoading || !isLastPage) && mapProfiles.length > 0 && (
        <div className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 transform">
          <div className="flex items-center gap-3 rounded-full bg-blue-600 px-4 py-2 text-white shadow-xl backdrop-blur-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-sm">
              Auto-loading profiles... ({hitsItems.length.toLocaleString()})
            </span>
          </div>
        </div>
      )}

      {/* Map Stats */}
      <div className="absolute left-4 top-4 z-40 rounded-lg bg-white/90 px-3 py-2 shadow-xl backdrop-blur-sm">
        <div className="text-sm text-gray-600">
          <div>
            {hitsItems.length > 0 ? 'Live' : 'Cached'}: {hitsItems.length > 0 ? hitsItems.length.toLocaleString() : profileData.length.toLocaleString()} profiles
          </div>
          <div>With coordinates: {mapProfiles.length.toLocaleString()}</div>
          
          {/* Storage Stats */}
          <div className="text-xs text-gray-500 mt-1">
            Storage: {storageStats.currentSizeKB}KB
            {storageStats.profileCount >= storageStats.maxCachedProfiles && (
              <span className="text-blue-600 font-medium"> 📦 Cache full</span>
            )}
          </div>
          
          {profileData.length > 0 && hitsItems.length === 0 && (
            <div className="mt-1 text-xs text-purple-600 font-medium">
              💾 Using cached data
            </div>
          )}
          {!isLastPage && hitsItems.length > 0 && (
            <div className="mt-1 text-xs text-blue-600 font-medium">
              Auto-loading... (Page size: {dynamicPageSize})
            </div>
          )}
          {(isLastPage || isProfilesComplete) && (
            <div className="mt-1 text-xs text-green-600 font-medium">
              ✓ All profiles loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
