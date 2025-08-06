"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  InstantSearch,
  Hits,
  Pagination,
  Stats,
  SortBy,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch";
import { Masonry } from "masonic";
import useMeasure from "react-use-measure";
import { searchClient } from "~/lib/typesense";
import { ProfileHitMasonry } from "./ProfileHitMasonry";
import { FilterModal, FilterButton } from "./FilterModal";
import { TypesenseDebugger } from "./TypesenseDebugger";
import { ProfileHitOptional } from "~/types/typesense";
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

  const debouncedRefine = useCallback((value: string) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const newTimeoutId = setTimeout(() => {
      refine(value);
    }, 150);
    
    setTimeoutId(newTimeoutId);
  }, [refine, timeoutId]);

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
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="pl-10 pr-10 py-3 text-lg rounded-full border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          type="button"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Custom Masonry Hits component
function MasonryHits() {
  const { hits, status, results, error } = useInstantSearch();
  const [ref, { width }] = useMeasure();

  // Debug logging
  useEffect(() => {
    console.log("🔍 InstantSearch Debug Info:", {
      status,
      hits: hits ? hits.length : "null/undefined",
      results: results ? {
        nbHits: results.nbHits,
        query: results.query,
        processingTimeMS: results.processingTimeMS,
        params: results.params,
        // Check if hits are nested in results
        resultsHits: results.hits ? results.hits.length : "no hits in results"
      } : "null",
      error: error ? error.message : "none"
    });
    
    // Deep dive into results structure
    if (results) {
      console.log("🔬 Full results structure:", JSON.stringify(results, null, 2));
    }
    
    if (hits && hits.length > 0) {
      console.log("📄 First hit sample:", hits[0]);
      console.log("📄 Hit data structure:", JSON.stringify(hits[0], null, 2));
    } else if (hits && hits.length === 0) {
      console.log("⚠️ Hits array is empty despite results showing data");
    }
  }, [hits, status, results, error]);

  const masonryItems = useMemo(() => {
    // Try to get hits from multiple sources
    let dataHits = hits;
    
    // Fallback: try to get hits from results if hits is null
    if (!dataHits && results?.hits) {
      console.log("🔄 Using results.hits as fallback");
      dataHits = results.hits;
    }
    
    console.log("🎯 Processing masonry items:", { 
      hitsExists: !!dataHits, 
      hitsIsArray: Array.isArray(dataHits), 
      hitsLength: dataHits?.length,
      resultsHitsExists: !!results?.hits,
      resultsHitsLength: results?.hits?.length
    });
    
    if (!dataHits || !Array.isArray(dataHits)) {
      console.log("❌ No hits or not array, returning empty array");
      return [];
    }
    
    const items = (dataHits as unknown as any[]).map((hit, index) => {
      // Typesense hits might be nested in a 'document' property
      const actualHit = hit.document || hit;
      
      console.log(`📋 Processing hit ${index}:`, { 
        hasDocument: !!hit.document,
        hasId: !!actualHit?.id, 
        hasName: !!actualHit?.name,
        hitKeys: actualHit ? Object.keys(actualHit).slice(0, 10) : "null hit",
        rawHitKeys: hit ? Object.keys(hit).slice(0, 5) : "null"
      });
      
      return {
        id: actualHit?.id || index.toString(),
        hit: actualHit,
        index,
      };
    });
    
    console.log("✅ Generated masonry items:", items.length);
    return items;
  }, [hits, results]);

  const renderMasonryItem = useCallback(
    ({ index, data }: { index: number; data: { hit: ProfileHitOptional; index: number } }) => {
      console.log(`🖼️ Rendering masonry item ${index}:`, { 
        dataExists: !!data, 
        hitExists: !!data?.hit, 
        hitName: data?.hit?.name 
      });
      return <ProfileHitMasonry hit={data.hit} index={data.index} />;
    },
    []
  );

  // Handle loading state
  if (status === "loading" || status === "stalled") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-xl bg-gray-200 h-80"></div>
          </div>
        ))}
      </div>
    );
  }

  // Handle error state
  if (status === "error") {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">Error loading profiles</div>
        <div className="text-gray-400 text-sm mt-2">Please try refreshing the page</div>
      </div>
    );
  }

  // Handle no results
  if (masonryItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No profiles found</div>
        <div className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</div>
      </div>
    );
  }

  console.log("📐 Masonry render decision:", { 
    containerWidth: width, 
    itemsCount: masonryItems.length,
    willUseMasonry: width > 0 && masonryItems.length > 0
  });

  return (
    <div ref={ref} className="w-full">
      {width > 0 ? (
        <>
          <div className="mb-4 text-sm text-gray-600">
            🎨 Masonry Layout: {masonryItems.length} items, {width}px width
          </div>
          <Masonry
            items={masonryItems}
            render={renderMasonryItem}
            columnGutter={16}
            columnWidth={280}
            overscanBy={2}
            itemKey={(item) => item.id}
          />
        </>
      ) : (
        // Fallback grid layout while measuring
        <>
          <div className="mb-4 text-sm text-gray-600">
            📐 Grid Layout: {masonryItems.length} items, measuring width...
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {masonryItems.map((item) => (
              <ProfileHitMasonry key={item.id} hit={item.hit} index={item.index} />
            ))}
          </div>
        </>
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
      apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY ? "✓ Present" : "❌ Missing",
      apiKey2: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY2 ? "✓ Present" : "❌ Missing",
      host2: process.env.NEXT_PUBLIC_TYPESENSE_HOST2,
      searchClient: searchClient ? "✓ Initialized" : "❌ Not initialized"
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
            query: ""
          }
        }}
      >
        {/* Search Header */}
        <div className="mb-8 max-w-2xl mx-auto">
          <DebouncedSearchBox placeholder={placeholder} />
        </div>

        {/* Controls Bar */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
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

          {/* Right side - Sort Options */}
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

        {/* Masonry Results */}
        <div className="mb-8">
          <MasonryHits />
        </div>

        {/* Pagination */}
        <div className="flex justify-center">
          <Pagination
            classNames={{
              root: "flex items-center space-x-1",
              list: "flex items-center space-x-1",
              item: "rounded-full border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors",
              link: "px-4 py-2 text-blue-600 hover:text-blue-800 font-medium",
              selectedItem: "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700",
              disabledItem: "opacity-50 cursor-not-allowed",
              previousPageItem: "rounded-full",
              nextPageItem: "rounded-full",
            }}
          />
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