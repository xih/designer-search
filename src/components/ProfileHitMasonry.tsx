"use client";

import React, { useState } from "react";
import type { ProfileHitOptional } from "~/types/typesense";
import { Skeleton } from "~/components/ui/skeleton";
import { ProfileAvatar, AVATAR_ZOOM_PRESETS } from "./ProfileAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface ProfileHitMasonryProps {
  hit: ProfileHitOptional;
  index?: number;
}

export function ProfileHitMasonry({ hit }: ProfileHitMasonryProps) {
  // Avatar zoom level - you can adjust this value to control cropping
  // 1.0 = normal, 1.1 = 110% (crops borders), 1.2 = 120% (more aggressive)
  const avatarZoom = AVATAR_ZOOM_PRESETS.CROP_BORDERS;

  // Handle case where hit is undefined
  if (!hit) {
    return (
      <div className="min-h-[300px] rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex justify-center">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
        <div className="space-y-2 text-center">
          <Skeleton className="mx-4 h-4" />
          <Skeleton className="mx-8 h-3" />
          <Skeleton className="mx-6 h-3" />
        </div>
      </div>
    );
  }

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const isValidUrl = (url?: string): boolean => {
    return !!(url?.trim() && url !== "");
  };

  const handleGoogleSearch = () => {
    const parts = [];
    if (hit.name) parts.push(`"${hit.name}"`);
    if (hit.location) parts.push(hit.location);
    if (hit.title) parts.push(hit.title);

    const query = parts.join(" ");
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(googleUrl, "_blank");
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg md:p-4">
      {/* Profile Header with Ellipsis Menu */}
      <div className="mb-2 flex items-start justify-between md:mb-3">
        <div className="flex items-start space-x-2 md:space-x-3">
          <ProfileAvatar
            profile={hit}
            size={48}
            zoom={avatarZoom}
            className="md:h-16 md:w-16"
          />
          <div className="flex-1">
            {/* Name and Username */}
            <h3 className="text-sm font-semibold leading-tight text-gray-900 md:text-lg">
              {hit.name || "Unknown"}
            </h3>
            {hit.username && (
              <p className="text-xs text-gray-500 md:text-sm">@{hit.username}</p>
            )}
            {/* Location */}
            {hit.location && (
              <p className="flex items-center gap-1 text-xs text-gray-600 md:text-sm">
                <span>📍</span>
                {hit.location}
              </p>
            )}
          </div>
        </div>

        {/* Ellipsis Dropdown Menu */}
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-200 data-[state=open]:bg-gray-100 data-[state=open]:text-gray-600">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleGoogleSearch}>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
                Google Search
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Profile Information - Left Aligned */}
      <div className="space-y-2 md:space-y-3">
        {/* Title */}
        {hit.title && (
          <p className="line-clamp-2 text-xs font-medium text-gray-700 md:text-sm">
            {hit.title}
          </p>
        )}

        {/* Followers count */}
        {hit.followers_count !== undefined && hit.followers_count > 0 && (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-sm font-medium text-blue-700">
              {hit.followers_count.toLocaleString()} followers
            </span>
          </div>
        )}

        {/* About section */}
        {hit.about && <p className="text-sm text-gray-700">{hit.about}</p>}

        {/* Skills */}
        {hit.skills && hit.skills.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">Skills</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {hit.skills.map((skill, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Companies */}
        {hit.companies && hit.companies.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700">Companies</h4>
            <div className="mt-1 flex flex-wrap gap-1">
              {hit.companies.map((company, index) => (
                <span
                  key={index}
                  className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Contact Actions */}
        <div className="flex gap-2">
          {/* Contact Email */}
          {isValidUrl(hit.contact_email) && (
            <button
              onClick={() => handleEmailClick(hit.contact_email!)}
              className="inline-flex items-center rounded-full bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
              title="Send email"
            >
              <svg
                className="h-4 w-4"
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
          {isValidUrl(hit.linkedin_url) && (
            <a
              href={hit.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-blue-50 p-2 text-blue-700 transition-colors hover:bg-blue-100"
              title="LinkedIn"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}

          {/* GitHub */}
          {isValidUrl(hit.github_url) && (
            <a
              href={hit.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-gray-50 p-2 text-gray-700 transition-colors hover:bg-gray-100"
              title="GitHub"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          )}
        </div>

        {/* Portfolio Site Button with Icon */}
        {isValidUrl(hit.website) && (
          <div>
            <a
              href={
                hit.website!.startsWith("http")
                  ? hit.website!
                  : `https://${hit.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded bg-gray-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-900"
            >
              Portfolio site
              <svg
                className="h-4 w-4"
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
          </div>
        )}
      </div>
    </div>
  );
}
