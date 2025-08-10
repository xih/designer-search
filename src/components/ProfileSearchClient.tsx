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
        className="rounded-full border-2 py-3 pl-10 pr-10 text-lg focus:border-transparent focus:ring-2 focus:ring-blue-500"
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

  // Handle infinite scroll loading
  const handleShowMore = useCallback(() => {
    if (isLoadingMore || isLastPage) return;

    setIsLoadingMore(true);
    showMore();
    // Reset loading state after a longer delay to allow results to load
    setTimeout(() => setIsLoadingMore(false), 800);
  }, [showMore, isLastPage, isLoadingMore]);

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
    if (!hitsItems || !Array.isArray(hitsItems)) {
      return [];
    }

    return hitsItems.map((hit, index) => ({
      id: hit?.id ?? index.toString(),
      hit: hit,
      index,
    }));
  }, [hitsItems]);

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

  // Handle loading state
  if (status === "loading" || status === "stalled") {
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
          columnWidth={280}
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

      {/* Infinite scroll trigger and loading indicator */}
      {!isLastPage && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div ref={setLoadMoreRef} className="h-4 w-full" />
          {isLoadingMore ? (
            <div className="flex items-center gap-3 text-blue-600">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm font-medium">
                Loading more profiles...
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
    </div>
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

  // Debug environment variables
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
    <div className={`container mx-auto px-4 py-8 ${className}`}>
      {/* Debug Panel - Remove this after fixing the issue */}
      <TypesenseDebugger />

      <InstantSearch
        indexName={collectionName}
        searchClient={searchClient}
        initialUiState={{
          [collectionName]: {
            query: "",
          },
        }}
        insights={true}
      >
        {/* Configure search parameters */}
        <Configure
          hitsPerPage={50}
          maxValuesPerFacet={1000}
          enablePersonalization={false}
        />

        {/* Search Header */}
        <div className="mx-auto mb-8 max-w-2xl">
          <DebouncedSearchBox placeholder={placeholder} />
        </div>

        {/* Controls Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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

          {/* Right side - View Switcher and Sort Options */}
          <div className="flex items-center gap-4">
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

        {/* Results */}
        <div className="mb-8">
          {currentView === "masonry" ? (
            <InfiniteMasonryHits />
          ) : currentView === "table" ? (
            <ProfileDataTable />
          ) : (
            <ProfileMapView />
          )}
        </div>

        {/* Filter Modal */}
        {showFilters && (
          <FilterModal
            open={isFilterModalOpen}
            onOpenChange={setIsFilterModalOpen}
          />
        )}
      </InstantSearch>
    </div>
  );
}
