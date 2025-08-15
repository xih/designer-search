"use client";

import React, { useState, useEffect } from "react";
import { useSearchBox } from "react-instantsearch";

export function QuickFilterTabs() {
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
  };

  // Update active filter based on query
  useEffect(() => {
    const queryLower = query.toLowerCase();
    const matchingFilter = filters.find((f) => f.toLowerCase() === queryLower);
    setActiveFilter(matchingFilter ?? "");
  }, [query]);

  return (
    <div className="mb-8">
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-8">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterClick(filter)}
              className={`whitespace-nowrap px-2 py-2 text-base font-medium transition-all duration-200 ${
                activeFilter === filter
                  ? "text-black"
                  : "text-gray-400 hover:text-gray-600"
              } `}
              style={{ fontFamily: 'ABCDiatypePlusVariable, system-ui, sans-serif' }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
