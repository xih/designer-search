import React from "react";
import { ProfileHit } from "./ProfileHit";
import { sampleProfiles } from "~/lib/sampleProfileData";

export function ProfileHitDemo() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Enhanced Profile Cards Demo
        </h2>
        <p className="mt-2 text-gray-600">
          Showcasing profile photos, Twitter links, and social media integration
        </p>
      </div>

      <div className="space-y-6">
        {sampleProfiles.map((profile) => (
          <ProfileHit key={profile.id} hit={profile} />
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-blue-50 p-6">
        <h3 className="text-lg font-semibold text-blue-900">
          Features Demonstrated:
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li>✓ Profile photos with fallback to initials</li>
          <li>✓ Twitter icons and links for each designer</li>
          <li>✓ Contact email buttons</li>
          <li>✓ LinkedIn, GitHub, and website links</li>
          <li>✓ Loading states and error handling</li>
          <li>✓ Responsive design with proper spacing</li>
          <li>✓ Enhanced Twitter button styling with border</li>
          <li>✓ Next.js Image optimization with external domain support</li>
        </ul>
      </div>
    </div>
  );
}
