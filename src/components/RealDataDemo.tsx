import React from "react";
import { ProfileHit } from "./ProfileHit";
import type { ProfileHitOptional } from "~/types/typesense";

export function RealDataDemo() {
  // Real data example based on the user's JSON response
  const realProfileExample: ProfileHitOptional = {
    id: "ZzwrE6FgmnTVrSr1eGHp7spGCJq2",
    name: "Farbod Faramarzi",
    username: "fabbe",
    title: "Product Designer",
    about:
      "Hej! I'm Farbod. A designer and every so often a developer. Currently working on all things Playlist and collections at Spotify.",
    location: "Stockholm",
    website: "https://fabbe.lol",
    profilePhotoUrl:
      "https://firebasestorage.googleapis.com/v0/b/maitake-project.appspot.com/o/profilePhotos%2FZzwrE6FgmnTVrSr1eGHp7spGCJq2%2Fopen-graph-93134f68-ce57-4962-86a4-25cdb7685135.png?alt=media&token=ae99b811-c09e-4f8f-a605-17894e4c62b8",
    contact_email: "fabbe@fabbe.lol",
    linkedin_url: "https://linkedin.com/in/farbodfaramarzi",
    twitter_url: "", // Empty string in your data
    github_url: "", // Empty string in your data
    skills: [], // Empty array in your data
    job_titles: [], // Empty array in your data
    companies: [], // Empty array in your data
    schools: [], // Empty array in your data
    project_names: [
      "Designing a new Foundation: Spotify for Desktop",
      "A new experience for Spotify on iPad",
      "Smart Shuffle",
      "Better in Black: Rethinking our Most Important Buttons",
    ],
    followers_count: 0,
    profile_created_at: 1748736469,
    indexed_at: 1749664777,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Real Backend Data Demo
        </h2>
        <p className="mt-2 text-gray-600">
          This shows how your actual backend data renders with the updated
          ProfileHit component
        </p>
      </div>

      <div className="space-y-6">
        <ProfileHit hit={realProfileExample} />
      </div>

      <div className="mt-8 rounded-lg bg-green-50 p-6">
        <h3 className="text-lg font-semibold text-green-900">
          ✅ Working Features:
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-green-800">
          <li>✓ Profile photo from Firebase Storage</li>
          <li>✓ Contact email button (fabbe@fabbe.lol)</li>
          <li>✓ LinkedIn link working</li>
          <li>✓ Website link working (fabbe.lol)</li>
          <li>✓ Project names displayed as tags</li>
          <li>✓ Empty arrays/strings handled gracefully</li>
          <li>✓ Proper date formatting</li>
          <li>✓ Location display (Stockholm)</li>
        </ul>
      </div>

      <div className="mt-4 rounded-lg bg-blue-50 p-6">
        <h3 className="text-lg font-semibold text-blue-900">
          📝 Data Structure Notes:
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>
            • <code>profilePhotoUrl</code> - Firebase Storage URL
          </li>
          <li>
            • <code>twitter_url</code> - Empty string (handled gracefully)
          </li>
          <li>
            • <code>github_url</code> - Empty string (handled gracefully)
          </li>
          <li>
            • <code>skills</code> - Empty array (section hidden)
          </li>
          <li>
            • <code>companies</code> - Empty array (section hidden)
          </li>
          <li>
            • <code>followers_count</code> - 0 (hidden when zero)
          </li>
        </ul>
      </div>
    </div>
  );
}
