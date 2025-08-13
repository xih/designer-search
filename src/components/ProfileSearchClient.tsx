"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
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
import { useAtom } from "jotai";
import { searchClient } from "~/lib/typesense";
import { ProfileHitMasonry } from "./ProfileHitMasonry";
import { FilterModal, FilterButton } from "./FilterModal";
import { TypesenseDebugger } from "./TypesenseDebugger";
import { ViewSwitcher, type ViewType } from "./ViewSwitcher";
import { ProfileDataTable } from "./ProfileDataTable";
import { ProfileMapView } from "./ProfileMapView";
import type { ProfileHitOptional } from "~/types/typesense";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import {
  profileDataAtom,
  profilesCompleteAtom,
  profilesLoadingAtom,
  dynamicPageSizeAtom,
  initialLoadCompletedAtom,
} from "~/lib/store";

interface ProfileSearchProps {
  indexName?: string;
  showFilters?: boolean;
  placeholder?: string;
  className?: string;
}

// Custom debounced search box component
function DebouncedSearchBox({ placeholder }: { placeholder: string }) {
  const { query, refine } = useSearchBox();
  const [inputValue, setInputValue] = useState(query);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedRefine = useCallback(
    (value: string) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        refine(value);
      }, 150);

      setTimeoutId(newTimeoutId);
    },
    [refine, timeoutId],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedRefine(value);
  };

  const handleClear = () => {
    setInputValue("");
    refine("");
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  // Update input value when query changes externally
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="rounded-full border-2 bg-white py-3 pl-10 pr-10 text-lg text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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

  // Global state management with Jotai
  const [profileData, setProfileData] = useAtom(profileDataAtom);
  const [isProfilesComplete, setIsProfilesComplete] =
    useAtom(profilesCompleteAtom);
  const [globalLoading, setGlobalLoading] = useAtom(profilesLoadingAtom);

  // Sync live search data to global state
  useEffect(() => {
    if (hitsItems.length > 0) {
      setProfileData(hitsItems);
      console.log(
        "🔄 [Masonry] Updated global state with:",
        hitsItems.length,
        "profiles",
      );
    }
  }, [hitsItems, setProfileData]);

  // Mark profiles as complete when loading is done
  useEffect(() => {
    if (isLastPage && hitsItems.length > 0 && !isProfilesComplete) {
      setIsProfilesComplete(true);
      setGlobalLoading(false);
      console.log(
        "✅ [Masonry] All profiles loaded and cached globally:",
        hitsItems.length,
      );
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

  const masonryItems = useMemo(() => {
    // Use live search data if available, otherwise use global state
    const profilesToProcess = hitsItems.length > 0 ? hitsItems : profileData;

    if (!profilesToProcess || !Array.isArray(profilesToProcess)) {
      return [];
    }

    return profilesToProcess.map((hit, index) => ({
      id: hit?.id ?? index.toString(),
      hit: hit,
      index,
    }));
  }, [hitsItems, profileData]);

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
      {width > 0 ? (
        <Masonry
          items={masonryItems}
          render={renderMasonryItem}
          columnGutter={16}
          columnWidth={width < 768 ? Math.floor((width - 32) / 2) : 280}
          overscanBy={2}
          itemKey={(item) => item.id}
        />
      ) : (
        // Fallback grid layout while measuring
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {masonryItems.map((item) => (
            <ProfileHitMasonry
              key={item.id}
              hit={item.hit}
              index={item.index}
            />
          ))}
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
          <div className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
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
      console.log(
        "🔄 Switched to larger page size (500) after loading initial 50 profiles",
      );
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
  const [currentView, setCurrentView] = useState<ViewType>("masonry");

  const collectionName =
    indexName ??
    process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME ??
    "profiles";

  // Debug environment variables and schema
  useEffect(() => {
    console.log("🔧 Typesense Configuration Debug:", {
      collectionName,
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
      port: process.env.NEXT_PUBLIC_TYPESENSE_PORT,
      protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL,
      apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY
        ? "✓ Present"
        : "❌ Missing",
      apiKey2: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY2
        ? "✓ Present"
        : "❌ Missing",
      host2: process.env.NEXT_PUBLIC_TYPESENSE_HOST2,
      searchClient: searchClient ? "✓ Initialized" : "❌ Not initialized",
    });
  }, [collectionName]);

  return (
    <div
      className={
        currentView === "map"
          ? "relative bg-white"
          : `container mx-auto px-4 py-8 bg-white ${className}`
      }
    >
      {/* Debug Panel - Remove this after fixing the issue */}
      {/* {currentView !== "map" && <TypesenseDebugger />} */}

      <InstantSearch
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
          /* Map View - Full screen with floating controls */
          <>
            {/* Floating Debug Panel for Map */}
            <div className="fixed bottom-4 left-4 z-50 max-w-sm">
              <TypesenseDebugger />
            </div>

            {/* Floating Search Header */}
            <div className="fixed left-1/2 top-4 z-40 w-96 max-w-[90vw] -translate-x-1/2 transform">
              <DebouncedSearchBox placeholder={placeholder} />
            </div>

            {/* Floating Controls Bar */}
            <div className="fixed right-4 top-4 z-40 space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                <Stats
                  classNames={{
                    root: "text-sm text-gray-600",
                  }}
                />
                {showFilters && (
                  <FilterButton onClick={() => setIsFilterModalOpen(true)} />
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-lg bg-white/90 p-3 shadow-xl backdrop-blur-sm">
                <ViewSwitcher
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
                <SortBy
                  items={[
                    { label: "Most Recent", value: collectionName },
                    {
                      label: "Most Followers",
                      value: `${collectionName}/sort/followers_count:desc`,
                    },
                    {
                      label: "Oldest First",
                      value: `${collectionName}/sort/profile_created_at:asc`,
                    },
                  ]}
                  classNames={{
                    root: "min-w-[180px]",
                    select:
                      "w-full rounded-full border-2 border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
                  }}
                />
              </div>
            </div>

            <ProfileMapView />
          </>
        ) : (
          /* Normal View - Container Layout */
          <>
            {/* Search Header */}
            <div className="mx-auto mb-8 max-w-2xl">
              <DebouncedSearchBox placeholder={placeholder} />
            </div>

            {/* Controls Bar */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Left side - Stats and Filter */}
              <div className="flex items-center gap-4">
                <Stats
                  classNames={{
                    root: "text-sm text-gray-600",
                  }}
                />

                {showFilters && (
                  <FilterButton onClick={() => setIsFilterModalOpen(true)} />
                )}
              </div>

              {/* Right side - View Switcher */}
              <div className="flex items-center gap-4">
                <ViewSwitcher
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
                {/* Hide sort dropdown on mobile - it will be in the filter modal */}
                <div className="hidden sm:block">
                  <SortBy
                    items={[
                      { label: "Most Recent", value: collectionName },
                      {
                        label: "Most Followers",
                        value: `${collectionName}/sort/followers_count:desc`,
                      },
                      {
                        label: "Oldest First",
                        value: `${collectionName}/sort/profile_created_at:asc`,
                      },
                    ]}
                    classNames={{
                      root: "min-w-[180px]",
                      select:
                        "w-full rounded-full border-2 border-gray-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
                    }}
                  />
                </div>
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

        {/* Filter Modal */}
        {showFilters && (
          <FilterModal
            open={isFilterModalOpen}
            onOpenChange={setIsFilterModalOpen}
            collectionName={collectionName}
          />
        )}
      </InstantSearch>
    </div>
  );
}
