"use client";

import React, { useState, useEffect } from "react";
import { useSearchBox } from "react-instantsearch";

interface QuickFilterTabsProps {
  statsRef?: React.RefObject<HTMLDivElement>;
}

export function QuickFilterTabs({ statsRef }: QuickFilterTabsProps) {
  const { refine, query } = useSearchBox();
  const [activeFilter, setActiveFilter] = useState<string>("");

  const filters = [
    "OpenAI",
    "Anthropic",
    "Design Engineer",
    "Facebook",
    "Apple",
    "Series A",
    "Google",
    "Meta",
    "Startup",
    "Remote",
  ];

  const handleFilterClick = (filter: string) => {
    const filterLower = filter.toLowerCase();
    if (activeFilter === filter) {
      // Clear filter if clicking the active one
      refine("");
      setActiveFilter("");
    } else {
      // Apply new filter
      refine(filterLower);
      setActiveFilter(filter);
    }

    // Auto-scroll to stats element when filter is clicked
    // This ensures the stats ("180 results found in 54ms") are visible
    if (statsRef?.current && window.scrollY > 200) {
      const statsPosition =
        statsRef.current.getBoundingClientRect().top + window.pageYOffset;
      // Scroll to stats position minus some offset for better visibility
      window.scrollTo({
        top: statsPosition - 150, // 100px offset from top
        behavior: "smooth",
      });
    }
  };

  // Update active filter based on query
  useEffect(() => {
    const queryLower = query.toLowerCase();
    const matchingFilter = filters.find((f) => f.toLowerCase() === queryLower);
    setActiveFilter(matchingFilter ?? "");
  }, [query]);

  return (
    <div className="mb-4">
      <div className="overflow-x-auto">
        <div className="grid min-w-max grid-flow-col gap-10">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterClick(filter)}
              className={`relative whitespace-nowrap px-2 py-2 text-base transition-all duration-100 ${
                activeFilter === filter
                  ? "text-black"
                  : "text-gray-400 hover:text-gray-900"
              }`}
              style={{
                fontFamily: "ABCDiatypePlusVariable, system-ui, sans-serif",
              }}
            >
              <span className="invisible font-bold">{filter}</span>
              <span
                className={`absolute inset-0 flex items-center justify-center ${
                  activeFilter === filter
                    ? "font-bold"
                    : "font-light hover:font-bold"
                }`}
              >
                {filter}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
