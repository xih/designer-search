"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useInfiniteHits, useInstantSearch } from "react-instantsearch";
import { Map, Marker } from "react-map-gl/mapbox";
import { useAtom } from 'jotai';
import { Drawer } from 'vaul';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetPortal,
  SheetOverlay,
} from "~/components/ui/sheet";
import type { ProfileHitOptional } from "~/types/typesense";
import { ProfileCard } from "./ProfileCard";
import { ProfileAvatar } from "./ProfileAvatar";
import { 
  profileDataAtom, 
  profilesCompleteAtom, 
  profilesLoadingAtom,
  initialLoadCompletedAtom,
  dynamicPageSizeAtom
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
            onClick={(e) => {
              e.stopPropagation(); // Prevent map click event
              onProfileClick(profile);
            }}
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

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileSwitching, setIsProfileSwitching] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleProfileClick = useCallback(
    (profile: ProfileHitOptional) => {
      // If sheet/drawer is already open, we're switching profiles
      if ((isMobile && isDrawerOpen) || (!isMobile && isSheetOpen)) {
        setIsProfileSwitching(true);
        setSelectedProfile(profile);
        // Reset the switching flag after a brief delay
        setTimeout(() => {
          setIsProfileSwitching(false);
        }, 100);
      } else {
        // First time opening
        setSelectedProfile(profile);
        if (isMobile) {
          setIsDrawerOpen(true);
        } else {
          setIsSheetOpen(true);
        }
      }
      onProfileSelect?.(profile);
    },
    [onProfileSelect, isMobile, isDrawerOpen, isSheetOpen, isProfileSwitching, selectedProfile],
  );

  // Sync live search data to global state
  useEffect(() => {
    if (hitsItems.length > 0) {
      setProfileData(hitsItems);
    }
  }, [hitsItems, setProfileData]);


  // Progressive auto-loading: Load initial 50, then continue with larger batches
  useEffect(() => {
    if (status === "loading" || isLastPage || isLoading) return;
    // Skip auto-loading if we already have complete data in global state
    if (isProfilesComplete && profileData.length > 0) return;

    const autoLoadMore = () => {
      setIsLoading(true);
      
      // Switch to larger page size after first 50 profiles
      if (!initialLoadCompleted && hitsItems.length >= 50) {
        setDynamicPageSize(500);
        setInitialLoadCompleted(true);
        setIsLoading(false);
        // Continue loading with larger batches after a short delay
        setTimeout(() => {
          if (!isLastPage) {
            showMore();
          }
        }, 200);
        return;
      }
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
    }
  }, [isLastPage, hitsItems.length, isProfilesComplete, setIsProfilesComplete, setIsLoading]);

  // Open sheet/drawer when profile is selected for the first time
  useEffect(() => {
    if (selectedProfile) {
      if (isMobile && !isDrawerOpen) {
        setIsDrawerOpen(true);
      } else if (!isMobile && !isSheetOpen) {
        setIsSheetOpen(true);
      }
    }
  }, [selectedProfile, isMobile, isDrawerOpen, isSheetOpen]);


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
        onClick={(e) => {
          // Only close sheet/drawer if clicking on empty map (not on markers)
          const features = e.features;
          if (!features || features.length === 0) {
            setSelectedProfile(null);
            setIsSheetOpen(false);
            setIsDrawerOpen(false);
          }
        }}
      >
        {/* ProfileAvatar Markers */}
        <ProfileAvatarOverlay
          profiles={mapProfiles}
          onProfileClick={handleProfileClick}
        />
      </Map>

      {/* Desktop Sheet for Profile Details */}
      <Sheet 
        open={!isMobile && isSheetOpen} 
        modal={false}
        onOpenChange={(open) => {
          // Only respond to manual close events from the X button
          // Ignore automatic close events that happen during profile switching
          if (open && !isSheetOpen) {
            setIsSheetOpen(true);
          }
          // Note: We handle closing through our manual controls only
        }}
      >
        <SheetPortal>
          {/* Custom overlay with no opacity */}
          <SheetOverlay className="bg-transparent backdrop-blur-none" />
          <SheetContent 
            side="right" 
            className="w-[400px] sm:w-[540px]" 
          >
            <SheetHeader>
              <SheetTitle>Profile Details</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {selectedProfile && <ProfileCard profile={selectedProfile} />}
            </div>
          </SheetContent>
        </SheetPortal>
      </Sheet>

      {/* Mobile Drawer for Profile Details */}
      <Drawer.Root 
        open={isDrawerOpen} 
        onOpenChange={(open) => {
          // Don't close the drawer if we're just switching profiles
          if (!open && !isProfileSwitching) {
            setIsDrawerOpen(false);
            setSelectedProfile(null);
          } else if (open && !isDrawerOpen) {
            setIsDrawerOpen(true);
          }
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[85%] flex-col rounded-t-[10px] bg-white">
            <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-gray-300" />
            <div className="flex-1 overflow-y-auto p-4">
              {selectedProfile && (
                <>
                  <div className="mb-4 flex items-start justify-between">
                    <Drawer.Title className="text-xl font-semibold">
                      Profile Details
                    </Drawer.Title>
                    <button
                      onClick={() => {
                        setIsDrawerOpen(false);
                        setSelectedProfile(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="h-6 w-6"
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
                </>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

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

    </div>
  );
}
