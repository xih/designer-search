"use client";

import React from "react";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Pagination,
  RefinementList,
  Stats,
  ClearRefinements,
  SortBy,
} from "react-instantsearch";
import { searchClient } from "~/lib/typesense";
import { ProfileHit } from "./ProfileHit";
import { ProfileHitOptional, FACETABLE_FIELDS } from "~/types/typesense";

interface ProfileSearchProps {
  indexName?: string;
  showFilters?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ProfileSearch({
  indexName,
  showFilters = true,
  placeholder = "Search profiles...",
  className = "",
}: ProfileSearchProps) {
  const collectionName =
    indexName ??
    process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME ??
    "profiles";

  return (
    <div className={`container mx-auto px-4 py-8 ${className}`}>
      <InstantSearch indexName={collectionName} searchClient={searchClient}>
        <div
          className={`grid gap-8 ${showFilters ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1"}`}
        >
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    <ClearRefinements
                      classNames={{
                        button: "text-sm text-blue-600 hover:text-blue-800",
                      }}
                    />
                  </div>

                  <div className="space-y-6">
                    {/* Skills Filter */}
                    <div>
                      <h4 className="mb-3 font-medium">Skills</h4>
                      <RefinementList
                        attribute="skills"
                        limit={10}
                        showMore={true}
                        classNames={{
                          root: "space-y-2",
                          item: "flex items-center",
                          label: "ml-2 text-sm cursor-pointer",
                          count: "ml-auto text-xs text-gray-500",
                          checkbox:
                            "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
                          showMore:
                            "mt-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer",
                        }}
                      />
                    </div>

                    {/* Companies Filter */}
                    <div>
                      <h4 className="mb-3 font-medium">Companies</h4>
                      <RefinementList
                        attribute="companies"
                        limit={8}
                        showMore={true}
                        classNames={{
                          root: "space-y-2",
                          item: "flex items-center",
                          label: "ml-2 text-sm cursor-pointer",
                          count: "ml-auto text-xs text-gray-500",
                          checkbox:
                            "h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500",
                          showMore:
                            "mt-2 text-sm text-green-600 hover:text-green-800 cursor-pointer",
                        }}
                      />
                    </div>

                    {/* Job Titles Filter */}
                    <div>
                      <h4 className="mb-3 font-medium">Job Titles</h4>
                      <RefinementList
                        attribute="job_titles"
                        limit={8}
                        showMore={true}
                        classNames={{
                          root: "space-y-2",
                          item: "flex items-center",
                          label: "ml-2 text-sm cursor-pointer",
                          count: "ml-auto text-xs text-gray-500",
                          checkbox:
                            "h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500",
                          showMore:
                            "mt-2 text-sm text-indigo-600 hover:text-indigo-800 cursor-pointer",
                        }}
                      />
                    </div>

                    {/* Schools Filter */}
                    <div>
                      <h4 className="mb-3 font-medium">Schools</h4>
                      <RefinementList
                        attribute="schools"
                        limit={6}
                        showMore={true}
                        classNames={{
                          root: "space-y-2",
                          item: "flex items-center",
                          label: "ml-2 text-sm cursor-pointer",
                          count: "ml-auto text-xs text-gray-500",
                          checkbox:
                            "h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500",
                          showMore:
                            "mt-2 text-sm text-purple-600 hover:text-purple-800 cursor-pointer",
                        }}
                      />
                    </div>

                    {/* Projects Filter */}
                    <div>
                      <h4 className="mb-3 font-medium">Projects</h4>
                      <RefinementList
                        attribute="project_names"
                        limit={6}
                        showMore={true}
                        classNames={{
                          root: "space-y-2",
                          item: "flex items-center",
                          label: "ml-2 text-sm cursor-pointer",
                          count: "ml-auto text-xs text-gray-500",
                          checkbox:
                            "h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500",
                          showMore:
                            "mt-2 text-sm text-orange-600 hover:text-orange-800 cursor-pointer",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className={showFilters ? "lg:col-span-3" : "col-span-1"}>
            {/* Search Box */}
            <div className="mb-6">
              <SearchBox
                classNames={{
                  root: "relative",
                  form: "relative",
                  input:
                    "w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500",
                  submit:
                    "absolute right-3 top-1/2 -translate-y-1/2 transform p-1",
                  reset:
                    "absolute right-12 top-1/2 -translate-y-1/2 transform p-1",
                }}
                placeholder={placeholder}
              />
            </div>

            {/* Controls Bar */}
            <div className="mb-4 flex items-center justify-between">
              {/* Search Stats */}
              <Stats
                classNames={{
                  root: "text-sm text-gray-600",
                }}
              />

              {/* Sort Options */}
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
                  root: "w-48",
                  select:
                    "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                }}
              />
            </div>

            {/* Search Results */}
            <div className="mb-8">
              <Hits
                hitComponent={({ hit }) => (
                  <ProfileHit hit={hit as unknown as ProfileHitOptional} />
                )}
                classNames={{
                  root: "",
                  list: "space-y-6",
                  item: "",
                }}
              />
            </div>

            {/* Pagination */}
            <div className="flex justify-center">
              <Pagination
                classNames={{
                  root: "flex space-x-2",
                  list: "flex space-x-2",
                  item: "rounded border px-3 py-2 hover:bg-gray-100",
                  link: "text-blue-600 hover:text-blue-800",
                  selectedItem: "bg-blue-600 text-white hover:bg-blue-700",
                }}
              />
            </div>
          </div>
        </div>
      </InstantSearch>
    </div>
  );
}
