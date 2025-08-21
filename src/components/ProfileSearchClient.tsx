"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  InstantSearch,
  Stats,
  SortBy,
  Configure,
  useInstantSearch,
  useSearchBox,
  useInfiniteHits,
} from "react-instantsearch";
import { Masonry } from "masonic";
import useMeasure from "react-use-measure";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAtom, useAtomValue } from "jotai";
import { useRouter, useSearchParams } from "next/navigation";
import { searchClient } from "~/lib/typesense";
import { ProfileHitMasonry } from "./ProfileHitMasonry";
import { ViewSwitcher, type ViewType } from "./ViewSwitcher";
import { ProfileDataTable } from "./ProfileDataTable";
import { ProfileMapView } from "./ProfileMapView";
import { QuickFilterTabs } from "./QuickFilterTabs";
import { StickySearchHeader } from "./StickySearchHeader";
import { SearchStats } from "./SearchStats";
import type { ProfileHitOptional } from "~/types/typesense";
import { Search, Info } from "lucide-react";
import { Input } from "~/components/ui/input";
import { ProfileSkeleton } from "~/components/ProfileSkeleton";
import {
  profileDataAtom,
  profilesCompleteAtom,
  profilesLoadingAtom,
  dynamicPageSizeAtom,
  initialLoadCompletedAtom,
  storageStatsAtom,
} from "~/lib/store";
import { AnimatePresence } from "motion/react";

interface ProfileSearchProps {
  indexName?: string;
  showFilters?: boolean;
  placeholder?: string;
  className?: string;
}

// Default suggestions shown when input is empty and focused
const DefaultSearchSuggestions = React.memo(function DefaultSearchSuggestions({
  onSuggestionSelect,
  isVisible,
}: {
  onSuggestionSelect: (suggestion: string) => void;
  isVisible: boolean;
}) {
  const defaultSuggestions = [
    // Roles
    {
      category: "Role",
      items: [
        "design engineer",
        "product designer",
        "brand designer",
        "researcher",
      ],
    },
    // Companies
    {
      category: "Companies",
      items: ["apple", "google", "meta", "facebook", "openai", "deepmind"],
    },
    // Locations
    {
      category: "Locations",
      items: ["san francisco", "new york", "worldwide"],
    },
  ];

  if (!isVisible) return null;

  return (
    <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="p-4">
        {defaultSuggestions.map((section) => (
          <div key={section.category} className="mb-4 last:mb-0">
            <h4 className="mb-2 text-sm font-medium text-gray-900">
              {section.category}
            </h4>
            <div className="flex flex-wrap gap-2">
              {section.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent blur event on input
                    onSuggestionSelect(item);
                  }}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Dynamic suggestions dropdown component with React.memo
const SearchSuggestions = React.memo(function SearchSuggestions({
  query,
  onSuggestionSelect,
  isVisible,
  profileData,
}: {
  query: string;
  onSuggestionSelect: (suggestion: string) => void;
  isVisible: boolean;
  profileData: ProfileHitOptional[];
}) {
  // Generate suggestions with optimized memoization
  const suggestions = useMemo(() => {
    if (!query || query.length < 2 || !profileData?.length) {
      return [];
    }

    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();

    // Optimized single pass through limited data
    const profileSubset = profileData.slice(0, 20);

    for (const hit of profileSubset) {
      if (suggestions.size >= 6) break;

      // Add profile names
      if (
        hit?.name &&
        suggestions.size < 3 &&
        hit.name.toLowerCase().includes(lowerQuery)
      ) {
        suggestions.add(hit.name);
      }

      // Add companies
      if (hit?.companies && suggestions.size < 6) {
        for (const company of hit.companies) {
          if (company.toLowerCase().includes(lowerQuery)) {
            suggestions.add(company);
            if (suggestions.size >= 6) break;
          }
        }
      }

      // Add locations
      if (
        hit?.location &&
        suggestions.size < 6 &&
        hit.location.toLowerCase().includes(lowerQuery)
      ) {
        suggestions.add(hit.location);
      }
    }

    return Array.from(suggestions).slice(0, 6);
  }, [query, profileData]);

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="py-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent blur event on input
              onSuggestionSelect(suggestion);
            }}
            className="flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <Search className="mr-3 h-4 w-4 text-gray-400" />
            <span>{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
});

// Optimized search box component with autocomplete
export function DebouncedSearchBox({ placeholder }: { placeholder: string }) {
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [profileData] = useAtom(profileDataAtom);

  // Memoize profile data to prevent unnecessary re-renders
  const memoizedProfileData = useMemo(() => profileData, [profileData.length]);

  const debouncedRefine = useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        refine(value);
      }, 150);
    },
    [refine],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);
      debouncedRefine(value);
      setShowSuggestions(value.length >= 2);
    },
    [debouncedRefine],
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    refine("");
    setShowSuggestions(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    inputRef.current?.focus();
  }, [refine]);

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      console.log("🔍 Suggestion selected:", suggestion); // Debug log

      // Clear any pending debounced calls
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Update input value and execute search immediately
      setInputValue(suggestion);
      refine(suggestion); // Execute search immediately
      setShowSuggestions(false);

      // Keep focus on input instead of blurring
      // inputRef.current?.blur();
    },
    [refine],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    // Show suggestions when focused, regardless of input length (for default suggestions)
    setShowSuggestions(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  // Update input value when query changes externally
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="rounded-lg border-0 py-3 pl-10 pr-10 text-lg text-gray-900 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
        style={{
          backgroundColor: "#F7F7F7",
          fontFamily: "ABCDiatypePlusVariable, system-ui, sans-serif",
        }}
        autoComplete="off"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          type="button"
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
      )}

      {/* Show default suggestions when input is empty and focused */}
      {inputValue.length === 0 ? (
        <DefaultSearchSuggestions
          onSuggestionSelect={handleSuggestionSelect}
          isVisible={showSuggestions && isFocused}
        />
      ) : (
        /* Show dynamic suggestions when user is typing */
        <SearchSuggestions
          query={inputValue}
          onSuggestionSelect={handleSuggestionSelect}
          isVisible={showSuggestions && isFocused && inputValue.length >= 2}
          profileData={memoizedProfileData}
        />
      )}
    </div>
  );
}

// Custom Infinite Masonry Hits component
function InfiniteMasonryHits({
  selectedProfileId,
  onProfileSelect,
}: {
  selectedProfileId: string | null;
  onProfileSelect: (profileId: string | null) => void;
}) {
  const {
    items: hitsItems,
    isLastPage,
    showMore,
  } = useInfiniteHits<ProfileHitOptional>();
  const { status, results, error } = useInstantSearch();
  const [ref, { width }] = useMeasure();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [masonryKey, setMasonryKey] = useState(0);
  const [masonryError, setMasonryError] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Debug logging to understand the loading states and errors
  useEffect(() => {
    console.log("🔍 InfiniteMasonryHits Debug Info:", {
      status,
      hitsItemsLength: hitsItems.length,
      isLastPage,
      results: results
        ? {
            nbHits: results.nbHits,
            processingTimeMS: results.processingTimeMS,
            query: results.query,
            page: results.page,
          }
        : null,
      searchClient: typeof searchClient,
      timestamp: new Date().toISOString(),
    });

    // Log first few items for debugging
    if (hitsItems.length > 0) {
      console.log(
        "📦 First 3 items:",
        hitsItems.slice(0, 3).map((item) => ({
          id: item.id,
          name: item.name,
          hasId: !!item.id,
          keys: Object.keys(item),
        })),
      );
    }
  }, [status, hitsItems.length, isLastPage, results, error]);

  // Global state management with Jotai
  const [profileData, setProfileData] = useAtom(profileDataAtom);
  const [isProfilesComplete, setIsProfilesComplete] =
    useAtom(profilesCompleteAtom);
  const [globalLoading, setGlobalLoading] = useAtom(profilesLoadingAtom);

  // Debug log for selected profile in InfiniteMasonryHits
  useEffect(() => {
    console.log(
      "📊 InfiniteMasonryHits - Selected Profile ID:",
      selectedProfileId,
    );
  }, [selectedProfileId]);

  // Sync live search data to global state (optimized to prevent excessive updates)
  const prevHitsLength = useRef(0);
  useEffect(() => {
    if (hitsItems.length > 0 && hitsItems.length !== prevHitsLength.current) {
      setProfileData(hitsItems);
      setHasInitiallyLoaded(true);
      prevHitsLength.current = hitsItems.length;
    }
  }, [hitsItems.length, setProfileData]);

  // Mark profiles as complete when loading is done
  useEffect(() => {
    if (isLastPage && hitsItems.length > 0 && !isProfilesComplete) {
      setIsProfilesComplete(true);
      setGlobalLoading(false);
    }
  }, [
    isLastPage,
    hitsItems.length,
    isProfilesComplete,
    setIsProfilesComplete,
    setGlobalLoading,
  ]);

  // Handle infinite scroll loading
  const handleShowMore = useCallback(() => {
    if (isLoadingMore || isLastPage || globalLoading) return;

    setIsLoadingMore(true);
    setGlobalLoading(true);
    showMore();
    // Reset loading state after a longer delay to allow results to load
    setTimeout(() => {
      setIsLoadingMore(false);
      setGlobalLoading(false);
    }, 800);
  }, [showMore, isLastPage, isLoadingMore, globalLoading, setGlobalLoading]);

  // Intersection observer for infinite scroll
  const [loadMoreRef, setLoadMoreRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef || isLastPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !isLoadingMore) {
          handleShowMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef);
    return () => observer.disconnect();
  }, [loadMoreRef, isLastPage, isLoadingMore, handleShowMore]);

  // Track data source to detect changes and force Masonic reset
  const [previousDataSource, setPreviousDataSource] = useState<
    "hits" | "cache" | null
  >(null);

  // Track previous array length to detect size changes
  const [previousArrayLength, setPreviousArrayLength] = useState(0);

  const masonryItems = useMemo(() => {
    // Use live search data if available, otherwise use global state
    const profilesToProcess = hitsItems.length > 0 ? hitsItems : profileData;
    const currentDataSource = hitsItems.length > 0 ? "hits" : "cache";

    if (!profilesToProcess || !Array.isArray(profilesToProcess)) {
      return [];
    }

    const filteredItems = profilesToProcess
      .filter((hit) => {
        // More robust filtering - ensure hit exists and has required properties
        return (
          hit &&
          typeof hit === "object" &&
          hit.id &&
          typeof hit.id === "string" &&
          hit.id.length > 0
        );
      })
      .map((hit, index) => ({
        id: hit.id,
        hit: hit,
        index,
        isSelected: selectedProfileId === hit.id, // Include selection state in data
      }));

    // Only reset Masonic when data source changes OR array shrinks significantly
    // Don't reset for selection changes or minor data updates
    const shouldReset =
      (previousDataSource !== null &&
        previousDataSource !== currentDataSource) ||
      (filteredItems.length < previousArrayLength && previousArrayLength > 0 && 
       Math.abs(filteredItems.length - previousArrayLength) > 5); // Only reset for significant changes

    if (shouldReset) {
      setMasonryKey((prev) => prev + 1);
      setMasonryError(false); // Reset error state when resetting
    }

    setPreviousDataSource(currentDataSource);
    setPreviousArrayLength(filteredItems.length);

    return filteredItems;
  }, [
    hitsItems.length,
    profileData.length,
    previousDataSource,
    previousArrayLength,
    selectedProfileId, // Add this so selection state is included in data
  ]);

  const renderMasonryItem = useCallback(
    ({
      data,
    }: {
      index: number;
      data: { hit: ProfileHitOptional; index: number; isSelected: boolean };
    }) => {
      return (
        <ProfileHitMasonry
          hit={data.hit}
          index={data.index}
          isSelected={data.isSelected} // Use selection state from data
          onSelect={onProfileSelect}
        />
      );
    },
    [onProfileSelect], // Remove selectedProfileId dependency
  );

  // Error handler for Masonry component
  const handleMasonryError = useCallback(() => {
    setMasonryError(true);
    setMasonryKey((prev) => prev + 1);
  }, []);

  // Stable fallback grid renderer
  const renderFallbackGrid = useCallback(
    () => (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {masonryItems.map((item) => (
          <ProfileHitMasonry
            key={item.id}
            hit={item.hit}
            index={item.index}
            isSelected={item.isSelected} // Use selection state from data
            onSelect={onProfileSelect}
          />
        ))}
      </div>
    ),
    [masonryItems, onProfileSelect], // Remove selectedProfileId dependency
  );

  // Determine which content to render - MOVED BEFORE CONDITIONAL RETURNS
  const shouldUseFallback = masonryError || width === 0;
  const masonryContent = useMemo(() => {
    console.log(`🏗️ Masonry Content Re-computation:`, {
      masonryKey,
      itemCount: masonryItems.length,
      shouldUseFallback,
      width,
      masonryError,
      timestamp: new Date().toISOString(),
    });
    
    if (shouldUseFallback) {
      return renderFallbackGrid();
    }

    try {
      return (
        <Masonry
          key={masonryKey}
          items={masonryItems}
          render={renderMasonryItem}
          columnGutter={16}
          columnWidth={width < 768 ? Math.floor((width - 32) / 2) : 280}
          overscanBy={2}
          itemKey={(item) => item?.id || `fallback-${Math.random()}`}
        />
      );
    } catch (error) {
      // Note: We can't call handleMasonryError here as it would change state during render
      // Instead, we'll use an effect to handle this
      return renderFallbackGrid();
    }
  }, [
    shouldUseFallback,
    renderFallbackGrid,
    masonryKey,
    masonryItems,
    renderMasonryItem,
    width,
    // Removed selectedProfileId - selection state is handled by individual cards
  ]);

  // Handle Masonry errors in an effect - MOVED BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    if (shouldUseFallback && !masonryError) {
      // Only set error state if not already set
      if (width === 0) return; // Don't set error for width measurement
      handleMasonryError();
    }
  }, [shouldUseFallback, masonryError, width, handleMasonryError]);

  // Handle initial loading state - ENHANCED with better debugging and logic
  const shouldShowSkeleton =
    (status === "loading" || status === "stalled") &&
    masonryItems.length === 0 &&
    profileData.length === 0 && // Also check cached data
    !hasInitiallyLoaded; // Prevent showing after initial load

  console.log("🔄 Loading state check:", {
    status,
    masonryItemsLength: masonryItems.length,
    profileDataLength: profileData.length,
    hitsItemsLength: hitsItems.length,
    hasInitiallyLoaded,
    shouldShowSkeleton,
    timestamp: new Date().toISOString(),
  });

  if (shouldShowSkeleton) {
    console.log("✨ Showing initial loading skeletons");
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProfileSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  // Handle error state - ENHANCED with debugging
  if (status === "error") {
    console.error("🚨 Error state triggered:", {
      error,
      status,
      results,
      hitsItemsLength: hitsItems.length,
      masonryItemsLength: masonryItems.length,
      profileDataLength: profileData.length,
      searchClient: typeof searchClient,
      indexName: process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME,
      host:
        process.env.NEXT_PUBLIC_TYPESENSE_HOST2 ??
        process.env.NEXT_PUBLIC_TYPESENSE_HOST,
    });

    return (
      <div className="py-12 text-center">
        <div className="text-lg text-red-500">Error loading profiles</div>
        <div className="mt-2 text-sm text-gray-400">
          Please try refreshing the page
        </div>
        {error && (
          <div className="mx-auto mt-4 max-w-md text-xs text-gray-400">
            Error: {error.message}
          </div>
        )}
      </div>
    );
  }

  // Handle no results - ENHANCED with debugging and better logic
  if (masonryItems.length === 0 && hasInitiallyLoaded) {
    console.warn("⚠️ No results state triggered:", {
      status,
      hitsItemsLength: hitsItems.length,
      masonryItemsLength: masonryItems.length,
      profileDataLength: profileData.length,
      hasInitiallyLoaded,
      results: results
        ? {
            nbHits: results.nbHits,
            query: results.query,
          }
        : null,
      isLastPage,
      globalLoading,
      isProfilesComplete,
      searchClientType: typeof searchClient,
      timestamp: new Date().toISOString(),
    });

    // Check if we should show cached data instead
    if (profileData.length > 0 && status !== "loading") {
      console.log(
        "🔄 Attempting to use cached data:",
        profileData.length,
        "profiles",
      );
      // Don't show "no results" if we have cached data that could be displayed
      return (
        <div className="py-12 text-center">
          <div className="text-lg text-gray-500">Loading profiles...</div>
          <div className="mt-2 text-sm text-gray-400">
            Using cached data ({profileData.length} profiles)
          </div>
        </div>
      );
    }

    return (
      <div className="py-12 text-center">
        <div className="text-lg text-gray-500">No profiles found</div>
        <div className="mt-2 text-sm text-gray-400">
          Try adjusting your search or filters
        </div>
        <div className="mt-4 text-xs text-gray-400">
          Status: {status} | Items: {hitsItems.length} | Results:{" "}
          {results?.nbHits ?? "N/A"}
        </div>
      </div>
    );
  }

  // Fallback for when component is still initializing and no clear state is determined
  if (masonryItems.length === 0 && !hasInitiallyLoaded && status === "idle") {
    console.log("⏳ Component initializing, showing skeleton fallback");
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProfileSkeleton key={`init-skeleton-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="w-full">
      {masonryContent}

      {/* Debug indicator when using fallback grid */}
      {masonryError && (
        <div className="mt-4 flex justify-center">
          <div className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-600">
            ⚠️ Using fallback grid due to Masonry error
          </div>
        </div>
      )}

      {/* Loading skeleton for new items during pagination */}
      {isLoadingMore && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProfileSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger and loading indicator */}
      {(!isLastPage || !isProfilesComplete) && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div ref={setLoadMoreRef} className="h-4 w-full" />
          {isLoadingMore || globalLoading ? (
            <div className="flex items-center gap-3 text-blue-600">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm font-medium">
                Loading more profiles... ({masonryItems.length.toLocaleString()}
                )
              </span>
            </div>
          ) : (
            <button
              onClick={handleShowMore}
              className="rounded-full border-2 border-blue-600 bg-white px-6 py-2 text-blue-600 transition-colors hover:border-blue-700 hover:bg-blue-50"
            >
              Show More
            </button>
          )}
        </div>
      )}

      {/* Cache Status Indicator */}
      {profileData.length > 0 && hitsItems.length === 0 && (
        <div className="mt-4 flex justify-center">
          <div className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600">
            💾 Using cached data ({masonryItems.length.toLocaleString()}{" "}
            profiles)
          </div>
        </div>
      )}

      {(isLastPage || isProfilesComplete) && masonryItems.length > 0 && (
        <div className="mt-4 flex justify-center">
          <div className="rounded-full bg-gray-50 px-3 py-1 text-xs font-light text-gray-400">
            ✓ All {masonryItems.length.toLocaleString()} profiles loaded
          </div>
        </div>
      )}
    </div>
  );
}

// Component to handle dynamic page size configuration
function DynamicConfigure() {
  const [dynamicPageSize, setDynamicPageSize] = useAtom(dynamicPageSizeAtom);
  const [initialLoadCompleted, setInitialLoadCompleted] = useAtom(
    initialLoadCompletedAtom,
  );
  const { items } = useInfiniteHits<ProfileHitOptional>();

  // Switch to larger page size after initial 50 profiles loaded
  useEffect(() => {
    if (!initialLoadCompleted && items.length >= 50) {
      setDynamicPageSize(500);
      setInitialLoadCompleted(true);
    }
  }, [
    items.length,
    initialLoadCompleted,
    setDynamicPageSize,
    setInitialLoadCompleted,
  ]);

  return (
    <Configure
      hitsPerPage={dynamicPageSize}
      maxValuesPerFacet={1000}
      enablePersonalization={false}
    />
  );
}

export default function ProfileSearchClient({
  indexName,
  showFilters: _showFilters = true,
  placeholder = "Search profiles...",
  className = "",
}: ProfileSearchProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );

  // Stable callback that doesn't get recreated on every render
  const handleProfileSelect = useCallback((profileId: string | null) => {
    setSelectedProfileId(profileId);
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const statsRef = useRef<HTMLDivElement>(null);

  // Debug log for selected profile state
  useEffect(() => {
    console.log("🎯 Selected Profile ID:", selectedProfileId);
  }, [selectedProfileId]);

  // Determine current view from URL search params
  const getCurrentViewFromParams = useMemo((): ViewType => {
    const view = searchParams.get("view");
    if (view === "table") return "table";
    if (view === "map") return "map";
    return "masonry"; // Default view
  }, [searchParams]);

  const [currentView, setCurrentView] = useState<ViewType>(
    getCurrentViewFromParams,
  );

  const collectionName =
    indexName ??
    process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME ??
    "profiles";

  // Update view when search params change
  useEffect(() => {
    const paramsView = getCurrentViewFromParams;
    if (paramsView !== currentView) {
      setCurrentView(paramsView);
    }
  }, [getCurrentViewFromParams, currentView]);

  // Handle view change with URL search parameters
  const handleViewChange = useCallback(
    (newView: ViewType) => {
      // Skip if already in the correct view
      if (newView === currentView) {
        return;
      }

      // Immediately update state for instant UI feedback
      setCurrentView(newView);

      // Update URL with search parameters
      const params = new URLSearchParams(searchParams.toString());
      if (newView === "masonry") {
        params.delete("view"); // Default view doesn't need parameter
      } else {
        params.set("view", newView);
      }

      const newUrl = params.toString() ? `/?${params.toString()}` : "/";
      router.push(newUrl, { scroll: false });
    },
    [router, currentView, searchParams],
  );

  return (
    <div
      className={
        currentView === "map"
          ? "relative bg-white"
          : `container mx-auto bg-white px-4 py-8 ${className}`
      }
    >
      <InstantSearch
        key={`search-${collectionName}`}
        indexName={collectionName}
        searchClient={searchClient}
        initialUiState={{
          [collectionName]: {
            query: "",
          },
        }}
        insights={false}
      >
        {/* Configure search parameters with dynamic page sizing */}
        <DynamicConfigure />

        {currentView === "map" ? (
          <>
            {/* Floating Search Header */}
            <div className="fixed left-1/2 top-4 z-40 w-96 max-w-[90vw] -translate-x-1/2 transform">
              <DebouncedSearchBox placeholder={placeholder} />
            </div>

            {/* Desktop Controls Bar - Top Left */}
            <div className="fixed left-4 top-4 z-40 hidden space-y-4 md:block">
              <div className="flex items-center gap-2 rounded-lg bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                <Stats
                  classNames={{
                    root: "text-sm text-gray-600",
                  }}
                />
              </div>

              <div className="flex flex-col gap-2 rounded-lg bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                <ViewSwitcher
                  currentView={currentView}
                  onViewChange={handleViewChange}
                />
              </div>
            </div>

            {/* Mobile Controls Bar - Bottom */}
            <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transform md:hidden">
              <div className="flex items-center gap-2 rounded-lg bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                <ViewSwitcher
                  currentView={currentView}
                  onViewChange={handleViewChange}
                />
              </div>
            </div>
            <ProfileMapView />
          </>
        ) : (
          /* Normal View - Container Layout */
          <>
            {/* Sticky Search Header */}
            <StickySearchHeader placeholder={placeholder} statsRef={statsRef} />

            {/* Controls Bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Left side - Stats and Filter (Now shows on both mobile and desktop) */}
              <div className="flex items-center gap-4" ref={statsRef}>
                <SearchStats
                  style={{
                    fontFamily: "ABCDiatypePlusVariable, system-ui, sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Results */}
            <div className="mb-8">
              {currentView === "masonry" ? (
                <InfiniteMasonryHits
                  selectedProfileId={selectedProfileId}
                  onProfileSelect={handleProfileSelect}
                />
              ) : (
                <ProfileDataTable />
              )}
            </div>

            {/* Bottom action button when profile is selected */}
            <AnimatePresence>
              {selectedProfileId && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 100,
                    scale: 0.9,
                    filter: "blur(4px)",
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{
                    opacity: 0,
                    y: 100,
                    scale: 0.8,
                    filter: "blur(4px)",
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="fixed bottom-8 left-1/2 flex -translate-x-1/2 gap-1 rounded-xl bg-gray-900 p-1 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0px_8px_8px_-8px_rgba(0,0,0,0.16)] will-change-transform"
                >
                  <div className="flex w-full justify-between gap-1">
                    <button 
                      onClick={() => handleProfileSelect(null)}
                      className="flex w-12 flex-col items-center gap-[1px] rounded-lg bg-gray-800 pb-1 pt-[6px] text-[10px] font-medium text-gray-300 hover:bg-gray-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.8839 18.6339C10.3957 19.122 9.60427 19.122 9.11612 18.6339L3.36612 12.8839C3.1317 12.6495 3 12.3315 3 12C3 11.6685 3.13169 11.3506 3.36612 11.1161L9.11612 5.36612C9.60427 4.87796 10.3957 4.87796 10.8839 5.36612C11.372 5.85427 11.372 6.64573 10.8839 7.13388L7.26776 10.75H19.75C20.4404 10.75 21 11.3097 21 12C21 12.6904 20.4404 13.25 19.75 13.25H7.26777L10.8839 16.8661C11.372 17.3543 11.372 18.1457 10.8839 18.6339Z"
                          fill="currentColor"
                        />
                      </svg>
                      Back
                    </button>
                    <button className="flex w-12 flex-col items-center gap-[1px] rounded-lg bg-gray-800 pb-1 pt-[6px] text-[10px] font-medium text-gray-300 hover:bg-red-900 hover:text-red-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4 flex-shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M7.58393 5C8.28068 3.24301 9.99487 2 12.0009 2C14.007 2 15.7212 3.24301 16.4179 5H21.25C21.6642 5 22 5.33579 22 5.75C22 6.16421 21.6642 6.5 21.25 6.5H19.9532L19.0588 20.3627C18.9994 21.2835 18.2352 22 17.3124 22H6.68756C5.76481 22 5.0006 21.2835 4.94119 20.3627L4.04683 6.5H2.75C2.33579 6.5 2 6.16421 2 5.75C2 5.33579 2.33579 5 2.75 5H7.58393ZM9.26161 5C9.83935 4.09775 10.8509 3.5 12.0009 3.5C13.151 3.5 14.1625 4.09775 14.7403 5H9.26161Z"
                          fill="currentColor"
                        />
                      </svg>
                      Trash
                    </button>
                    <button className="flex w-12 flex-col items-center gap-[1px] rounded-lg bg-gray-800 pb-1 pt-[6px] text-[10px] font-medium text-gray-300 hover:bg-gray-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M10.4902 2.84406C11.1661 1.69 12.8343 1.69 13.5103 2.84406L22.0156 17.3654C22.699 18.5321 21.8576 19.9999 20.5056 19.9999H3.49483C2.14281 19.9999 1.30147 18.5321 1.98479 17.3654L10.4902 2.84406ZM12 9C12.4142 9 12.75 9.33579 12.75 9.75V13.25C12.75 13.6642 12.4142 14 12 14C11.5858 14 11.25 13.6642 11.25 13.25V9.75C11.25 9.33579 11.5858 9 12 9ZM13 15.75C13 16.3023 12.5523 16.75 12 16.75C11.4477 16.75 11 16.3023 11 15.75C11 15.1977 11.4477 14.75 12 14.75C12.5523 14.75 13 15.1977 13 15.75Z"
                          fill="currentColor"
                        />
                      </svg>
                      Report
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </InstantSearch>
    </div>
  );
}
