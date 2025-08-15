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
import {
  profileDataAtom,
  profilesCompleteAtom,
  profilesLoadingAtom,
  dynamicPageSizeAtom,
  initialLoadCompletedAtom,
  storageStatsAtom,
} from "~/lib/store";

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
function InfiniteMasonryHits() {
  const {
    items: hitsItems,
    isLastPage,
    showMore,
  } = useInfiniteHits<ProfileHitOptional>();
  const { status } = useInstantSearch();
  const [ref, { width }] = useMeasure();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [masonryKey, setMasonryKey] = useState(0);
  const [masonryError, setMasonryError] = useState(false);

  // Global state management with Jotai
  const [profileData, setProfileData] = useAtom(profileDataAtom);
  const [isProfilesComplete, setIsProfilesComplete] =
    useAtom(profilesCompleteAtom);
  const [globalLoading, setGlobalLoading] = useAtom(profilesLoadingAtom);

  // Sync live search data to global state (optimized to prevent excessive updates)
  const prevHitsLength = useRef(0);
  useEffect(() => {
    if (hitsItems.length > 0 && hitsItems.length !== prevHitsLength.current) {
      setProfileData(hitsItems);
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
      }));

    // Force Masonic reset when data source changes OR array shrinks
    const shouldReset =
      (previousDataSource !== null &&
        previousDataSource !== currentDataSource) ||
      (filteredItems.length < previousArrayLength && previousArrayLength > 0);

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
  ]);

  const renderMasonryItem = useCallback(
    ({
      data,
    }: {
      index: number;
      data: { hit: ProfileHitOptional; index: number };
    }) => {
      return <ProfileHitMasonry hit={data.hit} index={data.index} />;
    },
    [],
  );

  // Error handler for Masonry component
  const handleMasonryError = useCallback(() => {
    setMasonryError(true);
    setMasonryKey((prev) => prev + 1);
  }, []);

  // Render fallback grid - MOVED BEFORE CONDITIONAL RETURNS
  const renderFallbackGrid = useCallback(
    () => (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {masonryItems.map((item) => (
          <ProfileHitMasonry key={item.id} hit={item.hit} index={item.index} />
        ))}
      </div>
    ),
    [masonryItems],
  );

  // Determine which content to render - MOVED BEFORE CONDITIONAL RETURNS
  const shouldUseFallback = masonryError || width === 0;
  const masonryContent = useMemo(() => {
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
  ]);

  // Handle Masonry errors in an effect - MOVED BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    if (shouldUseFallback && !masonryError) {
      // Only set error state if not already set
      if (width === 0) return; // Don't set error for width measurement
      handleMasonryError();
    }
  }, [shouldUseFallback, masonryError, width, handleMasonryError]);

  // Handle initial loading state (only when no items exist)
  if (
    (status === "loading" || status === "stalled") &&
    masonryItems.length === 0
  ) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-80 rounded-xl bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  // Handle error state
  if (status === "error") {
    return (
      <div className="py-12 text-center">
        <div className="text-lg text-red-500">Error loading profiles</div>
        <div className="mt-2 text-sm text-gray-400">
          Please try refreshing the page
        </div>
      </div>
    );
  }

  // Handle no results
  if (masonryItems.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-lg text-gray-500">No profiles found</div>
        <div className="mt-2 text-sm text-gray-400">
          Try adjusting your search or filters
        </div>
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
            <div key={`loading-${i}`} className="animate-pulse">
              <div className="h-80 rounded-xl bg-gray-200"></div>
            </div>
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
  showFilters = true,
  placeholder = "Search profiles...",
  className = "",
}: ProfileSearchProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const statsRef = useRef<HTMLDivElement>(null);

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
                <InfiniteMasonryHits />
              ) : (
                <ProfileDataTable />
              )}
            </div>
          </>
        )}
      </InstantSearch>
    </div>
  );
}
