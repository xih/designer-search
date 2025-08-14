"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useInfiniteHits, useInstantSearch } from "react-instantsearch";
import { Map, Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import { useAtom } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import type { ProfileHitOptional } from "~/types/typesense";
import { ProfileAvatar } from "./ProfileAvatar";
import { MobileDrawer } from "./MobileDrawer";
import { DesktopSheet } from "./DesktopSheet";
import {
  profileDataAtom,
  profilesCompleteAtom,
  profilesLoadingAtom,
  initialLoadCompletedAtom,
  dynamicPageSizeAtom,
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
  selectedProfileId,
}: {
  profiles: MapProfile[];
  onProfileClick: (profile: ProfileHitOptional) => void;
  selectedProfileId?: string;
}) {
  return (
    <>
      {profiles.map((profile) => {
        const isSelected = selectedProfileId === profile.id;
        return (
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
                className={`shadow-lg ring-2 transition-all ${
                  isSelected
                    ? "scale-110 ring-4 ring-blue-500"
                    : "ring-white hover:ring-blue-500"
                }`}
              />
            </div>
          </Marker>
        );
      })}
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);

  // Global state management with Jotai
  const [profileData, setProfileData] = useAtom(profileDataAtom);
  const [isProfilesComplete, setIsProfilesComplete] =
    useAtom(profilesCompleteAtom);
  const [isLoading, setIsLoading] = useAtom(profilesLoadingAtom);
  const [initialLoadCompleted, setInitialLoadCompleted] = useAtom(
    initialLoadCompletedAtom,
  );
  const [dynamicPageSize, setDynamicPageSize] = useAtom(dynamicPageSizeAtom);

  // Process profiles with lat_lng_field coordinates
  const mapProfiles = useMemo(() => {
    // Use live search data if available, otherwise use global state
    const profilesToProcess = hitsItems.length > 0 ? hitsItems : profileData;

    if (!profilesToProcess || !Array.isArray(profilesToProcess)) return [];

    const profilesWithCoords: MapProfile[] = [];
    const locationCounts: Record<string, number> = {};

    profilesToProcess.forEach((profile) => {
      // Use lat_lng_field from Typesense geopoint field
      if (
        !profile?.lat_lng_field ||
        !Array.isArray(profile.lat_lng_field) ||
        profile.lat_lng_field.length !== 2
      ) {
        return;
      }

      const [latitude, longitude] = profile.lat_lng_field;

      // Track how many profiles are in each location for clustering
      const locationKey = `${latitude},${longitude}`;
      locationCounts[locationKey] = (locationCounts[locationKey] ?? 0) + 1;

      // Add small offset for profiles in the same city to prevent overlap
      const offset = (locationCounts[locationKey] - 1) * 0.005; // Smaller offset
      const angle = (locationCounts[locationKey] - 1) * 137.5 * (Math.PI / 180); // Golden angle

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
  const [isManuallyClosing, setIsManuallyClosing] = useState(false);
  const [lastManualCloseTime, setLastManualCloseTime] = useState(0);
  // 🔧 HYPOTHESIS: Remove snap points to eliminate pull-to-refresh conflicts
  // Regular drawer without snap points should not interfere with Chrome's pull-to-refresh
  const hasUserInteracted = useRef(false);

  // Check if device is mobile and add touch event debugging
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // 🔧 HYPOTHESIS: Debug touch events to identify pull-to-refresh conflicts
    const handleTouchStart = (e: TouchEvent) => {
      if (isDrawerOpen && isMobile) {
        console.log("🤏 [TOUCH-START] Touch started on mobile with drawer open:", {
          touches: e.touches.length,
          targetElement: (e.target as Element)?.tagName,
          clientY: e.touches[0]?.clientY,
          hypothesis: "Tracking pull-to-refresh conflicts",
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDrawerOpen && isMobile && e.touches[0]?.clientY < 100) {
        console.log("🤏 [TOUCH-MOVE] Touch moving near top of screen:", {
          clientY: e.touches[0]?.clientY,
          hypothesis: "Potential pull-to-refresh zone",
        });
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("resize", checkMobile);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDrawerOpen, isMobile]);

  const handleProfileClick = useCallback(
    (profile: ProfileHitOptional) => {
      console.log("📱 [PROFILE-CLICK] Profile clicked:", {
        profileName: profile.name,
        isMobile,
        isDrawerOpen,
        isSheetOpen,
        selectedProfile: selectedProfile?.name,
        isProfileSwitching,
      });

      // Mark that user has interacted with the map
      hasUserInteracted.current = true;

      // Create URL-friendly slug from profile name (more secure than raw ID)
      const profileSlug =
        profile.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || profile.id;

      // Update URL with profile slug for shareability
      const params = new URLSearchParams(searchParams.toString());
      params.set("profile", profileSlug);
      router.push(`?${params.toString()}`, { scroll: false });

      // Always zoom for manual clicks (this is triggered by avatar clicks, not URL effects)
      if (mapRef.current && profile.lat_lng_field) {
        mapRef.current.flyTo({
          center: [profile.lat_lng_field[1], profile.lat_lng_field[0]], // [longitude, latitude]
          zoom: 5,
          duration: 1000,
        });
      }

      // If sheet/drawer is already open, we're switching profiles
      if ((isMobile && isDrawerOpen) || (!isMobile && isSheetOpen)) {
        console.log("📱 [PROFILE-SWITCH] Switching profiles");
        setIsProfileSwitching(true);
        setSelectedProfile(profile);
        // Reset the switching flag after a brief delay
        setTimeout(() => {
          console.log(
            "📱 [PROFILE-SWITCH-RESET] Resetting profile switching flag",
          );
          setIsProfileSwitching(false);
        }, 100);
      } else {
        // First time opening
        console.log("📱 [FIRST-OPEN] First time opening drawer/sheet");
        setSelectedProfile(profile);
        if (isMobile) {
          console.log("📱 [DRAWER-OPEN] Setting drawer open to true");
          setIsDrawerOpen(true);
          setIsSheetOpen(false); // Ensure sheet is closed on mobile
        } else {
          console.log("📱 [SHEET-OPEN] Setting sheet open to true");
          setIsSheetOpen(true);
          setIsDrawerOpen(false); // Ensure drawer is closed on desktop
        }
      }
      onProfileSelect?.(profile);
    },
    [
      onProfileSelect,
      isMobile,
      isDrawerOpen,
      isSheetOpen,
      isProfileSwitching,
      selectedProfile,
      searchParams,
      router,
    ],
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
  }, [
    status,
    isLastPage,
    isLoading,
    showMore,
    hitsItems.length,
    isProfilesComplete,
    profileData.length,
    initialLoadCompleted,
    setInitialLoadCompleted,
    dynamicPageSize,
    setDynamicPageSize,
    setIsLoading,
  ]);

  // Mark profiles as complete when loading is done
  useEffect(() => {
    if (isLastPage && hitsItems.length > 0 && !isProfilesComplete) {
      setIsProfilesComplete(true);
      setIsLoading(false);
    }
  }, [
    isLastPage,
    hitsItems.length,
    isProfilesComplete,
    setIsProfilesComplete,
    setIsLoading,
  ]);

  // Check for profile slug/ID in URL on page load and auto-select profile
  useEffect(() => {
    const profileParam = searchParams.get("profile");

    console.log("🔗 [URL-EFFECT] URL profile param changed:", {
      profileParam,
      mapProfilesCount: mapProfiles.length,
      selectedProfile: selectedProfile?.name,
      isManuallyClosing,
      lastManualCloseTime,
    });

    // Don't process URL changes if we're manually closing or recently closed
    const timeSinceManualClose = Date.now() - lastManualCloseTime;
    if (isManuallyClosing || timeSinceManualClose < 2000) {
      // Increased timeout
      console.log("🔗 [URL-IGNORE] Ignoring URL change due to manual close");
      return;
    }

    if (profileParam && mapProfiles.length > 0 && !selectedProfile) {
      // Only treat as direct link if user hasn't interacted with the map yet
      // This prevents programmatic URL changes from triggering high zoom
      const isActualDirectLink = !hasUserInteracted.current;

      // Try to find by slug first (name-based), then fallback to ID
      const profileToSelect = mapProfiles.find((p) => {
        const slug =
          p.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") || p.id;
        return slug === profileParam || p.id === profileParam;
      });

      if (profileToSelect) {
        setSelectedProfile(profileToSelect);

        // Only zoom with high level for true direct links
        if (
          mapRef.current &&
          profileToSelect.lat_lng_field &&
          isActualDirectLink
        ) {
          setTimeout(() => {
            mapRef.current?.flyTo({
              center: [
                profileToSelect.lat_lng_field![1],
                profileToSelect.lat_lng_field![0],
              ],
              zoom: 10,
              duration: 2000,
            });
          }, 500); // Small delay to ensure map is ready
        }

        onProfileSelect?.(profileToSelect);
      }

      // Reset the flag after a short delay
      if (isActualDirectLink) {
        // Direct link handling completed
      }
    } else if (!profileParam && selectedProfile && !isManuallyClosing) {
      setSelectedProfile(null);
      setIsSheetOpen(false);
      setIsDrawerOpen(false);
    }
  }, [
    searchParams,
    mapProfiles,
    selectedProfile,
    onProfileSelect,
    isManuallyClosing,
    lastManualCloseTime,
  ]);

  // Open sheet/drawer when profile is selected for the first time
  useEffect(() => {
    console.log("📱 [DRAWER-EFFECT] Profile selection effect triggered:", {
      selectedProfile: selectedProfile?.name,
      isMobile,
      isDrawerOpen,
      isSheetOpen,
      isProfileSwitching,
      isManuallyClosing,
    });

    // Don't auto-open if we're manually closing
    if (isManuallyClosing) {
      console.log("📱 [DRAWER-EFFECT-SKIP] Skipping due to manual closing");
      return;
    }

    if (selectedProfile) {
      if (isMobile && !isDrawerOpen) {
        console.log("📱 [DRAWER-EFFECT-OPEN] Opening drawer from effect");
        setIsDrawerOpen(true);
        setIsSheetOpen(false); // Ensure sheet is closed on mobile
      } else if (!isMobile && !isSheetOpen) {
        console.log("📱 [SHEET-EFFECT-OPEN] Opening sheet from effect");
        setIsSheetOpen(true);
        setIsDrawerOpen(false); // Ensure drawer is closed on desktop
      }
    } else if (!isManuallyClosing) {
      console.log(
        "📱 [DRAWER-EFFECT-CLEAR] No selected profile, clearing states",
      );
      if (isSheetOpen) {
        console.log("📱 [SHEET-EFFECT-CLOSE] Closing sheet from effect");
        setIsSheetOpen(false);
      }
      if (isDrawerOpen) {
        console.log("📱 [DRAWER-EFFECT-CLOSE] Closing drawer from effect");
        setIsDrawerOpen(false);
      }
    }
  }, [
    selectedProfile,
    isMobile,
    isDrawerOpen,
    isSheetOpen,
    isManuallyClosing,
    isProfileSwitching,
  ]);

  if (status === "loading" && mapProfiles.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-blue-600">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <div className="text-center">
            <div className="text-lg font-medium">Loading Globe View</div>
            <div className="text-sm text-gray-500">
              Auto-loading all profiles...
            </div>
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
        ref={mapRef}
        initialViewState={{
          longitude: -122.4194,
          latitude: 37.7749,
          zoom: 2,
        }}
        style={{ width: "100vw", height: "100vh" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ""}
        onClick={(e) => {
          const features = e.features;

          console.log("🗺️ [MAP-CLICK] Map clicked:", {
            featuresCount: features?.length ?? 0,
            isMobile,
            isDrawerOpen,
            isSheetOpen,
            selectedProfile: selectedProfile?.name,
            eventTarget: e.originalEvent?.target,
            eventPhase: e.originalEvent?.eventPhase,
            coordinates: e.lngLat,
          });

          // DESKTOP LOGIC: Close sheet on any empty map click
          if (!isMobile && (!features || features.length === 0)) {
            console.log(
              "🗺️ [DESKTOP-CLOSE] Closing desktop sheet on empty map click",
            );

            // Record the time of manual close and set flag
            const closeTime = Date.now();
            setLastManualCloseTime(closeTime);
            setIsManuallyClosing(true);

            setSelectedProfile(null);
            setIsSheetOpen(false);

            // Clear profile from URL when closing
            const params = new URLSearchParams(searchParams.toString());
            params.delete("profile");

            router.push(`?${params.toString()}`, { scroll: false });

            // Reset the flag after URL has time to update
            setTimeout(() => {
              console.log(
                "🗺️ [MANUAL-CLOSE-RESET] Resetting manual closing flag",
              );
              setIsManuallyClosing(false);
            }, 500);
          }
          // MOBILE LOGIC: Close drawer on empty map click when drawer is open
          else if (
            isMobile &&
            (!features || features.length === 0) &&
            isDrawerOpen
          ) {
            console.log(
              "🗺️ [MOBILE-CLOSE] Closing mobile drawer on empty map click",
              {
                hasSelectedProfile: !!selectedProfile,
                drawerState: isDrawerOpen,
                featuresLength: features?.length,
                hypothesis: "Clear selectedProfile to prevent reopening",
              },
            );

            // Record the time of manual close and set flag
            const closeTime = Date.now();
            setLastManualCloseTime(closeTime);
            setIsManuallyClosing(true);

            // Clear selectedProfile to prevent effect from reopening drawer
            setSelectedProfile(null);
            setIsDrawerOpen(false);

            // Clear profile from URL when closing
            const params = new URLSearchParams(searchParams.toString());
            params.delete("profile");
            router.push(`?${params.toString()}`, { scroll: false });

            // Reset the flag after URL has time to update
            setTimeout(() => {
              console.log(
                "🗺️ [MOBILE-MANUAL-CLOSE-RESET] Resetting manual closing flag",
              );
              setIsManuallyClosing(false);
            }, 500);
          } else {
            console.log(
              "🗺️ [MAP-IGNORE] Map click ignored - clicked on feature or conditions not met",
              {
                reason: isMobile
                  ? !isDrawerOpen
                    ? "drawer not open"
                    : "clicked on feature or other condition"
                  : "not mobile or clicked on feature",
                isMobile,
                isDrawerOpen,
                hasFeatures: features && features.length > 0,
                selectedProfile: selectedProfile?.name,
              },
            );
          }
        }}
      >
        {/* ProfileAvatar Markers */}
        <ProfileAvatarOverlay
          profiles={mapProfiles}
          onProfileClick={handleProfileClick}
          selectedProfileId={selectedProfile?.id}
        />
      </Map>

      {/* Desktop Sheet for Profile Details */}
      {!isMobile && (
        <DesktopSheet
          isOpen={isSheetOpen}
          selectedProfile={selectedProfile}
          onOpenChange={setIsSheetOpen}
        />
      )}

      {/* Mobile Drawer for Profile Details */}
      {isMobile && (
        <MobileDrawer
          isOpen={isDrawerOpen}
          selectedProfile={selectedProfile}
          isProfileSwitching={isProfileSwitching}
          isManuallyClosing={isManuallyClosing}
          onOpenChange={(open) => {
            // 🔧 HYPOTHESIS: Let vaul handle closing smoothly instead of forcing immediate state changes
            if (!open && !isProfileSwitching && !isManuallyClosing) {
              console.log("📱 [DRAWER-SMOOTH-CLOSE] Allowing vaul to close smoothly");

              // Set manual closing flag to prevent race conditions
              const closeTime = Date.now();
              setLastManualCloseTime(closeTime);
              setIsManuallyClosing(true);

              // 🔧 HYPOTHESIS: Use setTimeout to allow animation to complete
              setTimeout(() => {
                console.log("📱 [DRAWER-DELAYED-CLOSE] Executing delayed close actions");
                
                // Clear profile from URL when closing
                const params = new URLSearchParams(searchParams.toString());
                params.delete("profile");
                router.push(`?${params.toString()}`, { scroll: false });

                setIsDrawerOpen(false);
                setSelectedProfile(null);

                // Reset flag after delay
                setTimeout(() => {
                  console.log("📱 [DRAWER-CLOSE-COMPLETE] Close animation complete");
                  setIsManuallyClosing(false);
                }, 300);
              }, 200); // Allow animation time
            }
          }}
          onClose={() => {
            console.log(
              "📱 [DRAWER-X-CLICK] X button clicked to close drawer",
            );

            // Set manual closing flag FIRST to prevent race conditions
            const closeTime = Date.now();
            setLastManualCloseTime(closeTime);
            setIsManuallyClosing(true);

            // Clear states immediately
            setIsDrawerOpen(false);
            setSelectedProfile(null);

            // Clear profile from URL when closing
            const params = new URLSearchParams(
              searchParams.toString(),
            );
            params.delete("profile");
            router.push(`?${params.toString()}`, {
              scroll: false,
            });

            // Reset the flag after a longer delay to prevent URL restoration
            setTimeout(() => {
              console.log(
                "📱 [MANUAL-CLOSE-RESET] Resetting manual closing flag",
              );
              setIsManuallyClosing(false);
            }, 2000); // Increased timeout
          }}
        />
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
    </div>
  );
}
