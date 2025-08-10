"use client";

import React from "react";
import Image from "next/image";
import type { ProfileHitOptional } from "~/types/typesense";

interface ProfileCardProps {
  profile: ProfileHitOptional;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const isValidUrl = (url?: string): boolean => {
    return !!(url?.trim() && url !== "");
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="flex items-center space-x-3">
        {isValidUrl(profile.profilePhotoUrl) ? (
          <Image
            src={profile.profilePhotoUrl!}
            alt={`${profile.name}'s profile photo`}
            width={60}
            height={60}
            className="h-16 w-16 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
            <span className="text-lg font-bold text-white">
              {profile.name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-gray-900">{profile.name ?? "Unknown"}</h3>
          {profile.username && (
            <p className="text-sm text-gray-500">@{profile.username}</p>
          )}
        </div>
      </div>

      {/* Title */}
      {profile.title && (
        <div>
          <h4 className="text-sm font-medium text-gray-700">Title</h4>
          <p className="text-sm text-gray-600">{profile.title}</p>
        </div>
      )}

      {/* Location */}
      {profile.location && (
        <div>
          <h4 className="text-sm font-medium text-gray-700">Location</h4>
          <p className="text-sm text-gray-600">{profile.location}</p>
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <div>
          <h4 className="text-sm font-medium text-gray-700">Bio</h4>
          <p className="text-sm text-gray-600 line-clamp-3">{profile.bio}</p>
        </div>
      )}

      {/* Followers */}
      {profile.followers_count !== undefined && profile.followers_count > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700">Followers</h4>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
            {profile.followers_count.toLocaleString()}
          </span>
        </div>
      )}

      {/* Skills */}
      {profile.skills && profile.skills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700">Skills</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {profile.skills.slice(0, 6).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
              >
                {skill}
              </span>
            ))}
            {profile.skills.length > 6 && (
              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-600">
                +{profile.skills.length - 6}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Companies */}
      {profile.companies && profile.companies.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700">Companies</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {profile.companies.slice(0, 4).map((company, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700"
              >
                {company}
              </span>
            ))}
            {profile.companies.length > 4 && (
              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-1 text-xs text-gray-600">
                +{profile.companies.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Actions</h4>
        <div className="flex gap-2">
          {/* Email */}
          {isValidUrl(profile.contact_email) && (
            <button
              onClick={() => handleEmailClick(profile.contact_email!)}
              className="inline-flex items-center rounded bg-gray-100 p-2 text-gray-700 transition-colors hover:bg-gray-200"
              title="Send email"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {/* LinkedIn */}
          {isValidUrl(profile.linkedin_url) && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded bg-blue-50 p-2 text-blue-700 transition-colors hover:bg-blue-100"
              title="LinkedIn"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
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
              className="inline-flex items-center rounded bg-gray-50 p-2 text-gray-700 transition-colors hover:bg-gray-100"
              title="GitHub"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          )}

          {/* Website */}
          {isValidUrl(profile.website) && (
            <a
              href={profile.website!.startsWith("http") ? profile.website! : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded bg-gray-50 p-2 text-gray-700 transition-colors hover:bg-gray-100"
              title="Website"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}