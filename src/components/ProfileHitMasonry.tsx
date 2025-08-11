"use client";

import React, { useState } from "react";
import type { ProfileHitOptional } from "~/types/typesense";
import Image from "next/image";
import { Skeleton } from "~/components/ui/skeleton";

interface ProfileHitMasonryProps {
  hit: ProfileHitOptional;
  index?: number;
}

export function ProfileHitMasonry({ hit }: ProfileHitMasonryProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

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

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const isValidUrl = (url?: string): boolean => {
    return !!(url?.trim() && url !== "");
  };

  // Prefer opengraphimageurl, fallback to photourl, then profilePhotoUrl
  const imageUrl = hit.opengraphimageurl ?? hit.photourl ?? hit.profilePhotoUrl;
  const showProfileImage = isValidUrl(imageUrl) && !imageError;
  const showFallback = !isValidUrl(imageUrl) || imageError;

  // Determine card height based on content
  const hasExtendedContent =
    (hit.about && hit.about.length > 100) ??
    (hit.skills && hit.skills.length > 6) ??
    (hit.companies && hit.companies.length > 3) ??
    (hit.project_names && hit.project_names.length > 3);

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${hasExtendedContent ? "min-h-[400px]" : "min-h-[300px]"} `}
    >
      {/* Profile Avatar - Centered */}
      <div className="relative mb-4 flex justify-center">
        {showProfileImage && (
          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-white">
            <Image
              src={imageUrl!}
              alt={`${hit.name}'s profile photo`}
              width={16}
              height={16}
              className="scale-200 h-full w-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
              unoptimized
            />
          </div>
        )}

        {showFallback && (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
            <span className="text-2xl font-bold text-white">
              {hit.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}

        {imageLoading && isValidUrl(imageUrl) && !imageError && (
          <Skeleton className="h-20 w-20 rounded-full" />
        )}
      </div>

      {/* Profile Information - Centered */}
      <div className="text-center">
        {/* Name and Username */}
        <h3 className="text-lg font-bold leading-tight text-gray-900">
          {hit.name || "Unknown"}
        </h3>
        {hit.username && (
          <p className="mt-1 text-sm text-gray-500">@{hit.username}</p>
        )}
        {hit.title && (
          <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-700">
            {hit.title}
          </p>
        )}

        {/* Followers count */}
        {hit.followers_count !== undefined && hit.followers_count > 0 && (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {hit.followers_count.toLocaleString()} followers
            </span>
          </div>
        )}

        {/* Location */}
        {hit.location && (
          <p className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-600">
            <span>📍</span>
            {hit.location}
          </p>
        )}

        {/* About section */}
        {hit.about && (
          <p className="mt-3 line-clamp-4 text-left text-sm text-gray-700">
            {hit.about}
          </p>
        )}

        {/* Skills - Show top 4 in compact form */}
        {hit.skills && hit.skills.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap justify-center gap-1">
              {hit.skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                >
                  {skill}
                </span>
              ))}
              {hit.skills.length > 4 && (
                <span className="rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-600">
                  +{hit.skills.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Companies - Show top 2 */}
        {hit.companies && hit.companies.length > 0 && (
          <div className="mt-2">
            <div className="flex flex-wrap justify-center gap-1">
              {hit.companies.slice(0, 2).map((company, index) => (
                <span
                  key={index}
                  className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
                >
                  {company}
                </span>
              ))}
              {hit.companies.length > 2 && (
                <span className="rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-600">
                  +{hit.companies.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Quick Contact Actions */}
        <div className="mt-4 flex justify-center gap-2">
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

          {/* Website */}
          {isValidUrl(hit.website) && (
            <a
              href={
                hit.website!.startsWith("http")
                  ? hit.website!
                  : `https://${hit.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-gray-50 p-2 text-gray-700 transition-colors hover:bg-gray-100"
              title="Website"
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
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
