"use client";

import React from "react";
import { Stats, useInstantSearch, useInfiniteHits } from "react-instantsearch";
import { useAtom, useAtomValue } from "jotai";
import type { ViewType } from "../ViewSwitcher";
import type { ProfileHitOptional } from "~/types/typesense";
import {
  profileDataAtom,
  profilesCompleteAtom,
  profilesLoadingAtom,
  dynamicPageSizeAtom,
  initialLoadCompletedAtom,
  storageStatsAtom,
} from "~/lib/store";

interface DebugPanelProps {
  currentView: ViewType;
}

// Debug Panel Component with all metadata
export function DebugPanel({ currentView }: DebugPanelProps) {
  const { status } = useInstantSearch();
  const { items } = useInfiniteHits<ProfileHitOptional>();
  const [profileData] = useAtom(profileDataAtom);
  const [isProfilesComplete] = useAtom(profilesCompleteAtom);
  const [isLoading] = useAtom(profilesLoadingAtom);
  const [dynamicPageSize] = useAtom(dynamicPageSizeAtom);
  const [initialLoadCompleted] = useAtom(initialLoadCompletedAtom);
  const storageStats = useAtomValue(storageStatsAtom);

  const currentDataSource = items.length > 0 ? "Live" : "Cached";
  const currentProfileCount =
    items.length > 0 ? items.length : profileData.length;

  return (
    <div className="w-64 rounded-lg border bg-white/95 p-3 shadow-xl backdrop-blur-sm">
      <div className="space-y-2 text-xs text-gray-600">
        {/* Basic Stats */}
        <div className="border-b border-gray-200 pb-2">
          <Stats
            classNames={{
              root: "text-sm text-gray-800 font-medium whitespace-nowrap",
            }}
          />
        </div>

        {/* Data Source & Count */}
        <div>
          <div className="font-medium text-gray-800">
            {currentDataSource}: {currentProfileCount.toLocaleString()} profiles
          </div>
          {currentView === "map" && (
            <div>
              With coordinates:{" "}
              {profileData
                .filter((p) => p.lat_lng_field)
                .length.toLocaleString()}
            </div>
          )}
        </div>

        {/* Loading Status */}
        <div className="space-y-1">
          <div>
            Status: <span className="font-medium">{status}</span>
          </div>
          <div>
            Page size: <span className="font-medium">{dynamicPageSize}</span>
          </div>
          <div>
            Initial load:{" "}
            <span className="font-medium">
              {initialLoadCompleted ? "✓ Complete" : "In progress..."}
            </span>
          </div>
          {isLoading && (
            <div className="font-medium text-blue-600">⏳ Loading more...</div>
          )}
          {isProfilesComplete && (
            <div className="font-medium text-green-600">
              ✓ All profiles loaded
            </div>
          )}
        </div>

        {/* Storage Stats */}
        <div className="border-t border-gray-200 pt-2">
          <div className="mb-1 font-medium text-gray-800">Cache Info:</div>
          <div>Storage: {storageStats.currentSizeKB}KB</div>
          <div>
            Cached: {storageStats.profileCount.toLocaleString()}/
            {storageStats.maxCachedProfiles.toLocaleString()}
          </div>
          <div>Efficiency: {storageStats.storageEfficiency}</div>
          {storageStats.profileCount >= storageStats.maxCachedProfiles && (
            <div className="font-medium text-orange-600">📦 Cache full</div>
          )}
        </div>

        {/* Data Source Indicator */}
        {profileData.length > 0 && items.length === 0 && (
          <div className="rounded border border-purple-200 bg-purple-50 p-2">
            <div className="text-xs font-medium text-purple-700">
              💾 Using cached data
            </div>
          </div>
        )}

        {/* Connection Info */}
        <div className="border-t border-gray-200 pt-2 text-xs">
          <div>
            Collection:{" "}
            {process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_NAME ?? "profiles"}
          </div>
          <div>
            Host:{" "}
            {process.env.NEXT_PUBLIC_TYPESENSE_HOST2 ??
              process.env.NEXT_PUBLIC_TYPESENSE_HOST ??
              "Not set"}
          </div>
        </div>
      </div>
    </div>
  );
}