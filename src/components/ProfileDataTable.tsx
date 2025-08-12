"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useInfiniteHits, useInstantSearch } from "react-instantsearch";
import { useAtom } from 'jotai';
import type { ProfileHitOptional } from "~/types/typesense";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { ProfileAvatar, AVATAR_ZOOM_PRESETS } from "./ProfileAvatar";
import { 
  profileDataAtom, 
  profilesCompleteAtom, 
  profilesLoadingAtom 
} from "~/lib/store";

export function ProfileDataTable() {
  const {
    items: hitsItems,
    isLastPage,
    showMore,
  } = useInfiniteHits<ProfileHitOptional>();
  const { status } = useInstantSearch();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const previousItemsLengthRef = useRef<number>(0);

  // Global state management with Jotai
  const [profileData, setProfileData] = useAtom(profileDataAtom);
  const [isProfilesComplete, setIsProfilesComplete] = useAtom(profilesCompleteAtom);
  const [globalLoading, setGlobalLoading] = useAtom(profilesLoadingAtom);

  const profiles = useMemo(() => {
    // Use live search data if available, otherwise use global state
    const profilesToProcess = (hitsItems.length > 0) ? hitsItems : profileData;
    return profilesToProcess?.filter(Boolean) || [];
  }, [hitsItems, profileData]);

  const isValidUrl = (url?: string): boolean => {
    return !!(url?.trim() && url !== "");
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // Sync live search data to global state
  useEffect(() => {
    if (hitsItems.length > 0) {
      setProfileData(hitsItems);
      console.log('🔄 [Table] Updated global state with:', hitsItems.length, 'profiles');
    }
  }, [hitsItems, setProfileData]);

  // Mark profiles as complete when loading is done
  useEffect(() => {
    if (isLastPage && hitsItems.length > 0 && !isProfilesComplete) {
      setIsProfilesComplete(true);
      setGlobalLoading(false);
      console.log('✅ [Table] All profiles loaded and cached globally:', hitsItems.length);
    }
  }, [isLastPage, hitsItems.length, isProfilesComplete, setIsProfilesComplete, setGlobalLoading]);

  const handleShowMore = useCallback(() => {
    if (isLoadingMore || isLastPage || globalLoading) return;

    // Store current scroll position
    scrollPositionRef.current = window.scrollY;
    previousItemsLengthRef.current = profiles.length;

    setIsLoadingMore(true);
    setGlobalLoading(true);
    showMore();
    // Reset loading state after a delay to allow results to load
    setTimeout(() => {
      setIsLoadingMore(false);
      setGlobalLoading(false);
    }, 800);
  }, [showMore, isLastPage, isLoadingMore, globalLoading, profiles.length, setGlobalLoading]);

  // Restore scroll position after new items are loaded
  useEffect(() => {
    if (
      profiles.length > previousItemsLengthRef.current &&
      scrollPositionRef.current > 0
    ) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
        scrollPositionRef.current = 0; // Reset after restoring
      });
    }
  }, [profiles.length]);

  // Only show loading skeleton on initial load when no data exists
  if ((status === "loading" || status === "stalled") && profiles.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Companies</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 animate-pulse bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 animate-pulse bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 animate-pulse bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 animate-pulse bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-40 animate-pulse bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-28 animate-pulse bg-gray-200" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
                    <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

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

  if (profiles.length === 0) {
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
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Followers</TableHead>
              <TableHead>Skills</TableHead>
              <TableHead>Companies</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile, index) => (
              <TableRow key={profile.id || index}>
                {/* Profile Photo */}
                <TableCell>
                  <ProfileAvatar
                    profile={profile}
                    size={40}
                    zoom={AVATAR_ZOOM_PRESETS.CROP_BORDERS}
                  />
                </TableCell>

                {/* Name & Username */}
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {profile.name ?? "Unknown"}
                    </div>
                    {profile.username && (
                      <div className="text-sm text-gray-500">
                        @{profile.username}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Title */}
                <TableCell>
                  <div className="max-w-xs truncate text-sm text-gray-700">
                    {profile.title ?? "-"}
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell>
                  <div className="max-w-xs truncate text-sm text-gray-600">
                    {profile.location ?? "-"}
                  </div>
                </TableCell>

                {/* Followers */}
                <TableCell className="text-right">
                  {profile.followers_count !== undefined &&
                  profile.followers_count > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {profile.followers_count.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>

                {/* Skills */}
                <TableCell>
                  {profile.skills && profile.skills.length > 0 ? (
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {profile.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {profile.skills.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-600">
                          +{profile.skills.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>

                {/* Companies */}
                <TableCell>
                  {profile.companies && profile.companies.length > 0 ? (
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {profile.companies.slice(0, 2).map((company, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                        >
                          {company}
                        </span>
                      ))}
                      {profile.companies.length > 2 && (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-600">
                          +{profile.companies.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex gap-1">
                    {/* Email */}
                    {isValidUrl(profile.contact_email) && (
                      <button
                        onClick={() => handleEmailClick(profile.contact_email!)}
                        className="inline-flex items-center rounded bg-gray-100 p-1.5 text-gray-700 transition-colors hover:bg-gray-200"
                        title="Send email"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    )}

                    {/* LinkedIn */}
                    {isValidUrl(profile.linkedin_url) && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded bg-blue-50 p-1.5 text-blue-700 transition-colors hover:bg-blue-100"
                        title="LinkedIn"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                    )}

                    {/* GitHub */}
                    {isValidUrl(profile.github_url) && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded bg-gray-50 p-1.5 text-gray-700 transition-colors hover:bg-gray-100"
                        title="GitHub"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </a>
                    )}

                    {/* Website */}
                    {isValidUrl(profile.website) && (
                      <a
                        href={
                          profile.website!.startsWith("http")
                            ? profile.website!
                            : `https://${profile.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded bg-gray-50 p-1.5 text-gray-700 transition-colors hover:bg-gray-100"
                        title="Website"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Load More Button */}
      {(!isLastPage || !isProfilesComplete) && (
        <div className="mt-6 flex justify-center">
          {isLoadingMore || globalLoading ? (
            <div className="flex items-center gap-3 text-blue-600">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm font-medium">
                Loading more profiles... ({profiles.length.toLocaleString()})
              </span>
            </div>
          ) : (
            <Button
              onClick={handleShowMore}
              variant="outline"
              className="rounded-full border-2 border-blue-600 px-6 py-2 text-blue-600 transition-colors hover:bg-blue-50"
            >
              Load More
            </Button>
          )}
        </div>
      )}

      {/* Cache Status Indicator */}
      {profileData.length > 0 && hitsItems.length === 0 && (
        <div className="mt-4 flex justify-center">
          <div className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-600 font-medium">
            💾 Using cached data ({profiles.length.toLocaleString()} profiles)
          </div>
        </div>
      )}

      {(isLastPage || isProfilesComplete) && profiles.length > 0 && (
        <div className="mt-4 flex justify-center">
          <div className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-600 font-medium">
            ✓ All {profiles.length.toLocaleString()} profiles loaded
          </div>
        </div>
      )}
    </div>
  );
}
