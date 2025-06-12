import React, { useState } from "react";
import type { ProfileHitOptional } from "~/types/typesense";
import Image from "next/image";

interface ProfileHitProps {
  hit: ProfileHitOptional;
}

export function ProfileHit({ hit }: ProfileHitProps) {
  // State to track image loading errors
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Format dates for display
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Handle email click
  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Helper function to check if a URL is valid and not empty
  const isValidUrl = (url?: string): boolean => {
    return !!(url?.trim() && url !== "");
  };

  // Social media icon components
  const LinkedInIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );

  const TwitterIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );

  const GitHubIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );

  const WebsiteIcon = () => (
    <svg
      className="h-5 w-5"
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
  );

  const EmailIcon = () => (
    <svg
      className="h-5 w-5"
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
  );

  // Determine if we should show the profile image or fallback
  const showProfileImage = isValidUrl(hit.profilePhotoUrl) && !imageError;
  const showFallback = !isValidUrl(hit.profilePhotoUrl) || imageError;

  return (
    <div className="rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start space-x-4">
        {/* Profile Avatar */}
        <div className="relative flex-shrink-0">
          {showProfileImage && (
            <Image
              src={hit.profilePhotoUrl!}
              alt={`${hit.name}'s profile photo`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200"
              onError={handleImageError}
              onLoad={handleImageLoad}
              unoptimized // Allow external images
            />
          )}

          {/* Fallback initial avatar - shown when no image or image fails */}
          {showFallback && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 ring-2 ring-gray-200">
              <span className="text-xl font-bold text-white">
                {hit.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Loading state */}
          {imageLoading && isValidUrl(hit.profilePhotoUrl) && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-gray-200">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="flex-1">
          {/* Header with name and username */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{hit.name}</h3>
              {hit.username && (
                <p className="text-sm text-gray-600">@{hit.username}</p>
              )}
              {hit.title && (
                <p className="text-sm font-medium text-gray-700">{hit.title}</p>
              )}
            </div>

            {/* Followers count */}
            {hit.followers_count !== undefined && hit.followers_count > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Followers</div>
                <div className="text-lg font-semibold text-blue-600">
                  {hit.followers_count.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Location and Join Date */}
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
            {hit.location && (
              <span className="flex items-center">📍 {hit.location}</span>
            )}
            {hit.profile_created_at && (
              <span className="flex items-center">
                📅 Joined {formatDate(hit.profile_created_at)}
              </span>
            )}
          </div>

          {/* About section */}
          {hit.about && (
            <p className="mt-3 line-clamp-3 text-sm text-gray-700">
              {hit.about}
            </p>
          )}

          {/* Contact and Social Links Section */}
          <div className="mt-4 flex flex-wrap gap-3">
            {/* Contact Email */}
            {isValidUrl(hit.contact_email) && (
              <button
                onClick={() => handleEmailClick(hit.contact_email!)}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                <EmailIcon />
                <span>Contact</span>
              </button>
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
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200"
              >
                <WebsiteIcon />
                <span>Website</span>
              </a>
            )}

            {/* LinkedIn */}
            {isValidUrl(hit.linkedin_url) && (
              <a
                href={hit.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700 transition-colors hover:bg-blue-100"
              >
                <LinkedInIcon />
                <span>LinkedIn</span>
              </a>
            )}

            {/* Twitter/X - Enhanced with better styling */}
            {isValidUrl(hit.twitter_url) && (
              <a
                href={hit.twitter_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm text-sky-700 transition-colors hover:bg-sky-100"
              >
                <TwitterIcon />
                <span>Twitter</span>
              </a>
            )}

            {/* GitHub */}
            {isValidUrl(hit.github_url) && (
              <a
                href={hit.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                <GitHubIcon />
                <span>GitHub</span>
              </a>
            )}
          </div>

          {/* Skills */}
          {hit.skills && hit.skills.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Skills:</h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {hit.skills.slice(0, 6).map((skill, index) => (
                  <span
                    key={index}
                    className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
                {hit.skills.length > 6 && (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    +{hit.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Companies */}
          {hit.companies && hit.companies.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700">Companies:</h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {hit.companies.slice(0, 3).map((company, index) => (
                  <span
                    key={index}
                    className="rounded bg-green-100 px-2 py-1 text-xs text-green-800"
                  >
                    {company}
                  </span>
                ))}
                {hit.companies.length > 3 && (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    +{hit.companies.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Schools */}
          {hit.schools && hit.schools.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700">Education:</h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {hit.schools.slice(0, 2).map((school, index) => (
                  <span
                    key={index}
                    className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800"
                  >
                    {school}
                  </span>
                ))}
                {hit.schools.length > 2 && (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    +{hit.schools.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Projects */}
          {hit.project_names && hit.project_names.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700">Projects:</h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {hit.project_names.slice(0, 3).map((project, index) => (
                  <span
                    key={index}
                    className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-800"
                  >
                    {project}
                  </span>
                ))}
                {hit.project_names.length > 3 && (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    +{hit.project_names.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Job Titles */}
          {hit.job_titles && hit.job_titles.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700">Roles:</h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {hit.job_titles.slice(0, 3).map((title, index) => (
                  <span
                    key={index}
                    className="rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-800"
                  >
                    {title}
                  </span>
                ))}
                {hit.job_titles.length > 3 && (
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    +{hit.job_titles.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
