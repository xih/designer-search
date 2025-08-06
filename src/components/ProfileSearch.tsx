"use client";

import React from "react";
import NoSSR from "./NoSSR";
import ProfileSearchClient from "./ProfileSearchClient";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";

interface ProfileSearchProps {
  indexName?: string;
  showFilters?: boolean;
  placeholder?: string;
  className?: string;
}


interface ProfileSearchProps {
  indexName?: string;
  showFilters?: boolean;
  placeholder?: string;
  className?: string;
}

// Loading fallback component
function SearchLoadingFallback({ placeholder, className }: Pick<ProfileSearchProps, 'placeholder' | 'className'>) {
  return (
    <div className={`container mx-auto px-4 py-8 ${className || ''}`}>
      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder={placeholder || "Search profiles..."}
            className="pl-10 pr-10 py-3 text-lg rounded-full border-2"
            disabled
            readOnly
          />
        </div>
      </div>
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          Loading search...
        </div>
      </div>
    </div>
  );
}

export default function ProfileSearch(props: ProfileSearchProps) {
  return (
    <NoSSR fallback={<SearchLoadingFallback placeholder={props.placeholder} className={props.className} />}>
      <ProfileSearchClient {...props} />
    </NoSSR>
  );
}
