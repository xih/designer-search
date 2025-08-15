"use client";

import React from "react";
import { useInstantSearch } from "react-instantsearch";

interface SearchStatsProps {
  className?: string;
  style?: React.CSSProperties;
}

export function SearchStats({ className = "", style }: SearchStatsProps) {
  const { results, status } = useInstantSearch();

  if (status === "loading" || !results) {
    return (
      <div className={`text-sm text-gray-400 ${className}`} style={style}>
        Searching...
      </div>
    );
  }

  const { nbHits, processingTimeMS } = results;

  return (
    <div className={`text-sm text-gray-400 ${className}`} style={style}>
      {nbHits.toLocaleString()} designer{nbHits !== 1 ? "s" : ""} found in{" "}
      {processingTimeMS}ms
    </div>
  );
}
